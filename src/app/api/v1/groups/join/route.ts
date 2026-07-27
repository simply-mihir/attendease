import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { code } = body as { code: string };

    if (!code || code.trim().length !== 6) {
      return Response.json(
        { error: "Please enter a valid 6-character group code" },
        { status: 400 }
      );
    }

    const group = await prisma.friendGroup.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { members: true },
    });

    if (!group) {
      return Response.json(
        { error: "Group not found. Check the code and try again." },
        { status: 404 }
      );
    }

    // Check if already a member
    const existing = group.members.find((m) => m.userId === user.id);
    if (existing) {
      return Response.json(
        { error: "You are already in this group" },
        { status: 400 }
      );
    }

    // Check group capacity (max 5)
    if (group.members.length >= 5) {
      return Response.json(
        { error: "This group is full (max 5 members)" },
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

    await prisma.friendGroupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
      },
    });

    return Response.json({
      success: true,
      groupName: group.name,
    });
  } catch (error) {
    console.error("Join group error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
