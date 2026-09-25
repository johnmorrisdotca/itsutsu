"use client";

import type { LetterMark } from "@/lib/puzzles/wordDrop/code";

import { WORD_KEY, WORD_KEY_PLAIN, WORD_TILE_MARK } from "./puzzles.constants";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

/**
 * THE KEYBOARD UNDER A WORDDROP GRID, for a phone with no keys of its own:
 * three rows of letters, Enter and a delete key, each letter coloured with the
 * best the guesses so far have said about it — in its place beats elsewhere
 * beats not in the word. Ten keys to the widest row, so every key is a
 * fingertip on a 390px screen.
 */
export function WordKeyboard({
  known,
  disabled,
  onLetter,
  onEnter,
  onBack,
}: {
  known: ReadonlyMap<string, LetterMark>;
  disabled: boolean;
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5" data-testid="word-keyboard">
      {ROWS.map((row, index) => (
        <div key={row} className="flex gap-1">
          {index === 2 ? (
            <button type="button" className={`${WORD_KEY} ${WORD_KEY_PLAIN} flex-[1.5]`} onClick={onEnter} disabled={disabled} data-testid="word-key-enter">
              {/* Its own size on a span, not a second size on the key, so the word fits at 390px ("ENTER" was clipped). */}
              <span className="text-[0.7rem] normal-case sm:text-sm">Enter</span>
            </button>
          ) : null}
          {[...row].map((letter) => {
            const mark = known.get(letter);
            return (
              <button
                key={letter}
                type="button"
                className={`${WORD_KEY} ${mark === undefined ? WORD_KEY_PLAIN : WORD_TILE_MARK[mark]}`}
                onClick={() => onLetter(letter)}
                disabled={disabled}
                data-testid={`word-key-${letter}`}
                data-mark={mark ?? ""}
              >
                {letter}
              </button>
            );
          })}
          {index === 2 ? (
            <button type="button" className={`${WORD_KEY} ${WORD_KEY_PLAIN} flex-[1.5]`} onClick={onBack} disabled={disabled} aria-label="delete a letter" data-testid="word-key-back">
              ⌫
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
