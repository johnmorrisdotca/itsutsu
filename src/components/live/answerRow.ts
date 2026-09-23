import type { CSSProperties } from "react";

/**
 * WHERE EACH ANSWER SITS IN A ROW OF ANSWERS, AND WHERE ITS CHOICES OPEN.
 *
 * John, 2026-09-22, having opened the handicap and watched it jump to a line of
 * its own: "Handicap, when clicked moves to 2nd row! Should keep that column!!!
 * same with Rules... I HATE the UI moving unnecessarily... keep the columns."
 *
 * So a row of answers is one grid, and every answer in it — each a `SetUpFold`
 * — is laid over the WHOLE of it (a subgrid spanning every column and every
 * row). Inside that, the answer's own button is pinned to its column in the
 * first line, and its choices, when open, to a line of their own under all the
 * buttons. Opening one changes the height of the lines below the buttons and
 * nothing else: no button moves, no neighbour moves.
 *
 * It is all placement rather than markup, so every fold's section still holds
 * its button AND its choices — which is what the specs read and what a screen
 * reader walks. The section spanning the row is transparent to the pointer
 * (`ANSWER_SPREAD`), so the buttons of the answers beneath it can be pressed.
 *
 * Below a tablet the row is a column and none of this applies: grid placement
 * means nothing to a flex box, so the same inline styles are simply ignored.
 */
export type AnswerPlace = {
  /** The answer's section: every column, every line of the row. */
  section: CSSProperties;
  /** Its button, or the whole of an answer that has no choices to open. */
  head: CSSProperties;
  /** Its choices, on their own line under every button. */
  body: CSSProperties;
};

/** At most this many answers side by side; more wrap to a second line of buttons. */
export const ANSWERS_ACROSS = 3;

/** The grid's columns, as many as there are answers up to `ANSWERS_ACROSS`. */
export function answerColumns(count: number): CSSProperties {
  const across = Math.max(1, Math.min(count, ANSWERS_ACROSS));
  return { gridTemplateColumns: `repeat(${across}, minmax(0, 1fr))` };
}

/** The place of the `index`th of `count` answers. */
export function answerPlace(index: number, count: number): AnswerPlace {
  const across = Math.max(1, Math.min(count, ANSWERS_ACROSS));
  const buttonLines = Math.ceil(count / across);
  const lines = buttonLines + count;
  return {
    section: { gridColumn: "1 / -1", gridRow: `1 / span ${lines}` },
    head: { gridColumn: `${(index % across) + 1}`, gridRow: `${Math.floor(index / across) + 1}` },
    body: { gridColumn: "1 / -1", gridRow: `${buttonLines + index + 1}` },
  };
}

/** A line under the whole row — after every button and every set of choices. */
export function answerRowFoot(count: number): CSSProperties {
  const across = Math.max(1, Math.min(count, ANSWERS_ACROSS));
  return { gridColumn: "1 / -1", gridRow: `${Math.ceil(count / across) + count + 1}` };
}
