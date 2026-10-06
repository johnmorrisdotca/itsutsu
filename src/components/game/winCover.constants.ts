import { speaker, type Speaker } from "@/lib/i18n/i18n";

/**
 * THE WORDS ON THE COVER OVER A FINISHED BOARD (`WinCover`), one place for
 * every game that draws it: the puzzles, the card games, the tables round
 * one device or several, and the practice board.
 */
export const winCoverCopy = (say: Speaker) => {
  // The kanji beside the words, for a reader of English only: a Japanese reader's words are Japanese already.
  const kanji = (word: string) => (say.pairsWithKanji ? word : "");
  return {
    /** Closes the cover: the finished board is often the reward. */
    seeBoard: say.say("wincover.seeBoard"),
    solved: { label: say.say("wincover.solved"), kanji: kanji("解決") },
    won: { label: say.say("wincover.won"), kanji: kanji("勝ち") },
    youWin: say.say("wincover.youWin"),
    wins: (who: string) => say.say("wincover.wins", { who }),
    shareWin: (who: string) => say.say("wincover.shareWin", { who }),
    /** The kanji beside any win, whoever it is said about. */
    winKanji: kanji("勝ち"),
    draw: { label: say.say("wincover.draw"), kanji: kanji("引き分け") },
    /** "You" among the names sharing a win. */
    you: say.say("wincover.you"),
    /** What follows the headline: how long it took, and in how many moves where that is told. */
    after: (time: string, moves?: number) =>
      moves === undefined
        ? say.say("wincover.afterTime", { time })
        : say.say("wincover.afterTimeMoves", { time, moves: say.count("count.move", moves) }),
    /** Kumimoji's pass and play, dealt again to the same players: its finish's press and its cover's. */
    againSamePlayers: say.say("wincover.againSamePlayers"),
    /** Mahjong at a table, over: back to its set-up for another deal. */
    playAgain: say.say("wincover.playAgain"),
    /** A practice board's computer, when it wins and nobody named its seat. */
    computer: say.say("wincover.computer"),
  };
};

/** The same words in English, for the tables that have not been given a speaker yet. */
export const WIN_COVER_COPY = winCoverCopy(speaker("en"));

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
