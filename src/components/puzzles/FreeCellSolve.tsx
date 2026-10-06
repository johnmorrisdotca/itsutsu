"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { CardDragGhost } from "@/components/cards/CardDragGhost";
import { useCardDrag } from "@/components/cards/useCardDrag";
import { PLAY_SURFACE } from "@/components/ui/ui.constants";
import { cardAt, cardCode } from "@/lib/cards/deck";
import { decodeMoves, encodeMoves, freeCellFinishingMoves, freeCellHomeMove, freeCellLiftable, freeCellMoveFor, freeCellStuck, freeCellWon, playFreeCell, replayFreeCell } from "@johnmorrisdotca/toranpu/freecell";
import type { FreeCellMove, FreeCellPile, FreeCellSpot, FreeCellTable as Table } from "@johnmorrisdotca/toranpu/freecell";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { FreeCellTable } from "./FreeCellTable";
import { PatienceControls } from "./PatienceControls";
import { freeCellCopy } from "./cardWords";
import { SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { usePatienceGame, type PatienceRules } from "./usePatienceGame";

/**
 * PLAYING FREECELL, as Solitaire is played (`SolitaireSolve`): every card can
 * be dragged with the run in order on it, or tapped and then the place it
 * should go tapped; a second tap on a card sends it home. Undo takes a move
 * back, and once every card left can go home in turn the game takes them.
 *
 * Kept as its moves (`freecell/code.ts`) through the puzzles' machinery: the
 * clock starts on the first move, a member's game half played waits in My
 * games, and a won game is handed in once and checked on the server by
 * replaying them (`checkFreeCell`).
 */
export function FreeCellSolve({
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
  const FREECELL_COPY = freeCellCopy(useSpeaker().locale);
  const hydrated = useHydrated();
  const rules = useMemo<PatienceRules<Table, FreeCellMove>>(
    () => ({ replay: (moves) => replayFreeCell(puzzle.givens, puzzle.size, moves), decode: decodeMoves, play: playFreeCell, won: freeCellWon, finish: freeCellFinishingMoves }),
    [puzzle.givens, puzzle.size],
  );
  const game = usePatienceGame(rules, resumed?.progress ?? null);
  const { table, moves, won } = game;
  const [picked, setPicked] = useState<FreeCellSpot | null>(null);
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

  const play = (move: FreeCellMove | null): boolean => {
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
      if (!play(freeCellMoveFor(table, from as FreeCellSpot, to as FreeCellPile))) setSaid(FREECELL_COPY.cannot);
    },
  });

  const lift = (spot: FreeCellSpot, event: ReactPointerEvent<HTMLElement>) => {
    const cards = freeCellLiftable(table, spot);
    if (cards.length === 0) return;
    drag.start(spot, cards.map(cardAt), event);
  };

  const press = (spot: FreeCellSpot) => {
    if (!live || game.finishing || !drag.clickWanted()) return;
    const held = freeCellLiftable(table, spot);
    const key = held.length > 0 ? `${spot.pile}:${cardCode(cardAt(held[0]))}` : "";
    // A second tap on the card just picked up sends it home, where it can go (`SolitaireSolve`).
    if (picked !== null && picked.pile === spot.pile && picked.index === spot.index) {
      if (drag.doubleTap(key) && play(freeCellHomeMove(table, spot))) return;
      setPicked(null);
      setSaid(null);
      return;
    }
    if (picked !== null && play(freeCellMoveFor(table, picked, spot.pile))) return;
    if (held.length > 0) {
      drag.doubleTap(key);
      setPicked(spot);
      setSaid(FREECELL_COPY.picked);
    } else if (picked !== null) {
      setSaid(FREECELL_COPY.cannot);
    }
  };

  const nothingLeft = live && freeCellStuck(table);
  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-3`} data-testid="puzzle-play" data-kind={puzzle.kind} data-seed={puzzle.seed} data-moves={encodeMoves(moves)} data-won={won ? "true" : "false"} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <FreeCellTable table={table} theme={theme} picked={live ? picked : null} lifted={drag.lifted as FreeCellSpot | null} readOnly={!live} onPress={press} onLift={lift} />
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
        said={game.finishing ? FREECELL_COPY.finishing : nothingLeft ? FREECELL_COPY.stuck : (said ?? FREECELL_COPY.howTo)}
      />
    </section>
  );
}
