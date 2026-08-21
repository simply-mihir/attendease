import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authOptions } from "./auth-options";
import { ensureSchema } from "./db";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthUser() {
  // Ensure DB schema is in sync (runs once per cold start, no-op after that)
  await ensureSchema();

  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) return null;
  return {
    id: (session.user as any).id as string,
    email: session.user.email!,
    name: session.user.name,
    image: session.user.image,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
