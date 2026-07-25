import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password, name, timezone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, timezone },
      select: { id: true, email: true, name: true, timezone: true, image: true },
    });

    // Create default notification settings
    await prisma.notificationSetting.create({
      data: { userId: user.id },
    });

    return Response.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
