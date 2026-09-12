import type { ReactNode } from "react";

import type { RatingPool } from "@/lib/rating/pools";
import type { RatingTier } from "@/lib/rating/elo";
import type { RecordOf, WonLostDrawn } from "./PlayerRecord";
import type { Streak } from "@/lib/rating/streak";

/**
 * WHAT ONE ROW OF THE ONE TABLE OF RECORDS HOLDS.
 *
 * Lifted out of `RecordTable.tsx` because AGENTS.md asks for shared `type` and
 * `Props` declarations in an adjacent `*.types.ts` rather than inline in the
 * component — and because the component reached the 500-line gate. The gate is
 * there to catch a file doing too many jobs, and the honest answer to it was
 * this split rather than shaving the prose that explains the jobs: the contract
 * four other files import is one thing, and the markup that draws it is another.
 *
 * The reasoning behind every field lives here with the field. WHY the columns
 * are in the order they are, why a caller may switch one off, and why every row
 * is the same height are arguments about the DRAWING and stay in the component.
 */

/** Which of the optional columns a table shows. */
export type RecordColumns = {
  /** A place in the order, numbered from the top. Ladders only. */
  rank?: boolean;
  /** How settled the rating is. Meaningless where the rows are not ratings. */
  tier?: boolean;
  /** When a member came in. People only. */
  joined?: boolean;
  /**
   * Off where a row has no single rating to show — see above. On by default,
   * so a table without one has said so.
   */
  rating?: boolean;
  /** The heading over the actions column; absent means there are no actions. */
  actions?: string;
};

/** A rating as a row shows it: the number, and which ladder earned it. */
export type ShownRating = { rating: number; pool: RatingPool };

export type RecordTableRow = {
  /** React's key, and nothing else — never shown. */
  key: string;
  /**
   * The one thing that varies: a game, a member, a player, a site.
   *
   * A node rather than a named kind because these really are different — a
   * game name with its thumbnail, a member with their avatar, country and
   * badge — and pretending otherwise would put every one of those inside this
   * file. It is the ONLY slot, deliberately: everything after it is drawn
   * here, so a caller cannot spell a shared figure its own way.
   */
  subject: ReactNode;
  record: WonLostDrawn;
  /**
   * Exactly which games these counted, so every number leads to them.
   *
   * Required, not optional. `gameLinks.coverage.test.ts` enforces this by
   * regex on `<RecordCells … of={…}>` call sites; now that the call site is
   * inside this file, the guarantee moves to the type — which is stronger,
   * because a type cannot be satisfied by writing the right characters.
   */
  of: RecordOf;
  /** The run these same games are on, or null where there is not one. */
  streak: Streak | null;
  /**
   * Why the streak cell is blank, where the row knows a reason other than
   * "nothing finished yet" — a per-site total has no run because a run is an
   * order. Without it an em dash reads as a bug rather than as an answer.
   */
  streakBlankBecause?: string;
  /** Null prints a dash: a rating nobody has earned is not a rating of 1600. */
  rating?: ShownRating | null;
  tier?: RatingTier;
  joined?: { at: string; isNew: boolean };
  /** What the reader may do about this row — a button or two. */
  actions?: ReactNode;
  /** A mark on the played count, for a total that needs qualifying. */
  note?: ReactNode;
  /**
   * The XP level to badge after the subject's name, or absent for none.
   *
   * `levelShown(xp)` is what decides; a caller passes what it answered, and null
   * and undefined both mean no badge. Absent is correct on most tables — a row
   * whose subject is a GAME has no level, and a row built from a `Player` row
   * cannot know one, since XP lives on `Member` and a rating row is keyed by a
   * folded name. It is drawn as a mark in the subject cell and NOT a column; the
   * head of this file says why.
   */
  level?: number | null;
  /**
   * `data-*` attributes on the row, for identifying it rather than drawing it.
   *
   * The Computers tab tags each row with the grade it is — `data-tier="kyu"` —
   * so a browser test can say the grades come out in order without reading the
   * names. Typed as data attributes on purpose: it is a hook for tests and
   * nothing that can reach the styling, the headings or a cell's contents,
   * which is where the drift this component exists to stop would come back in.
   */
  attributes?: Record<`data-${string}`, string>;
};
