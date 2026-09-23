import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Which version of a game a live board is holding, as an HTTP entity tag.
 *
 * A board polls every fifteen seconds, and most of those asks come back to a
 * game where nothing has happened. Each one used to read the whole game —
 * every move, the last thirty remarks, both players' names — and send it all
 * again. This is the small read that lets the route answer "nothing changed"
 * instead: one row, three numbers.
 *
 * WHAT THE THREE NUMBERS COVER, and why nothing else is needed:
 *
 * - `updatedAt` moves on every write to the game row, and every change a board
 *   shows is one: a move and the passes it leaves owed are written in the same
 *   transaction as the row's `moveCount` and turn, as is a forfeit, a takeback,
 *   a seat taken, an offer made or answered, a resignation and a clock.
 * - `moveCount` is there as well so a write that somehow left `updatedAt`
 *   alone still cannot hide a new stone.
 * - the remarks are their own table and never touch the game row, so their
 *   count is read beside it. Remarks are only ever added, never removed or
 *   edited, so a count cannot come back to a number it has held before.
 *
 * What it does NOT cover is a player renaming themselves mid-game: the name is
 * read from the member, and the board shows the new one at the next move
 * rather than the next poll. That is the one staleness allowed, and it is a
 * name, not the position.
 */
export async function gameVersion(id: string): Promise<string | null> {
  const row = await prisma.game.findUnique({
    where: { id },
    select: { updatedAt: true, moveCount: true, _count: { select: { reactions: true } } },
  });
  if (row === null) return null;
  return versionTag(row.updatedAt, row.moveCount, row._count.reactions);
}

/** The tag itself, quoted as HTTP wants an entity tag to be. */
export function versionTag(updatedAt: Date, moveCount: number, remarks: number): string {
  return `"g${updatedAt.getTime().toString(36)}-${moveCount}-${remarks}"`;
}

/**
 * Whether a request's `If-None-Match` names this version. The header may list
 * several tags, or `*`; a weak tag (`W/"…"`) matches its strong form, as the
 * weak comparison HTTP asks for on a GET says it should.
 */
export function holdsVersion(ifNoneMatch: string | null, version: string): boolean {
  if (ifNoneMatch === null) return false;
  return ifNoneMatch
    .split(",")
    .map((tag) => tag.trim().replace(/^W\//, ""))
    .some((tag) => tag === "*" || tag === version);
}
