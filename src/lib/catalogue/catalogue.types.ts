import type { RatingPool } from "@/lib/rating/pools";

import type { SinceLastPlayed } from "./catalogueFigures";

/**
 * A game's top player as the games index draws them.
 *
 * Plain data, because the Cards view is a client component and everything it
 * is handed crosses to the browser.
 */
export type TopPlayerShown = {
  /**
   * Their name, or null where this reader is not shown it.
   *
   * Null for a reader with no session: the open pages name no member, which
   * `e2e/gate.spec.ts` holds them to. See `forReader`.
   */
  name: string | null;
  /** Their member id, which is what a count's link asks by. Null for a name nobody holds. */
  memberId: string | null;
  /** Which ladder this is the top of. The strip says so. */
  pool: RatingPool;
  wins: number;
  losses: number;
  draws: number;
  /** Their level for the badge beside the name; null for a program or a name with nobody behind it. */
  level: number | null;
};

/** What the index knows about one game. */
export type GameStats = {
  variant: string;
  /** Finished games of it that reached a result. */
  played: number;
  /** When it was last played, or null for a game nobody has. */
  last: {
    since: SinceLastPlayed;
    /** That game, for a reader who may open it; null for one who may not. */
    gameId: string | null;
  } | null;
  /** Null where nobody holds a standing in either pool. */
  top: TopPlayerShown | null;
};

/** What the index knows about one family. */
export type FamilyStats = {
  played: number;
  gamesPlayed: number;
  games: number;
  crowns:
    | { kind: "held"; holder: TopPlayerShown; games: string[] }
    | { kind: "shared"; holders: number; each: number }
    | null;
};

/** Every game and every family, keyed by variant and by family key. */
export type CatalogueStats = {
  games: Record<string, GameStats>;
  families: Record<string, FamilyStats>;
};
