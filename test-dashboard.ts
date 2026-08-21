import { GET } from "./src/app/api/v1/dashboard/route";
import { prisma } from "./src/lib/db";
import { NextRequest } from "next/server";

async function main() {
  // First find any user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }

  // Mock next-auth getServerSession
  const mockSession = {
    user: { email: user.email, id: user.id }
  };
  jest.mock("next-auth", () => ({
    getServerSession: () => Promise.resolve(mockSession)
  }));

  const req = new NextRequest("http://localhost:3000/api/v1/dashboard");
  try {
    const res = await GET();
    console.log("Status:", res.status);
    console.log("Response:", await res.json());
  } catch (err) {
    console.error("Error calling GET:", err);
  }
}

main().finally(() => prisma.$disconnect());
