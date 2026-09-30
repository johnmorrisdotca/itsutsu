"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { CardDragGhost } from "@/components/cards/CardDragGhost";
import { useCardDrag } from "@/components/cards/useCardDrag";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_SURFACE, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { cardAt, cardCode } from "@/lib/cards/deck";
import { encodeMoves, homeMove, liftable, moveFor, recyclesLeft, stockMove, stuck } from "@johnmorrisdotca/toranpu/klondike";
import type { KlondikeMove, KlondikePile, TableSpot } from "@johnmorrisdotca/toranpu/klondike";
import { encodeSolitaireProgress } from "@/lib/puzzles/puzzleProgress";
import { solitaireRules } from "@/lib/puzzles/solitaire/generate";
import { solitaireScore } from "@/lib/puzzles/solitaire/scoring";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { SOLITAIRE_COPY } from "./puzzles.constants";
import { SolitaireScoreChips } from "./SolitaireSetUpOptions";
import { SolitaireTable } from "./SolitaireTable";
import { SolveDone, SolveHeader, SolvePaused, type ResumedRun, type SolveRace, useSolve } from "./solveShared";
import { useKlondikeGame } from "./useKlondikeGame";
import { useSolitaireScoring } from "./useSolitaireScoring";

/**
 * PLAYING SOLITAIRE: Klondike on the site's table, with the site's deck.
 *
 * Every face-up card can be dragged, and the cards on it go with it; or tapped,
 * and then the place it should go tapped; a second tap on a card sends it home
 * (John, 2026-09-29: "the cards are all draggable, etc."). The stock turns with
 * a tap. Undo takes a move back. Once every card on the columns is face up the
 * game brings the rest home by itself (`useKlondikeGame`).
 *
 * A game is kept as its moves (`solitaire/code.ts`), through the puzzles'
 * machinery: the clock starts on the first move, a member's game half played
 * waits in My games (`useSolve` keeps the moves), and a won game is handed in
 * once and checked on the server by replaying them (`checkSolitaire`). Nothing
 * else is sent: the deal, the rules and every move are the browser's.
 */
export function SolitaireSolve({
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
  const rules = useMemo(() => solitaireRules(puzzle.size, puzzle.level), [puzzle.size, puzzle.level]);
  const game = useKlondikeGame(puzzle.givens, rules, resumed?.progress ?? null);
  const { table, moves, tables, won } = game;
  const [picked, setPicked] = useState<TableSpot | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [scoring, setScoring] = useSolitaireScoring();

  const { startedAt, elapsedMs, done, begin, finish, runOut, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: encodeSolitaireProgress(moves), resumed }, false);
  const live = done === null && !pausing.paused;
  const theme = BOARD_THEMES[appearance.boardTheme] ?? BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];

  /* Won, by a hand or by the finish: handed in once, with the moves that won it. */
  const handedIn = useRef(false);
  useEffect(() => {
    if (!won || handedIn.current || done !== null) return;
    handedIn.current = true;
    void finish(encodeMoves(moves), Date.now());
  }, [won, done, finish, moves]);
  // The finish waits while the game is paused, and goes on when it is resumed.
  const { holdFinish } = game;
  useEffect(() => holdFinish(!pausing.paused), [pausing.paused, holdFinish]);

  /* One door for every move a person makes: the clock starts, the move is played, and whatever was picked up is put down. */
  const play = (move: KlondikeMove | null): boolean => {
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
      if (!play(moveFor(table, from as TableSpot, to as KlondikePile))) setSaid(SOLITAIRE_COPY.cannot);
    },
  });

  const lift = (spot: TableSpot, event: ReactPointerEvent<HTMLElement>) => {
    const cards = liftable(table, spot);
    if (cards.length === 0) return;
    drag.start(spot, cards.map(cardAt), event);
  };

  const press = (spot: TableSpot) => {
    if (!live || game.finishing || !drag.clickWanted()) return;
    if (spot.pile === "s") {
      play(stockMove(table));
      return;
    }
    const held = liftable(table, spot);
    const key = held.length > 0 ? `${spot.pile}:${cardCode(cardAt(held[0]))}` : "";
    /*
     * A SECOND TAP ON THE CARD JUST PICKED UP sends it home, where it can go:
     * a double tap is a pick and a quick tap again, never the tap that put a
     * card down followed by one that picks the next — that is two moves.
     */
    if (picked !== null && picked.pile === spot.pile && picked.index === spot.index) {
      if (drag.doubleTap(key) && play(homeMove(table, spot))) return;
      setPicked(null);
      setSaid(null);
      return;
    }
    if (picked !== null && play(moveFor(table, picked, spot.pile))) return;
    if (held.length > 0) {
      drag.doubleTap(key);
      setPicked(spot);
      setSaid(SOLITAIRE_COPY.picked);
    } else if (picked !== null) {
      setSaid(SOLITAIRE_COPY.cannot);
    }
  };

  const giveUp = () => {
    if (!live || startedAt === null) return;
    void runOut(encodeMoves(moves), Date.now());
  };

  const score = solitaireScore(scoring, tables, moves, won && done !== null ? done.elapsedMs : null);
  const nothingLeft = live && stuck(table);
  const left = recyclesLeft(table);
  return (
    <section className={`${PLAY_SURFACE} flex flex-col gap-3`} data-testid="puzzle-play" data-kind={puzzle.kind} data-seed={puzzle.seed} data-moves={encodeMoves(moves)} data-won={won ? "true" : "false"} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <SolitaireTable table={table} theme={theme} picked={live ? picked : null} lifted={drag.lifted as TableSpot | null} readOnly={!live} onPress={press} onLift={lift} />
      </SolvePaused>
      <CardDragGhost ghost={drag.ghost} ghostRef={drag.ghostRef} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => { game.undo(); setPicked(null); }} disabled={!live || moves.length === 0 || game.finishing} data-testid="solitaire-undo">
          Undo
        </button>
        <p className="text-sm tabular-nums" data-testid="solitaire-move-count">
          {moves.length} {moves.length === 1 ? "move" : "moves"}
        </p>
        {score === null ? null : (
          <p className="text-sm tabular-nums" data-testid="solitaire-score" data-scoring={scoring}>
            {scoring === "vegas" ? "Vegas" : "Score"} {score}
          </p>
        )}
        {done === null ? (
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} ml-auto`} onClick={giveUp} disabled={!live || startedAt === null || game.finishing} data-testid="solitaire-give-up">
            Give up
          </button>
        ) : null}
      </div>
      {done === null ? (
        <p className="min-h-10 text-sm text-muted" data-testid="solitaire-said" aria-live="polite">
          {game.finishing ? SOLITAIRE_COPY.finishing : nothingLeft ? SOLITAIRE_COPY.stuck : (said ?? `${SOLITAIRE_COPY.howTo} ${SOLITAIRE_COPY.passesLeft(left)}`)}
        </p>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} moves={moves.length} />
      )}
      <SolitaireScoreChips chosen={scoring} onChoose={setScoring} />
    </section>
  );
}
