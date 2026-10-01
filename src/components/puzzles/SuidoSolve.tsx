"use client";

import { useMemo, useState } from "react";

import { decodeLayout, flowOfGame, gameCode, hintFor, isGameSolved, newGame, turnAt, type Game } from "@johnmorrisdotca/suido";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { resumedGame, suidoReading, turnedToFace } from "@/lib/puzzles/suido/play";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { SUIDO_COPY, SUIDO_WAYS } from "./suido.constants";
import { SuidoBoard } from "./SuidoBoard";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { SolveHint } from "./SolveHint";
import { TsunagiViewport } from "./TsunagiViewport";

/**
 * Solving Suido: tap a piece to turn it a quarter, and watch where the water
 * goes. The puzzle is done the moment the board passes the check the server
 * runs (`checkSuidoAnswer`), which the board is held to as every piece is
 * turned (`isGameSolved` is that same test); what is handed in, and what is
 * kept half way, is the board as it stands in the package's own code
 * (`gameCode`).
 *
 * The clock starts with the first turn. A big board is looked at through the
 * zoom Tsunagi's big boards have (`TsunagiViewport`), a turn being a click that
 * the box lets through.
 */
export function SuidoSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  hints = false,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  hints?: boolean;
}) {
  const hydrated = useHydrated();
  const { kind, size, seed } = puzzle;
  const dealt = useMemo(() => newGame(puzzle.givens)!, [puzzle.givens]);
  const answer = useMemo(() => decodeLayout(puzzle.solution)!.cells, [puzzle.solution]);
  // A run picked up again starts from what it was left with, where that is this board's.
  const [game, setGame] = useState<Game>(() => (resumed === null ? null : resumedGame(dealt, resumed.progress)) ?? dealt);
  const [anticlockwise, setAnticlockwise] = useState(false);
  const [hinted, setHinted] = useState<number | null>(null);

  const { startedAt, elapsedMs, done, begin, finish, pausing, hinting } = useSolve(puzzle, hasAccount, race, null, { progress: gameCode(game), resumed }, hints);
  const live = done === null && !pausing.paused;

  /* Every change goes through here: a tap, a key, or a Hint. Solved, the board is handed in once. */
  const change = (next: Game, cell: number | null) => {
    const at = begin();
    setGame(next);
    setHinted(cell);
    if (isGameSolved(next)) void finish(gameCode(next), at);
  };
  const turn = (cell: number, by: 1 | -1) => {
    if (!live) return;
    const next = turnAt(game, cell, by);
    // Bare ground and a cross look the same turned any way: nothing happened, so nothing starts.
    if (next !== game) change(next, null);
  };
  /* Hint: the piece nearest the pump that does not face as the answer has it, turned to face so, and lit. */
  const hint = () => {
    const cell = hintFor(game, answer);
    if (cell === null || !live || !hinting.spend()) return;
    change(turnedToFace(game, cell, answer), cell);
  };

  const reading = useMemo(() => suidoReading(game, flowOfGame(game)), [game]);
  const said = SUIDO_COPY.status(reading);
  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-4`} data-testid="puzzle-play" data-kind={kind} data-seed={seed} data-code={gameCode(game)} data-solved={reading.solved ? "true" : "false"} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <TsunagiViewport size={size} name="suido">
          <SuidoBoard layout={game.start} masks={game.masks} quarters={game.quarters} hint={hinted} done={done !== null} anticlockwise={anticlockwise} onTurn={turn} />
        </TsunagiViewport>
      </SolvePaused>
      {done === null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label={SUIDO_COPY.turn} data-testid="suido-way">
              {(["clockwise", "anticlockwise"] as const).map((each) => (
                <button
                  key={each}
                  type="button"
                  role="radio"
                  aria-checked={anticlockwise === (each === "anticlockwise")}
                  className={`${PICK_WORD_CHIP} ${anticlockwise === (each === "anticlockwise") ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                  onClick={() => setAnticlockwise(each === "anticlockwise")}
                  data-testid={`suido-way-${each}`}
                >
                  {SUIDO_WAYS[each].label} <span className="font-mincho opacity-70">{SUIDO_WAYS[each].kanji}</span>
                </button>
              ))}
            </div>
            <SolveHint hinting={hinting} onHint={hint} disabled={!live} racing={race !== null} />
          </div>
          <span className="text-sm text-muted" data-testid="suido-said" data-leaks={reading.leaks} data-reached={reading.reached} aria-live="polite">
            {startedAt === null ? SUIDO_COPY.howTo : said}
          </span>
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} />
      )}
    </section>
  );
}
