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
