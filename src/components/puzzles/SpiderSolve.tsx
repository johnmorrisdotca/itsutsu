"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { CardDragGhost } from "@/components/cards/CardDragGhost";
import { useCardDrag } from "@/components/cards/useCardDrag";
import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { cardAt, cardCode } from "@/lib/cards/deck";
import { COLUMNS, decodeMoves, encodeMoves, playSpider, replaySpider, spiderBestMove, spiderDealMove, spiderFinishingMoves, spiderLiftable, spiderMoveFor, spiderStuck, spiderWon } from "@johnmorrisdotca/toranpu/spider";
import type { SpiderMove, SpiderSpot, SpiderTable as Table } from "@johnmorrisdotca/toranpu/spider";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PatienceControls } from "./PatienceControls";
import { SPIDER_COPY } from "./puzzles.constants";
import { SpiderTable } from "./SpiderTable";
import { SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { usePatienceGame, type PatienceRules } from "./usePatienceGame";

/**
 * PLAYING SPIDER, as Solitaire is played (`SolitaireSolve`): every face-up
 * card can be dragged with the run of its own suit on it, or tapped and then
 * the column it should go on tapped; a second tap moves the run to the best
 * column that takes it (`spiderBestMove`). A tap on the stock deals. Undo
 * takes a move back, and once every card is dealt and face up the game puts
 * the rest in order by itself, where it can.
 *
 * Kept as its moves (`spider/code.ts`) through the puzzles' machinery: the
 * clock starts on the first move, a member's game half played waits in My
 * games, and a won game is handed in once and checked on the server by
 * replaying them (`checkSpider`).
 */
export function SpiderSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
  appearance?: Appearance;
}) {
  const hydrated = useHydrated();
  const rules = useMemo<PatienceRules<Table, SpiderMove>>(
    () => ({ replay: (moves) => replaySpider(puzzle.givens, puzzle.size, moves), decode: decodeMoves, play: playSpider, won: spiderWon, finish: spiderFinishingMoves }),
    [puzzle.givens, puzzle.size],
  );
  const game = usePatienceGame(rules, resumed?.progress ?? null);
  const { table, moves, won } = game;
  const [picked, setPicked] = useState<SpiderSpot | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  const { startedAt, elapsedMs, done, begin, finish, runOut, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: encodeMoves(moves), resumed }, false);
  const live = done === null && !pausing.paused;
  const theme = BOARD_THEMES[appearance.boardTheme] ?? BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];

  /* Won, by a hand or by the finish: handed in once, with the moves that won it. */
  const handedIn = useRef(false);
  useEffect(() => {
    if (!won || handedIn.current || done !== null) return;
    handedIn.current = true;
    void finish(encodeMoves(moves), Date.now());
  }, [won, done, finish, moves]);
  const { holdFinish } = game;
  useEffect(() => holdFinish(!pausing.paused), [pausing.paused, holdFinish]);

  const play = (move: SpiderMove | null): boolean => {
    if (move === null || !live || game.finishing) return false;
    begin();
    game.play(move);
    setPicked(null);
    setSaid(null);
    return true;
  };

  const drag = useCardDrag({
    disabled: !live || game.finishing,
    onDrop: (from, to) => {
      if (to === null) return;
      if (!play(spiderMoveFor(table, from as SpiderSpot, to))) setSaid(SPIDER_COPY.cannot);
    },
  });

  const lift = (spot: SpiderSpot, event: ReactPointerEvent<HTMLElement>) => {
    const cards = spiderLiftable(table, spot);
    if (cards.length === 0) return;
    drag.start(spot, cards.map(cardAt), event);
  };

  const press = (spot: SpiderSpot) => {
    if (!live || game.finishing || !drag.clickWanted()) return;
    if (spot.pile === "s") {
      if (!play(spiderDealMove(table)) && table.stock.length > 0) setSaid(SPIDER_COPY.cannotDeal);
      return;
    }
    const held = spiderLiftable(table, spot);
    const key = held.length > 0 ? `${spot.pile}:${cardCode(cardAt(held[0]))}` : "";
    // A second tap on the card just picked up moves its run where it fits best (`spiderBestMove`).
    if (picked !== null && picked.pile === spot.pile && picked.index === spot.index) {
      if (drag.doubleTap(key) && play(spiderBestMove(table, spot))) return;
      setPicked(null);
      setSaid(null);
      return;
    }
    if (picked !== null && play(spiderMoveFor(table, picked, spot.pile))) return;
    if (held.length > 0) {
      drag.doubleTap(key);
      setPicked(spot);
      setSaid(SPIDER_COPY.picked);
    } else if (picked !== null) {
      setSaid(SPIDER_COPY.cannot);
    }
  };

  const nothingLeft = live && spiderStuck(table);
  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-3`} data-testid="puzzle-play" data-kind={puzzle.kind} data-seed={puzzle.seed} data-moves={encodeMoves(moves)} data-won={won ? "true" : "false"} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <SpiderTable table={table} theme={theme} picked={live ? picked : null} lifted={drag.lifted as SpiderSpot | null} readOnly={!live} onPress={press} onLift={lift} />
      </SolvePaused>
      <CardDragGhost ghost={drag.ghost} ghostRef={drag.ghostRef} />
      <PatienceControls
        puzzle={puzzle}
        hasAccount={hasAccount}
        race={race}
        done={done}
        moves={moves.length}
        canUndo={live && moves.length > 0 && !game.finishing}
        onUndo={() => {
          game.undo();
          setPicked(null);
        }}
        canGiveUp={live && startedAt !== null && !game.finishing}
        onGiveUp={() => void runOut(encodeMoves(moves), Date.now())}
        extra={SPIDER_COPY.dealsLeft(table.stock.length / COLUMNS)}
        said={game.finishing ? SPIDER_COPY.finishing : nothingLeft ? SPIDER_COPY.stuck : (said ?? SPIDER_COPY.howTo)}
      />
    </section>
  );
}
