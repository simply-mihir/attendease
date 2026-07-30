import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Timetable import is not configured" },
      { status: 503 }
    );
  }

  const { image, mimeType } = await req.json();
  // image = base64 string (no data: prefix)
  // mimeType = "image/png" | "image/jpeg" | "image/webp"

  if (!image || !mimeType) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  // Limit image size (~5MB base64 ≈ 6.6MB string)
  if (image.length > 7_000_000) {
    return NextResponse.json(
      { error: "Image too large. Max 5MB." },
      { status: 400 }
    );
  }

  const prompt = `You are a timetable parser. Analyze this university/college class timetable image and extract ALL subjects with their weekly schedule.

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
- If the image is not a timetable, return: {"subjects": [], "error": "This doesn't appear to be a timetable"}`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://attendease-c7wl.vercel.app",
        "X-Title": "AttendEase",
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[OpenRouter] API error:", err);
      return NextResponse.json(
        { error: "Failed to analyze image. Try again." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "No response from AI. Try a clearer image." },
        { status: 422 }
      );
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse AI response. Try a clearer image." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.subjects || !Array.isArray(parsed.subjects)) {
      return NextResponse.json(
        { error: "Invalid timetable data. Try a clearer image." },
        { status: 422 }
      );
    }

    // Map day names to numbers
    const DAY_MAP: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    // Generate distinct colors for subjects
    const COLORS = [
      "#7C3AED", "#06B6D4", "#EC4899", "#F59E0B", "#22C55E",
      "#EF4444", "#8B5CF6", "#14B8A6", "#F97316", "#6366F1",
      "#A855F7", "#0EA5E9", "#E11D48", "#84CC16", "#D946EF",
    ];

    const subjects = parsed.subjects.map((s: any, i: number) => ({
      name: (s.name || "Unknown Subject").trim(),
      code: s.code?.trim() || null,
      instructor: s.instructor?.trim() || null,
      colorHex: COLORS[i % COLORS.length],
      schedules: (s.schedules || [])
        .map((sch: any) => ({
          day: sch.day,
          dayOfWeek: DAY_MAP[sch.day?.toLowerCase()] ?? -1,
          startTime: sch.startTime || "09:00",
          endTime: sch.endTime || "10:00",
          room: sch.room?.trim() || null,
        }))
        .filter((sch: any) => sch.dayOfWeek >= 0),
    }));

    return NextResponse.json({
      subjects,
      totalSubjects: subjects.length,
      totalSlots: subjects.reduce(
        (a: number, s: any) => a + s.schedules.length,
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
