/**
 * THE WORDS ON THE COVER OVER A FINISHED BOARD (`WinCover`), one place for
 * every game that draws it: the puzzles, the card games, the tables round
 * one device or several, and the practice board.
 */
export const WIN_COVER_COPY = {
  /** Closes the cover: the finished board is often the reward. */
  seeBoard: "See the board",
  solved: { label: "Solved", kanji: "解決" },
  won: { label: "Won", kanji: "勝ち" },
  youWin: "You win",
  wins: (who: string) => `${who} wins`,
  shareWin: (who: string) => `${who} share the win`,
  /** The kanji beside any win, whoever it is said about. */
  winKanji: "勝ち",
  draw: { label: "Draw", kanji: "引き分け" },
  /** "You" among the names sharing a win. */
  you: "You",
  took: (time: string) => ` in ${time}`,
  moves: (moves: number) => `, in ${moves} ${moves === 1 ? "move" : "moves"}`,
  /** Kumimoji's pass and play, dealt again to the same players: its finish's press and its cover's. */
  againSamePlayers: "Play again, same players",
  /** Mahjong at a table, over: back to its set-up for another deal. */
  playAgain: "Play again",
  /** A practice board's computer, when it wins and nobody named its seat. */
  computer: "The computer",
} as const;

/** The large kanji at the top of the cover. */
export const WIN_COVER_MARK = {
  solved: "解",
  won: "勝",
  draw: "引",
  /** A game somebody else won: the end of it, not a loss shouted at the reader. */
  lost: "終",
} as const;

/**
 * THE WIN'S TWO BEATS: the winning move lands and the board flashes, once,
 * then the cover comes up. John, 2026-09-29, on a Tsunagi solved with only a
 * line under the board to say so: "once the last (winning / completion) move
 * is played, we should 'flash' the screen or something, to indicate the win."
 *
 * One glow in and out, well under the three a second a photosensitive reader
 * can be hurt by. A reader who asks for less motion is shown no flash at all:
 * a calm fade of the wash, shorter, and then the card (globals.css, `win-`).
 */
export const WIN_FLASH_MS = 700;
export const WIN_CALM_MS = 300;
