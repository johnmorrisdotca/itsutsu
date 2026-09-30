"use client";

import { useEffect, useReducer, useState } from "react";

import { allFaceUp, decodeMoves, finishingMoves, klondikeWon, playKlondike, replay } from "@johnmorrisdotca/toranpu/klondike";
import type { KlondikeMove, KlondikeRules, KlondikeTable } from "@johnmorrisdotca/toranpu/klondike";

/** A game as it stands: every move made, and every table they made, the deal first. */
type Game = { moves: KlondikeMove[]; tables: KlondikeTable[] };

type Action = { type: "play"; move: KlondikeMove } | { type: "undo" };

function reduce(game: Game, action: Action): Game {
  if (action.type === "undo") {
    if (game.moves.length === 0 || klondikeWon(game.tables[game.tables.length - 1])) return game;
    return { moves: game.moves.slice(0, -1), tables: game.tables.slice(0, -1) };
  }
  const next = playKlondike(game.tables[game.tables.length - 1], action.move);
  return next === null ? game : { moves: [...game.moves, action.move], tables: [...game.tables, next] };
}

/** How long each card of a game playing itself out waits before it goes home, so the finish is seen rather than jumped to. */
const FINISH_STEP_MS = 110;

/**
 * A KLONDIKE GAME IN THE BROWSER: the deal, the moves made on it and every
 * table they made, with Undo, and the finish that plays itself once every card
 * is face up (`finishingMoves`) — a card at a time, or all at once for a reader
 * who asks the browser for less motion.
 *
 * A run picked up again starts from its kept moves, replayed from the deal; a
 * list that no longer replays (a deal changed under it) starts the deal afresh
 * rather than showing a table that was never played.
 */
export function useKlondikeGame(deal: string, rules: KlondikeRules, kept: string | null) {
  const [game, dispatch] = useReducer(reduce, null, (): Game => {
    const tables = replay(deal, rules, kept ?? "") ?? replay(deal, rules, "")!;
    const moves = tables.length > 1 ? decodeMoves(kept ?? "")! : [];
    return { moves, tables };
  });
  const table = game.tables[game.tables.length - 1];
  const won = klondikeWon(table);
  const count = game.moves.length;

  /*
   * THE FINISH, worked out once, on the first table where every card shows,
   * and then played to its end. Worked out again after every card it moved, a
   * fresh search from a table half brought home can miss the line the first
   * one found, and the game stopped with cards still out (found by the spec
   * that plays a whole game, 2026-09-29).
   */
  const [plan, setPlan] = useState<{ from: number; moves: KlondikeMove[] } | null>(null);
  const [finishOn, setFinishOn] = useState(true);
  useEffect(() => {
    if (plan !== null || won || !allFaceUp(table)) return;
    const moves = finishingMoves(table);
    // Set once, after the render that showed the last card: the search is too slow to run inside a render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (moves !== null && moves.length > 0) setPlan({ from: count, moves });
  }, [plan, won, table, count]);
  useEffect(() => {
    if (plan === null || !finishOn || won) return;
    const next = plan.moves[count - plan.from];
    if (next === undefined) return;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    if (reduced) {
      for (const move of plan.moves.slice(count - plan.from)) dispatch({ type: "play", move });
      return;
    }
    const timer = window.setTimeout(() => dispatch({ type: "play", move: next }), FINISH_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [plan, finishOn, won, count]);

  return {
    moves: game.moves,
    tables: game.tables,
    table,
    won,
    /** Whether the game is bringing its last cards home by itself. */
    finishing: plan !== null && !won,
    play: (move: KlondikeMove) => dispatch({ type: "play", move }),
    undo: () => dispatch({ type: "undo" }),
    /** Hold the finish, while the game is paused. */
    holdFinish: setFinishOn,
  };
}
