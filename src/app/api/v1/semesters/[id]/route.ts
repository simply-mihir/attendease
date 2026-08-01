import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET — get single semester with full details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const semester = await prisma.semester.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      subjects: {
        include: {
          _count: { select: { attendanceRecords: true } },
        },
      },
      holidays: { orderBy: { date: "asc" } },
      examPeriods: { orderBy: { startDate: "asc" } },
    },
  });

  if (!semester) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 });
  }

  return NextResponse.json(semester);
}

// PUT — update semester (name, dates) or end it
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const { name, startDate, endDate, isCurrent } = body;

  const semester = await prisma.semester.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!semester) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (name) updateData.name = name;
  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate) updateData.endDate = new Date(endDate);
  
  // Ending a semester
  if (isCurrent === false) {
    updateData.isCurrent = false;
  }

  // Activating a semester — deactivate others first
  if (isCurrent === true) {
    await prisma.semester.updateMany({
      where: { userId: user.id, isCurrent: true },
      data: { isCurrent: false },
    });
    updateData.isCurrent = true;
  }

  const updated = await prisma.semester.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
