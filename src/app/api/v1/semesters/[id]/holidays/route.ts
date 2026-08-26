import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyUserModification } from "@/lib/attendance-notifier";

// GET — list holidays for a semester
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const semester = await prisma.semester.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!semester) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

  const holidays = await prisma.holiday.findMany({
    where: { semesterId: params.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(holidays);
}

// POST — add a holiday (single or bulk)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const semester = await prisma.semester.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!semester) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

  const body = await req.json();

  // Support both single and bulk
  const holidays = Array.isArray(body) ? body : [body];

  const created = [];
  for (const h of holidays) {
    if (!h.name || !h.date) continue;
    try {
      const holiday = await prisma.holiday.create({
        data: {
          semesterId: params.id,
          name: h.name,
          date: new Date(h.date),
        },
      });
      created.push(holiday);
    } catch (e: any) {
      // Skip duplicates (unique constraint)
      if (!e.code?.includes("P2002")) throw e;
    }
  }

  if (created.length > 0) {
    const title = created.length === 1 ? "Holiday Marked" : "Holidays Marked";
    const msg = created.length === 1 ? `${created[0].name} on ${created[0].date.toDateString()}` : `${created.length} holidays added.`;
    notifyUserModification(user.id, title, msg).catch(console.error);
  }

  return NextResponse.json(created, { status: 201 });
}

// DELETE — remove a holiday
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { holidayId } = await req.json();
  if (!holidayId) return NextResponse.json({ error: "holidayId required" }, { status: 400 });

  // Verify ownership
  const holiday = await prisma.holiday.findFirst({
    where: { id: holidayId, semester: { userId: user.id } },
  });
  if (!holiday) return NextResponse.json({ error: "Holiday not found" }, { status: 404 });

  await prisma.holiday.delete({ where: { id: holidayId } });
  return NextResponse.json({ success: true });
}
