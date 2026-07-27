import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();

  const groupId = params.id;

  try {
    const body = await req.json().catch(() => ({}));
    const message = (body as { message?: string }).message;

    // Verify user is a member
    const membership = await prisma.friendGroupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: user.id },
      },
    });

    if (!membership) {
      return Response.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    // Get all other members' push subscriptions
    const otherMembers = await prisma.friendGroupMember.findMany({
      where: { groupId, userId: { not: user.id } },
      include: {
        user: {
          select: {
            id: true,
            pushSubscriptions: true,
          },
        },
      },
    });

    const senderName = user.name || "Someone";
    const payload = {
      title: "Friend Group Nudge 👀",
      body: message || `${senderName} says: Skipping today? 😏`,
      tag: `nudge-${groupId}`,
      data: { url: "/groups" },
    };

    let sent = 0;
    for (const member of otherMembers) {
      for (const sub of member.user.pushSubscriptions) {
        try {
          await sendPushNotification(
            {
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            payload
          );
          sent++;
        } catch {
          // Subscription might be expired, continue
        }
      }
    }

    return Response.json({
      sent,
      totalMembers: otherMembers.length,
    });
  } catch (error) {
    console.error("Nudge error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
