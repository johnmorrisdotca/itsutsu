"use client";

import { cycleMark, toggleSize, type KanaMark } from "@/lib/puzzles/gomojiKana/kanaMarks";
import { WORD_STYLES, type WordStyle } from "@/lib/puzzles/gomoji/wordStyles";

import { WORD_KEY, WORD_KEY_COUNT, WORD_KEY_MARK_STONES, WORD_KEY_PLAIN, WORD_KEY_TYPED, WORD_TILE_MARK } from "./puzzles.constants";

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
 * THE KANA KEYS UNDER A KANA GOMOJI GRID: the plain kana of the gojūon, and
 * the three keys that make the rest of them from the kana just typed — 小 for
 * small or large (つ ⇄ っ), ゛゜ for its mark (は → ば → ぱ → は) — as a phone's
 * kana keyboard does. A key is coloured by what the guesses have said about
 * its kana in any size or mark: found, in the word, or out.
 */
export function KanaKeyboard({
  known,
  typed,
  last = null,
  style,
  disabled,
  readOnly = false,
  onKana,
  onSmall,
  onMark,
  onEnter,
  onBack,
}: {
  /** The best each base kana has been marked, by `kanaBase`. */
  known: ReadonlyMap<string, KanaMark>;
  /** How often each kana is in the row being typed, by base (`typedCounts`): its key is ringed, and counted from two; ぱ rings は. */
  typed: ReadonlyMap<string, number>;
  /** The kana 小 and ゛゜ would change — the chosen one, or the one just typed — or null when there is none. */
  last?: string | null;
  style: WordStyle;
  disabled: boolean;
  /** Drawn at full colour and pressed by nobody: the keyboard of a finished game, replayed. */
  readOnly?: boolean;
  onKana: (kana: string) => void;
  onSmall: () => void;
  onMark: () => void;
  onEnter: () => void;
  onBack: () => void;
}) {
  const marked = style === WORD_STYLES.tiles ? WORD_TILE_MARK : WORD_KEY_MARK_STONES;
  // A shade shorter than English's keys on a phone: six rows of them have to leave Enter on the screen.
  const key = `${WORD_KEY} min-h-8 px-0 text-sm normal-case sm:min-h-11 sm:text-base`;
  /*
   * What 小 and ゛゜ would make of the last kana, shown on the keys themselves.
   * John, 2026-09-25, on an iPhone: "no way to enter ga vs Ka and po and
   * little Tsu" — the keys were there, labelled 小 and ゛゜, and read as
   * nothing. After か the ゛゜ key reads が; after は, ば and then ぱ; after
   * つ the 小 key reads っ. Nothing to make, it is dimmed.
   */
  const small = last === null || toggleSize(last) === last ? null : toggleSize(last);
  const toned = last === null || cycleMark(last) === last ? null : cycleMark(last);
  // Read-only, the keys keep their colours and take no press: `disabled` would dim the colours being read.
  const inert = readOnly ? { tabIndex: -1, "aria-disabled": true as const } : {};
  return (
    <div className={`flex select-none flex-col gap-1.5 ${readOnly ? "pointer-events-none" : ""}`} data-testid="kana-keyboard" data-read-only={readOnly ? "true" : undefined}>
      <div className="grid grid-cols-10 gap-1">
        {[0, 1, 2, 3, 4].flatMap((row) =>
          COLUMNS.map((column, at) => {
            const kana = column[row]!;
            if (kana === "") return <span key={`${at}-${row}`} aria-hidden="true" />;
            const mark = known.get(kana);
            const count = typed.get(kana) ?? 0;
            return (
              <button
                key={kana}
                type="button"
                className={`${key} ${mark === undefined ? WORD_KEY_PLAIN : marked[mark]} ${count > 0 ? WORD_KEY_TYPED : ""} relative`}
                onClick={() => onKana(kana)}
                disabled={disabled}
                {...inert}
                data-testid={`kana-key-${kana}`}
                data-mark={mark ?? ""}
                data-typed={count > 0 ? "true" : undefined}
                aria-label={count > 1 ? `${kana}, ${count} in the row` : undefined}
              >
                {kana}
                {count > 1 ? (
                  <span className={WORD_KEY_COUNT} aria-hidden="true" data-testid="key-count">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
      <div className="flex gap-1">
        <MakeKey kind="小" makes={small} keyClass={key} onPress={onSmall} disabled={disabled} inert={inert} testId="kana-key-small" />
        <MakeKey kind="゛゜" makes={toned} keyClass={key} onPress={onMark} disabled={disabled} inert={inert} testId="kana-key-mark" />
        <button type="button" className={`${key} ${WORD_KEY_PLAIN}`} onClick={onBack} disabled={disabled} aria-label="delete a kana" data-testid="kana-key-back" {...inert}>
          ⌫
        </button>
        <button type="button" className={`${key} ${WORD_KEY_PLAIN} flex-[2]`} onClick={onEnter} disabled={disabled} data-testid="kana-key-enter" {...inert}>
          <span className="text-[0.7rem] normal-case sm:text-sm">Enter</span>
        </button>
      </div>
    </div>
  );
}

/**
 * A key that makes another kana from the last one: it shows what it will
 * make, large, with its sign small beneath, and is dimmed when it would make
 * nothing.
 */
function MakeKey({
  kind,
  makes,
  keyClass,
  onPress,
  disabled,
  inert,
  testId,
}: {
  kind: "小" | "゛゜";
  makes: string | null;
  keyClass: string;
  onPress: () => void;
  disabled: boolean;
  inert: object;
  testId: string;
}) {
  const what = kind === "小" ? "small or large" : "its mark";
  return (
    <button
      type="button"
      className={`${keyClass} ${WORD_KEY_PLAIN} flex-col gap-0.5 leading-none`}
      onClick={onPress}
      disabled={disabled || makes === null}
      aria-label={makes === null ? `${kind}: nothing to change` : `make ${makes}`}
      data-testid={testId}
      data-makes={makes ?? ""}
      {...inert}
    >
      {/* Two lines always, so the key is one height whatever it says and the keyboard never grows under a finger. */}
      <span className="text-base sm:text-lg">{makes ?? kind}</span>
      <span className="text-[0.55rem] text-muted" title={`change the kana: ${what}`}>
        {makes === null ? "\u00a0" : kind}
      </span>
    </button>
  );
}
