"use client";

import type { KanaMark } from "@/lib/puzzles/wordDropKana/kanaMarks";
import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/wordDrop/wordStyles";

import { WORD_KEY, WORD_KEY_MARK_STONES, WORD_KEY_PLAIN, WORD_TILE_MARK } from "./puzzles.constants";

/**
 * The gojūon, a column to a consonant and five kana down each, read left to
 * right for a reader of English (a Japanese chart runs right to left). や and わ
 * have gaps where the kana table does; ん and ー share わ's column.
 */
const COLUMNS: readonly (readonly string[])[] = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "", "ゆ", "", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "を", "ん", "ー", ""],
];

/**
 * THE KANA KEYS UNDER A KANA WORDDROP GRID: the plain kana of the gojūon, and
 * the three keys that make the rest of them from the kana just typed — 小 for
 * small or large (つ ⇄ っ), ゛゜ for its mark (は → ば → ぱ → は) — as a phone's
 * kana keyboard does. A key is coloured by what the guesses have said about
 * its kana in any size or mark: found, in the word, or out.
 */
export function KanaKeyboard({
  known,
  style,
  disabled,
  onKana,
  onSmall,
  onMark,
  onEnter,
  onBack,
}: {
  /** The best each base kana has been marked, by `kanaBase`. */
  known: ReadonlyMap<string, KanaMark>;
  style: WordStyle;
  disabled: boolean;
  onKana: (kana: string) => void;
  onSmall: () => void;
  onMark: () => void;
  onEnter: () => void;
  onBack: () => void;
}) {
  const marked = style === WORD_STYLES.tiles ? WORD_TILE_MARK : WORD_KEY_MARK_STONES;
  // A shade shorter than English's keys on a phone: six rows of them have to leave Enter on the screen.
  const key = `${WORD_KEY} min-h-8 px-0 text-sm normal-case sm:min-h-11 sm:text-base`;
  return (
    <div className="flex flex-col gap-1.5" data-testid="kana-keyboard">
      <div className="grid grid-cols-10 gap-1">
        {[0, 1, 2, 3, 4].flatMap((row) =>
          COLUMNS.map((column, at) => {
            const kana = column[row]!;
            if (kana === "") return <span key={`${at}-${row}`} aria-hidden="true" />;
            const mark = known.get(kana);
            return (
              <button
                key={kana}
                type="button"
                className={`${key} ${mark === undefined ? WORD_KEY_PLAIN : marked[mark]}`}
                onClick={() => onKana(kana)}
                disabled={disabled}
                data-testid={`kana-key-${kana}`}
                data-mark={mark ?? ""}
              >
                {kana}
              </button>
            );
          }),
        )}
      </div>
      <div className="flex gap-1">
        <button type="button" className={`${key} ${WORD_KEY_PLAIN}`} onClick={onSmall} disabled={disabled} aria-label="make the kana small or large" data-testid="kana-key-small">
          小
        </button>
        <button type="button" className={`${key} ${WORD_KEY_PLAIN}`} onClick={onMark} disabled={disabled} aria-label="change the kana's mark" data-testid="kana-key-mark">
          ゛゜
        </button>
        <button type="button" className={`${key} ${WORD_KEY_PLAIN}`} onClick={onBack} disabled={disabled} aria-label="delete a kana" data-testid="kana-key-back">
          ⌫
        </button>
        <button type="button" className={`${key} ${WORD_KEY_PLAIN} flex-[2]`} onClick={onEnter} disabled={disabled} data-testid="kana-key-enter">
          <span className="text-[0.7rem] normal-case sm:text-sm">Enter</span>
        </button>
      </div>
    </div>
  );
}
