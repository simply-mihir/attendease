import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: Record<string, unknown> = { userId: user.id };
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const exceptions = await prisma.classException.findMany({
    where,
    include: { subject: { select: { name: true } } },
    orderBy: { date: "desc" },
  });
  return Response.json({ exceptions });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const body = await req.json();

  const exception = await prisma.classException.create({
    data: {
      userId: user.id,
      subjectId: body.allSubjects ? null : body.subjectId,
      exceptionType: body.exceptionType,
      date: new Date(body.date),
      reason: body.reason,
      allSubjects: body.allSubjects || false,
    },
  });
  return Response.json({ exception }, { status: 201 });
}
