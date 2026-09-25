"use client";

import type { LetterMark } from "@/lib/puzzles/wordDrop/code";
import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/wordDrop/wordStyles";

import { WORD_KEY, WORD_KEY_MARK_STONES, WORD_KEY_PLAIN, WORD_KEY_TYPED, WORD_TILE_MARK } from "./puzzles.constants";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const NONE_TYPED: ReadonlySet<string> = new Set();

/**
 * THE KEYBOARD UNDER A WORDDROP GRID, for a phone with no keys of its own:
 * three rows of letters, Enter and a delete key, each letter coloured with the
 * best the guesses so far have said about it — in its place beats elsewhere
 * beats not in the word. Ten keys to the widest row, so every key is a
 * fingertip on a 390px screen. A letter not in the word is grey under tiles
 * and black under stones, the colour its tile or stone took.
 */
export function WordKeyboard({
  known,
  typed = NONE_TYPED,
  style,
  disabled,
  readOnly = false,
  onLetter,
  onEnter,
  onBack,
}: {
  known: ReadonlyMap<string, LetterMark>;
  /** The letters in the row being typed, whose keys are ringed (`WORD_KEY_TYPED`). */
  typed?: ReadonlySet<string>;
  style: WordStyle;
  disabled: boolean;
  /** Drawn at full colour and pressed by nobody: the keyboard of a finished game, replayed. */
  readOnly?: boolean;
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBack: () => void;
}) {
  const marked = style === WORD_STYLES.tiles ? WORD_TILE_MARK : WORD_KEY_MARK_STONES;
  // Read-only, the keys keep their colours and take no press: `disabled` would dim the colours being read.
  const inert = readOnly ? { tabIndex: -1, "aria-disabled": true as const } : {};
  return (
    <div className={`flex flex-col gap-1.5 ${readOnly ? "pointer-events-none" : ""}`} data-testid="word-keyboard" data-read-only={readOnly ? "true" : undefined}>
      {ROWS.map((row, index) => (
        <div key={row} className="flex gap-1">
          {index === 2 ? (
            <button type="button" className={`${WORD_KEY} ${WORD_KEY_PLAIN} flex-[1.5]`} onClick={onEnter} disabled={disabled} data-testid="word-key-enter" {...inert}>
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
                className={`${WORD_KEY} ${mark === undefined ? WORD_KEY_PLAIN : marked[mark]} ${typed.has(letter) ? WORD_KEY_TYPED : ""}`}
                onClick={() => onLetter(letter)}
                disabled={disabled}
                {...inert}
                data-testid={`word-key-${letter}`}
                data-mark={mark ?? ""}
                data-typed={typed.has(letter) ? "true" : undefined}
              >
                {letter}
              </button>
            );
          })}
          {index === 2 ? (
            <button type="button" className={`${WORD_KEY} ${WORD_KEY_PLAIN} flex-[1.5]`} onClick={onBack} disabled={disabled} aria-label="delete a letter" data-testid="word-key-back" {...inert}>
              ⌫
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
