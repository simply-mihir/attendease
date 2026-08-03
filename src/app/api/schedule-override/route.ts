import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { parseScheduleMessage } from "@/lib/schedule-parser";

// POST — parse user message and create override
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session!.user as any).id;

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  try {
    // Get user's subjects for matching
    const subjects = await prisma.subject.findMany({
      where: {
        user: { id: userId },
      },
      include: {
        schedules: true,
      },
    });

    // Parse the message
    const parsed = parseScheduleMessage(message, subjects as any);

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        reply: parsed.error,
        suggestions: parsed.suggestions || [],
      });
    }

    // Create the override(s)
    if (parsed.type === "swap") {
      // Create two overrides for a swap
      await prisma.$transaction([
        prisma.scheduleOverride.create({
          data: {
            userId: userId,
            date: parsed.date,
            subjectId: parsed.subjectId,
            type: "swap",
            originalTime: parsed.originalTime,
            newTime: parsed.newTime,
            swapSubjectId: parsed.swapSubjectId,
            note: message,
          },
        }),
        prisma.scheduleOverride.create({
          data: {
            userId: userId,
            date: parsed.date,
            subjectId: parsed.swapSubjectId!,
            type: "swap",
            originalTime: parsed.newTime,
            newTime: parsed.originalTime,
            swapSubjectId: parsed.subjectId,
            note: message,
          },
        }),
      ]);
    } else {
      await prisma.scheduleOverride.create({
        data: {
          userId: userId,
          date: parsed.date,
          subjectId: parsed.subjectId,
          type: parsed.type,
          originalTime: parsed.originalTime,
          newTime: parsed.newTime,
          note: message,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reply: parsed.confirmMessage,
      override: parsed,
    });
  } catch (error) {
    console.error("Schedule override error:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}

// GET — fetch overrides for a date range
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session!.user as any).id;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const overrides = await prisma.scheduleOverride.findMany({
    where: {
      userId: userId,
      ...(startDate && endDate
        ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      swapSubject: { select: { id: true, name: true, code: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ overrides });
}
