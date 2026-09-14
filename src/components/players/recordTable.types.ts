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
  /**
   * What each person has earned on the site.
   *
   * ON BY DEFAULT, like `rating` and unlike `rank`, `tier` and `joined` — and it
   * was off by default until John asked why some tables showed it and others
   * did not: *"Make sure all STATS tables actually show the userXP in them
   * too… This means everywhere in the site. why are some pages now showing
   * it???"* A switch that is off unless somebody remembers it is exactly how
   * one table came to have the column and the rest did not, three times over.
   * So a table of PEOPLE gets the column without asking, and only a table whose
   * rows are not people — a player's own by-game breakdown, a per-site total —
   * switches it off, with `xp: false` and the reason beside it.
   * `xpColumn.coverage.test.ts` holds every `xp: false` to that.
   *
   * The tables of programs keep the column: every cell is a dash, and that is
   * the answer John gave for a program — "–", never 0 and never "Lv 1" — on a
   * table that otherwise reads exactly like the members list.
   */
  xp?: boolean;
  /** The heading over the actions column; absent means there are no actions. */
  actions?: string;
};

/** A row's lesser actions, behind "⋯": whose row it is, and where they stand with the reader. */
export type RowMoreProps = {
  email: string;
  /** The name as the row shows it (`shownName`), for the button's accessible name. */
  name: string;
  isBuddy: boolean;
  ignoring: boolean;
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
   * `levelShown(member)` is what decides; a caller passes what it answered, and
   * null and undefined both mean no badge. Absent is correct on most tables — a
   * row whose subject is a GAME has no level, and a row built from a `Player` row
   * cannot know one, since XP lives on `Member` and a rating row is keyed by a
   * folded name. It is drawn as a mark in the subject cell and NOT a column; the
   * head of `RecordTable.tsx` says why.
   *
   * A PROGRAM HAS ONE LIKE ANYONE: it earns from its games under the same
   * rules as a person and stands where its total puts it — John's "i still
   * don't see Levels for all equally and bots don't have XP".
   */
  level?: number | null;
  /**
   * What this member has earned, for the XP column — or null where the row has
   * no total to show.
   *
   * `xpShown(member)` is what decides, and it is `levelShown`'s twin for a
   * reason: the rung and the total are one fact seen twice, so a row must not be
   * able to carry one without the other. NOUGHT IS A NUMBER AND PRINTS AS ONE; a
   * dash here means "no total to be had", which is a name with no member behind
   * it — never a member who has earned nothing, person or program.
   */
  xp?: number | null;
  /**
   * Why the XP cell is a dash. There is one reason left on the site — a name
   * nobody has claimed has no member to have earned anything — and the cell
   * says it by default; the field stays so a table that knows a reason can
   * say it on the row rather than trust the default.
   */
  xpBlankBecause?: string;
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
