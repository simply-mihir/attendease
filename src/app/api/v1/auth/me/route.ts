import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorizedResponse();
  return Response.json({ user });
}
