"use client";

import type { GomojiLanguage, LetterMark } from "@/lib/puzzles/gomoji/code";
import { KEYBOARD_ROWS } from "@/lib/puzzles/gomoji/keyboardRows";
import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/gomoji/wordStyles";
import { keyLabel } from "@/lib/puzzles/keyMarks";

import { FUTAGO_KEY, FUTAGO_KEY_LETTER, FutagoKeyHalves, futagoKeyWords } from "./FutagoKey";
import { KeyFace } from "./KeyFace";
import { WORD_KEY, WORD_KEY_COUNT, WORD_KEY_MARK_STONES, WORD_KEY_PLAIN, WORD_KEY_TYPED, WORD_TILE_MARK } from "./puzzles.constants";

const NONE_TYPED: ReadonlyMap<string, number> = new Map();
const NONE_COUNTED: ReadonlyMap<string, number> = new Map();

/** A split key's halves, in words, for a screen reader. */
const MARK_WORDS: Record<LetterMark, string> = { hit: "in its place", near: "in the word elsewhere", miss: "not in it" };

/**
 * THE KEYBOARD UNDER A GOMOJI GRID, for a phone with no keys of its own:
 * three rows of letters, Enter and a delete key, each letter coloured with the
 * best the guesses so far have said about it — in its place beats elsewhere
 * beats not in the word. Ten keys to the widest row, so every key is a
 * fingertip on a 390px screen. A letter not in the word is grey under tiles
 * and black under stones, the colour its tile or stone took.
 *
 * `lang` picks the layout (`keyboardRows.ts`): QWERTY, AZERTY or QWERTZ with
 * Ä, Ö and Ü of their own. Defaults to English so every existing caller keeps
 * drawing the keyboard it always has.
 *
 * A Futago's keyboard (`futago.ts`) is handed `split`, each board's marks,
 * and draws every key in two halves, one board's colour each (`FutagoKey`).
 */
export function WordKeyboard({
  known,
  split = null,
  counted = NONE_COUNTED,
  typed = NONE_TYPED,
  style,
  lang = "en",
  disabled,
  readOnly = false,
  onLetter,
  onEnter,
  onBack,
}: {
  known: ReadonlyMap<string, LetterMark>;
  /** A Futago's two boards' marks, the first board's on the left half of each key and the second's on the right; null for one word. */
  split?: readonly [ReadonlyMap<string, LetterMark>, ReadonlyMap<string, LetterMark>] | null;
  /** How many of each letter the guesses prove the word holds (`knownCounts`): a count on the letter from two. */
  counted?: ReadonlyMap<string, number>;
  /** How often each letter is in the row being typed (`typedCounts`): its key is ringed, and counted from two. */
  typed?: ReadonlyMap<string, number>;
  style: WordStyle;
  lang?: GomojiLanguage;
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
    <div className={`flex select-none flex-col gap-1.5 ${readOnly ? "pointer-events-none" : ""}`} data-testid="word-keyboard" data-read-only={readOnly ? "true" : undefined}>
      {KEYBOARD_ROWS[lang].map((row, index) => (
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
            const proven = counted.get(letter) ?? 0;
            const halves = split === null ? null : ([split[0].get(letter), split[1].get(letter)] as const);
            const face = halves !== null ? FUTAGO_KEY : mark === undefined ? WORD_KEY_PLAIN : marked[mark];
            return (
              <button
                key={letter}
                type="button"
                className={`${WORD_KEY} ${face} ${count > 0 ? WORD_KEY_TYPED : ""} relative`}
                onClick={() => onLetter(letter)}
                disabled={disabled}
                {...inert}
                data-testid={`word-key-${letter}`}
                data-mark={halves === null ? (mark ?? "") : halves.map((each) => each ?? "").join("|")}
                data-typed={count > 0 ? "true" : undefined}
                data-known-count={proven >= 2 ? proven : undefined}
                aria-label={halves === null ? keyLabel(letter, proven, count) : `${keyLabel(letter, proven, count) ?? letter.toUpperCase()}, ${futagoKeyWords(halves, MARK_WORDS)}`}
              >
                {halves === null ? null : <FutagoKeyHalves marks={halves} marked={marked} />}
                {halves === null || (halves[0] === undefined && halves[1] === undefined) ? (
                  <KeyFace letter={letter} known={proven} />
                ) : (
                  <span className={FUTAGO_KEY_LETTER}>
                    <KeyFace letter={letter} known={proven} />
                  </span>
                )}
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
