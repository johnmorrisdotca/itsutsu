import { botTierFor } from "@/lib/bots/bots";
import { playedSides } from "@/lib/rating/playedRun";

import {
  bestTimeNews,
  firstGameNews,
  firstResultNews,
  hardBotNews,
  mayBeFirstGame,
  type NewsGame,
  type SiteNewsRow,
} from "./siteNews";

/**
 * THE SITE'S NEWS FROM BEFORE IT WAS WRITTEN, DERIVED FROM THE ROWS THAT WERE.
 * Pure: `siteNewsBackfill.play.test.ts` reads the games and solves, this walks
 * them oldest first by the SAME rules the live writers use (`siteNews.ts`),
 * and the runner writes what it plans.
 *
 * Walked in order, because every one of these is "the first" or "faster than
 * everything before", and only a walk in order can say which one that was.
 *
 * FIRST PLACE IS NOT HERE, and cannot be. Who led a ladder after each game is
 * a fact about the ratings at the time, and a rating is stored as it stands
 * now: the history of who held first place was never kept, so it cannot be
 * told. It is told from now on, as it happens.
 */

/** A finished game, as the walk reads it. */
export type BackfillGame = NewsGame & { endedAt: Date };

/** A kept solve, as the walk reads it. */
export type BackfillSolve = { memberId: string; kind: string; size: number; level: string; elapsedMs: number; finishedAt: Date };

/** A row to write, with the moment it happened as its date. */
export type PlannedNews = SiteNewsRow & { createdAt: Date };

/** The facts in finished games: each game's first, first wins and losses, top grades first beaten. */
export function newsFromGames(games: readonly BackfillGame[]): PlannedNews[] {
  const ordered = [...games].sort((a, b) => a.endedAt.getTime() - b.endedAt.getTime() || a.id.localeCompare(b.id));
  const planned: PlannedNews[] = [];
  const firstPlayed = new Set<string>();
  const beaten = new Set<string>();
  const won = new Map<string, number>();
  const lost = new Map<string, number>();

  for (const game of ordered) {
    const at = (row: SiteNewsRow | null) => {
      if (row !== null) planned.push({ ...row, createdAt: game.endedAt });
    };
    if (!firstPlayed.has(game.variant) && mayBeFirstGame(game)) {
      firstPlayed.add(game.variant);
      at(firstGameNews(game));
    }
    /* The tallies as `recordPlayed` carries them: `playedSides`, one game
       against yourself counted once from Black. */
    for (const side of playedSides(game)) {
      at(firstResultNews(game, { ...side, wonBefore: won.get(side.memberId) ?? 0, lostBefore: lost.get(side.memberId) ?? 0 }));
      if (side.outcome === "win") won.set(side.memberId, (won.get(side.memberId) ?? 0) + 1);
      if (side.outcome === "loss") lost.set(side.memberId, (lost.get(side.memberId) ?? 0) + 1);
    }
    if (game.winner === "black" || game.winner === "white") {
      const winnerId = game.winner === "black" ? game.blackMemberId : game.whiteMemberId;
      const loserId = game.winner === "black" ? game.whiteMemberId : game.blackMemberId;
      if (winnerId !== null && loserId !== null) {
        const row = hardBotNews(game, winnerId, loserId, botTierFor(loserId));
        const key = row === null ? "" : `${row.variant}:${row.subject}`;
        if (row !== null && !beaten.has(key)) {
          beaten.add(key);
          at(row);
        }
      }
    }
  }
  return planned;
}

/** Every best time as it was set: each solve faster than all before it at its kind, size and level. */
export function newsFromSolves(solves: readonly BackfillSolve[]): PlannedNews[] {
  const ordered = [...solves].sort((a, b) => a.finishedAt.getTime() - b.finishedAt.getTime());
  const best = new Map<string, number>();
  const planned: PlannedNews[] = [];
  for (const solve of ordered) {
    const key = `${solve.kind}:${solve.size}:${solve.level}`;
    const row = bestTimeNews({ ...solve, solved: true }, best.get(key) ?? null);
    if (row === null) continue;
    best.set(key, solve.elapsedMs);
    planned.push({ ...row, createdAt: solve.finishedAt });
  }
  return planned;
}
