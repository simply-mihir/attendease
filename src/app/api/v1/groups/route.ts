import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { calculateAttendance } from "@/lib/attendance-calc";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const memberships = await prisma.friendGroupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  subjects: {
                    where: { isArchived: false },
                    select: {
                      id: true,
                      name: true,
                      colorHex: true,
                      totalClassesHeld: true,
                      totalPresent: true,
                      totalLate: true,
                      totalAbsent: true,
                      totalExcused: true,
                      minAttendancePct: true,
                      currentPercentage: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const groups = memberships.map((m) => {
    const group = m.group;
    const members = group.members.map((member) => {
      const subjects = member.user.subjects.map((s) => {
        const stats = calculateAttendance({
          totalClasses: s.totalClassesHeld,
          totalPresent: s.totalPresent,
          totalLate: s.totalLate,
          totalAbsent: s.totalAbsent,
          totalExcused: s.totalExcused,
          minRequiredPct: s.minAttendancePct,
        });
        return {
          name: s.name,
          colorHex: s.colorHex,
          currentPct: s.currentPercentage,
          canSkipCount: stats.canSkipCount,
          statusColor: stats.statusColor,
        };
      });

      const overallPct =
        member.user.subjects.length > 0
          ? Math.round(
              (member.user.subjects.reduce(
                (sum, s) => sum + s.currentPercentage,
                0
              ) /
                member.user.subjects.length) *
                100
            ) / 100
          : 0;

      return {
        userId: member.userId,
        name: member.user.name || "Student",
        image: member.user.image,
        joinedAt: member.joinedAt,
        overallPct,
        subjects,
      };
    });

    return {
      id: group.id,
      name: group.name,
      code: group.code,
      createdBy: group.createdBy,
      memberCount: members.length,
      members,
    };
  });

  return Response.json({ groups });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { name } = body as { name: string };

    if (!name || name.trim().length === 0) {
      return Response.json({ error: "Group name is required" }, { status: 400 });
    }

    if (name.trim().length > 50) {
      return Response.json(
        { error: "Group name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Check user's group count (max 3)
    const userGroupCount = await prisma.friendGroupMember.count({
      where: { userId: user.id },
    });

    if (userGroupCount >= 3) {
      return Response.json(
        { error: "You can be in at most 3 groups" },
        { status: 400 }
      );
    }

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.friendGroup.findUnique({
        where: { code },
      });
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const group = await prisma.friendGroup.create({
      data: {
        name: name.trim(),
        code,
        createdBy: user.id,
        members: {
          create: { userId: user.id },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return Response.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
