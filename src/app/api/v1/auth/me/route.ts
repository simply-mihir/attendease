import { NextRequest } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  return Response.json({ user });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  
  const body = await req.json();
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        email: body.email,
        ...(body.timezone ? { timezone: body.timezone } : {}),
      }
    });
    
    // We don't return password hashes
    const { passwordHash, ...safeUser } = updatedUser;
    
    return Response.json({ user: safeUser });
  } catch (error) {
    return Response.json({ error: "Failed to update profile. Email might be in use." }, { status: 400 });
  }
}
