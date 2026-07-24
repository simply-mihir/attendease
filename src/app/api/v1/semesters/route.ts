import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();
  const semesters = await prisma.semester.findMany({
    where: { userId: user.id },
    include: { subjects: { select: { id: true } } },
    orderBy: { startDate: "desc" },
  });
  return Response.json({ semesters });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();
  const body = await req.json();

  if (body.isCurrent) {
    await prisma.semester.updateMany({
      where: { userId: user.id, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const semester = await prisma.semester.create({
    data: {
      userId: user.id,
      name: body.name,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isCurrent: body.isCurrent || false,
    },
  });
  return Response.json({ semester }, { status: 201 });
}
