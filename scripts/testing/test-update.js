const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  
  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email: user.email }
    });
    console.log("Success");
  } catch (err) {
    console.error("Error:", err);
  }
}

main().finally(() => prisma.$disconnect());
