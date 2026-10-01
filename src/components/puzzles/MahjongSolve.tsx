"use client";

import { useCallback, useMemo, useState } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { canTake, freePairs, geometryOf, hintFor, isCleared, matchesOf, tilesLeft } from "@johnmorrisdotca/jarajara";
import { shuffleTiles } from "@johnmorrisdotca/jarajara";
import { layoutFor } from "@johnmorrisdotca/jarajara";
import type { MahjongMove } from "@johnmorrisdotca/jarajara";
import { decodeMoves, encodeMoves, playSolve } from "@johnmorrisdotca/jarajara";
import { bonusRuleOf } from "@johnmorrisdotca/jarajara";
import { encodeMahjongProgress } from "@/lib/puzzles/puzzleProgress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MahjongBoard, mahjongAspect } from "./MahjongBoard";
import { MahjongFindToggle, MahjongFreeToggle } from "./MahjongFreeToggle";
import { MAHJONG_COPY } from "./mahjong.constants";
import { useMahjongFind, useMahjongFree } from "./mahjongFree";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { TsunagiViewport } from "./TsunagiViewport";

/** The one layout too wide for a phone's tiles to be tapped whole: the Turtle, looked at through the zoom Bridges and Tsunagi use. */
const ZOOM_FROM = 15;

/**
 * SOLVING MAHJONG: tap a free tile and then its match, or drag one onto the
 * other, or double-tap a tile to take it with its free match. Undo takes back
 * the last move, as often as asked; Shuffle, offered only when no free pair is
 * left, lays the tiles left again where they lie (`shuffleTiles`), the same
 * way every time, so the server can play the solve through when it is handed
 * in. Hint, when chosen at set-up, lights a free pair.
 *
 * The solve IS its moves (`moves.ts`): what is kept half way, what is handed
 * in, and what the tiles on the screen are read from. A run opened again is
 * played from its moves to where it was left.
 */
export function MahjongSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  hints = false,
  appearance = DEFAULT_APPEARANCE,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  hints?: boolean;
  appearance?: Appearance;
}) {
  const hydrated = useHydrated();
  const { size, givens } = puzzle;
  const layout = layoutFor(size)!;
  const geometry = geometryOf(layout);
  const rule = bonusRuleOf(givens);
  const [moves, setMoves] = useState<MahjongMove[]>(() => {
    const kept = resumed === null ? null : decodeMoves(resumed.progress, givens.length);
    return kept !== null && playSolve(size, givens, kept) !== null ? kept : [];
  });
  const [chosen, setChosen] = useState<number | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const showFree = useMahjongFree();
  const finding = useMahjongFind();
  const [pointed, setPointed] = useState<number | null>(null);

  const played = useMemo(() => playSolve(size, givens, moves) ?? { cells: givens, shuffles: 0 }, [size, givens, moves]);
  const cells = played.cells;
  const pairs = useMemo(() => freePairs(geometry, cells, rule), [geometry, cells, rule]);
  const stuck = pairs.length === 0 && !isCleared(cells);
  // Find answers for the chosen tile, else the one a mouse is over.
  const lookingAt = chosen ?? pointed;
  const found = useMemo(() => (finding && lookingAt !== null ? matchesOf(geometry, cells, rule, lookingAt) : null), [finding, lookingAt, geometry, cells, rule]);

  const { elapsedMs, done, begin, finish, pausing, hinting } = useSolve(puzzle, hasAccount, race, null, { progress: encodeMahjongProgress(moves), resumed }, hints);
  const live = done === null && !pausing.paused;

  /* A move made, from any press: the one door. The last pair clears the table and hands the solve in. */
  const play = useCallback(
    (move: MahjongMove) => {
      const at = begin();
      const next = [...moves, move];
      setMoves(next);
      setChosen(null);
      if ("pair" in move) for (const slot of move.pair) hinting.unmark(slot);
      const after = playSolve(size, givens, next);
      setSaid("shuffle" in move ? MAHJONG_COPY.shuffled : null);
      if (after !== null && isCleared(after.cells)) void finish(encodeMoves(next), at);
    },
    [begin, moves, hinting, size, givens, finish],
  );

  const take = (a: number, b: number): boolean => {
    if (!canTake(geometry, cells, rule, a, b)) return false;
    play({ pair: [a, b] });
    return true;
  };

  const tap = (slot: number) => {
    if (!live) return;
    begin();
    if (chosen === null || chosen === slot) {
      setChosen(chosen === slot ? null : slot);
      setSaid(chosen === slot ? null : MAHJONG_COPY.chosen);
      return;
    }
    if (take(chosen, slot)) return;
    // Not its match: this one is chosen instead, and the table says so.
    setChosen(slot);
    setSaid(MAHJONG_COPY.noMatch);
  };
  const pair = (from: number, to: number) => {
    if (!live) return;
    if (!take(from, to)) setSaid(MAHJONG_COPY.noMatch);
  };
  /* A double-tap takes the tile with its free match: the first one in the layout's order, where it has several. */
  const double = (slot: number) => {
    if (!live) return;
    const match = pairs.find(([a, b]) => a === slot || b === slot);
    if (match === undefined) {
      setChosen(slot);
      setSaid(MAHJONG_COPY.noMatch);
      return;
    }
    take(match[0], match[1]);
  };
  const shuffle = () => {
    if (!live || !stuck) return;
    if (shuffleTiles(geometry, cells, rule, played.shuffles) === null) {
      setSaid(MAHJONG_COPY.hopeless);
      return;
    }
    play({ shuffle: true });
  };
  const undo = () => {
    if (!live || moves.length === 0) return;
    setMoves(moves.slice(0, -1));
    setChosen(null);
    setSaid(null);
  };
  /*
   * THE CHOSEN TILE'S MATCH FIRST. John, 2026-10-01: "if you have something
   * pre-selected it helps find that pair first." With nothing chosen, any
   * free pair, as before; with a chosen tile that has no free match, another
   * pair, and the line says so.
   */
  const hint = () => {
    const found = hintFor(geometry, cells, rule, chosen);
    if (found.pair === null || !hinting.spend()) return;
    begin();
    hinting.mark([...found.pair]);
    if (found.found === "other") setSaid(MAHJONG_COPY.noFreeMatch);
  };

  const theme = BOARD_THEMES[appearance.boardTheme];
  const line = done !== null ? null : said ?? (stuck ? MAHJONG_COPY.stuck : MAHJONG_COPY.howTo);
  return (
    <section
      className={`${PLAY_SURFACE} flex flex-col gap-4`}
      data-testid="puzzle-play"
      data-kind={puzzle.kind}
      data-seed={puzzle.seed}
      data-moves={encodeMoves(moves)}
      data-pairs={pairs.map(([a, b]) => `${a}-${b}`).join(" ")}
      data-left={tilesLeft(cells)}
      {...readyMark(hydrated)}
    >
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <TsunagiViewport size={size} name="mahjong" zoomFrom={ZOOM_FROM} aspect={mahjongAspect(size)}>
          <MahjongBoard
            size={size}
            cells={cells}
            theme={theme}
            chosen={live ? chosen : null}
            hinted={[...hinting.marked]}
            found={live ? found : null}
            showFree={showFree}
            readOnly={!live}
            onTap={tap}
            onPair={pair}
            onDouble={double}
            onBlocked={() => live && setSaid(MAHJONG_COPY.blocked)}
            onPoint={setPointed}
          />
        </TsunagiViewport>
      </SolvePaused>
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={undo} disabled={moves.length === 0 || pausing.paused} data-testid="mahjong-undo">
              Undo
            </button>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={shuffle} disabled={!stuck || pausing.paused} title={stuck ? undefined : "Shuffle is for when no free pair is left"} data-testid="mahjong-shuffle">
              Shuffle
            </button>
            <SolveHint hinting={hinting} onHint={hint} disabled={pausing.paused || pairs.length === 0} racing={race !== null} />
          </div>
          <p className="min-h-10 text-sm text-muted" data-testid="mahjong-said" data-stuck={stuck ? "true" : "false"} aria-live="polite">
            {line} <span className="whitespace-nowrap">· {tilesLeft(cells)} tiles left, {pairs.length} {pairs.length === 1 ? "pair" : "pairs"} free</span>
          </p>
          <MahjongFreeToggle />
          <MahjongFindToggle />
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} />
      )}
    </section>
  );
}
