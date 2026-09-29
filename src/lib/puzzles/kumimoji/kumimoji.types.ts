export type KumimojiLength = "short" | "medium" | "full";
export type KumimojiLanguage = "english" | "japanese";

/** How far the player has turned the table to look at it: quarter turns clockwise, 0 to 3. The view alone; the grid never turns. */
export type Turn = 0 | 1 | 2 | 3;

/**
 * WHAT A KUMIMOJI WAS SET UP AS, beyond its hand and level: the choices that
 * make one game a different game from another at the same seed, carried
 * together wherever a game is made, checked, kept or raced. Each is optional,
 * and its absence is the default: Short, English, one set, no diagonals.
 */
export type KumimojiOptions = {
  gameLength?: KumimojiLength;
  doubleSet?: boolean;
  language?: KumimojiLanguage;
  /**
   * Diagonals (John, 2026-09-28: "we could allow people to play diagonally…
   * An option at startup is the right choice"): every diagonal run of three
   * or more tiles, read top to bottom, must be a word too, and joins its
   * tiles as a word across or down does (`judgeGrid`). Off by default.
   */
  diagonals?: boolean;
};
