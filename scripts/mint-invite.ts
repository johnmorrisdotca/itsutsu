/**
 * Mints an invite code from the command line.
 *
 * The site is gated, so the very first code cannot be minted through the site
 * — somebody has to be let in before anybody can let anybody in. This is that
 * bootstrap, and it is also the thing to reach for when a code is needed and
 * a browser is not to hand.
 *
 *   pnpm invite                       one code
 *   pnpm invite "for Rin" 3           a note, and three uses
 */
import { PrismaClient } from "@prisma/client";

import { generateInviteCode } from "../src/lib/invite/inviteCode.ts";

const prisma = new PrismaClient();

const note = process.argv[2] ?? "";
const maxUses = Number(process.argv[3] ?? 0);

const createdBy =
  process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "cli";

let code = "";
for (let attempt = 0; attempt < 12; attempt += 1) {
  const candidate = generateInviteCode();
  if ((await prisma.inviteCode.findUnique({ where: { code: candidate } })) === null) {
    code = candidate;
    break;
  }
}

if (code === "") {
  console.error("Could not find an unused code. Try again.");
  process.exit(1);
}

await prisma.inviteCode.create({
  data: {
    code,
    createdBy,
    note,
    maxUses: Number.isFinite(maxUses) ? Math.max(0, maxUses) : 0,
  },
});

console.log(`\n  ${code}\n`);
console.log(`  minted by ${createdBy}${note ? ` for "${note}"` : ""}`);
console.log(`  redeem at /join\n`);

await prisma.$disconnect();
