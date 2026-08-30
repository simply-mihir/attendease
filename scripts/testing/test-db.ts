import 'dotenv/config';
import { prisma } from "../../src/lib/db";
async function main() {
  const overrides = await prisma.scheduleOverride.findMany({ where: { type: 'extra' } });
  console.log(JSON.stringify(overrides, null, 2));
}
main().catch(console.error).finally(() => process.exit(0));
