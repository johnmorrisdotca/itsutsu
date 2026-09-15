/**
 * The words the tables of records share, kept where both a server component
 * and a client one can read them.
 *
 * `LadderMore.tsx` is `"use client"`, and a string exported from a client module
 * is not a string to a server component that imports it — it is a client
 * reference. The per-game standings are drawn on the server and say the same
 * thing about the same kind of row, so the words live here rather than in
 * either table.
 */

/**
 * Why an XP cell is a dash, by the kind of row it is on.
 *
 * One dash, one reason, and the hover says it. There used to be two — the
 * other was "a program does not earn experience" — until John settled that a
 * program earns from its games and stands where its total puts it, like
 * anyone. What is left is a rating row keyed by a name nobody has claimed,
 * which only a table keyed by a folded name — the site ladder, a game's
 * standings — can hold.
 */
export const XP_BLANK_BECAUSE = {
  unclaimedName: "A name nobody has claimed: there is no member behind it to have earned anything.",
} as const;

/**
 * What the members list says about each way it can be narrowed: the chip's
 * name, matching the switch it takes off, and the clause for the sentence
 * an empty list prints. `who` is named from `WHO_DISPLAY`, the chips' own words.
 */
export const NARROWING_WORDS = {
  settled: { chip: "Settled ratings", clause: "has a settled rating" },
  active: { chip: "Seen lately", clause: (days: number) => `has been seen in the last ${days} days` },
  remembered: "as you chose last time",
} as const;

/**
 * The cell classes, here rather than in each table, so columns line up between
 * pages.
 *
 * Exported so that `RecordTable` — which draws the columns AROUND these: the
 * rating, the tier, whatever a table switches on — uses the same two strings
 * rather than a copy. A copied class string is how a table drifts half a line
 * out of true and nobody can say why.
 */
export const CELL = "py-1.5 pr-3 font-mono tabular-nums";
/*
 * `whitespace-nowrap` because these headings are two words at most and a
 * wrapped one throws the whole row's baseline out. On the members list, which
 * carries two action columns, "WIN RATE" broke over two lines while the same
 * heading on the ladder beside it did not — two tables meant to read as one,
 * differing by a line height for no reason a reader could see.
 */
export const HEAD = "py-1 pr-3 whitespace-nowrap";

/**
 * The heading typography every record table shares.
 *
 * It was this string written out in five files and a near-miss of it in two
 * more — `0.68rem`/`0.1em` against `0.7rem`/`0.14em`, on two tables a reader
 * sees one after the other. One string, one look.
 */
export const TABLE_HEAD_CLASS =
  "text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";

/** The table element itself, so no page invents its own width or size. */
export const TABLE_CLASS = "w-full text-sm";

/** The line between rows. */
export const ROW_CLASS = "border-t border-rule";
