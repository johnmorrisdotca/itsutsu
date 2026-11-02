"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, SECTION_HEADING } from "@/components/ui/ui.constants";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { ArrowMark, type CellArrow } from "./GomojiGrid";
import { useWordStyle } from "./WordStyleContext";
import { WORD_KEY, WORD_KEY_COUNT, WORD_KEY_MARK_STONES, WORD_KEY_PLAIN, WORD_KEY_TYPED, WORD_STONE, WORD_STONE_LOOK, WORD_TILE, WORD_TILE_MARK } from "./puzzles.constants";

type Mark = "hit" | "near" | "kin" | "miss";

/** One row of the guide: a real example of the mark, and its colour's name and meaning. */
type Row = { mark: Mark; letter: string; arrow?: Exclude<CellArrow, ""> | undefined; name: PhraseKey; says: PhraseKey };

/** One key of the guide: its mark (none for a key not yet tried), a letter to show on it, and its name and meaning. */
type KeyRow = { mark: Mark | null; letter: string; name: PhraseKey; says: PhraseKey };

/** The letter games' marks, in the order a player meets them. */
const LETTER_ROWS: readonly Row[] = [
  { mark: "hit", letter: "A", name: "pword.help.greenName", says: "pword.help.greenLetter" },
  { mark: "near", letter: "B", name: "pword.help.orangeName", says: "pword.help.orangeLetter" },
  { mark: "miss", letter: "C", name: "pword.help.blackName", says: "pword.help.blackLetter" },
];

/** The kana game's marks: the same, a yellow for the column, and the three arrows (green, as the board draws a kana with one). */
const KANA_ROWS: readonly Row[] = [
  { mark: "hit", letter: "あ", name: "pword.help.greenName", says: "pword.help.greenKana" },
  { mark: "near", letter: "い", name: "pword.help.orangeName", says: "pword.help.orangeKana" },
  { mark: "kin", letter: "か", name: "pword.help.yellowName", says: "pword.help.yellowKana" },
  { mark: "miss", letter: "う", name: "pword.help.blackName", says: "pword.help.blackKana" },
];
const ARROW_ROWS: readonly Row[] = [
  { mark: "hit", letter: "っ", arrow: "↓", name: "pword.help.arrowDownName", says: "pword.help.arrowDown" },
  { mark: "hit", letter: "ぱ", arrow: "↑", name: "pword.help.arrowUpName", says: "pword.help.arrowUp" },
  { mark: "hit", letter: "づ", arrow: "↓↑", name: "pword.help.arrowBothName", says: "pword.help.arrowBoth" },
];

/** What a key says in the guide: its colour's name is the first word of the sentence, as the key shows it. */
const LETTER_KEYS: readonly KeyRow[] = [
  { mark: "hit", letter: "A", name: "pword.help.keyGreenName", says: "pword.help.keyGreen" },
  { mark: "near", letter: "B", name: "pword.help.keyOrangeName", says: "pword.help.keyOrange" },
  { mark: "miss", letter: "C", name: "pword.help.keyBlackName", says: "pword.help.keyBlack" },
  { mark: null, letter: "D", name: "pword.help.keyWhiteName", says: "pword.help.keyWhite" },
];
const KANA_KEYS: readonly KeyRow[] = [
  { mark: "hit", letter: "あ", name: "pword.help.keyGreenName", says: "pword.help.keyGreen" },
  { mark: "near", letter: "い", name: "pword.help.keyOrangeName", says: "pword.help.keyOrange" },
  { mark: "kin", letter: "か", name: "pword.help.keyYellowName", says: "pword.help.keyYellow" },
  { mark: "miss", letter: "う", name: "pword.help.keyBlackName", says: "pword.help.keyBlack" },
  { mark: null, letter: "え", name: "pword.help.keyWhiteName", says: "pword.help.keyWhite" },
];

/**
 * Whether a key belongs to the guide and not to the game: any key pressed inside its dialog, and Enter or Space on its button, which
 * press it. The games listen on the whole window for letters, Enter and Space, and would swallow both (`preventDefault`), so the
 * button could not be opened from the keyboard and a letter typed in the dialog would land in the guess.
 */
export function helpOwnsKey(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("dialog") !== null) return true;
  return (event.key === "Enter" || event.key === " ") && target.closest("[data-word-help]") !== null;
}

/** A mark as the board draws it in the style the player chose: a stone, or a tile. */
function MarkExample({ mark, letter, arrow }: { mark: Mark; letter: string; arrow?: Exclude<CellArrow, ""> | undefined }) {
  const { style } = useWordStyle();
  if (style === WORD_STYLES.tiles) {
    return (
      <span className={`${WORD_TILE} ${WORD_TILE_MARK[mark]} relative size-12 shrink-0 text-2xl`} aria-hidden="true" data-testid="word-help-mark" data-mark={mark}>
        {letter}
        {arrow === undefined ? null : <ArrowMark arrow={arrow} />}
      </span>
    );
  }
  return (
    <span className={`${WORD_STONE} relative size-12 shrink-0 text-2xl`} style={WORD_STONE_LOOK[mark]} aria-hidden="true" data-testid="word-help-mark" data-mark={mark}>
      {letter}
      {arrow === undefined ? null : <ArrowMark arrow={arrow} />}
    </span>
  );
}

/** A key as the keyboard draws it, the colour it takes in the style the player chose. */
function KeyExample({ mark, letter }: { mark: Mark | null; letter: string }) {
  const { style } = useWordStyle();
  const marked = style === WORD_STYLES.tiles ? WORD_TILE_MARK : WORD_KEY_MARK_STONES;
  return (
    <span className={`${WORD_KEY} ${mark === null ? WORD_KEY_PLAIN : marked[mark]} relative !min-h-12 w-12 flex-none text-lg normal-case`} aria-hidden="true" data-testid="word-help-key" data-mark={mark ?? "plain"}>
      {letter}
    </span>
  );
}

/** One line of the guide: the example, then the colour's name in bold and what it means. */
function GuideRow({ example, name, children }: { example: ReactNode; name?: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3" data-testid="word-help-row">
      <span className="flex w-14 shrink-0 justify-center">{example}</span>
      <p className="min-w-0 text-sm leading-snug sm:text-base">
        {name === undefined ? null : <strong className="block">{name}</strong>}
        {children}
      </p>
    </li>
  );
}

/**
 * THE COLOUR GUIDE of the word games, a labelled button on the game itself and
 * the page it opens. John, 2026-11-02, after losing a kana game: "there should
 * be instructions that any age person can click to bring up to see what the
 * meanings are of the 4 colours on the board and the keyboard… the up and down
 * arrows… a better design is needed for this."
 *
 * Every mark is drawn as the board draws it, in the style the player chose,
 * beside its colour's NAME and a sentence a child can read, so the colour is
 * never the only thing said. The kana game adds its yellow and its arrows.
 * It is a native dialog: Escape, the × and the Got it button close it, so does
 * a press outside it, and closing leaves the game exactly as it was.
 */
export function WordMarksHelp({ kana }: { kana: boolean }) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const rows = kana ? KANA_ROWS : LETTER_ROWS;
  const keys = kana ? KANA_KEYS : LETTER_KEYS;
  // The miss is black on a stone and dark grey on a tile (`WORD_STONE_LOOK`, `WORD_TILE_MARK`): the guide names it as it is drawn in the style chosen.
  const { style } = useWordStyle();
  const nameOf = (row: Row) => say.say(row.mark === "miss" && style === WORD_STYLES.tiles ? "pword.help.greyName" : row.name);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${BUTTON_BASE} ${BUTTON_QUIET} gap-2 rounded-full px-3 py-1 text-sm whitespace-nowrap`}
        aria-haspopup="dialog"
        aria-label={say.say("pword.help.openLong")}
        data-testid="word-help-open"
        data-word-help="open"
        {...readyMark(hydrated)}
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper" aria-hidden="true">
          ?
        </span>
        {say.say("pword.help.open")}
      </button>
      {open ? (
        <dialog
          ref={dialog}
          onClose={() => setOpen(false)}
          // A press on the backdrop lands on the dialog itself, never on what is inside it.
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          aria-labelledby="word-help-title"
          className="m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-rule bg-paper p-4 text-ink shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm sm:p-6"
          data-testid="word-help-dialog"
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <h2 id="word-help-title" className={SECTION_HEADING}>
                {say.say("pword.help.title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-mt-1 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-moss"
                aria-label={say.say("pword.help.close")}
                data-testid="word-help-close"
              >
                ×
              </button>
            </div>
            <section className="flex flex-col gap-3" data-testid="word-help-board">
              <h3 className="text-base font-semibold">{say.say("pword.help.board")}</h3>
              <p className="text-sm text-muted">{say.say(kana ? "pword.help.boardKana" : "pword.help.boardLetters")}</p>
              <ul className="flex flex-col gap-3">
                {rows.map((row) => (
                  <GuideRow key={row.mark} example={<MarkExample mark={row.mark} letter={row.letter} />} name={nameOf(row)}>
                    {say.say(row.says)}
                  </GuideRow>
                ))}
              </ul>
            </section>
            {kana ? (
              <section className="flex flex-col gap-3" data-testid="word-help-arrows">
                <h3 className="text-base font-semibold">{say.say("pword.help.arrows")}</h3>
                <p className="text-sm text-muted">{say.say("pword.help.arrowsLead")}</p>
                <ul className="flex flex-col gap-3">
                  {ARROW_ROWS.map((row) => (
                    <GuideRow key={row.arrow} example={<MarkExample mark={row.mark} letter={row.letter} arrow={row.arrow} />} name={say.say(row.name)}>
                      {say.say(row.says)}
                    </GuideRow>
                  ))}
                </ul>
              </section>
            ) : null}
            <section className="flex flex-col gap-3" data-testid="word-help-keyboard">
              <h3 className="text-base font-semibold">{say.say("pword.help.keyboard")}</h3>
              <p className="text-sm text-muted">{say.say("pword.help.keyboardLead")}</p>
              <ul className="flex flex-col gap-3">
                {keys.map((key) => (
                  <GuideRow key={key.says} example={<KeyExample mark={key.mark} letter={key.letter} />} name={say.say(key.name)}>
                    {say.say(key.says)}
                  </GuideRow>
                ))}
                <GuideRow
                  name={say.say("pword.help.keyRingName")}
                  example={
                    <span className={`${WORD_KEY} ${WORD_KEY_PLAIN} ${WORD_KEY_TYPED} relative !min-h-12 w-12 flex-none text-lg normal-case`} aria-hidden="true">
                      {kana ? "か" : "E"}
                      <span className={WORD_KEY_COUNT}>2</span>
                    </span>
                  }
                >
                  {say.say("pword.help.keyRing")}
                </GuideRow>
              </ul>
            </section>
            <button type="button" onClick={() => setOpen(false)} className={`${BUTTON_BASE} ${BUTTON_STRONG} w-full text-base`} data-testid="word-help-done">
              {say.say("pword.help.gotIt")}
            </button>
          </div>
        </dialog>
      ) : null}
    </>
  );
}
