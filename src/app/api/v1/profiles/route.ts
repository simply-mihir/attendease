import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const profiles = await prisma.degreeProfile.findMany({
    where: { userId: user.id },
    include: { semesters: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "Course/Degree name is required" }, { status: 400 });
  }

  if (body.isCurrent ?? true) {
    await prisma.degreeProfile.updateMany({
      where: { userId: user.id, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const profile = await prisma.degreeProfile.create({
    data: {
      userId: user.id,
      name: body.name,
      degreeType: body.degreeType || body.name,
      institution: body.institution || null,
      isCurrent: body.isCurrent ?? true,
    },
  });

  // Create initial semester if provided
  if (body.semesterName) {
    await prisma.semester.updateMany({
      where: { userId: user.id, isCurrent: true },
      data: { isCurrent: false },
    });

    const now = new Date();
    const sixMonths = new Date(now);
    sixMonths.setMonth(sixMonths.getMonth() + 6);

    await prisma.semester.create({
      data: {
        userId: user.id,
        degreeProfileId: profile.id,
        name: body.semesterName,
        startDate: now,
        endDate: sixMonths,
        isCurrent: true,
      },
    });
  }

  return NextResponse.json({ profile }, { status: 201 });
}
