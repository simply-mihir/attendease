import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session!.user as any).id;

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
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session!.user as any).id;

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
