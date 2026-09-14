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
 * Two dashes, two reasons, and the hover has to say the right one: the cell's
 * own default is the program's, because that is the dash a reader meets most —
 * on the members list, the Computers tab and the operator's Bots tab. A rating
 * row keyed by a name nobody has claimed is the other, and only a table keyed
 * by a folded name — the site ladder, a game's standings — can hold one.
 */
export const XP_BLANK_BECAUSE = {
  program: "A program does not earn experience — the ladder is for the people here.",
  unclaimedName: "A name nobody has claimed: there is no member behind it to have earned anything.",
} as const;
