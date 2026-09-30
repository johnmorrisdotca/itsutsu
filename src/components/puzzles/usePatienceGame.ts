"use client";

import { useEffect, useReducer, useState } from "react";

/**
 * WHAT A PATIENCE GAME'S RULES GIVE ITS TABLE IN THE BROWSER (FreeCell,
 * Spider): the deal replayed, a move played, a won table known, and the moves
 * that bring the rest home once nothing is left to decide.
 */
export type PatienceRules<Table, Move> = {
  /** Every table a move list makes from the deal, the deal first, or null where it does not replay. */
  replay: (moves: string) => Table[] | null;
  decode: (moves: string) => Move[] | null;
  play: (table: Table, move: Move) => Table | null;
  won: (table: Table) => boolean;
  /** The finish from this table, or null while the player still has something to decide. */
  finish: (table: Table) => Move[] | null;
};

type Game<Table, Move> = { moves: Move[]; tables: Table[] };

type Action<Move> = { type: "play"; move: Move } | { type: "undo" };

/** How long each card of a game playing itself out waits before it moves, so the finish is seen rather than jumped to. */
const FINISH_STEP_MS = 110;

/**
 * A PATIENCE GAME IN THE BROWSER, as `useKlondikeGame` is Klondike's: the
 * deal, the moves made on it and every table they made, with Undo, and the
 * finish that plays itself (`PatienceRules.finish`) — a card at a time, or all
 * at once for a reader who asks the browser for less motion.
 *
 * A run picked up again starts from its kept moves, replayed from the deal; a
 * list that no longer replays starts the deal afresh rather than showing a
 * table that was never played.
 */
export function usePatienceGame<Table, Move>(rules: PatienceRules<Table, Move>, kept: string | null) {
  const [game, dispatch] = useReducer(
    (current: Game<Table, Move>, action: Action<Move>): Game<Table, Move> => {
      if (action.type === "undo") {
        if (current.moves.length === 0 || rules.won(current.tables[current.tables.length - 1])) return current;
        return { moves: current.moves.slice(0, -1), tables: current.tables.slice(0, -1) };
      }
      const next = rules.play(current.tables[current.tables.length - 1], action.move);
      return next === null ? current : { moves: [...current.moves, action.move], tables: [...current.tables, next] };
    },
    null,
    (): Game<Table, Move> => {
      const tables = rules.replay(kept ?? "") ?? rules.replay("")!;
      const moves = tables.length > 1 ? rules.decode(kept ?? "")! : [];
      return { moves, tables };
    },
  );
  const table = game.tables[game.tables.length - 1];
  const won = rules.won(table);
  const count = game.moves.length;

  /* The finish, worked out once on the first table that has one, and then played to its end. */
  const [plan, setPlan] = useState<{ from: number; moves: Move[] } | null>(null);
  const [finishOn, setFinishOn] = useState(true);
  const { finish } = rules;
  useEffect(() => {
    if (plan !== null || won) return;
    const moves = finish(table);
    // Set once, after the render that showed the table: a search is too slow to run inside a render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (moves !== null && moves.length > 0) setPlan({ from: count, moves });
  }, [plan, won, table, count, finish]);
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
    play: (move: Move) => dispatch({ type: "play", move }),
    undo: () => dispatch({ type: "undo" }),
    /** Hold the finish, while the game is paused. */
    holdFinish: setFinishOn,
  };
}
