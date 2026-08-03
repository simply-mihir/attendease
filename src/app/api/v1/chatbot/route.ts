import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recalcSubjectStats } from "@/lib/subject-stats";
import { calculateAttendance, simulateSkip } from "@/lib/attendance-calc";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── Tool definitions for the LLM ────────────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_todays_classes",
      description:
        "Get today's class schedule with attendance status. Use when user asks about today's classes, schedule, or what's happening today.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_attendance",
      description:
        "Mark attendance (present, absent, late, excused, cancelled) for a subject today. Use when user says things like 'mark me present for DBMS', 'I attended OS', 'I bunked math', 'absent for physics'.",
      parameters: {
        type: "object",
        properties: {
          subjectQuery: {
            type: "string",
            description: "Subject name, code, or abbreviation mentioned by the user",
          },
          status: {
            type: "string",
            enum: ["present", "absent", "late", "excused", "cancelled"],
            description:
              "Attendance status. Map 'bunked/skipped/missed' to absent, 'attended/went/was there' to present.",
          },
        },
        required: ["subjectQuery", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analytics",
      description:
        "Get overall attendance analytics — percentage, streak, subject-wise breakdown, danger/warning subjects. Use when user asks about attendance percentage, stats, analytics, how they're doing, overall attendance.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_subject_info",
      description:
        "Get detailed info about a specific subject — attendance %, streak, classes held, schedule. Use when user asks about a particular subject's stats.",
      parameters: {
        type: "object",
        properties: {
          subjectQuery: {
            type: "string",
            description: "Subject name, code, or abbreviation",
          },
        },
        required: ["subjectQuery"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "skip_optimizer",
      description:
        "Calculate how many classes the user can safely skip/bunk across subjects without falling below minimum attendance. Use when user asks 'can I bunk?', 'how many classes can I skip?', 'which class to bunk?', 'is it safe to skip?'.",
      parameters: {
        type: "object",
        properties: {
          maxSkips: {
            type: "number",
            description: "Number of classes the user wants to skip. Default 3 if not specified.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_override",
      description:
        "Change class timings — reschedule, cancel, add extra class, or swap two classes for a specific date. Use when user talks about class timing changes, cancellations, swaps, or extra classes.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["reschedule", "cancel", "extra", "swap"],
            description: "Type of schedule change",
          },
          subjectQuery: {
            type: "string",
            description: "Primary subject name/code",
          },
          date: {
            type: "string",
            description:
              "Target date in YYYY-MM-DD format. Parse 'today', 'tomorrow', 'this Monday', 'Aug 5th' etc. into YYYY-MM-DD.",
          },
          newTime: {
            type: "string",
            description: "New time in HH:MM 24h format (e.g., '14:00' for 2pm). Required for reschedule/extra.",
          },
          swapSubjectQuery: {
            type: "string",
            description: "Second subject for swap operations",
          },
        },
        required: ["action", "subjectQuery", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_attendance_history",
      description:
        "Get recent attendance records for a subject or all subjects. Use when user asks 'when did I last attend X?', 'my attendance history', 'show my records'.",
      parameters: {
        type: "object",
        properties: {
          subjectQuery: {
            type: "string",
            description: "Subject name/code, or leave empty for all subjects",
          },
          days: {
            type: "number",
            description: "Number of past days to look at. Default 7.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_bulk_attendance",
      description:
        "Mark attendance for ALL of today's classes at once with the same status. Use when user says 'mark all present', 'I attended everything today', 'bunked all classes'.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["present", "absent", "late"],
            description: "Status to apply to all today's classes",
          },
        },
        required: ["status"],
      },
    },
  },
];

// ── Tool executor functions ─────────────────────────────────────

async function execGetTodaysClasses(userId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const todayStr = now.toISOString().slice(0, 10);

  const schedules = await prisma.schedule.findMany({
    where: { userId, dayOfWeek, isActive: true },
    include: {
      subject: {
        select: {
          id: true, name: true, colorHex: true, currentPercentage: true,
          minAttendancePct: true, totalClassesHeld: true, totalPresent: true,
          totalLate: true, streakCount: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const todayRecords = await prisma.attendanceRecord.findMany({
    where: { userId, date: new Date(todayStr) },
  });

  const markedMap = new Map(
    todayRecords.map((r) => [`${r.subjectId}-${r.scheduleId || ""}`, r])
  );

  const classes = schedules.map((s) => {
    const key = `${s.subjectId}-${s.id}`;
    const record = markedMap.get(key);
    return {
      scheduleId: s.id,
      subjectId: s.subject.id,
      subjectName: s.subject.name,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      currentPct: s.subject.currentPercentage,
      minPct: s.subject.minAttendancePct,
      streakCount: s.subject.streakCount,
      attendanceMarked: !!record,
      attendanceStatus: record?.status || null,
    };
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return { date: todayStr, dayName: dayNames[dayOfWeek], classes, totalClasses: classes.length };
}

async function execMarkAttendance(userId: string, subjectQuery: string, status: string) {
  const subject = await findSubject(userId, subjectQuery);
  if (!subject) return { error: `Could not find subject matching "${subjectQuery}". Check spelling or use the full name.` };

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Find the schedule for today
  const schedule = await prisma.schedule.findFirst({
    where: { subjectId: subject.id, dayOfWeek: today.getDay(), isActive: true },
  });

  const record = await prisma.attendanceRecord.upsert({
    where: {
      subjectId_userId_date_scheduleId: {
        subjectId: subject.id,
        userId,
        date: new Date(todayStr),
        scheduleId: schedule?.id || "",
      },
    },
    create: {
      subjectId: subject.id,
      userId,
      scheduleId: schedule?.id || null,
      date: new Date(todayStr),
      status,
      source: "chatbot",
    },
    update: { status, editedAt: new Date(), editedReason: "Updated via chatbot" },
  });

  const updatedStats = await recalcSubjectStats(subject.id);
  return {
    success: true,
    subjectName: subject.name,
    status,
    newPercentage: updatedStats?.currentPercentage ?? subject.currentPercentage,
  };
}

async function execGetAnalytics(userId: string) {
  const subjects = await prisma.subject.findMany({
    where: { userId, isArchived: false },
    include: { schedules: { where: { isActive: true } } },
    orderBy: { name: "asc" },
  });

  let overallPresent = 0;
  let overallTotal = 0;
  const subjectsSummary = subjects.map((s) => {
    const stats = calculateAttendance({
      totalClasses: s.totalClassesHeld,
      totalPresent: s.totalPresent,
      totalLate: s.totalLate,
      totalAbsent: s.totalAbsent,
      totalExcused: s.totalExcused,
      minRequiredPct: s.minAttendancePct,
    });
    overallPresent += s.totalPresent + s.totalLate;
    overallTotal += s.totalClassesHeld;
    return {
      name: s.name,
      code: s.code,
      currentPct: stats.currentPercentage,
      status: stats.statusColor,
      canSkip: stats.canSkipCount,
      totalClasses: s.totalClassesHeld,
      streak: s.streakCount,
      minRequired: s.minAttendancePct,
    };
  });

  const overallPct = overallTotal === 0 ? 0 : Math.round((overallPresent / overallTotal) * 100);
  return { overallPct, totalSubjects: subjects.length, subjects: subjectsSummary };
}

async function execGetSubjectInfo(userId: string, subjectQuery: string) {
  const subject = await findSubject(userId, subjectQuery);
  if (!subject) return { error: `Could not find subject matching "${subjectQuery}".` };

  const stats = calculateAttendance({
    totalClasses: subject.totalClassesHeld,
    totalPresent: subject.totalPresent,
    totalLate: subject.totalLate,
    totalAbsent: subject.totalAbsent,
    totalExcused: subject.totalExcused,
    minRequiredPct: subject.minAttendancePct,
  });

  const schedules = await prisma.schedule.findMany({
    where: { subjectId: subject.id, isActive: true },
    orderBy: { dayOfWeek: "asc" },
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    name: subject.name,
    code: subject.code,
    currentPct: stats.currentPercentage,
    status: stats.statusColor,
    canSkip: stats.canSkipCount,
    needToAttend: stats.mustAttendCount,
    totalClasses: subject.totalClassesHeld,
    totalPresent: subject.totalPresent,
    totalAbsent: subject.totalAbsent,
    streak: subject.streakCount,
    minRequired: subject.minAttendancePct,
    schedule: schedules.map((s) => ({
      day: dayNames[s.dayOfWeek],
      time: `${s.startTime}–${s.endTime}`,
      room: s.room,
    })),
  };
}

async function execSkipOptimizer(userId: string, maxSkips: number = 3) {
  const subjects = await prisma.subject.findMany({
    where: { userId, isArchived: false },
    orderBy: { name: "asc" },
  });

  const subjectData = subjects.map((s) => {
    const stats = {
      totalClasses: s.totalClassesHeld,
      totalPresent: s.totalPresent,
      totalLate: s.totalLate,
      totalAbsent: s.totalAbsent,
      totalExcused: s.totalExcused,
      minRequiredPct: s.minAttendancePct,
    };
    const result = calculateAttendance(stats);
    return {
      subjectName: s.name,
      currentPct: result.currentPercentage,
      stats,
      canSkip: result.canSkipCount,
      skipsAllocated: 0,
    };
  });

  let remaining = maxSkips;
  while (remaining > 0) {
    let bestIdx = -1;
    let bestCan = 0;
    for (let i = 0; i < subjectData.length; i++) {
      const rem = subjectData[i].canSkip - subjectData[i].skipsAllocated;
      if (rem > bestCan) { bestCan = rem; bestIdx = i; }
    }
    if (bestIdx === -1) break;
    subjectData[bestIdx].skipsAllocated++;
    remaining--;
  }

  const recommendations = subjectData
    .filter((sd) => sd.skipsAllocated > 0)
    .map((sd) => {
      const sim = simulateSkip(sd.stats, sd.skipsAllocated);
      return {
        subjectName: sd.subjectName,
        currentPct: sd.currentPct,
        skipsAllocated: sd.skipsAllocated,
        newPct: sim.newPercentage,
        remainingBuffer: sd.canSkip - sd.skipsAllocated,
      };
    });

  const cannotSkip = subjectData.filter((sd) => sd.canSkip === 0).map((sd) => sd.subjectName);

  return {
    recommendations,
    totalSkipsUsed: maxSkips - remaining,
    totalRequested: maxSkips,
    cannotSkip,
    safeToSkipAll: remaining === 0,
  };
}

async function execScheduleOverride(
  userId: string,
  action: string,
  subjectQuery: string,
  dateStr: string,
  newTime?: string,
  swapSubjectQuery?: string
) {
  const subject = await findSubject(userId, subjectQuery);
  if (!subject) return { error: `Could not find subject "${subjectQuery}".` };

  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return { error: `Invalid date: ${dateStr}` };

  if (action === "swap") {
    if (!swapSubjectQuery) return { error: "Need a second subject for swap." };
    const swapSubject = await findSubject(userId, swapSubjectQuery);
    if (!swapSubject) return { error: `Could not find swap subject "${swapSubjectQuery}".` };

    const schedA = await prisma.schedule.findFirst({
      where: { subjectId: subject.id, dayOfWeek: date.getDay(), isActive: true },
    });
    const schedB = await prisma.schedule.findFirst({
      where: { subjectId: swapSubject.id, dayOfWeek: date.getDay(), isActive: true },
    });

    await prisma.$transaction([
      prisma.scheduleOverride.create({
        data: {
          userId, date, subjectId: subject.id, type: "swap",
          originalTime: schedA?.startTime || null,
          newTime: schedB?.startTime || null,
          swapSubjectId: swapSubject.id, note: `Swap ${subject.name} and ${swapSubject.name}`,
        },
      }),
      prisma.scheduleOverride.create({
        data: {
          userId, date, subjectId: swapSubject.id, type: "swap",
          originalTime: schedB?.startTime || null,
          newTime: schedA?.startTime || null,
          swapSubjectId: subject.id, note: `Swap ${swapSubject.name} and ${subject.name}`,
        },
      }),
    ]);

    return { success: true, action: "swap", subject1: subject.name, subject2: swapSubject.name, date: dateStr };
  }

  const sched = await prisma.schedule.findFirst({
    where: { subjectId: subject.id, dayOfWeek: date.getDay(), isActive: true },
  });

  await prisma.scheduleOverride.create({
    data: {
      userId, date, subjectId: subject.id, type: action,
      originalTime: sched?.startTime || null,
      newTime: newTime || null,
      note: `${action} ${subject.name}`,
    },
  });

  return { success: true, action, subjectName: subject.name, date: dateStr, newTime };
}

async function execGetAttendanceHistory(userId: string, subjectQuery?: string, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: any = { userId, date: { gte: since } };
  if (subjectQuery) {
    const subject = await findSubject(userId, subjectQuery);
    if (!subject) return { error: `Could not find subject "${subjectQuery}".` };
    where.subjectId = subject.id;
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: { subject: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 30,
  });

  return {
    records: records.map((r) => ({
      subject: r.subject.name,
      date: r.date.toISOString().slice(0, 10),
      status: r.status,
    })),
    total: records.length,
    days,
  };
}

async function execMarkBulkAttendance(userId: string, status: string) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const schedules = await prisma.schedule.findMany({
    where: { userId, dayOfWeek: now.getDay(), isActive: true },
    include: { subject: { select: { id: true, name: true } } },
  });

  if (schedules.length === 0) return { error: "No classes scheduled for today." };

  const results: string[] = [];
  for (const s of schedules) {
    await prisma.attendanceRecord.upsert({
      where: {
        subjectId_userId_date_scheduleId: {
          subjectId: s.subject.id,
          userId,
          date: new Date(todayStr),
          scheduleId: s.id,
        },
      },
      create: {
        subjectId: s.subject.id, userId, scheduleId: s.id,
        date: new Date(todayStr), status, source: "chatbot",
      },
      update: { status, editedAt: new Date(), editedReason: "Bulk via chatbot" },
    });
    await recalcSubjectStats(s.subject.id);
    results.push(s.subject.name);
  }

  return { success: true, status, subjects: results, count: results.length };
}

// ── Helper: fuzzy subject finder ────────────────────────────────

async function findSubject(userId: string, query: string) {
  const subjects = await prisma.subject.findMany({
    where: { userId, isArchived: false },
  });

  const q = query.toLowerCase().trim();

  // Exact name match
  let match = subjects.find((s) => s.name.toLowerCase() === q);
  if (match) return match;

  // Code match
  match = subjects.find((s) => s.code?.toLowerCase() === q);
  if (match) return match;

  // Contains match
  match = subjects.find((s) => s.name.toLowerCase().includes(q));
  if (match) return match;

  // Abbreviation match (first letters)
  match = subjects.find((s) => {
    const words = s.name.toLowerCase().split(/\s+/);
    if (words.length > 1) {
      const acronym = words.map((w) => w[0]).join("");
      if (acronym === q) return true;
    }
    return false;
  });
  if (match) return match;

  // Partial word match
  match = subjects.find((s) => {
    const words = s.name.toLowerCase().split(/\s+/);
    return words.some((w) => w.length > 3 && (w.includes(q) || q.includes(w)));
  });

  return match || null;
}

// ── Main route handler ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Chatbot not configured. Set OPENROUTER_API_KEY." },
      { status: 503 }
    );
  }

  const { message, history = [] } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Get subject names for context
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id, isArchived: false },
    select: { name: true, code: true },
  });
  const subjectList = subjects.map((s) => `${s.name}${s.code ? ` (${s.code})` : ""}`).join(", ");

  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const systemPrompt = `You are AttendEase Assistant — a helpful, concise attendance tracker chatbot for a college student.

Current info:
- Today: ${dayNames[now.getDay()]}, ${now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
- User's subjects: ${subjectList || "None enrolled"}
- User's name: ${user.name || "Student"}

Your capabilities (use the provided tools):
1. Show today's classes and attendance status
2. Mark attendance (present/absent/late/excused/cancelled) for individual or all classes
3. Show analytics — overall %, per-subject stats, streaks
4. Skip/bunk optimizer — how many classes can be safely skipped
5. Schedule changes — reschedule, cancel, add extra, swap classes
6. Attendance history
7. Subject-specific info

Rules:
- Be concise and friendly. Use short responses.
- When marking attendance, map 'bunked/skipped/missed/didn't go' → absent, 'went/attended/was there' → present, 'was late/reached late' → late
- For dates: parse 'today', 'tomorrow', 'this Monday', 'next Friday', 'Aug 5th' into YYYY-MM-DD
- For times: parse '2pm' → '14:00', '9:30am' → '09:30', etc.
- Always call the appropriate tool before responding about data
- If user asks something you can't handle, say so briefly
- Use emojis sparingly (✅ ❌ 📊 📅 🔥) to make responses scannable`;

  // Build conversation for LLM
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8).map((m: any) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  try {
    // First LLM call — may return tool calls
    const llmRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://attendease-c7wl.vercel.app",
        "X-Title": "AttendEase",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!llmRes.ok) {
      const err = await llmRes.json().catch(() => ({}));
      console.error("[Chatbot] LLM error:", err);
      return NextResponse.json({ error: "AI service temporarily unavailable." }, { status: 502 });
    }

    const llmData = await llmRes.json();
    const choice = llmData.choices?.[0];

    if (!choice) {
      return NextResponse.json({ error: "No response from AI." }, { status: 502 });
    }

    // If no tool calls, return the text directly
    if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
      return NextResponse.json({
        reply: choice.message.content || "I'm not sure how to help with that. Try asking about your classes, attendance, or analytics!",
        actions: [],
      });
    }

    // Execute tool calls
    const toolResults: any[] = [];
    const actions: string[] = [];

    for (const tc of choice.message.tool_calls) {
      const fn = tc.function.name;
      let args: any = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch {}

      let result: any;

      switch (fn) {
        case "get_todays_classes":
          result = await execGetTodaysClasses(user.id);
          break;
        case "mark_attendance":
          result = await execMarkAttendance(user.id, args.subjectQuery, args.status);
          if (result.success) actions.push("attendance_marked");
          break;
        case "get_analytics":
          result = await execGetAnalytics(user.id);
          break;
        case "get_subject_info":
          result = await execGetSubjectInfo(user.id, args.subjectQuery);
          break;
        case "skip_optimizer":
          result = await execSkipOptimizer(user.id, args.maxSkips || 3);
          break;
        case "schedule_override":
          result = await execScheduleOverride(
            user.id, args.action, args.subjectQuery, args.date,
            args.newTime, args.swapSubjectQuery
          );
          if (result.success) actions.push("schedule_changed");
          break;
        case "get_attendance_history":
          result = await execGetAttendanceHistory(user.id, args.subjectQuery, args.days || 7);
          break;
        case "mark_bulk_attendance":
          result = await execMarkBulkAttendance(user.id, args.status);
          if (result.success) actions.push("attendance_marked");
          break;
        default:
          result = { error: "Unknown action" };
      }

      toolResults.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }

    // Second LLM call — generate natural language response from tool results
    const followUpMessages = [
      ...messages,
      choice.message,
      ...toolResults,
    ];

    const followUpRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://attendease-c7wl.vercel.app",
        "X-Title": "AttendEase",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages: followUpMessages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!followUpRes.ok) {
      // Fallback: return raw tool results as readable text
      const fallback = toolResults.map((tr) => {
        const data = JSON.parse(tr.content);
        if (data.error) return `Error: ${data.error}`;
        if (data.success && data.subjectName && data.status) {
          return `✅ Marked ${data.status} for ${data.subjectName}. Attendance: ${data.newPercentage}%`;
        }
        return JSON.stringify(data, null, 2);
      }).join("\n");

      return NextResponse.json({ reply: fallback, actions });
    }

    const followUpData = await followUpRes.json();
    const finalReply = followUpData.choices?.[0]?.message?.content || "Done! Let me know if you need anything else.";

    return NextResponse.json({ reply: finalReply, actions });
  } catch (error) {
    console.error("[Chatbot] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
