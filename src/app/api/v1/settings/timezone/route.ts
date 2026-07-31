import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const { timezone } = await req.json();
  if (!timezone || typeof timezone !== "string") {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  // Validate timezone
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { timezone },
  });

  return NextResponse.json({ ok: true, timezone });
}
