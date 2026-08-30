import { prisma } from "../../src/lib/db";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user in DB to test");
    return;
  }
  
  const body = {
    name: user.name,
    email: user.email,
    image: "https://api.dicebear.com/7.x/thumbs/svg?seed=test"
  };
  
  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        email: body.email,
        ...(body.image !== undefined ? { image: body.image } : {}),
      }
    });
    console.log("Update successful!");
  } catch (error: any) {
    console.error("Update failed:", error.code, error.message);
  }
}
main().finally(() => process.exit(0));
