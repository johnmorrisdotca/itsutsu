"use client";

import { useCallback, useMemo, useState } from "react";

import { canDouble, legalMoves, playMove, turnIsPlayed, type GameState } from "@johnmorrisdotca/sugoroku";

import type { SugorokuMove, SugorokuTable } from "@/lib/party/sugoroku/sugoroku.types";
import { rolledGame, viewOf } from "@/lib/party/sugoroku/sugorokuTable";
import { sugorokuLastRoll } from "@/lib/party/sugoroku/sugorokuWords";

import type { SugorokuHighlight, SugorokuShownDice } from "./sugoroku.types";

type Step = readonly [number, number];

/** What a person has done with the turn so far, which is nobody's until Done: this table's turn only, so a table that moves on forgets it. */
type Local = { text: string; revealed: boolean; steps: readonly Step[]; selected: number | null };

/** Where in the turn a table stands for the reader: what the page draws and which presses it offers. */
export type SugorokuPhase = "waiting" | "roll" | "move" | "answer" | "over";

export type SugorokuTurn = {
  phase: SugorokuPhase;
  /** The game with this turn's dice thrown and this turn's moves made so far, while the reader plays a turn. */
  game: GameState | null;
  dice: SugorokuShownDice | null;
  highlight: SugorokuHighlight | null;
  canRoll: boolean;
  canDouble: boolean;
  canUndo: boolean;
  canDone: boolean;
  canAnswer: boolean;
  /** Dice this turn has still to play. */
  left: number;
  /** A turn with no legal move to make: Done is all there is. */
  blocked: boolean;
  roll: () => void;
  press: (own: number | null) => void;
  undo: () => void;
  done: () => void;
  double: () => void;
  take: () => void;
  drop: () => void;
  giveUp: () => void;
};

/**
 * THE TURN A PERSON PLAYS, AS THE BOARD LETS THEM: Roll, move a checker by
 * tapping it and then where it goes, take the turn back a move at a time, and
 * Done — one move on the table, the roll and the play together, since the dice
 * are the seed's and the roll is not a throw to wait for. Nothing is sent
 * before Done, so a half-played turn is nobody's: a page left and come back to
 * has its turn to play again with the very same dice.
 *
 * Used by the table on one device and the table on several, so the two cannot
 * draw a turn differently: `canAct` says whether this page may move for the
 * seat to play, and `send` is the way a move is made.
 */
export function useSugorokuTurn(table: SugorokuTable, canAct: boolean, send: (move: SugorokuMove) => void): SugorokuTurn {
  const [kept, setKept] = useState<Local>({ text: table.text, revealed: false, steps: [], selected: null });
  const local: Local = kept.text === table.text ? kept : { text: table.text, revealed: false, steps: [], selected: null };
  const update = useCallback((change: (was: Local) => Local) => setKept((was) => change(was.text === table.text ? was : { text: table.text, revealed: false, steps: [], selected: null })), [table.text]);

  const { game } = viewOf(table);
  const base = useMemo(() => (canAct ? rolledGame(table) : null), [canAct, table]);
  // The opening roll is the first turn's dice, already thrown: nothing to press to see them.
  const revealed = local.revealed || game?.phase === "playing";
  const live = useMemo(() => {
    if (base === null || !revealed) return null;
    let at = base;
    for (const [from, to] of local.steps) at = playMove(at, { from, to });
    return at;
  }, [base, revealed, local.steps]);

  const moves = useMemo(() => (live !== null && live.phase === "playing" ? legalMoves(live) : []), [live]);
  const turnDone = live !== null && (live.phase === "over" || turnIsPlayed(live));

  const press = (own: number | null) => {
    if (live === null || live.turn === null || turnDone) return;
    update((was) => {
      if (own === null) return { ...was, selected: null };
      if (was.selected !== null && moves.some((move) => move.from === was.selected && move.to === own)) return { ...was, steps: [...was.steps, [was.selected, own]], selected: null };
      if (moves.some((move) => move.from === own)) return { ...was, selected: was.selected === own ? null : own };
      return { ...was, selected: null };
    });
  };

  const phase: SugorokuPhase =
    game === null ? "over" : !canAct ? "waiting" : game.phase === "double-offered" ? "answer" : live !== null ? "move" : "roll";

  const shown: SugorokuShownDice | null = (() => {
    if (live !== null && live.dice !== null && live.turn !== null) {
      const values = live.dice;
      // A double of two dice plays four times, two to a die; any other die is spent when the numbers left of its value are no more than the dice of that value after it.
      const perDie = live.settings.variant.doubles === "four" && values.length === 2 && values[0] === values[1] ? 2 : 1;
      const spent = values.map((value, at) => live.need.filter((need) => need === value).length <= values.slice(at + 1).filter((one) => one === value).length * perDie);
      return { side: live.turn, values, spent };
    }
    const last = sugorokuLastRoll(table);
    return last === null ? null : { side: last.side, values: last.values, spent: last.values.map(() => true) };
  })();

  const highlight: SugorokuHighlight | null =
    live !== null && live.turn !== null && !turnDone
      ? {
          side: live.turn,
          from: local.selected,
          targets: local.selected === null ? [] : moves.filter((move) => move.from === local.selected).map((move) => move.to),
          movable: [...new Set(moves.map((move) => move.from))],
        }
      : null;

  return {
    phase,
    game: live,
    dice: shown,
    highlight,
    canRoll: canAct && game?.phase === "before-roll" && !revealed,
    canDouble: canAct && game?.phase === "before-roll" && !revealed && canDouble(game),
    canUndo: live !== null && local.steps.length > 0,
    canDone: turnDone,
    canAnswer: canAct && game?.phase === "double-offered",
    left: live === null ? 0 : live.need.length,
    blocked: live !== null && live.phase === "playing" && live.need.length === 0 && local.steps.length === 0,
    roll: () => update((was) => ({ ...was, revealed: true })),
    press,
    undo: () => update((was) => ({ ...was, steps: was.steps.slice(0, -1), selected: null })),
    done: () => {
      if (turnDone) send({ t: "play", steps: local.steps });
    },
    double: () => send({ t: "double" }),
    take: () => send({ t: "take" }),
    drop: () => send({ t: "drop" }),
    giveUp: () => send({ t: "concede" }),
  };
}
