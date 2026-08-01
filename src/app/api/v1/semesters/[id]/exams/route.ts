import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const exams = await prisma.examPeriod.findMany({
    where: { semesterId: params.id, semester: { userId: user.id } },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(exams);
}

// POST — create exam period
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const semester = await prisma.semester.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!semester) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

  const { name, startDate, endDate } = await req.json();
  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "Name, start date, and end date required" }, { status: 400 });
  }

  const exam = await prisma.examPeriod.create({
    data: {
      semesterId: params.id,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return NextResponse.json(exam, { status: 201 });
}

// DELETE — remove exam period
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { examId } = await req.json();
  if (!examId) return NextResponse.json({ error: "examId required" }, { status: 400 });

  const exam = await prisma.examPeriod.findFirst({
    where: { id: examId, semester: { userId: user.id } },
  });
  if (!exam) return NextResponse.json({ error: "Exam period not found" }, { status: 404 });

  await prisma.examPeriod.delete({ where: { id: examId } });
  return NextResponse.json({ success: true });
}
