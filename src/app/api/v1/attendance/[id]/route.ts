import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { recalcSubjectStats } from "@/lib/subject-stats";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

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
      date: body.date ? new Date(body.date) : undefined,
      editedAt: new Date(),
      editedReason: body.editReason || "Manual edit",
    },
  });

  const updatedStats = await recalcSubjectStats(record.subjectId);

  return Response.json({ record, updatedStats });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

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
  
  const updatedStats = await recalcSubjectStats(existing.subjectId);

  return Response.json({ success: true, updatedStats });
}
