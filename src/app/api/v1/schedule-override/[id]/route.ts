import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const userId = user.id;

  await prisma.scheduleOverride.deleteMany({
    where: {
      id: params.id,
      userId: userId,
    },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  const userId = user.id;

  const body = await req.json();

  try {
    const { createOverrideSchema } = await import("@/lib/validations/subject");
    const parsedManual = createOverrideSchema.safeParse(body);
    
    if (!parsedManual.success) {
      return NextResponse.json({ error: parsedManual.error.errors[0].message }, { status: 400 });
    }

    const override = await prisma.scheduleOverride.updateMany({
      where: {
        id: params.id,
        userId: userId,
      },
      data: {
        date: new Date(parsedManual.data.date),
        subjectId: parsedManual.data.subjectId,
        type: parsedManual.data.type,
        originalTime: parsedManual.data.originalTime,
        newTime: parsedManual.data.newTime,
        note: parsedManual.data.note,
        weight: parsedManual.data.weight,
      },
    });

    if (override.count === 0) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update override:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
