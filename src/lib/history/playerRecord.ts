import "server-only";

import { prisma } from "@/lib/prisma";
import { playerKey } from "@/lib/rating/playerKey";

/** A player's won-lost-drawn record, overall and by game, from the games table. */
export type PlayerRecord = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  byVariant: { variant: string; wins: number; losses: number; draws: number }[];
  recent: { id: string; variant: string; opponent: string; outcome: "won" | "lost" | "drew" }[];
};

const RECENT = 10;

/**
 * Counts every finished game the name took part in, either colour, matched
 * case-insensitively. Abandoned games are not results and are left out.
 */
export async function fetchPlayerRecord(name: string, memberId?: string | null): Promise<PlayerRecord> {
  const key = playerKey(name);
  const empty: PlayerRecord = { games: 0, wins: 0, losses: 0, draws: 0, byVariant: [], recent: [] };
  const mine = memberId != null && memberId !== "" ? memberId : null;
  if (key === "" && mine === null) return empty;

  /*
   * A RECORD FOLLOWS THE PERSON, NOT THE SPELLING.
   *
   * A game stores the names as they were played — `blackName` is whatever was
   * typed that day — so counting by today's name loses every game somebody
   * played under an older one. A twelve-year-old renamed on this site's own
   * advice and her seven games became "0 games played". Nothing was lost; the
   * question was wrong.
   *
   * Both, joined, rather than one or the other. The seats carry `memberId`
   * for games played since accounts existed, and that is the reliable half —
   * but a member who played here before their seat was bound to them, or
   * under a name nobody has claimed, is still in the record by name alone.
   * Asking for either finds both and double-counts neither: a game matches
   * once however many of its columns say so.
   */
  const byName = [
    { blackName: { equals: key, mode: "insensitive" as const } },
    { whiteName: { equals: key, mode: "insensitive" as const } },
  ];
  const rows = await prisma.game.findMany({
    where: {
      status: "finished",
      result: { not: "abandoned" },
      OR: mine === null
        ? byName
        : [...(key === "" ? [] : byName), { blackMemberId: mine }, { whiteMemberId: mine }],
    },
    orderBy: { playedAt: "desc" },
    select: {
      id: true,
      variant: true,
      blackName: true,
      whiteName: true,
      blackMemberId: true,
      whiteMemberId: true,
      winner: true,
      hiddenByBlack: true,
      hiddenByWhite: true,
    },
  });

  const record: PlayerRecord = { ...empty, byVariant: [], recent: [] };
  const byVariant = new Map<string, { wins: number; losses: number; draws: number }>();

  for (const game of rows) {
    /*
     * WHICH SEAT THEY WERE IN, and getting this from the name alone is how a
     * fixed record becomes a WRONG one. A game she played as black under an
     * old name would fail the name test, be read as white, and every win she
     * earned would be filed as a loss — a bug strictly worse than the zeros
     * it replaced, because it looks like data.
     *
     * So the seat is read the same way the game was found: the id decides
     * where it is bound, and the name answers only where it is not.
     */
    const isBlack =
      mine !== null && game.blackMemberId === mine
        ? true
        : mine !== null && game.whiteMemberId === mine
          ? false
          : playerKey(game.blackName) === key;
    const outcome =
      game.winner === null ? "drew" : (game.winner === "black") === isBlack ? "won" : "lost";
    record.games += 1;
    if (outcome === "won") record.wins += 1;
    else if (outcome === "lost") record.losses += 1;
    else record.draws += 1;

    const tally = byVariant.get(game.variant) ?? { wins: 0, losses: 0, draws: 0 };
    if (outcome === "won") tally.wins += 1;
    else if (outcome === "lost") tally.losses += 1;
    else tally.draws += 1;
    byVariant.set(game.variant, tally);

    // A game this player hid counts, and is not listed.
    const hidden = isBlack ? game.hiddenByBlack : game.hiddenByWhite;
    if (!hidden && record.recent.length < RECENT) {
      record.recent.push({
        id: game.id,
        variant: game.variant,
        opponent: isBlack ? game.whiteName : game.blackName,
        outcome,
      });
    }
  }

  record.byVariant = Array.from(byVariant, ([variant, tally]) => ({ variant, ...tally })).sort(
    (a, b) => b.wins + b.losses + b.draws - (a.wins + a.losses + a.draws),
  );
  return record;
}
