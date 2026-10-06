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

/**
 * THE JAPANESE OF A LINE THAT DEPENDS ON ITS ARGUMENTS (an English table's function).
 *
 * A function cannot be handed to a browser, so the Japanese of one is data: a line whose `{0}`, `{1}`
 * are the call's arguments in order (`["{0}手", "{0} moves"]`), or a choice by one argument's value
 * (`by` is its place, `is` the lines keyed by what it reads as a string, `other` the rest). The English
 * is still a function and keeps its plurals; the Japanese says what it says and the back-translation
 * says it in English. `fillLine` and `pickLine` (`copyTable.ts`) are what read it.
 */
export type JaCases = { readonly by: number; readonly is: { readonly [value: string]: JaNode }; readonly other?: JaNode };
export type JaNode = JaLine | JaCases;

/** The same, as text alone: what a reader is given. */
export type JaTextCases = { readonly by: number; readonly is: { readonly [value: string]: JaTextNode }; readonly other?: JaTextNode };
export type JaTextNode = string | JaTextCases;

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
