import type { Review } from "./dictionaries/ja.drafted.constants";

/**
 * The shape of Japanese copy that belongs to data: a game's rules, an
 * opening's words, a family's blurb. It sits beside the English row of the
 * same table, typed `Record<Key, …>`, never as a second copy of the data (the
 * English keeps the names, the numbers and the fields that are not words).
 *
 * Every sentence carries `back`, what the Japanese literally says read back
 * into English, for the same reason the phrase table's drafted file does:
 * John does not read Japanese and both sites publish it under his name.
 * A line is a tuple, `["日本語", "literal English"]`, so a table of two
 * hundred rule bullets stays one line a bullet.
 */

/** Who read an entry: the phrase table's own `Review`, so a sibling table is stamped the way a phrase is. */
export type CopyReview = Review;

/** One Japanese sentence and what it literally says: `[text, back]`. */
export type JaLine = readonly [text: string, back: string];

/** The text of a line. */
export function jaText(line: JaLine): string {
  return line[0];
}

/** What a line literally says, in English. */
export function jaBack(line: JaLine): string {
  return line[1];
}

/** The reviewer agent's pass of 2026-10-06, the one the first batches carry. */
export const AGENT_READ_2026_10_06: CopyReview = { by: "agent", on: "2026-10-06" };
