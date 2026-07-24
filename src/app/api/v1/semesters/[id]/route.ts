import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const body = await req.json();

  if (body.isCurrent) {
    await prisma.semester.updateMany({ where: { userId: user.id, isCurrent: true }, data: { isCurrent: false } });
  }

  const semester = await prisma.semester.update({
    where: { id },
    data: {
      name: body.name,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      isCurrent: body.isCurrent,
    },
  });
  return Response.json({ semester });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  await prisma.semester.delete({ where: { id } });
  return Response.json({ success: true });
}
