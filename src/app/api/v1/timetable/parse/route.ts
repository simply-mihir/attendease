import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import * as XLSX from "xlsx";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const TIMETABLE_PROMPT = `You are a timetable parser. Analyze this university/college class timetable and extract ALL subjects with their weekly schedule.

Return ONLY valid JSON in this exact format, no other text:
{
  "subjects": [
    {
      "name": "Subject Name",
      "code": "CS101 or null if not visible",
      "instructor": "Professor name or null if not visible",
      "schedules": [
        {
          "day": "Monday",
          "startTime": "09:00",
          "endTime": "10:00",
          "room": "Room 301 or null if not visible"
        }
      ]
    }
  ]
}

Rules:
- Use 24-hour time format (HH:MM)
- Day names must be: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- If a subject appears multiple times on different days, group all schedules under one subject entry
- If end time is not visible, estimate based on typical class duration (1 hour)
- Merge duplicate subjects (same name appearing in different cells)
- Ignore breaks, lunch, free periods
- If the content is not a timetable, return: {"subjects": [], "error": "This doesn't appear to be a timetable"}`;

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const COLORS = [
  "#7C3AED", "#06B6D4", "#EC4899", "#F59E0B", "#22C55E",
  "#EF4444", "#8B5CF6", "#14B8A6", "#F97316", "#6366F1",
  "#A855F7", "#0EA5E9", "#E11D48", "#84CC16", "#D946EF",
];

// Supported mime types for inline data (image + PDF)
const INLINE_MIME_TYPES = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/pdf",
]);

// Convert Excel/CSV base64 to text table for Gemini
function parseSpreadsheetToText(base64Data: string, mimeType: string): string {
  const buffer = Buffer.from(base64Data, "base64");
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });

  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (workbook.SheetNames.length > 1) {
      lines.push(`--- Sheet: ${sheetName} ---`);
    }
    // Convert to CSV-like text so Gemini can read it
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    lines.push(csv);
  }

  const text = lines.join("\n");
  if (text.trim().length === 0) {
    throw new Error("The file appears to be empty");
  }
  return text;
}

async function callGeminiWithInlineData(
  base64Data: string,
  mimeType: string
): Promise<Response> {
  return fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: TIMETABLE_PROMPT },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
    }),
  });
}

async function callGeminiWithText(textContent: string): Promise<Response> {
  return fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${TIMETABLE_PROMPT}\n\nHere is the timetable data extracted from a spreadsheet:\n\n${textContent}`,
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
    }),
  });
}

function normalizeSubjects(parsed: Record<string, unknown>) {
  if (!parsed.subjects || !Array.isArray(parsed.subjects)) {
    return null;
  }

  return parsed.subjects.map(
    (s: Record<string, unknown>, i: number) => ({
      name: (typeof s.name === "string" ? s.name : "Unknown Subject").trim(),
      code: typeof s.code === "string" ? s.code.trim() || null : null,
      instructor:
        typeof s.instructor === "string" ? s.instructor.trim() || null : null,
      colorHex: COLORS[i % COLORS.length],
      schedules: (Array.isArray(s.schedules) ? s.schedules : [])
        .map((sch: Record<string, unknown>) => ({
          day: sch.day,
          dayOfWeek:
            DAY_MAP[typeof sch.day === "string" ? sch.day.toLowerCase() : ""] ??
            -1,
          startTime: typeof sch.startTime === "string" ? sch.startTime : "09:00",
          endTime: typeof sch.endTime === "string" ? sch.endTime : "10:00",
          room: typeof sch.room === "string" ? sch.room.trim() || null : null,
        }))
        .filter((sch: { dayOfWeek: number }) => sch.dayOfWeek >= 0),
    })
  );
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Timetable import is not configured. Ask your admin to set GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  const { image, mimeType } = (await req.json()) as {
    image: string;
    mimeType: string;
  };

  if (!image || !mimeType) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  // Limit file size (~10MB base64 ≈ 13.3MB string)
  if (image.length > 14_000_000) {
    return NextResponse.json(
      { error: "File too large. Max 10MB." },
      { status: 400 }
    );
  }

  try {
    let geminiRes: Response;

    if (INLINE_MIME_TYPES.has(mimeType)) {
      // Images and PDFs → send as inline data
      geminiRes = await callGeminiWithInlineData(image, mimeType);
    } else {
      // Excel/CSV → parse to text, send as text prompt
      let textContent: string;
      try {
        textContent = parseSpreadsheetToText(image, mimeType);
      } catch (parseErr) {
        console.error("[Timetable] Spreadsheet parse error:", parseErr);
        return NextResponse.json(
          { error: "Could not read the spreadsheet. Make sure it's a valid Excel or CSV file." },
          { status: 422 }
        );
      }
      geminiRes = await callGeminiWithText(textContent);
    }

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error("[Gemini] API error:", err);
      return NextResponse.json(
        { error: "Failed to analyze file. Try again." },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "No response from AI. Try a clearer file." },
        { status: 422 }
      );
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse AI response. Try a clearer file." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.error) {
      return NextResponse.json(
        { error: parsed.error, subjects: [] },
        { status: 200 }
      );
    }

    const subjects = normalizeSubjects(parsed);
    if (!subjects) {
      return NextResponse.json(
        { error: "Invalid timetable data. Try a clearer file." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      subjects,
      totalSubjects: subjects.length,
      totalSlots: subjects.reduce(
        (a: number, s: { schedules: unknown[] }) => a + s.schedules.length,
        0
      ),
    });
  } catch (err) {
    console.error("[Timetable] Parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse timetable. Try again." },
      { status: 500 }
    );
  }
}
