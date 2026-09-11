import "server-only";

import { prisma } from "@/lib/prisma";
import { playerKey } from "@/lib/rating/playerKey";
import { extendStreak, type Streak, type StreakOutcome } from "@/lib/rating/streak";

/** A player's won-lost-drawn record, overall and by game, from the games table. */
export type PlayerRecord = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  /**
   * The run across every finished game here, whichever game and whether or
   * not it was rated — which is what this whole record counts.
   *
   * A DIFFERENT NUMBER FROM THE STORED ONE, and told apart on purpose. The
   * streak on `Player` counts RATED games, because that is what a rating's
   * record is; this counts every finished game, because that is what a
   * player's own page is about. They will often disagree, and a page showing
   * one under counts of the other would be quietly wrong.
   *
   * Free to work out here, and only here: this function has already read
   * every one of those games, newest first, to count them. That is the line
   * between this and a table of many players — a list must never read a
   * player's history per row, which is the fault taken off the landing page
   * in 0.139.0.
   */
  streak: Streak | null;
  byVariant: {
    variant: string;
    wins: number;
    losses: number;
    draws: number;
    /** The run in this one game, from the same pass over the same rows. */
    streak: Streak | null;
  }[];
  recent: { id: string; variant: string; opponent: string; outcome: "won" | "lost" | "drew" }[];
};

const RECENT = 10;

/**
 * A run being read backwards through time: it grows while the results match
 * and is shut the moment one does not.
 *
 * The rows come newest first, so the answer is the LEADING stretch — and once
 * that is over, every older game is about a run that has already ended. A
 * closed run that went on being fed would count the whole record.
 */
type Run = { streak: Streak | null; open: boolean };

function newRun(): Run {
  return { streak: null, open: true };
}

/** How a player's page words a result, as a streak counts it. */
function asStreakOutcome(outcome: "won" | "lost" | "drew"): StreakOutcome {
  return outcome === "won" ? "win" : outcome === "lost" ? "loss" : "draw";
}

function feed(run: Run, outcome: "won" | "lost" | "drew"): void {
  if (!run.open) return;
  const next = extendStreak(run.streak, asStreakOutcome(outcome));
  // `extendStreak` starts again from one when the kind changes, which is the
  // right answer going forwards and means "the run is over" going backwards.
  if (run.streak !== null && next.count === 1) {
    run.open = false;
    return;
  }
  run.streak = next;
}

/**
 * Counts every finished game the name took part in, either colour, matched
 * case-insensitively. Abandoned games are not results and are left out.
 */
export async function fetchPlayerRecord(name: string, memberId?: string | null): Promise<PlayerRecord> {
  const key = playerKey(name);
  const empty: PlayerRecord = {
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: null,
    byVariant: [],
    recent: [],
  };
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
  const byVariant = new Map<string, { wins: number; losses: number; draws: number; run: Run }>();
  /*
   * The rows arrive newest first, so a run is the leading stretch of one kind
   * and CLOSES at the first result that differs. Tracked as it goes rather
   * than collected and measured afterwards, so counting a player's games
   * stays one pass over rows this function was reading anyway.
   */
  const overall = newRun();

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
    feed(overall, outcome);

    const tally = byVariant.get(game.variant) ?? { wins: 0, losses: 0, draws: 0, run: newRun() };
    if (outcome === "won") tally.wins += 1;
    else if (outcome === "lost") tally.losses += 1;
    else tally.draws += 1;
    feed(tally.run, outcome);
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

  record.streak = overall.streak;
  record.byVariant = Array.from(byVariant, ([variant, tally]) => ({
    variant,
    wins: tally.wins,
    losses: tally.losses,
    draws: tally.draws,
    streak: tally.run.streak,
  })).sort((a, b) => b.wins + b.losses + b.draws - (a.wins + a.losses + a.draws));
  return record;
}
