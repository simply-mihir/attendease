import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { createScheduleSchema } from "@/lib/validations/subject";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const schedules = await prisma.schedule.findMany({
    where: { userId: user.id, isActive: true },
    include: { subject: { select: { name: true, colorHex: true, currentPercentage: true, minAttendancePct: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return Response.json({ schedules });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = createScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const subject = await prisma.subject.findFirst({
      where: { id: parsed.data.subjectId, userId: user.id },
    });
    if (!subject) return Response.json({ error: "Subject not found" }, { status: 404 });

    const schedule = await prisma.schedule.create({
      data: { ...parsed.data, userId: user.id },
    });

    return Response.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error("Create schedule error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
