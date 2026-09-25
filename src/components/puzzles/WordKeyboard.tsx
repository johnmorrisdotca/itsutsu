"use client";

import type { LetterMark } from "@/lib/puzzles/wordDrop/code";
import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/wordDrop/wordStyles";

import { WORD_KEY, WORD_KEY_COUNT, WORD_KEY_MARK_STONES, WORD_KEY_PLAIN, WORD_KEY_TYPED, WORD_TILE_MARK } from "./puzzles.constants";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const NONE_TYPED: ReadonlyMap<string, number> = new Map();

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
  /** How often each letter is in the row being typed (`typedCounts`): its key is ringed, and counted from two. */
  typed?: ReadonlyMap<string, number>;
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
            const count = typed.get(letter) ?? 0;
            return (
              <button
                key={letter}
                type="button"
                className={`${WORD_KEY} ${mark === undefined ? WORD_KEY_PLAIN : marked[mark]} ${count > 0 ? WORD_KEY_TYPED : ""} relative`}
                onClick={() => onLetter(letter)}
                disabled={disabled}
                {...inert}
                data-testid={`word-key-${letter}`}
                data-mark={mark ?? ""}
                data-typed={count > 0 ? "true" : undefined}
                aria-label={count > 1 ? `${letter}, ${count} in the row` : undefined}
              >
                {letter}
                {count > 1 ? (
                  <span className={WORD_KEY_COUNT} aria-hidden="true" data-testid="key-count">
                    {count}
                  </span>
                ) : null}
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
