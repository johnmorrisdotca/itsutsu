import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";

/**
 * PARTY TABLES ON SEVERAL DEVICES, as the specs that make them tidy them away.
 *
 * A spec makes its tables through the site, as a member would, and takes them
 * away again by id — never a sweep: a spec deciding what another spec's world
 * contains is the fault "A Spec Should Bring Its Own World" names. Guarded on
 * a database on this machine, like everything else here that deletes.
 */

let loaded = false;

function loadEnv() {
  if (loaded) return;
  // The dev server reads .env itself; this process has to be told.
  process.loadEnvFile(".env");
  loaded = true;
}

/** Takes these tables away, with their seats and moves (they cascade). */
export async function removeTables(ids: readonly string[]): Promise<void> {
  loadEnv();
  if (ids.length === 0 || !isLocalDatabase(process.env.DATABASE_URL)) return;
  const prisma = new PrismaClient();
  try {
    await prisma.partyTable.deleteMany({ where: { id: { in: [...ids] } } });
  } finally {
    await prisma.$disconnect();
  }
}

/** The inbox lines about a table, for a member: what the site told them, read from where it is kept. */
export async function inboxAbout(tableId: string, memberId: string): Promise<{ kind: string; detail: string }[]> {
  loadEnv();
  const prisma = new PrismaClient();
  try {
    return await prisma.inboxItem.findMany({ where: { gameId: tableId, memberId }, select: { kind: true, detail: true }, orderBy: { createdAt: "asc" } });
  } finally {
    await prisma.$disconnect();
  }
}
