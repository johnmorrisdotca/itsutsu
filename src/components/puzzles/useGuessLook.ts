import { useCallback, useEffect, useState } from "react";

import { guessMeaning } from "@/lib/puzzles/gomojiKana/guessMeaning";

/** How a guess came to be looked at: pointed at with a mouse, focused with a key, or tapped. */
export type LookHow = "hover" | "focus" | "tap";

/** What a row of the board tells the page: which guess is looked at, or none. */
export type LookAt = (word: string | null, how: LookHow, key?: string) => void;

/**
 * THE GUESS BEING LOOKED AT, and what it means, for the one quiet line under the board.
 *
 * A tap shows it and stays until another tap, a mistake said in its place, or the next guess; a mouse pointed at a
 * row shows it for as long as it stays there, and a row focused with a key for as long as it keeps the focus. A tap
 * on the row that is shown puts it away. Nothing here takes a key, moves the focus or asks the typing to wait: it only
 * reads which row was meant. The line is `null` until the dictionary has answered, and stays `null` for a word with
 * nothing quiet to say, so the line says nothing and nothing moves.
 */
export function useGuessLook(enabled: boolean): { line: string | null; word: string | null; look: LookAt; clear: () => void } {
  const [at, setAt] = useState<{ word: string; how: LookHow; key: string } | null>(null);
  const [said, setSaid] = useState<{ word: string; line: string } | null>(null);

  const look = useCallback<LookAt>(
    (word, how, key = "") => {
      if (!enabled) return;
      setAt((was) => {
        if (word === null) return was !== null && was.how === how ? null : was;
        // A tap on the row already shown by a tap puts it away.
        if (how === "tap" && was !== null && was.how === "tap" && was.key === key) return null;
        return { word, how, key };
      });
    },
    [enabled],
  );
  const clear = useCallback(() => setAt(null), []);

  const asked = at?.word ?? null;
  useEffect(() => {
    if (asked === null) return;
    let still = true;
    void guessMeaning(asked).then((line) => {
      if (still && line !== null) setSaid({ word: asked, line });
    });
    return () => {
      still = false;
    };
  }, [asked]);

  const showing = at !== null && said !== null && said.word === at.word ? said.line : null;
  return { line: showing, word: showing === null || at === null ? null : at.word, look, clear };
}

/**
 * The meaning of the hidden words, for the card that ends the round, and only once it has ended: nothing is asked for while
 * `ended` is false, so the answer is never fetched, let alone shown, before it is given away. A word with nothing quiet to say is `null`.
 */
export function useHiddenMeanings(words: readonly string[], ended: boolean): (string | null)[] {
  const [lines, setLines] = useState<(string | null)[]>([]);
  const key = words.join(",");
  useEffect(() => {
    if (!ended) return;
    let still = true;
    void Promise.all(key.split(",").map((word) => guessMeaning(word))).then((found) => {
      if (still) setLines(found);
    });
    return () => {
      still = false;
    };
  }, [ended, key]);
  return ended ? lines : [];
}
