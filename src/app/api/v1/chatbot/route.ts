import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { notifyAttendanceMarked } from "@/lib/attendance-notifier";
import { prisma } from "@/lib/db";
import { recalcSubjectStats } from "@/lib/subject-stats";
import { calculateAttendance, simulateSkip } from "@/lib/attendance-calc";
import { getUserTimezone, getUserToday } from "@/lib/timezone";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-2-9b-it:free";

// ── Tool executor functions ─────────────────────────────────────

/** Parse "HH:MM" to total minutes */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
/** Convert total minutes to "HH:MM" */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function execGetTodaysClasses(userId: string) {
  const tz = await getUserTimezone(userId);
  const { dayOfWeek, dateStr: todayStr } = getUserToday(tz);

  const [schedules, overrides, todayRecords] = await Promise.all([
    prisma.schedule.findMany({
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
    }),
    prisma.scheduleOverride.findMany({
      where: { userId, date: new Date(todayStr + "T00:00:00Z") },
      include: {
        subject: {
          select: {
            id: true, name: true, colorHex: true, currentPercentage: true,
            minAttendancePct: true, totalClassesHeld: true, totalPresent: true,
            totalLate: true, streakCount: true,
          },
        },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { userId, date: new Date(todayStr) },
    }),
  ]);

  // Build original time lookup for swap endTime resolution
  const originalBySubject = new Map<string, { startTime: string; endTime: string }>();
  for (const s of schedules) {
    originalBySubject.set(s.subject.id, { startTime: s.startTime, endTime: s.endTime });
  }

  const markedMap = new Map(
    todayRecords.map((r) => [`${r.subjectId}-${r.scheduleId || ""}`, r])
  );

  // Start with regular classes
  let classes = schedules.map((s) => {
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

  // Apply overrides
  for (const ov of overrides) {
    switch (ov.type) {
      case "cancel":
        classes = classes.filter((c) => c.subjectId !== ov.subjectId);
        break;
      case "reschedule": {
        const idx = classes.findIndex((c) => c.subjectId === ov.subjectId);
        if (idx !== -1 && ov.newTime) {
          const orig = classes[idx];
          const duration = timeToMinutes(orig.endTime) - timeToMinutes(orig.startTime);
          const newEnd = duration > 0 ? minutesToTime(timeToMinutes(ov.newTime) + duration) : orig.endTime;
          classes[idx] = { ...orig, startTime: ov.newTime, endTime: newEnd };
        } else if (idx === -1 && ov.subject && ov.newTime) {
          classes.push({
            scheduleId: ov.id, subjectId: ov.subjectId,
            subjectName: ov.subject.name, startTime: ov.newTime, endTime: "",
            room: null, currentPct: ov.subject.currentPercentage,
            minPct: ov.subject.minAttendancePct, streakCount: ov.subject.streakCount,
            attendanceMarked: false, attendanceStatus: null,
          });
        }
        break;
      }
      case "extra":
        if (ov.subject) {
          classes.push({
            scheduleId: ov.id, subjectId: ov.subjectId,
            subjectName: ov.subject.name, startTime: ov.newTime || "09:00", endTime: "",
            room: null, currentPct: ov.subject.currentPercentage,
            minPct: ov.subject.minAttendancePct, streakCount: ov.subject.streakCount,
            attendanceMarked: false, attendanceStatus: null,
          });
        }
        break;
      case "swap": {
        const idx = classes.findIndex((c) => c.subjectId === ov.subjectId);
        if (idx !== -1 && ov.newTime) {
          const swapPartnerOrig = ov.swapSubjectId ? originalBySubject.get(ov.swapSubjectId) : null;
          classes[idx] = {
            ...classes[idx],
            startTime: ov.newTime,
            endTime: swapPartnerOrig?.endTime || classes[idx].endTime,
          };
        }
        break;
      }
    }
  }

  classes.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return { date: todayStr, dayName: dayNames[dayOfWeek], classes, totalClasses: classes.length };
}

async function execMarkAttendance(userId: string, subjectQuery: string, status: string) {
  const subject = await findSubject(userId, subjectQuery);
  if (!subject) return { error: `Could not find subject matching "${subjectQuery}". Check spelling or use the full name.` };

  const tz = await getUserTimezone(userId);
  const { dayOfWeek, dateStr: todayStr } = getUserToday(tz);

  const schedule = await prisma.schedule.findFirst({
    where: { subjectId: subject.id, dayOfWeek, isActive: true },
  });

  await prisma.attendanceRecord.upsert({
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
  await notifyAttendanceMarked(userId, subject.name, status, todayStr);
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
  const tz = await getUserTimezone(userId);
  const { dayOfWeek, dateStr: todayStr } = getUserToday(tz);

  const schedules = await prisma.schedule.findMany({
    where: { userId, dayOfWeek, isActive: true },
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

  let match = subjects.find((s) => s.name.toLowerCase() === q);
  if (match) return match;

  match = subjects.find((s) => s.code?.toLowerCase() === q);
  if (match) return match;

  match = subjects.find((s) => s.name.toLowerCase().includes(q));
  if (match) return match;

  match = subjects.find((s) => {
    const words = s.name.toLowerCase().split(/\s+/);
    if (words.length > 1) {
      const acronym = words.map((w) => w[0]).join("");
      if (acronym === q) return true;
    }
    return false;
  });
  if (match) return match;

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
      { error: "Chatbot not configured. Set OPENROUTER_API_KEY in .env" },
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

  const tz = await getUserTimezone(user.id);
  const { dayOfWeek: todayDow, dateStr: todayDateStr, dayName: todayDayName } = getUserToday(tz);

  const systemPrompt = `You are AttendEase Assistant — a concise attendance tracker chatbot.

Today: ${todayDayName}, ${todayDateStr}
Today's date (YYYY-MM-DD): ${todayDateStr}
User: ${user.name || "Student"}
Subjects: ${subjectList || "None"}

You MUST respond with ONLY a JSON object (no markdown, no code fences, no extra text). The JSON must have this shape:

{"intent": "<intent_name>", "params": {<parameters>}}

Available intents and their params:

1. "get_todays_classes" — params: {}
   Use when: user asks about today's classes, schedule, what's on today

2. "mark_attendance" — params: {"subject": "<name>", "status": "<present|absent|late|excused|cancelled>"}
   Use when: user wants to mark attendance. Map: bunked/skipped/missed → absent, attended/went → present, late/reached late → late

3. "mark_bulk_attendance" — params: {"status": "<present|absent|late>"}
   Use when: user says "mark all present/absent", "attended everything", "bunked all"

4. "get_analytics" — params: {}
   Use when: user asks about overall stats, percentage, how they're doing

5. "get_subject_info" — params: {"subject": "<name>"}
   Use when: user asks about a specific subject's attendance/details

6. "skip_optimizer" — params: {"maxSkips": <number, default 3>}
   Use when: user asks "can I bunk?", "how many can I skip?", "safe to skip?"

7. "schedule_override" — params: {"action": "<reschedule|cancel|extra|swap>", "subject": "<name>", "date": "<YYYY-MM-DD>", "newTime": "<HH:MM 24h>", "swapSubject": "<name>"}
   Use when: user talks about timing changes, cancellations, extra classes, swaps
   For dates: today=${todayDateStr}, tomorrow=${(() => { const t = new Date(todayDateStr + "T12:00:00"); t.setDate(t.getDate() + 1); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`; })()}
   Convert day names to actual dates. Convert "2pm" to "14:00", "9:30am" to "09:30"

8. "get_attendance_history" — params: {"subject": "<name or empty>", "days": <number, default 7>}
   Use when: user asks about past records, history, when they last attended

9. "chat" — params: {"message": "<your response>"}
   Use when: user is chatting casually, greeting, or asking something you can answer without data

CRITICAL RULES:
- Output ONLY the JSON object. No other text before or after.
- No markdown code fences. No \`\`\`json. Just raw JSON.
- If unsure about intent, use "chat" with a helpful response asking for clarification.
- Match subject names fuzzily — "dbms" matches "Database Management Systems", "os" matches "Operating Systems", etc.`;

  // Build conversation
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  try {
    // Step 1: Get intent from LLM
    const intentRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://attendease-c7wl.vercel.app",
        "X-Title": "AttendEase",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 512,
      }),
    });

    if (!intentRes.ok) {
      const err = await intentRes.json().catch(() => ({}));
      console.error("[Chatbot] LLM error:", err);
      return NextResponse.json({ error: "AI service temporarily unavailable." }, { status: 502 });
    }

    const intentData = await intentRes.json();
    const rawContent = intentData.choices?.[0]?.message?.content || "";

    // Parse intent JSON from response
    let intent: string = "chat";
    let params: any = {};

    try {
      // Strip thinking tags, code fences, and whitespace
      let cleaned = rawContent
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();

      // Find JSON object in the response
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);
        intent = parsed.intent || "chat";
        params = parsed.params || {};
      }
    } catch (e) {
      console.error("[Chatbot] JSON parse error:", e, "Raw:", rawContent.substring(0, 300));
      // If we can't parse, treat as chat and return the raw text
      return NextResponse.json({
        reply: rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || "Sorry, I didn't understand that. Could you rephrase?",
        actions: [],
      });
    }

    // Step 2: Execute the intent
    let result: any;
    const actions: string[] = [];

    switch (intent) {
      case "get_todays_classes":
        result = await execGetTodaysClasses(user.id);
        break;
      case "mark_attendance":
        if (!params.subject || !params.status) {
          result = { error: "Please specify which subject and status (present/absent/late)." };
        } else {
          result = await execMarkAttendance(user.id, params.subject, params.status);
          if (result.success) actions.push("attendance_marked");
        }
        break;
      case "mark_bulk_attendance":
        if (!params.status) {
          result = { error: "Please specify status: present, absent, or late." };
        } else {
          result = await execMarkBulkAttendance(user.id, params.status);
          if (result.success) actions.push("attendance_marked");
        }
        break;
      case "get_analytics":
        result = await execGetAnalytics(user.id);
        break;
      case "get_subject_info":
        if (!params.subject) {
          result = { error: "Which subject? Please specify." };
        } else {
          result = await execGetSubjectInfo(user.id, params.subject);
        }
        break;
      case "skip_optimizer":
        result = await execSkipOptimizer(user.id, params.maxSkips || 3);
        break;
      case "schedule_override":
        if (!params.subject || !params.action || !params.date) {
          result = { error: "Please specify subject, action (cancel/reschedule/extra/swap), and date." };
        } else {
          result = await execScheduleOverride(
            user.id, params.action, params.subject, params.date,
            params.newTime, params.swapSubject
          );
          if (result.success) actions.push("schedule_changed");
        }
        break;
      case "get_attendance_history":
        result = await execGetAttendanceHistory(user.id, params.subject, params.days || 7);
        break;
      case "chat":
        // Direct chat response — no data lookup needed
        return NextResponse.json({
          reply: params.message || "I'm here to help. You can ask about your schedule, mark attendance, view analytics, check skip availability, or manage schedule changes.",
          actions: [],
        });
      default:
        result = { error: "I couldn't determine your request. Try asking about your classes, attendance, or analytics." };
    }

    // Step 3: Format using deterministic formatter (no second LLM call — avoids hallucinated numbers)
    const reply = formatFallback(intent, result);
    return NextResponse.json({ reply, actions });
  } catch (error) {
    console.error("[Chatbot] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

// ── Deterministic response formatter ──────────────────────────

function formatFallback(intent: string, result: any): string {
  if (result.error) return `Unable to complete the request: ${result.error}`;

  switch (intent) {
    case "get_todays_classes": {
      if (result.classes.length === 0) {
        return `Schedule for ${result.dayName}, ${result.date}:\n\nNo classes are scheduled for today. You have a free day.`;
      }

      const marked = result.classes.filter((c: any) => c.attendanceMarked).length;
      const unmarked = result.totalClasses - marked;

      const lines = result.classes.map((c: any, i: number) => {
        const idx = i + 1;
        const status = c.attendanceMarked ? `Marked: ${c.attendanceStatus}` : "Not marked";
        const pctLabel = c.currentPct >= c.minPct ? `${c.currentPct}% (safe)` : `${c.currentPct}% (below ${c.minPct}%)`;
        return `${idx}. ${c.subjectName}\n   Time: ${c.startTime} - ${c.endTime}${c.room ? ` | Room: ${c.room}` : ""}\n   Attendance: ${pctLabel} | Status: ${status}`;
      });

      let msg = `Schedule for ${result.dayName}, ${result.date}\n${result.totalClasses} class${result.totalClasses > 1 ? "es" : ""} scheduled today.\n\n${lines.join("\n\n")}`;

      msg += `\n\nSummary: ${marked} of ${result.totalClasses} marked`;
      if (unmarked > 0) msg += ` | ${unmarked} pending`;

      return msg;
    }

    case "mark_attendance": {
      const statusLabel = result.status.charAt(0).toUpperCase() + result.status.slice(1);
      return `Attendance recorded successfully.\n\nSubject: ${result.subjectName}\nStatus: ${statusLabel}\nUpdated attendance: ${result.newPercentage}%\n\nYour dashboard has been refreshed to reflect this change.`;
    }

    case "mark_bulk_attendance": {
      const statusLabel = result.status.charAt(0).toUpperCase() + result.status.slice(1);
      const subjectLines = result.subjects.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
      return `Bulk attendance recorded successfully.\n\nStatus: ${statusLabel}\nClasses updated: ${result.count}\n\n${subjectLines}\n\nAll records have been saved and your dashboard is updated.`;
    }

    case "get_analytics": {
      const safe = result.subjects.filter((s: any) => s.status === "green").length;
      const warning = result.subjects.filter((s: any) => s.status === "yellow").length;
      const danger = result.subjects.filter((s: any) => s.status === "red").length;

      const lines = result.subjects.map((s: any) => {
        const statusTag = s.status === "green" ? "Safe" : s.status === "yellow" ? "At Risk" : "Danger";
        const skipInfo = s.canSkip > 0
          ? `${s.canSkip} skip${s.canSkip > 1 ? "s" : ""} available`
          : "no skips available";
        return `- ${s.name}: ${s.currentPct}% [${statusTag}]\n  ${s.totalClasses} classes held | Streak: ${s.streak} days | ${skipInfo}`;
      });

      let msg = `Attendance Analytics Overview\n\nOverall attendance: ${result.overallPct}% across ${result.totalSubjects} subject${result.totalSubjects > 1 ? "s" : ""}`;
      msg += `\nBreakdown: ${safe} safe, ${warning} at risk, ${danger} in danger`;
      msg += `\n\nSubject-wise details:\n\n${lines.join("\n\n")}`;

      if (danger > 0) {
        const dangerNames = result.subjects.filter((s: any) => s.status === "red").map((s: any) => s.name).join(", ");
        msg += `\n\nImmediate attention required for: ${dangerNames}. These subjects are below the minimum attendance threshold.`;
      }

      return msg;
    }

    case "get_subject_info": {
      const statusTag = result.status === "green" ? "Safe" : result.status === "yellow" ? "At Risk" : "Danger";
      let msg = `Subject Report: ${result.name}${result.code ? ` (${result.code})` : ""}\n`;
      msg += `\nStatus: ${statusTag}`;
      msg += `\nCurrent attendance: ${result.currentPct}%`;
      msg += `\nMinimum required: ${result.minRequired}%`;
      msg += `\nClasses attended: ${result.totalPresent} of ${result.totalClasses} held`;
      msg += `\nClasses absent: ${result.totalAbsent}`;
      msg += `\nCurrent streak: ${result.streak} day${result.streak !== 1 ? "s" : ""}`;

      if (result.canSkip > 0) {
        msg += `\n\nYou can safely skip up to ${result.canSkip} more class${result.canSkip > 1 ? "es" : ""} and remain above ${result.minRequired}%.`;
      } else if (result.needToAttend > 0) {
        msg += `\n\nRecovery plan: You need to attend the next ${result.needToAttend} consecutive class${result.needToAttend > 1 ? "es" : ""} to reach ${result.minRequired}%.`;
      } else {
        msg += `\n\nYou are exactly at the threshold. No skips are available at this time.`;
      }

      if (result.schedule && result.schedule.length > 0) {
        const schedLines = result.schedule.map((s: any) => `- ${s.day}: ${s.time}${s.room ? ` (${s.room})` : ""}`).join("\n");
        msg += `\n\nWeekly schedule:\n${schedLines}`;
      }

      return msg;
    }

    case "skip_optimizer": {
      if (result.recommendations.length === 0) {
        let msg = "Skip Optimizer Result\n\nNo safe skips are available at this time.";
        if (result.cannotSkip.length > 0) {
          msg += ` The following subjects are at or below their minimum attendance threshold and require your attendance: ${result.cannotSkip.join(", ")}.`;
        }
        return msg;
      }

      const lines = result.recommendations.map((r: any) =>
        `- ${r.subjectName}: ${r.skipsAllocated} skip${r.skipsAllocated > 1 ? "s" : ""} allocated\n  Current: ${r.currentPct}% | After skipping: ${r.newPct}% | Remaining buffer: ${r.remainingBuffer} skip${r.remainingBuffer !== 1 ? "s" : ""}`
      );

      let msg = `Skip Optimizer Result\n\nRequested: ${result.totalRequested} skip${result.totalRequested > 1 ? "s" : ""} | Allocated: ${result.totalSkipsUsed}\n\nRecommended allocation:\n\n${lines.join("\n\n")}`;

      if (result.cannotSkip.length > 0) {
        msg += `\n\nDo not skip: ${result.cannotSkip.join(", ")}. These subjects have no buffer remaining.`;
      }

      if (result.safeToSkipAll) {
        msg += `\n\nAll requested skips have been safely allocated without dropping below any threshold.`;
      }

      return msg;
    }

    case "schedule_override": {
      if (result.action === "swap") {
        return `Schedule Override Confirmed\n\nAction: Swap\nDate: ${result.date}\nSwapped: ${result.subject1} and ${result.subject2}\n\nBoth subjects will follow each other's original time slots for the specified date. Your dashboard and notifications will reflect this change.`;
      }

      const actionLabels: Record<string, string> = {
        cancel: "Cancellation",
        reschedule: "Reschedule",
        extra: "Extra Class",
      };
      const actionLabel = actionLabels[result.action] || result.action;

      let msg = `Schedule Override Confirmed\n\nAction: ${actionLabel}\nSubject: ${result.subjectName}\nDate: ${result.date}`;
      if (result.newTime) msg += `\nNew time: ${result.newTime}`;

      if (result.action === "cancel") {
        msg += `\n\nThis class has been marked as cancelled. It will not appear in your schedule or notifications for this date.`;
      } else if (result.action === "reschedule") {
        msg += `\n\nThe class has been moved to the new time slot. Your schedule and reminders will update accordingly.`;
      } else if (result.action === "extra") {
        msg += `\n\nAn additional class session has been added. It will appear in your schedule for this date.`;
      }

      return msg;
    }

    case "get_attendance_history": {
      if (result.records.length === 0) return `Attendance History\n\nNo records found for the last ${result.days} day${result.days > 1 ? "s" : ""}. You can mark attendance from your dashboard or by asking me.`;

      const statusCounts: Record<string, number> = {};
      result.records.forEach((r: any) => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      });
      const countSummary = Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(", ");

      const lines = result.records.slice(0, 15).map((r: any) =>
        `- ${r.date} | ${r.subject}: ${r.status}`
      );

      let msg = `Attendance History (last ${result.days} days)\n\nTotal records: ${result.total}\nBreakdown: ${countSummary}\n\n${lines.join("\n")}`;

      if (result.total > 15) msg += `\n\n${result.total - 15} additional record${result.total - 15 > 1 ? "s" : ""} not shown. View your full history on the Calendar page.`;

      return msg;
    }

    default:
      return "The requested action has been completed. Let me know if there is anything else I can help with.";
  }
}
