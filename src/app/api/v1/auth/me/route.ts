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
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined && body.email !== user.email) updateData.email = body.email;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.image !== undefined) updateData.image = body.image;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });
    
    // We don't return password hashes
    const { passwordHash, ...safeUser } = updatedUser;
    
    return Response.json({ user: safeUser });
  } catch (error: any) {
    console.error("[Profile Update Error]", error);
    if (error?.code === "P2002") {
      return Response.json({ error: "Failed to update profile. Email might be in use." }, { status: 400 });
    }
    return Response.json({ error: error.message || "An unexpected error occurred while updating profile." }, { status: 500 });
  }
}
