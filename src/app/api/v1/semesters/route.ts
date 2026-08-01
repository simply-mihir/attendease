import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { migrateExistingSubjects } from "@/lib/semester-migration";

// GET — list all semesters for the user
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  // Auto-migrate existing subjects if needed
  await migrateExistingSubjects(user.id);

  const semesters = await prisma.semester.findMany({
    where: { userId: user.id },
    include: {
      subjects: { select: { id: true, name: true } },
      _count: { select: { subjects: true, holidays: true, examPeriods: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(semesters);
}

// POST — create a new semester
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { name, startDate, endDate } = await req.json();

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "Name, start date, and end date are required" }, { status: 400 });
  }

  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  // Deactivate any currently active semester
  await prisma.semester.updateMany({
    where: { userId: user.id, isCurrent: true },
    data: { isCurrent: false },
  });

  const semester = await prisma.semester.create({
    data: {
      userId: user.id,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: true,
    },
  });

  return NextResponse.json(semester, { status: 201 });
}
