/**
 * HOW A GOMOJI GRID IS DRAWN, chosen by the player and kept on the account
 * (`wordStyle` in the preferences registry).
 *
 * John, 2026-09-25: "SHOULDNT our WORD Drop game use Gomoku pebbles with the
 * LETTERS INSIDE? doesn't that make it unique?", then "The Othello Tiles seem
 * appropriate. also then the board should look like Othello board.", then
 * "allow user to choose 3 styles. Othello, Gomoku, Tiles".
 *
 *  - REVERSI: a disc filling each square, on the wood, ruled as a Reversi
 *    board is. The default, as the one he settled on.
 *  - GOMOKU: a stone on each crossing, the lines running between them.
 *  - TILES: a square letter tile in each cell, as the game was first drawn.
 *
 * Named Reversi, as this site names the game, not Othello, a trademark (John,
 * 2026-09-25: "can we really say Othello??? Otherwise call it what we do on
 * the site, which is Reversi"). A member who chose the old key reads the
 * fallback, which is the same style.
 *
 * Only the drawing changes. The letters, the marks and what they say are the
 * same in every style, and each stone says its mark in words (`aria-label`).
 */
export const WORD_STYLE_LIST = ["reversi", "gomoku", "tiles"] as const;
export type WordStyle = (typeof WORD_STYLE_LIST)[number];

export const WORD_STYLES = { reversi: "reversi", gomoku: "gomoku", tiles: "tiles" } as const satisfies Record<WordStyle, WordStyle>;

export const WORD_STYLE_DISPLAY: Record<WordStyle, { label: string }> = {
  reversi: { label: "Reversi" },
  gomoku: { label: "Gomoku" },
  tiles: { label: "Tiles" },
};
