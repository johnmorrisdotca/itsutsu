import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";

/**
 * Clears what an earlier run of this suite left behind.
 *
 * The specs post seats and never take them down, so a local database
 * accumulates them a few at a time until the lobby specs start failing on
 * each other's leavings: "Post the seat" is never offered because a matching
 * seat is already waiting, and a row filtered by a player's name matches two
 * of them and fails on strict mode. Three sessions have now spent time
 * triaging failures that were nothing but this.
 *
 * Only unplayed open seats, which is exactly the litter and nothing else. A
 * game with a stone on it is somebody's game and is left alone whatever its
 * age; a seat nobody ever answered is not a record of anything.
 *
 * The guard is the point of the file. This deletes rows, so it refuses to run
 * against anything but a database on this machine — a suite that can quietly
 * delete from production because somebody exported the wrong URL is a far
 * worse thing than the mess it is cleaning up.
 */

export async function clearAbandonedSeats(): Promise<number> {
  /*
   * The dev server reads .env itself; this process has to be told, exactly as
   * e2e/members.ts is. Without it DATABASE_URL is undefined, the guard says
   * "not local" and this quietly does nothing at all — which would look like
   * a working tidy-up and be no tidy-up whatever.
   */
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL)) return 0;

  const prisma = new PrismaClient();
  try {
    const gone = await prisma.game.deleteMany({
      where: { status: "active", openSeat: { not: null }, moveCount: 0 },
    });
    return gone.count;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Takes one game away again, for a spec that made a seat it does not want to
 * leave standing.
 *
 * A seat left behind changes what another spec reads in the sentence, which
 * is how this suite spent a day failing on its own leavings. Same guard as
 * everything else here: a database on this machine, or nothing at all.
 */
export async function removeGame(id: string): Promise<void> {
  process.loadEnvFile(".env");
  if (!isLocalDatabase(process.env.DATABASE_URL)) return;

  const prisma = new PrismaClient();
  try {
    await prisma.game.deleteMany({ where: { id } });
  } finally {
    await prisma.$disconnect();
  }
}
