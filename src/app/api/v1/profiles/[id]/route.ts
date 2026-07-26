import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

  const existing = await prisma.degreeProfile.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body.isCurrent) {
    await prisma.degreeProfile.updateMany({
      where: { userId: user.id, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const profile = await prisma.degreeProfile.update({
    where: { id },
    data: {
      name: body.name !== undefined ? body.name : existing.name,
      degreeType: body.degreeType !== undefined ? body.degreeType : existing.degreeType,
      institution: body.institution !== undefined ? body.institution : existing.institution,
      isCurrent: body.isCurrent !== undefined ? body.isCurrent : existing.isCurrent,
    },
  });

  return NextResponse.json({ profile });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const { id } = params;

  const existing = await prisma.degreeProfile.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.degreeProfile.delete({ where: { id } });

  // Ensure at least one current profile exists
  const remaining = await prisma.degreeProfile.findFirst({ where: { userId: user.id } });
  if (remaining && !remaining.isCurrent) {
    await prisma.degreeProfile.update({ where: { id: remaining.id }, data: { isCurrent: true } });
  }

  return NextResponse.json({ success: true });
}
