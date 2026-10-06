"use client";

import Link from "@/components/ui/Link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { decodeLayout } from "@johnmorrisdotca/tsunagi";
import { helpOpensOn, SOLVE_HELPS, strongestHelp, type SolveHelp } from "@/lib/puzzles/solveHelp";
import { cheatLine } from "@johnmorrisdotca/tsunagi";
import { explosionAfter, explosionsAsChosen, strokesToExplosion } from "@johnmorrisdotca/tsunagi";
import { blockOf, TSUNAGI_BLOCK } from "@johnmorrisdotca/tsunagi";
import type { TsunagiSet } from "@/lib/puzzles/tsunagi/levels";
import { challengesOf } from "@johnmorrisdotca/tsunagi";
import { firstUnsolvedTsunagiLevel, levelCountOf, nextLevelLabel, openTsunagiLevels, setOfSeed } from "@/lib/puzzles/tsunagi/levels";
import { allJoined, answerOf, decodeLines, dragFinger, encodeLines, filled, joined, letGo, linesOfAnswer, NO_REACH, noLines, pressAt, unjoinedPairs, type Lines, type Reach } from "@johnmorrisdotca/tsunagi";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { feltOrWoodTheme } from "./GomojiGrid";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { TsunagiGrid } from "./TsunagiGrid";
import { TsunagiLevelChips } from "./TsunagiLevelChips";
import { TsunagiViewport } from "./TsunagiViewport";
import { TsunagiSolvedView } from "./TsunagiSolvedView";
import { tsunagiLevelPath } from "./TsunagiLevelPicker";
import { TsunagiFillPicker, TsunagiMarksPicker } from "./TsunagiMarksPicker";
import type { TsunagiCheatsChoice, TsunagiExplosionsChoice, TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { keepSolveHere, keptSolves, keptSolvesOff } from "./tsunagiKept";
import { inSet, seedIn } from "./tsunagiSets";
import { useTsunagiAttempts } from "./useTsunagiAttempts";
import { useTsunagiCheats, useTsunagiExplosions, useTsunagiFill, useTsunagiMarks } from "./useTsunagiMarks";

/** How long Check's flashing lasts; its words stay until the board changes. */
const CHECK_FLASH_MS = 2400;

/** How long an explosion's burst shows; its words stay until the next stroke. */
const BLAST_MS = 1200;

/** The board of levels at a size: the set-up, opened on that size. */
export function tsunagiLevelsPath(size: number, set: TsunagiSet = "classic"): string {
  return `${setUpPath("tsunagi")}?size=${size}${set === "portals" ? "&set=portals" : ""}`;
}

/**
 * SOLVING A TSUNAGI LEVEL: press a marble or a line's end and drag. The rules
 * of a press and a drag are `tsunagi/lines.ts`; this holds the lines, the
 * undo, the clock (`useSolve`, as every puzzle), and the end: when every pair
 * is joined and every cell has a line through it, the answer is handed in and
 * the done card offers the next level and the board of levels.
 *
 * On a board with explosions (`tsunagi/explosions.ts`) every stroke is counted,
 * the count to the next one is shown under the board and turns to a warning a
 * stroke before, and the stroke that sets one off breaks a line, bursts where
 * it was, and leaves nothing to undo: an explosion is not taken back. Restart
 * starts the count again; a kept run picks up with a fresh count.
 *
 * A board with a STROKE LIMIT uses the same count: the strokes left are shown
 * under the board, Undo gives none back, and a board out of strokes before it
 * is solved takes nothing more until Restart, which gives them all back.
 *
 * HELP, as chosen at set-up: a level's explosions softened or off, and Cheat,
 * which draws one unfinished line (`cheatLine`). A solve that used either is
 * sent as helped (`solveHelp.ts`): solved, no points, off the fastest table —
 * and with explosions off, opening no block. Neither is offered in a race.
 *
 * A level past the open blocks is shut, and says which block opens it. A member's
 * solved levels come from the page (`tsunagiSolvedBy`); anybody's are also in
 * this browser (`tsunagiKept`), written the moment a level is solved.
 */
export function TsunagiSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
  known = {},
  attempts: attemptsKnown = {},
  bestSolves = {},
  marksChosen = null,
  fillChosen = null,
  closed = [],
  explosionsChosen = null,
  cheatsChosen = null,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  appearance?: Appearance;
  /** The levels at this size the member has solved on the account, with their best times, by seed. */
  known?: Record<number, number>;
  /** How many times the member has started each level at this size, on the account, by seed. */
  attempts?: Record<number, number>;
  /** The member's best solve of each level at this size, to open from its time, by seed. */
  bestSolves?: Record<number, string>;
  /** Colours or numbers, as the account last chose; null where it never has. */
  marksChosen?: TsunagiMarks | null;
  /** Marbles or lines, as the account last chose; null where it never has. */
  fillChosen?: TsunagiFill | null;
  /** Levels at this size solved on the account only with explosions off: solved, and opening no block, by seed. */
  closed?: readonly number[];
  /** Explosions as made, softened or off, as the account last chose at set-up; null where it never has. */
  explosionsChosen?: TsunagiExplosionsChoice | null;
  /** Whether Cheat is allowed, as the account last chose at set-up; null where it never has. */
  cheatsChosen?: TsunagiCheatsChoice | null;
}) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const { size, seed } = puzzle;
  // The seed names the level and its set (`tsunagi/levels.ts`); what a reader sees is its number in the set.
  const { set, level } = setOfSeed(seed);
  const layout = useMemo(() => decodeLayout(puzzle.givens, size)!, [puzzle.givens, size]);
  const [lines, setLines] = useState<Lines>(() => (resumed === null ? null : decodeLines(layout, resumed.progress)) ?? noLines(layout));
  const [undo, setUndo] = useState<Lines[]>([]);
  const now = useRef(lines);
  const drawing = useRef<number | null>(null);
  const before = useRef<Lines | null>(null);
  // How far the finger is from the end of the line it draws, once that has been through a portal (`dragFinger`).
  const reach = useRef<Reach>(NO_REACH);
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const { marks, chooseMarks } = useTsunagiMarks(marksChosen, hasAccount);
  const { fill, chooseFill } = useTsunagiFill(fillChosen, hasAccount);
  const theme = feltOrWoodTheme({ ...appearance, felt });
  // Help, as chosen at set-up; never in a race, where both seats play the level as made.
  const { explosions: explosionsChoice } = useTsunagiExplosions(explosionsChosen, hasAccount);
  const { cheats } = useTsunagiCheats(cheatsChosen, hasAccount);
  const easing = race === null && layout.explosions !== null ? explosionsChoice : "on";
  const cheatOffered = race === null && cheats === "allowed";
  // The board as it is played: its explosions as chosen.
  const played = useMemo(() => ({ ...layout, explosions: explosionsAsChosen(layout.explosions, easing) }), [layout, easing]);
  const eased: SolveHelp | null = easing === "off" ? SOLVE_HELPS.explosionsOff : easing === "soft" ? SOLVE_HELPS.explosionsSoft : null;
  const cheated = useRef(false);
  const [cheatedShown, setCheatedShown] = useState(false);

  /*
   * This page is drawn in the browser only (`PuzzlePlayClient`), so the
   * browser's own solves are read at once. Two sets: every level solved, which
   * opens on its finished board; and the ones that open blocks, which is every
   * one but a level solved only with its explosions off (`helpOpensOn`).
   */
  const [solvedHere] = useState(() => inSet({ ...keptSolvesOff(size), ...keptSolves(size), ...known }, set));
  const solvedSet = useMemo(() => new Set(Object.keys(solvedHere).map(Number)), [solvedHere]);
  const [opening] = useState(() => new Set(Object.keys(inSet({ ...keptSolves(size), ...Object.fromEntries(Object.keys(known).filter((each) => !closed.includes(Number(each))).map((each) => [each, 0])) }, set)).map(Number)));
  const open = openTsunagiLevels(size, opening, set);
  const count = levelCountOf(size, set);
  // Past the open blocks is shut, except a level already solved: it opens on its finished board wherever it now sits.
  const shut = race === null && resumed === null && level > open && !solvedSet.has(level);
  // Where "next" leads once this one is solved: the lowest level still unsolved, this one counted in where its solve opens.
  const opensNow = helpOpensOn(eased);
  const onwardTo = firstUnsolvedTsunagiLevel(size, new Set([...opening, ...(opensNow ? [level] : [])]), set);
  const onward = {
    next: onwardTo === null ? null : { href: tsunagiLevelPath(size, seedIn(set, onwardTo)), label: nextLevelLabel(level, onwardTo, say) },
    all: { href: tsunagiLevelsPath(size, set), label: say.say("pset.mine.allLevels") },
  };
  // A level already solved opens on its finished board; only Restart starts it again (`TsunagiSolvedView`).
  const answerLines = useMemo(() => linesOfAnswer(layout, puzzle.solution), [layout, puzzle.solution]);
  const [reviewing, setReviewing] = useState(race === null && resumed === null && solvedSet.has(level) && answerLines !== null);
  // An attempt is a board started from empty: counted at its first line, once, and again after Restart. A kept run was counted when it began.
  const { attempts, countOne } = useTsunagiAttempts(size, seed, hasAccount, attemptsKnown[seed] ?? 0);
  const counted = useRef(resumed !== null);
  // Check: the pairs not joined yet, their marbles flashing a moment; the words stay until the board changes.
  const [flagged, setFlagged] = useState<ReadonlySet<number> | null>(null);
  const [checkSays, setCheckSays] = useState<string | null>(null);
  // Explosions: the strokes so far, the cells the last one burst, and what it did.
  const strokes = useRef(0);
  const [strokeCount, setStrokeCount] = useState(0);
  const [blasted, setBlasted] = useState<ReadonlySet<number> | null>(null);
  const [blastSays, setBlastSays] = useState<string | null>(null);
  useEffect(() => {
    if (blasted === null) return;
    const off = window.setTimeout(() => setBlasted(null), BLAST_MS);
    return () => window.clearTimeout(off);
  }, [blasted]);
  useEffect(() => {
    if (flagged === null) return;
    const off = window.setTimeout(() => setFlagged(null), CHECK_FLASH_MS);
    return () => window.clearTimeout(off);
  }, [flagged]);

  const { startedAt, elapsedMs, done, begin, finish, pausing } = useSolve(puzzle, hasAccount, race, null, {
    progress: encodeLines(layout, lines),
    resumed,
  });
  // Out of strokes: the board takes nothing more until Restart.
  const spent = layout.strokes !== null && strokeCount >= layout.strokes && done === null;
  const idle = done !== null || pausing.paused || shut || reviewing || spent;

  const show = useCallback((next: Lines) => {
    now.current = next;
    setLines(next);
    setFlagged(null);
    setCheckSays(null);
  }, []);

  const press = useCallback(
    (cell: number) => {
      if (idle) return;
      const pressed = pressAt(layout, now.current, cell);
      if (pressed.drawing === null) return;
      begin();
      if (!counted.current) {
        counted.current = true;
        countOne();
      }
      before.current = now.current;
      drawing.current = pressed.drawing;
      reach.current = NO_REACH;
      show(pressed.lines);
      setBlastSays(null);
    },
    [idle, layout, begin, show, countOne],
  );
  const drag = useCallback(
    (cell: number) => {
      if (drawing.current === null || idle) return;
      const dragged = dragFinger(layout, now.current, drawing.current, cell, reach.current);
      reach.current = dragged.reach;
      show(dragged.lines);
    },
    [idle, layout, show],
  );
  const lift = useCallback(() => {
    if (drawing.current === null) return;
    drawing.current = null;
    reach.current = NO_REACH;
    const next = letGo(now.current, layout);
    show(next);
    const was = before.current;
    before.current = null;
    if (was === null || JSON.stringify(was) === JSON.stringify(next)) return;
    const stroke = strokes.current + 1;
    strokes.current = stroke;
    setStrokeCount(stroke);
    if (allJoined(layout, next)) {
      const answer = answerOf(layout, next);
      // Every level has one answer, so a board joined and full is it; compared all the same, never assumed.
      if (answer === puzzle.solution) {
        const at = Date.now();
        void finish(answer, at, strongestHelp([cheated.current ? SOLVE_HELPS.cheated : null, eased])).then(() => undefined);
        return;
      }
    }
    // A stroke that solves the level sets nothing off; any other may.
    const blown = explosionAfter(played, puzzle.givens, next, stroke);
    if (blown === null) {
      setUndo((stack) => [...stack.slice(-199), was]);
      return;
    }
    show(blown.lines);
    setUndo([]);
    setBlasted(new Set(blown.cells));
    setBlastSays(say.say(blown.hit.length > 1 ? "pmaze.tsunagi.blast" : "pmaze.tsunagi.boom"));
  }, [layout, played, eased, show, finish, puzzle.solution, puzzle.givens, say]);

  // Kept in this browser as soon as it is solved, so the board of levels opens the next row with or without an account.
  useEffect(() => {
    if (done !== null && race === null) keepSolveHere(size, seed, done.elapsedMs, helpOpensOn(done.helped ?? null));
  }, [done, race, size, seed]);

  const takeBack = () => {
    if (idle || undo.length === 0) return;
    show(undo[undo.length - 1]!);
    setUndo((stack) => stack.slice(0, -1));
  };
  const restart = () => {
    if ((idle && !spent) || now.current.every((line) => line.length === 0)) return;
    setUndo((stack) => [...stack.slice(-199), now.current]);
    show(noLines(layout));
    counted.current = false;
    strokes.current = 0;
    setStrokeCount(0);
    setBlastSays(null);
    // A fresh attempt: Cheat pressed in the one before is not held against it.
    cheated.current = false;
    setCheatedShown(false);
  };
  const playAgain = () => {
    setReviewing(false);
    setUndo([]);
    show(noLines(layout));
    counted.current = false;
    strokes.current = 0;
    setStrokeCount(0);
    cheated.current = false;
    setCheatedShown(false);
  };
  /* CHEAT: one unfinished line drawn as the answer has it (`cheatLine`), anything in its way cut back. It spends no stroke, and the solve it helps is kept as helped. */
  const cheat = () => {
    if (idle || answerLines === null) return;
    const drawn = cheatLine(layout, now.current, answerLines);
    if (drawn === null) return;
    begin();
    if (!counted.current) {
      counted.current = true;
      countOne();
    }
    cheated.current = true;
    setCheatedShown(true);
    setUndo((stack) => [...stack.slice(-199), now.current]);
    show(drawn.lines);
    if (allJoined(layout, drawn.lines) && answerOf(layout, drawn.lines) === puzzle.solution) {
      void finish(puzzle.solution, Date.now(), strongestHelp([SOLVE_HELPS.cheated, eased])).then(() => undefined);
    }
  };
  const check = () => {
    if (idle) return;
    const missing = unjoinedPairs(layout, now.current);
    setFlagged(new Set(missing));
    const empty = filled(layout, now.current);
    setCheckSays(
      missing.length > 0 ? say.count("pmaze.tsunagi.notJoined", missing.length) : say.count("pmaze.tsunagi.allJoined", empty.of - empty.done),
    );
  };

  const pairs = layout.ends.length;
  const pairsJoined = layout.ends.filter((_, pair) => joined(layout, lines, pair)).length;
  const cover = filled(layout, lines);
  const boomIn = strokesToExplosion(played, strokeCount);
  const lastBoom = boomIn === 1;
  const asked = (
    <>
      {set === "portals" ? say.say("pmaze.tsunagi.sizePortals", { size: String(size) }) : `${size}×${size}`} · {say.say("puzzle.level.number", { number: String(level) })} <span className="text-xs">{say.say("pmaze.ofCount", { count: String(count) })}</span>{" "}
      {/*
        ONE WIDTH FOR EVERY COUNT. The first stroke turns "0 attempts" into "1
        attempt", and where the line over the board sat on the edge of wrapping,
        the board jumped under the finger mid-drag (0.398.0's CI). Room for "· 999
        attempts", kept whatever the count, so the line wraps the same before
        play and during it.
      */}
      <span className="inline-block min-w-[13ch] text-xs text-muted" data-testid="tsunagi-attempts" data-count={attempts}>
        {say.count("pmaze.tsunagi.attempt", attempts)}
      </span>
    </>
  );

  if (shut) {
    const block = blockOf(level);
    const first = firstUnsolvedTsunagiLevel(size, solvedSet, set) ?? 1;
    return (
      <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind="tsunagi" data-seed={level} data-set={set} {...readyMark(hydrated)}>
        <p className="text-sm" data-testid="tsunagi-shut">
          {say.say("pmaze.shut", { level: String(level), size: `${size}×${size}`, block: String(block - 1), first: String((block - 2) * TSUNAGI_BLOCK + 1), last: String((block - 1) * TSUNAGI_BLOCK) })}
        </p>
        <p className="flex flex-wrap gap-2">
          <Link href={tsunagiLevelPath(size, seedIn(set, first))} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="tsunagi-shut-first">
            {say.say("pmaze.playFirst", { level: String(first) })}
          </Link>
          <Link href={tsunagiLevelsPath(size, set)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
            {say.say("pset.mine.allLevels")}
          </Link>
        </p>
      </section>
    );
  }

  const chips = <TsunagiLevelChips size={size} level={level} set={set} challenges={challengesOf(puzzle.givens)} />;
  const pickers = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-3">
        <TsunagiMarksPicker marks={marks} onChoose={chooseMarks} />
        <TsunagiFillPicker fill={fill} onChoose={chooseFill} />
      </div>
      <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
    </div>
  );

  if (reviewing && answerLines !== null) {
    return (
      <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind="tsunagi" data-seed={level} data-set={set} data-reviewing="true" {...readyMark(hydrated)}>
        <p className="text-sm text-muted" data-testid="puzzle-asked">
          {asked}
        </p>
        <TsunagiSolvedView
          layout={layout}
          lines={answerLines}
          marks={marks}
          fill={fill}
          theme={theme}
          best={solvedHere[level] === undefined ? null : { elapsedMs: solvedHere[level]!, solveId: bestSolves[seed] ?? null }}
          attempts={attempts}
          next={onward.next}
          all={onward.all}
          onRestart={playAgain}
          under={chips}
        />
        {pickers}
      </section>
    );
  }

  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind="tsunagi" data-seed={level} data-set={set} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} asked={asked} />
      <SolvePaused pausing={pausing}>
        <TsunagiViewport size={size}>
          <TsunagiGrid layout={layout} lines={lines} marks={marks} fill={fill} theme={theme} done={done !== null} flagged={flagged} blasted={blasted} onPress={press} onDrag={drag} onLift={lift} />
        </TsunagiViewport>
      </SolvePaused>
      {chips}
      {done === null ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={takeBack} disabled={undo.length === 0 || pausing.paused || spent} data-testid="tsunagi-undo">
              {say.say("puzzle.press.undo")}
            </button>
            <button
              type="button"
              className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
              onClick={restart}
              disabled={startedAt === null || pausing.paused || lines.every((line) => line.length === 0)}
              data-testid="tsunagi-restart"
            >
              {say.say("puzzle.press.restart")}
            </button>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={check} disabled={pausing.paused} data-testid="tsunagi-check">
              {say.say("puzzle.solve.check")}
            </button>
            {cheatOffered ? (
              <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={cheat} disabled={pausing.paused || spent} title={say.say("pmaze.tsunagi.cheatSays")} data-testid="tsunagi-cheat">
                {say.say("puzzle.press.cheat")}
              </button>
            ) : null}
            <span className="text-sm text-muted tabular-nums" data-testid="tsunagi-progress" data-joined={pairsJoined} data-filled={cover.done} aria-live="polite">
              {pairsJoined === pairs && cover.done < cover.of
                ? say.count("pmaze.tsunagi.joinedEmpty", cover.of - cover.done)
                : say.say("pmaze.tsunagi.progress", { joined: String(pairsJoined), pairs: String(pairs), percent: String(Math.round((100 * cover.done) / cover.of)) })}
            </span>
          </div>
          {layout.strokes === null ? null : (
            <p
              className={`text-sm ${spent ? "font-semibold text-shu" : "text-muted"}`}
              data-testid="tsunagi-strokes-left"
              data-left={Math.max(0, layout.strokes - strokeCount)}
              data-limit={layout.strokes}
              aria-live="polite"
            >
              {spent ? say.say("pmaze.tsunagi.outOfStrokes") : say.count("pmaze.tsunagi.strokesLeft", layout.strokes, { left: String(layout.strokes - strokeCount) })}
            </p>
          )}
          {eased === null && !cheatedShown ? null : (
            // Said before the solve, not after it: what the help chosen will cost.
            <p className="text-sm text-muted" data-testid="tsunagi-help-note" data-helped={strongestHelp([cheatedShown ? SOLVE_HELPS.cheated : null, eased]) ?? undefined}>
              {eased === SOLVE_HELPS.explosionsOff
                ? say.say("pmaze.tsunagi.noteOff")
                : eased === SOLVE_HELPS.explosionsSoft
                  ? say.say(cheatedShown ? "pmaze.tsunagi.noteSoftCheat" : "pmaze.tsunagi.noteSoft")
                  : say.say("pmaze.tsunagi.noteCheat")}
            </p>
          )}
          {boomIn === null ? null : (
            <p className={`text-sm ${lastBoom ? "font-semibold text-shu" : "text-muted"}`} data-testid="tsunagi-boom-countdown" data-left={boomIn} data-strokes={strokeCount} aria-live="polite">
              {blastSays === null ? "" : `${blastSays} `}
              {lastBoom ? say.say("pmaze.tsunagi.boomNext") : say.count("pmaze.tsunagi.boomIn", boomIn)}
            </p>
          )}
          {checkSays === null ? null : (
            <p className="text-sm" data-testid="tsunagi-check-says" data-missing={flagged?.size ?? undefined} aria-live="polite">
              {checkSays}
            </p>
          )}
          <p className="text-sm text-muted">{say.say("pmaze.tsunagi.howTo")}</p>
        </div>
      ) : (
        <SolveDone
          puzzle={puzzle}
          done={done}
          hasAccount={hasAccount}
          race={race}
          onward={onward}
        />
      )}
      {pickers}
    </section>
  );
}
