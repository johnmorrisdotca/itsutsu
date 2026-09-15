import type { Cursor } from "@/lib/api/paging.types";
import type { Stone } from "@/lib/gomoku/gomoku.types";

import type { GameSummary } from "./gameHistory.types";
import type { MY_GAME_GROUPS } from "./myGames.constants";
import type { OfferState } from "./offers.types";

/**
 * The shapes of a reader's queue of games: one row, the seven groups, the
 * queue with what its paged group cannot say about itself, and a group capped
 * for display.
 *
 * Split out of `myGames.ts` when it reached the file-size gate, for AGENTS.md's
 * types rule — the queue's contract is read by the route, the lobby and the
 * advance to the next game, and the read that fills it is a different job.
 * `myGames.ts` re-exports every one, so every import keeps its path.
 */

export type MyGameGroup = (typeof MY_GAME_GROUPS)[number];

export type MyGame = {
  game: GameSummary;
  /**
   * The colour this browser holds in it — or, on an offer, the colour it WOULD
   * hold. An offer's seat is not yet anybody's, and the one fact a reader most
   * wants before answering is which side of the board they are being asked to
   * take, so the honest thing is to name it and let `offer` below say that it
   * is not theirs yet.
   */
  seat: Stone;
  group: MyGameGroup;
  /**
   * What this offer has become, for the two groups that hold offers, and null
   * for an ordinary game.
   *
   * Carried rather than worked out in the row, because the row would have to
   * ask the same four columns and could get a different answer — and because
   * "declined" and "withdrawn" are the two states a reader is told apart by.
   */
  offer: OfferState | null;
  /** Which side of an offer this reader is on. Null for an ordinary game. */
  offerSide: "to-me" | "from-me" | null;
  /** Whose turn it is, while the game runs. */
  toPlay: Stone | null;
  /** When something last happened, as an ISO string. */
  since: string;
  /** Running, but nobody has moved for a fortnight. */
  stale: boolean;
};

export type MyGames = Record<MyGameGroup, MyGame[]>;

/**
 * THE WHOLE QUEUE: the seven groups, plus what the one that PAGES could not say
 * about itself.
 *
 * `groups` keeps the shape it has always had — a record of seven arrays — so
 * every reader of it, including `/api/games/mine`, goes on reading arrays. What
 * is new is that `groups.finished` is ONE PAGE rather than the whole group, and a
 * page cannot report the two things the panel above it needs: how many there
 * really are, and whether there is another page.
 *
 * THOSE TWO FACTS TRAVEL BESIDE THE GROUPS RATHER THAN INSIDE THEM, and the
 * reason is worth stating because the tidier-looking arrangement is the broken
 * one. Putting a `{ items, next, total }` envelope in `groups.finished` would
 * make one of the seven a different shape from the other six, and the first
 * casualty is `Object.values(groups).reduce((n, list) => n + list.length, 0)` —
 * which is what the doorstep spec does to every group, and what would then read
 * `undefined` and answer `NaN` with nothing failing.
 *
 * AND `fetchMyGames` RETURNS THIS RATHER THAN THE GROUPS ALONE, with no second
 * door that hands back only the groups. A caller holding just the groups would
 * reach for `groups.finished.length` for the count and get the PAGE's length — a
 * number that is in range, looks right, and means something else. That is the
 * one mistake this shape exists to make impossible.
 */
export type MyQueue = {
  /** The seven groups. `finished` holds one page of itself; the rest are complete. */
  groups: MyGames;
  /** What the finished group's page cannot say about the group it came from. */
  finished: {
    /** How many finished games there are, over exactly the set the page pages. */
    total: number;
    /** Where the page ended, or null when it was the last one. */
    next: Cursor | null;
  };
};

/** A bucket capped for display, without losing how big the bucket actually was. */
export type ShownGroup<T> = {
  /** The capped slice, taken from the front. */
  items: T[];
  /** The bucket's own size, before the cap. */
  total: number;
  /** How many the cap left out. Zero means every one of them is shown. */
  hidden: number;
};
