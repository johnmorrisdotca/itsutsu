"use client";

import Link from "@/components/ui/Link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import type { Appearance } from "@/components/board/board.types";
import { joinQuery, playPath } from "@/lib/gomoku/slugs";
import { viewHref } from "@/lib/history/myGamesViews";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { decodeKanaProgress, encodeKanaProgress } from "@/lib/puzzles/puzzleProgress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { backspace, choose, clearAt, emptyRow, step, typeLetter, wordOf, type TypingRow } from "@/lib/puzzles/gomoji/typingRow";
import { boardGuesses, everyWordFound, hiddenWordsOf, wordRowsResumed, wordsShown } from "@/lib/puzzles/gomoji/futago";
import { asWordCount } from "@/lib/puzzles/gomoji/wordsSeed";
import { dodgeGuesses, readDodge } from "@/lib/puzzles/gomoji/dodgePlay";
import { decodeDodgeGivens } from "@/lib/puzzles/gomoji/dodgeSeed";
import { backwardsGuesses, breaksBackwardsRule } from "@/lib/puzzles/gomoji/backwards";
import { isBackwardsGivens } from "@/lib/puzzles/gomoji/backwardsSeed";
import { futagoKanaScore } from "@/lib/puzzles/gomoji/futagoScore";
import { breaksKanaHardRule, toHiragana } from "@/lib/puzzles/gomojiKana/kanaCode";
import { cycleMark, kanaBase, markKanaGuess, toggleSize, type KanaMark, type KanaMarked } from "@/lib/puzzles/gomojiKana/kanaMarks";
import { kanaWordsOf } from "@/lib/puzzles/gomojiKana/kanaWords";
import { isDailyPoolWord } from "@/lib/puzzles/dailyWords/dailyPools";
import { finishRomaji, readRomaji } from "@/lib/puzzles/gomojiKana/romaji";
import { headStartKeys } from "@/lib/puzzles/gomoji/headStart";
import { kanaKeyMarks, knownCounts, typedCounts, withHeadStart } from "@/lib/puzzles/keyMarks";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { KanaKeyboard } from "./KanaKeyboard";
import { WordBoards } from "./WordBoards";
import { GomojiGrid, type CellArrow } from "./GomojiGrid";
import { WordReplay } from "./WordReplay";
import { WordScoreLine } from "./WordScoreLine";
import { SakasaScoreLine } from "./SakasaScoreLine";
import { useWordKeys, wordKeysClass, WordKeysToggle } from "./WordKeysToggle";
import { useWordStyle } from "./WordStyleContext";
import { WordStylePicker } from "./WordStylePicker";
import { usePlayInView } from "./usePlayInView";
import { type ResumedRun, SolveDone, SolveHeader, SolvePaused, type SolveRace, useSolve } from "./solveShared";
import { PuzzleWallpaper } from "./PuzzleWallpaper";
import { PuzzleWayBack } from "./PuzzleWayBack";
import { WinStack } from "./PuzzleWinSlot";
import { BUTTON_BASE, BUTTON_STRONG, PLAY_SURFACE, SELECTABLE } from "@/components/ui/ui.constants";
import { ResultMark } from "@/components/game/ResultMark";


function arrowOf(mark: KanaMarked): CellArrow {
  return mark.wrongSize && mark.wrongMark ? "↓↑" : mark.wrongSize ? "↓" : mark.wrongMark ? "↑" : "";
}

/** The place the 小 and ゛゜ keys change: the chosen kana, or the one just typed before the waiting place. */
function lastTyped(row: TypingRow): number {
  return row.at < row.slots.length && row.slots[row.at] !== "" ? row.at : row.at - 1;
}

function changeLast(row: TypingRow, change: (kana: string) => string): TypingRow {
  const at = lastTyped(row);
  if (at < 0 || row.slots[at] === "") return row;
  return { ...row, slots: row.slots.map((kana, index) => (index === at ? change(kana) : kana)) };
}

/**
 * Solving Gomoji in kana (docs/plans/other/WORD-04-kana.md): Gomoji's
 * grid, styles and keys, with John's colours — green, orange, yellow for the
 * column, grey — and an arrow on a kana right but for its size or mark.
 *
 * Kana come from the gojūon keys under the grid, with 小 and ゛゜ to change the
 * last one, or from the desk's keyboard in romaji (`readRomaji`), the sound
 * still being typed shown beside the prompt until it is a kana. On easy and
 * medium the grid opens with the free grey word already played. The level
 * decides how many guesses follow it (`layout.ts`); Strict, where it was
 * chosen, holds every guess to the kana already found (`breaksKanaHardRule`).
 *
 * A FUTAGO (`futago.ts`) is the same with two words, as `GomojiSolve` plays
 * one: two boards, the free grey word grey against both and on both, every
 * guess on each board until its word is found, and split keys.
 */
export function GomojiKanaSolve({
  puzzle,
  strict = false,
  headStart = false,
  hasAccount,
  race = null,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
}: {
  puzzle: Puzzle;
  /** Whether Strict was chosen: every kana found must be played again, a green in its place. */
  strict?: boolean;
  /** Whether Head start was chosen: as many kana keys as the word has, none of them in it, grey before the first guess (`headStart.ts`). */
  headStart?: boolean;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  /** The reader's board, so the board colour picker starts where they left it (`useFeltChoice`). */
  appearance?: Appearance;
}) {
  const hydrated = useHydrated();
  const { style } = useWordStyle();
  const keys = useWordKeys();
  // The same board colour picker a Reversi or Gomoku board offers (`useFeltChoice`); every Gomoji style shares it.
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const dressed = useMemo(() => ({ ...appearance, felt }), [appearance, felt]);
  const { kind, size, level, seed } = puzzle;
  const [guesses, setGuesses] = useState<string[]>(() => (resumed === null ? null : decodeKanaProgress(resumed.progress, size)) ?? []);
  // A Gomoji Nige 逃げ in kana hides nothing and has no free grey word: the dodger answers every guess (`dodgePlay.ts`).
  const dodging = useMemo(() => decodeDodgeGivens(puzzle.givens), [puzzle.givens]);
  const dodge = useMemo(() => (dodging === null ? null : readDodge(kind, size, level, dodging, guesses)), [dodging, kind, size, level, guesses]);
  // One word, or a Futago's two (`futago.ts`), and the free grey word; a dodger's the one it stands for after these guesses.
  const given = useMemo(
    () => (dodge !== null ? { words: [dodge.word], grey: null } : (hiddenWordsOf(kind, size, puzzle.givens) ?? { words: [""], grey: null })),
    [dodge, kind, size, puzzle.givens],
  );
  const hidden = given.words[0]!;
  // One word, a Futago's two or a Yotsugo's four: the address and Another ask for the same count again.
  const count = asWordCount(given.words.length);
  const many = count > 1;
  const free = given.grey === null ? 0 : 1;
  const words = useMemo(() => kanaWordsOf(size), [size]);
  // A run kept under the counts before 2026-09-28 may have used today's count already: it opens with a guess left (`rowsResumed`).
  const [kept] = useState(() => guesses.length);
  // A Sakasa, played backwards (`backwards.ts`): its word behind a mark, no free grey word, and its levels the other way round.
  const backwards = isBackwardsGivens(puzzle.givens);
  const rows = dodging !== null ? dodgeGuesses(kind, size) : backwards ? backwardsGuesses(kind, size, level) : wordRowsResumed(kind, size, level, given, kept);
  const [typing, setTyping] = useState<TypingRow>(() => emptyRow(size));
  const [romaji, setRomaji] = useState("");
  const [said, setSaid] = useState<string | null>(null);
  // Typing has begun: from here the board and the keys are kept on the screen together (`usePlayInView`).
  const [engaged, setEngaged] = useState(false);
  const { elapsedMs, done, begin, finish, runOut, pausing, clock } = useSolve(puzzle, hasAccount, race, null, { progress: encodeKanaProgress(guesses), resumed, strict, headStart }, false, true);

  /* The rows drawn: the free grey word first where there is one, then the guesses. */
  const shown = useMemo(() => (given.grey === null ? guesses : [given.grey, ...guesses]), [given.grey, guesses]);
  const marked = useMemo(() => shown.map((guess) => markKanaGuess([...guess], [...hidden])), [shown, hidden]);
  // The head start's kana keys are grey from the first moment, as a guess would have left them (`headStart.ts`).
  const started = useMemo(() => (headStart ? headStartKeys(kind, size, puzzle.givens) : []), [headStart, kind, size, puzzle.givens]);
  const known = useMemo(() => withHeadStart(kanaKeyMarks(shown, hidden), started, "miss"), [shown, hidden, started]);
  // Each board of a Futago: the grey word and the guesses it was shown, their marks, and whether its word is found.
  const boards = useMemo(
    () =>
      given.words.map((word) => {
        const guessed = boardGuesses(guesses, word);
        const rowsShown = given.grey === null ? guessed : [given.grey, ...guessed];
        const marks = rowsShown.map((row) => markKanaGuess([...row], [...word]));
        return { word, guessed, rows: rowsShown, marks: marks.map((row) => row.map((each) => each.mark)), arrows: marks.map((row) => row.map(arrowOf)), found: guessed.includes(word) };
      }),
    [given, guesses],
  );
  const split = useMemo(
    () => (many ? boards.map((board): ReadonlyMap<string, KanaMark> => withHeadStart(kanaKeyMarks(board.rows, board.word), started, "miss")) : null),
    [many, boards, started],
  );
  // How many of a kana the marks on the board prove, by base as the keys are: a count on its key from two.
  // Not for a Futago, whose two words hold different counts.
  const counted = useMemo(
    () =>
      many ? new Map<string, number>() : knownCounts(
        shown,
        marked.map((row) => row.map((each) => each.mark)),
        kanaBase,
      ),
    [many, shown, marked],
  );

  const playRoot = usePlayInView(engaged && done === null, typing);
  const closed = done !== null || pausing.paused;

  const edit = useCallback(
    (change: (row: TypingRow) => TypingRow) => {
      if (closed) return;
      setSaid(null);
      setEngaged(true);
      setTyping(change);
    },
    [closed],
  );
  /*
   * The first kana typed starts the clock, on the keys under the board as on
   * a desk's keyboard. It started at the first guess sent, so on a phone a
   * player typing their first word watched 0:00 and a Pause they could not
   * press — John, 2026-09-25: "clock doesn't start on iPhone with keyboard use."
   */
  const kana = useCallback(
    (typed: string) => {
      if (closed) return;
      begin();
      edit((row) => typeLetter(row, typed));
    },
    [closed, begin, edit],
  );
  const back = useCallback(() => {
    if (romaji !== "") setRomaji((pending) => pending.slice(0, -1));
    else edit(backspace);
  }, [romaji, edit]);

  /* A key on the desk: added to the romaji being typed, and every kana it completes goes into the row. */
  const roman = useCallback(
    (key: string) => {
      if (closed) return;
      const { kana: made, rest } = readRomaji(romaji + key);
      if (made.length > 0) {
        begin();
        edit((row) => made.reduce(typeLetter, row));
      }
      setRomaji(rest);
    },
    [closed, romaji, begin, edit],
  );

  const enter = useCallback(() => {
    if (closed) return;
    // A last "n" is ん at Enter; any other half-typed sound is dropped.
    const row = romaji === "" ? typing : finishRomaji(romaji).reduce(typeLetter, typing);
    setRomaji("");
    setTyping(row);
    const word = wordOf(row);
    if (word === null) {
      setSaid(`A guess is ${size} kana.`);
      return;
    }
    if (!words.allowed.has(word) && !(given.words.includes(word) && isDailyPoolWord("ja", size, word))) {
      setSaid(`${word} is not in the word list.`);
      return;
    }
    // Strict holds a guess to what every board still being played has found; a found board asks nothing more.
    // A Sakasa holds every guess to what the rows uncovered, whatever Strict says (`breaksBackwardsRule`).
    const breaks = backwards ? breaksBackwardsRule(kind, guesses, hidden, word) : strict ? (boards.filter((board) => !board.found).map((board) => breaksKanaHardRule(board.guessed, board.word, word)).find((each) => each !== null) ?? null) : null;
    if (breaks !== null) {
      setSaid(`${backwards ? "Sakasa" : "Strict"}: ${breaks}.`);
      return;
    }
    const at = begin();
    const next = [...guesses, word];
    setGuesses(next);
    setTyping(emptyRow(size));
    setSaid(null);
    // A dodger is found only when the guess left it nowhere else to go (`dodgeFound`).
    const found = dodging === null ? everyWordFound(next, given.words) : readDodge(kind, size, level, dodging, next).found;
    // Backwards, the word typed is the loss and every row filled without it the win.
    if (backwards) {
      if (word === hidden) void runOut(next.join(""), at);
      else if (next.length === rows) void finish(next.join(""), at);
    } else if (found) void finish(next.join(""), at);
    else if (next.length === rows) void runOut(next.join(""), at);
  }, [closed, romaji, typing, size, words, strict, guesses, given, boards, begin, finish, runOut, rows, dodging, backwards, hidden, kind, level]);

  /* The desk's keyboard: romaji, kana from a Japanese keyboard, Enter, Backspace and Delete, Space and the arrows. */
  useEffect(() => {
    if (closed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select") !== null) return;
      if (/^[a-zA-Z'-]$/.test(event.key)) {
        event.preventDefault();
        roman(event.key.toLowerCase());
      } else if (/^[ぁ-ゖァ-ヶー]$/u.test(event.key)) {
        event.preventDefault();
        kana(toHiragana(event.key));
      } else if (event.key === "Enter") {
        event.preventDefault();
        enter();
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        back();
      } else if (event.key === " ") {
        event.preventDefault();
        edit(clearAt);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        edit((row) => step(row, event.key === "ArrowLeft" ? -1 : 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closed, roman, kana, enter, back, edit]);

  const left = rows - guesses.length;
  const score = done === null ? null : futagoKanaScore(given.words, guesses, rows, done.elapsedMs);
  return (
    <section ref={playRoot} className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} headStart={headStart} />
      {/* Over, the board becomes its replay in the same place, with its scrubber and keyboard (`WordReplay`). */}
      {done === null && many ? (
        <SolvePaused pausing={pausing}>
          <WordBoards size={size} rows={free + rows} boards={boards} free={free} typing={typing} done={false} style={style} onChoose={(place) => edit((row) => choose(row, place))} appearance={dressed} />
        </SolvePaused>
      ) : done === null ? (
        <SolvePaused pausing={pausing}>
            <GomojiGrid
              size={size}
              rows={free + rows}
              guesses={shown}
              marks={marked.map((row) => row.map((each) => each.mark))}
              arrows={marked.map((row) => row.map(arrowOf))}
              free={free}
              typing={typing}
              done={false}
              style={style}
              onChoose={(place) => edit((row) => choose(row, place))}
              appearance={dressed}
            />
        </SolvePaused>
      ) : (
        // The board over, as its replay: the cell a win's cover is drawn over (`PuzzleWinSlot`).
        <WinStack>
          <WordReplay kind="gomojiKana" size={size} givens={puzzle.givens} guesses={guesses} level={level} headStart={headStart} style={style} appearance={dressed} />
        </WinStack>
      )}
      {done === null ? (
        <>
          <p className="min-h-5 text-sm text-muted" data-testid="word-said" aria-live="polite">
            {said ?? (backwards
              ? `Type any word but the hidden one, keeping every kana uncovered. ${left} ${left === 1 ? "row" : "rows"} to get through.`
              : `${free === 1 ? `The first word is free, grey everywhere${count === 4 ? " in all four quarters" : many ? " for both words" : ""}. ` : ""}${count === 4 ? "Every guess goes to all four words. " : many ? "Every guess goes to both words. " : ""}${left} ${left === 1 ? "guess" : "guesses"} left${
              dodge === null ? "" : `, and ${dodge.standing} ${dodge.standing === 1 ? "word" : "words"} for it to hide among`
            }.`)}
            {romaji === "" ? null : (
              <span className="ml-2 font-mono text-ink" data-testid="kana-romaji">
                {romaji}…
              </span>
            )}
          </p>
          <div className={`${wordKeysClass(keys.shown)} flex-col`} data-testid="word-keys-box">
            <KanaKeyboard
              known={known}
              split={split}
              counted={counted}
              typed={typedCounts(typing.slots, kanaBase)}
              last={lastTyped(typing) >= 0 && typing.slots[lastTyped(typing)] !== "" ? typing.slots[lastTyped(typing)]! : null}
              style={style}
              disabled={pausing.paused}
              onKana={kana}
              onSmall={() => edit((row) => changeLast(row, toggleSize))}
              onMark={() => edit((row) => changeLast(row, cycleMark))}
              onEnter={enter}
              onBack={back}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WordStylePicker />
            <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
            <WordKeysToggle shown={keys.shown} onToggle={keys.toggle} />
          </div>
        </>
      ) : done.outOfGuesses ? (
        <div className={`${SELECTABLE} flex flex-col gap-2`} data-testid="word-out">
          {backwards && !done.outOfTime ? (
            <p className="text-base">
              <ResultMark kind="failure" className="mr-1.5" />
              Caught on row {guesses.length} of {rows}: <strong className="tracking-wide" data-testid="word-was">{hidden}</strong> was the word.
            </p>
          ) : (
            <p className="text-base" data-testid={done.outOfTime ? "puzzle-out-of-time" : undefined}>
              <ResultMark kind="failure" className="mr-1.5" />
              {done.outOfTime ? "Out of time" : `Out of ${rows} guesses`}.{" "}
              {many ? "The words were" : dodge === null || dodge.standing <= 1 ? "The word was" : `It was still hiding among ${dodge.standing} words, one of them`}{" "}
              <strong className="tracking-wide" data-testid="word-was">{wordsShown(kind, given.words)}</strong>.
            </p>
          )}
          {backwards ? <SakasaScoreLine word={hidden} guesses={guesses} /> : <WordScoreLine score={score!} headStart={headStart} />}
          {hasAccount && race === null ? (
            <p className="text-xs text-muted" data-testid="word-kept">
              {done.paid !== null && done.paid.points > 0 ? `+${done.paid.points} XP for playing it out. ` : ""}
              Kept in{" "}
              <Link href={viewHref("completed")} className="underline">
                My games
              </Link>{" "}
              with your guesses.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2" data-testid="puzzle-way-on">
            <Link
              href={joinQuery(playPath(kind), puzzleQuery({ size, level, seed: null, checks: null, hints: false, strict, headStart, words: count, dodge: dodging !== null, backwards, clock }))}
              className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
              data-testid="word-another"
            >
              {count === 4 ? "Four more words →" : many ? "Two more words →" : "Another word →"}
            </Link>
            <PuzzleWayBack kind={kind} />
          </div>
          <PuzzleWallpaper puzzle={puzzle} result={done.outOfTime ? "Out of time" : backwards ? `Caught on row ${guesses.length}` : `Out of ${rows} guesses`} />
        </div>
      ) : (
        <>
          {backwards ? <SakasaScoreLine word={hidden} guesses={guesses} /> : <WordScoreLine score={score!} headStart={headStart} />}
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} strict={strict} headStart={headStart} />
        </>
      )}
      {/* JMdict's licence asks for this on every page that shows its words. */}
      <p className={`${SELECTABLE} text-xs text-muted`} data-testid="kana-credit">
        Words from{" "}
        <a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" className="underline" rel="noreferrer" target="_blank">
          JMdict
        </a>{" "}
        by the Electronic Dictionary Research and Development Group, used under its{" "}
        <a href="https://www.edrdg.org/edrdg/licence.html" className="underline" rel="noreferrer" target="_blank">
          licence
        </a>{" "}
        (CC BY-SA 4.0), release {words.release}.
      </p>
    </section>
  );
}
