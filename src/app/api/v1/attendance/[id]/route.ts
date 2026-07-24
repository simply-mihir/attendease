import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();
  const { id } = await params;

  const existing = await prisma.attendanceRecord.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "update",
      entityType: "attendance",
      entityId: id,
      oldValue: JSON.stringify({ status: existing.status }),
      newValue: JSON.stringify({ status: body.status }),
    },
  });

  const record = await prisma.attendanceRecord.update({
    where: { id },
    data: {
      status: body.status,
      notes: body.notes,
      editedAt: new Date(),
      editedReason: body.editReason || "Manual edit",
    },
  });

  // Recalc stats (inline simplified version)
  const records = await prisma.attendanceRecord.findMany({
    where: { subjectId: record.subjectId },
  });
  const countable = records.filter((r) => !["holiday", "cancelled"].includes(r.status));
  const present = countable.filter((r) => r.status === "present" || r.status === "late").length;
  const currentPercentage = countable.length === 0 ? 0 : Math.round((present / countable.length) * 10000) / 100;
  await prisma.subject.update({
    where: { id: record.subjectId },
    data: {
      totalClassesHeld: countable.length,
      totalPresent: countable.filter((r) => r.status === "present").length,
      totalAbsent: countable.filter((r) => r.status === "absent").length,
      totalLate: countable.filter((r) => r.status === "late").length,
      totalExcused: countable.filter((r) => r.status === "excused").length,
      currentPercentage,
    },
  });

  return Response.json({ record });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();
  const { id } = await params;

  const existing = await prisma.attendanceRecord.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "delete",
      entityType: "attendance",
      entityId: id,
      oldValue: JSON.stringify(existing),
    },
  });

  await prisma.attendanceRecord.delete({ where: { id } });
  return Response.json({ success: true });
}
