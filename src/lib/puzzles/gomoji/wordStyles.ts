/**
 * HOW A GOMOJI GRID IS DRAWN, chosen by the player and kept on the account
 * (`wordStyle` in the preferences registry).
 *
 * John, 2026-09-25: "SHOULDNT our WORD Drop game use Gomoku pebbles with the
 * LETTERS INSIDE? doesn't that make it unique?", then "The Othello Tiles seem
 * appropriate. also then the board should look like Othello board.", then
 * "allow user to choose 3 styles. Othello, Gomoku, Tiles".
 *
 *  - OTHELLO: a disc filling each square, on the wood, ruled as an Othello
 *    board is. The default, as the one he settled on.
 *  - GOMOKU: a stone on each crossing, the lines running between them.
 *  - TILES: a square letter tile in each cell, as the game was first drawn.
 *
 * Only the drawing changes. The letters, the marks and what they say are the
 * same in every style, and each stone says its mark in words (`aria-label`).
 */
export const WORD_STYLE_LIST = ["othello", "gomoku", "tiles"] as const;
export type WordStyle = (typeof WORD_STYLE_LIST)[number];

export const WORD_STYLES = { othello: "othello", gomoku: "gomoku", tiles: "tiles" } as const satisfies Record<WordStyle, WordStyle>;

export const WORD_STYLE_DISPLAY: Record<WordStyle, { label: string }> = {
  othello: { label: "Othello" },
  gomoku: { label: "Gomoku" },
  tiles: { label: "Tiles" },
};
