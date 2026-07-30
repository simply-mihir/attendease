import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = params;
    const body = await req.json();

    const existing = await prisma.reminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
        ...(body.dueTime !== undefined && { dueTime: body.dueTime || null }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.isCompleted !== undefined && { isCompleted: Boolean(body.isCompleted) }),
        ...(body.subjectId !== undefined && { subjectId: body.subjectId || null }),
      },
      include: {
        subject: {
          select: { id: true, name: true, colorHex: true, code: true },
        },
      },
    });

    return NextResponse.json({ reminder: updated });
  } catch (err: any) {
    console.error("Update reminder error:", err);
    return NextResponse.json({ error: err.message || "Failed to update reminder" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const { id } = params;
    const existing = await prisma.reminder.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    await prisma.reminder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete reminder error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete reminder" }, { status: 500 });
  }
}
