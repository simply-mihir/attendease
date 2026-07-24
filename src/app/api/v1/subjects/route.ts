import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { createSubjectSchema } from "@/lib/validations/subject";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const url = new URL(req.url);
  const archived = url.searchParams.get("archived") === "true";
  const semesterId = url.searchParams.get("semesterId");

  const subjects = await prisma.subject.findMany({
    where: {
      userId: user.id,
      isArchived: archived,
      ...(semesterId ? { semesterId } : {}),
    },
    include: {
      schedules: { where: { isActive: true } },
      semester: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return Response.json({ subjects });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = createSubjectSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: { ...parsed.data, userId: user.id },
      include: { schedules: true },
    });

    return Response.json({ subject }, { status: 201 });
  } catch (error) {
    console.error("Create subject error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
