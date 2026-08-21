import { prisma } from "./src/lib/db";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No users found");
    return;
  }
  
  console.log("Found user:", user.email, user.id);
  
  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        image: "https://api.dicebear.com/7.x/thumbs/svg?seed=simply.mihir20@gmail.com"
      }
    });
    console.log("Success! Updated user.");
  } catch (err) {
    console.error("Prisma error:", err);
  }
}

main().finally(() => process.exit(0));
