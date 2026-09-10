import { PrismaClient } from "@prisma/client";
const url = process.env.TARGET_DB;
if (!url || !url.startsWith("postgres")) { console.log("NO USABLE URL"); process.exit(0); }
const prisma = new PrismaClient({ datasources: { db: { url } } });
try {
  const games = await prisma.game.count();
  const members = await prisma.member.count();
  console.log("connected. games:", games, "members:", members);
} catch (e) { console.log("FAILED:", String(e).slice(0, 120)); }
await prisma.$disconnect();
