/**
 * How the four boxes read. The same tiles stand on the tab in every state, so
 * a member learns the shape once: dashed and numbered before there are any
 * words, live while they are being chosen, and masked once they are set —
 * because a set phrase is hashed and cannot be shown again, not even to its
 * owner.
 */
export type WordTilesMode = "empty" | "picking" | "kept";

export type WordTilesProps = {
  /** The boxes as arranged: a word, or nothing yet. Not read when `mode` is "kept". */
  words: readonly (string | null)[];
  mode: WordTilesMode;
  /** A draw is in flight: nothing can be tapped until it lands. */
  busy?: boolean;
  /** Tapping a kept word: it goes back out, and four fresh words are offered. */
  onTakeOut?: (word: string) => void;
  /** A word carried, or stepped with the arrow keys, from one box to another. */
  onMove?: (from: number, to: number) => void;
};

export type WordCandidatesProps = {
  /** The four on offer this round. */
  offered: readonly string[];
  busy: boolean;
  /** How many boxes are still empty, for the line above the offer. */
  remaining: number;
  /** Keep the word at this position in the offer. */
  onKeep: (index: number) => void;
  /** Four different words instead. */
  onRefresh: () => void;
};
