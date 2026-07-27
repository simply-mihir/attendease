import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { calculateAttendance } from "@/lib/attendance-calc";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const groupId = params.id;

  // Verify user is a member
  const membership = await prisma.friendGroupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: user.id },
    },
  });

  if (!membership) {
    return Response.json({ error: "Not a member of this group" }, { status: 403 });
  }

  const group = await prisma.friendGroup.findUnique({
    where: { id: groupId },
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
  });

  if (!group) {
    return Response.json({ error: "Group not found" }, { status: 404 });
  }

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

    const totalPct = member.user.subjects.reduce(
      (sum, s) => sum + s.currentPercentage,
      0
    );
    const overallPct =
      member.user.subjects.length > 0
        ? Math.round((totalPct / member.user.subjects.length) * 100) / 100
        : 0;

    return {
      userId: member.userId,
      name: member.user.name || "Student",
      image: member.user.image,
      overallPct,
      subjects,
    };
  });

  return Response.json({
    id: group.id,
    name: group.name,
    code: group.code,
    createdBy: group.createdBy,
    members,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const groupId = params.id;

  // Verify user is a member
  const membership = await prisma.friendGroupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: user.id },
    },
  });

  if (!membership) {
    return Response.json({ error: "Not a member of this group" }, { status: 403 });
  }

  // Check if user is the last member
  const memberCount = await prisma.friendGroupMember.count({
    where: { groupId },
  });

  if (memberCount <= 1) {
    // Delete the entire group
    await prisma.friendGroup.delete({ where: { id: groupId } });
    return Response.json({ deleted: true });
  }

  // Just remove the member
  await prisma.friendGroupMember.delete({
    where: {
      groupId_userId: { groupId, userId: user.id },
    },
  });

  return Response.json({ left: true });
}
