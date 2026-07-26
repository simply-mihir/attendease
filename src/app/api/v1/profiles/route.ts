import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  let profiles = await prisma.degreeProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (profiles.length === 0) {
    const defaultProfile = await prisma.degreeProfile.create({
      data: {
        userId: user.id,
        name: "Main Degree Program",
        degreeType: "Bachelor of Technology",
        isCurrent: true,
      },
    });
    profiles = [defaultProfile];
  }

  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
  }

  if (body.isCurrent) {
    await prisma.degreeProfile.updateMany({
      where: { userId: user.id, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const profile = await prisma.degreeProfile.create({
    data: {
      userId: user.id,
      name: body.name,
      degreeType: body.degreeType || null,
      institution: body.institution || null,
      isCurrent: body.isCurrent ?? true,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}
