import { NextRequest } from "next/server";
import { prisma, ensureSchema } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { generateSlug } from "@/lib/subject-slug";

/** Resolve a subject by slug first, then fall back to ID. Ensures schema is ready. */
async function resolveSubject(slugOrId: string, userId: string) {
  await ensureSchema();
  // Try slug lookup first (safe — fails gracefully if slug column doesn't exist)
  try {
    const bySlug = await prisma.subject.findFirst({
      where: { slug: slugOrId, userId },
    });
    if (bySlug) return bySlug;
  } catch {
    // slug column doesn't exist yet — skip slug lookup
  }

  // Fall back to ID
  return prisma.subject.findFirst({ where: { id: slugOrId, userId } });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

  const base = await resolveSubject(id, user.id);
  if (!base) return Response.json({ error: "Not found" }, { status: 404 });

  // Backfill slug if missing (safe)
  try {
    if (!base.slug) {
      const slug = await uniqueSlug(base.name, user.id, base.id);
      await prisma.subject.update({ where: { id: base.id }, data: { slug } });
      base.slug = slug;
    }
  } catch {
    // slug column doesn't exist yet
  }

  const subject = await prisma.subject.findFirst({
    where: { id: base.id, userId: user.id },
    include: {
      schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      attendanceRecords: { orderBy: { date: "desc" }, take: 60 },
      semester: { select: { name: true } },
    },
  });

  if (!subject) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ subject });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

  const existing = await resolveSubject(id, user.id);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Regenerate slug if name changed (safe)
  let slug = existing.slug;
  try {
    if (body.name && body.name !== existing.name) {
      slug = await uniqueSlug(body.name, user.id, existing.id);
    } else if (!slug) {
      slug = await uniqueSlug(existing.name, user.id, existing.id);
    }
  } catch {
    slug = undefined;
  }

  const subject = await prisma.subject.update({
    where: { id: existing.id },
    data: {
      name: body.name,
      code: body.code,
      instructorName: body.instructorName,
      minAttendancePct: body.minAttendancePct,
      colorHex: body.colorHex,
      icon: body.icon,
      semesterId: body.semesterId,
      reminderEnabled: body.reminderEnabled,
      reminderBeforeMin: body.reminderBeforeMin,
      isArchived: body.isArchived,
      archiveReason: body.archiveReason,
      ...(slug !== undefined ? { slug } : {}),
    },
    include: { schedules: true },
  });

  return Response.json({ subject });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

  const existing = await resolveSubject(id, user.id);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.subject.delete({ where: { id: existing.id } });
  return Response.json({ success: true });
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
