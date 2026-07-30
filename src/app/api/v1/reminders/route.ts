import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cachedJson } from "@/lib/api-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const subjectId = searchParams.get("subjectId");
  const category = searchParams.get("category");
  const completed = searchParams.get("completed");

  const where: any = { userId: user.id };
  if (subjectId) where.subjectId = subjectId;
  if (category) where.category = category;
  if (completed !== null && completed !== undefined) {
    where.isCompleted = completed === "true";
  }

  const reminders = await prisma.reminder.findMany({
    where,
    include: {
      subject: {
        select: { id: true, name: true, colorHex: true, code: true },
      },
    },
    orderBy: [
      { isCompleted: "asc" },
      { dueDate: "asc" },
      { dueTime: "asc" },
    ],
  });

  return NextResponse.json({ reminders });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { title, description, category, dueDate, dueTime, priority, subjectId } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ error: "Title and dueDate are required" }, { status: 400 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "other",
        dueDate: new Date(dueDate),
        dueTime: dueTime || null,
        priority: priority || "medium",
      },
      include: {
        subject: {
          select: { id: true, name: true, colorHex: true, code: true },
        },
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err: any) {
    console.error("Create reminder error:", err);
    return NextResponse.json({ error: err.message || "Failed to create reminder" }, { status: 500 });
  }
}
