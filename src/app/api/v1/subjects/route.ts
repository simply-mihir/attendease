import { NextRequest } from "next/server";
import { prisma, ensureSchema } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { createSubjectSchema } from "@/lib/validations/subject";
import { cachedJson } from "@/lib/api-cache";
import { generateSlug } from "@/lib/subject-slug";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await getAuthUser();
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

  // Backfill slugs (safe — skips if slug column doesn't exist yet)
  try {
    for (const s of subjects) {
      if (!s.slug) {
        const slug = await uniqueSlug(s.name, user.id, s.id);
        await prisma.subject.update({ where: { id: s.id }, data: { slug } });
        (s as any).slug = slug;
      }
    }
  } catch {
    // slug column doesn't exist yet — skip backfill
  }

  return cachedJson({ subjects }, 30);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = createSubjectSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const activeSemester = await prisma.semester.findFirst({
      where: { userId: user.id, isCurrent: true },
    });

    let slug: string | undefined;
    try {
      slug = await uniqueSlug(parsed.data.name, user.id);
    } catch {
      // slug column doesn't exist yet
    }

    const subject = await prisma.subject.create({
      data: {
        ...parsed.data,
        userId: user.id,
        ...(slug ? { slug } : {}),
        semesterId: parsed.data.semesterId || activeSemester?.id || null
      },
      include: { schedules: true },
    });

    return Response.json({ subject }, { status: 201 });
  } catch (error) {
    console.error("Create subject error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Generate a unique slug for a user, appending -2, -3, etc. if needed. */
async function uniqueSlug(name: string, userId: string, excludeId?: string): Promise<string> {
  const base = generateSlug(name);
  let candidate = base;
  let counter = 1;

  while (true) {
    const conflict = await prisma.subject.findFirst({
      where: {
        userId,
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (!conflict) return candidate;
    counter++;
    candidate = `${base}-${counter}`;
  }
}
