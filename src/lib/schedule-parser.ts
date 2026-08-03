interface Subject {
  id: string;
  name: string;
  code: string | null;
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface ParseResult {
  success: boolean;
  type: "reschedule" | "cancel" | "extra" | "swap";
  subjectId: string;
  subjectName: string;
  date: Date;
  originalTime: string | null;
  newTime: string | null;
  swapSubjectId?: string;
  swapSubjectName?: string;
  confirmMessage: string;
  error?: string;
  suggestions?: string[];
}

export function parseScheduleMessage(
  message: string,
  subjects: Subject[]
): ParseResult | { success: false; error: string; suggestions?: string[] } {
  const msg = message.toLowerCase().trim();

  // 1. Detect the type of change
  const type = detectChangeType(msg);

  // 2. Find which subject(s) are mentioned
  const matchedSubjects = findSubjects(msg, subjects);

  if (matchedSubjects.length === 0) {
    return {
      success: false,
      error: "I couldn't identify which subject you're referring to. Could you try again with the full subject name or code?",
      suggestions: subjects.map(s => s.name),
    };
  }

  // 3. Parse the date
  const date = parseDate(msg);
  if (!date) {
    return {
      success: false,
      error: "I couldn't figure out the date. Try something like 'on August 5th', 'this Monday', 'tomorrow', or 'on 05/08/2026'.",
    };
  }

  // 4. Parse time(s)
  const times = parseTimes(msg);

  // 5. Build the result based on type
  switch (type) {
    case "cancel": {
      const subject = matchedSubjects[0];
      const originalTime = findOriginalTime(subject, date) || times[0] || null;
      return {
        success: true,
        type: "cancel",
        subjectId: subject.id,
        subjectName: subject.name,
        date,
        originalTime,
        newTime: null,
        confirmMessage: `Got it! ${subject.name} class on ${formatDate(date)} has been cancelled.`,
      };
    }

    case "swap": {
      if (matchedSubjects.length < 2) {
        return {
          success: false,
          error: "For a swap, I need two subjects. E.g., 'Swap DBMS and OS timings on Monday'.",
        };
      }
      const [subA, subB] = matchedSubjects;
      const timeA = findOriginalTime(subA, date);
      const timeB = findOriginalTime(subB, date);
      return {
        success: true,
        type: "swap",
        subjectId: subA.id,
        subjectName: subA.name,
        date,
        originalTime: timeA,
        newTime: timeB,
        swapSubjectId: subB.id,
        swapSubjectName: subB.name,
        confirmMessage: `Done! Swapped ${subA.name} (${timeA || "?"}) and ${subB.name} (${timeB || "?"}) on ${formatDate(date)}.`,
      };
    }

    case "extra": {
      const subject = matchedSubjects[0];
      const newTime = times[0] || null;
      if (!newTime) {
        return {
          success: false,
          error: "What time is the extra class? E.g., 'Extra DBMS class at 3pm on Saturday'.",
        };
      }
      return {
        success: true,
        type: "extra",
        subjectId: subject.id,
        subjectName: subject.name,
        date,
        originalTime: null,
        newTime,
        confirmMessage: `Added! Extra ${subject.name} class at ${newTime} on ${formatDate(date)}.`,
      };
    }

    case "reschedule":
    default: {
      const subject = matchedSubjects[0];
      const originalTime = findOriginalTime(subject, date);

      // Try to find "from X to Y" or "moved to Y"
      let fromTime = originalTime;
      let toTime: string | null = null;

      if (times.length >= 2) {
        fromTime = times[0];
        toTime = times[1];
      } else if (times.length === 1) {
        toTime = times[0];
      }

      if (!toTime) {
        return {
          success: false,
          error: "What's the new time? E.g., 'DBMS moved to 2pm on Monday'.",
        };
      }

      return {
        success: true,
        type: "reschedule",
        subjectId: subject.id,
        subjectName: subject.name,
        date,
        originalTime: fromTime,
        newTime: toTime,
        confirmMessage: `Updated! ${subject.name} on ${formatDate(date)} moved${fromTime ? ` from ${fromTime}` : ""} to ${toTime}.`,
      };
    }
  }
}

function detectChangeType(msg: string): "reschedule" | "cancel" | "extra" | "swap" {
  if (/\b(swap|switch|exchange|interchange)\b/.test(msg)) return "swap";
  if (/\b(cancel|cancelled|no class|off|holiday|free)\b/.test(msg)) return "cancel";
  if (/\b(extra|additional|added|new class|special)\b/.test(msg)) return "extra";
  return "reschedule"; // default: moved/changed/rescheduled
}

function findSubjects(msg: string, subjects: Subject[]): Subject[] {
  const found: Subject[] = [];

  for (const subject of subjects) {
    const nameLower = subject.name.toLowerCase();
    const codeLower = subject.code?.toLowerCase();

    // Check full name match
    if (msg.includes(nameLower)) {
      found.push(subject);
      continue;
    }

    // Check code match (e.g., "CS301")
    if (codeLower && msg.includes(codeLower)) {
      found.push(subject);
      continue;
    }

    // Check abbreviation / short name match
    // "DBMS", "OS", "DCN" etc.
    const words = nameLower.split(/\s+/);
    if (words.length > 1) {
      const acronym = words.map(w => w[0]).join("");
      if (msg.includes(acronym) && acronym.length >= 2) {
        found.push(subject);
        continue;
      }
    }

    // Check partial match (first significant word)
    const significantWords = words.filter(
      w => !["and", "of", "the", "for", "in", "to", "a"].includes(w) && w.length > 3
    );
    for (const word of significantWords) {
      if (msg.includes(word)) {
        found.push(subject);
        break;
      }
    }
  }

  return found;
}

function parseDate(msg: string): Date | null {
  const now = new Date();
  const currentYear = now.getFullYear();

  // "today"
  if (/\btoday\b/.test(msg)) return startOfDay(now);

  // "tomorrow"
  if (/\btomorrow\b/.test(msg)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return startOfDay(d);
  }

  // "day after tomorrow"
  if (/\bday after tomorrow\b/.test(msg)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return startOfDay(d);
  }

  // "this Monday", "next Tuesday", "coming Wednesday"
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayMatch = msg.match(
    /\b(this|next|coming)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
  );
  if (dayMatch) {
    const isNext = dayMatch[1] === "next";
    const targetDay = dayNames.indexOf(dayMatch[2]);
    const d = new Date(now);
    let diff = targetDay - d.getDay();
    if (diff <= 0) diff += 7;
    if (isNext && diff <= 7) diff += 7;
    d.setDate(d.getDate() + diff);
    return startOfDay(d);
  }

  // "August 5", "Aug 5th", "5 August", "5th Aug"
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const monthShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  // "August 5th" or "Aug 5"
  const mdMatch = msg.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
  );
  if (mdMatch) {
    const monthStr = mdMatch[1].toLowerCase();
    const day = parseInt(mdMatch[2]);
    let monthIndex = months.indexOf(monthStr);
    if (monthIndex === -1) monthIndex = monthShort.indexOf(monthStr);
    if (monthIndex !== -1) {
      return startOfDay(new Date(currentYear, monthIndex, day));
    }
  }

  // "5th August" or "5 Aug"
  const dmMatch = msg.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i
  );
  if (dmMatch) {
    const day = parseInt(dmMatch[1]);
    const monthStr = dmMatch[2].toLowerCase();
    let monthIndex = months.indexOf(monthStr);
    if (monthIndex === -1) monthIndex = monthShort.indexOf(monthStr);
    if (monthIndex !== -1) {
      return startOfDay(new Date(currentYear, monthIndex, day));
    }
  }

  // "05/08/2026" or "5/8" (DD/MM format)
  const slashMatch = msg.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1]);
    const month = parseInt(slashMatch[2]) - 1;
    const year = slashMatch[3] ? parseInt(slashMatch[3]) : currentYear;
    return startOfDay(new Date(year < 100 ? year + 2000 : year, month, day));
  }

  return null;
}

function parseTimes(msg: string): string[] {
  const times: string[] = [];

  // Match "2pm", "2:30pm", "14:00", "2 pm", "2:30 PM"
  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?\b/g;
  let match;

  while ((match = timeRegex.exec(msg)) !== null) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3]?.toLowerCase();

    // Skip if it looks like a date (e.g., "August 5")
    if (hours > 12 && !ampm) {
      // 24-hour format like "14:00"
      if (hours <= 23) {
        times.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
      }
      continue;
    }

    if (hours > 12) continue; // invalid
    if (hours <= 0) continue;

    if (ampm === "pm" && hours !== 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;

    // If no am/pm specified and hours <= 6, assume PM (school context)
    if (!ampm && hours >= 1 && hours <= 6) hours += 12;

    times.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
  }

  return times;
}

function findOriginalTime(subject: Subject, date: Date): string | null {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
  const schedule = subject.schedules?.find(s => s.dayOfWeek === dayOfWeek);
  return schedule?.startTime || null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
