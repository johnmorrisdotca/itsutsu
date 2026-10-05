"use client";

import { useState } from "react";

import type { Kind } from "@johnmorrisdotca/suido";

import type { SuidoSquares } from "@/lib/puzzles/suido/seed";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { PuzzleAsked } from "@/lib/puzzles/puzzleAddress";

import { SUIDO_KINDS, SUIDO_SQUARES, SUIDO_SQUARES_LIST } from "./suido.constants";

/**
 * Suido's own choices, held by the set-up (`PuzzleSetUp`): drains, the usual kind, or network; and whether some pieces are big or turn in blocks. Squares make a
 * network, so choosing them chooses Network, and choosing Drains takes them off: the last choice made wins, and neither is ever disabled.
 */
export function useSuidoChoice(asked: PuzzleAsked | undefined) {
  const [pipes, setPipesOnly] = useState<Kind>(asked?.pipes ?? "drains");
  const [squares, setSquaresOnly] = useState<SuidoSquares>(asked?.squares ?? "none");
  const setPipes = (next: Kind) => {
    setPipesOnly(next);
    if (next === "drains") setSquaresOnly("none");
  };
  const setSquares = (next: SuidoSquares) => {
    setSquaresOnly(next);
    if (next !== "none") setPipesOnly("network");
  };
  return { pipes, setPipes, squares, setSquares };
}

/**
 * SUIDO'S OWN SET-UP CHOICE, under the options: what the board asks of the
 * water. Drains is the default and what a kept board of any age was; network
 * is the other. A row of chips, and the line under it keeps the room its
 * longest wording takes, so the screen never changes height as they change.
 * The choice travels in the address until a seed is drawn, and the seed says
 * it from then on (`suidoKindOfSeed`). Under it, whether some pieces are big
 * (`suidoSquaresOfSeed`): the same, a second row and a second line that keep the
 * room their longest wording takes.
 */
export function SuidoSetUpOptions({ pipes, setPipes, squares, setSquares }: ReturnType<typeof useSuidoChoice>) {
  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Kind of board" data-testid="suido-kind">
        {(["drains", "network"] as const).map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={pipes === each}
            className={`${PICK_WORD_CHIP} ${pipes === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setPipes(each)}
            data-testid={`suido-kind-${each}`}
          >
            {SUIDO_KINDS[each].label} <span className="font-mincho opacity-70">{SUIDO_KINDS[each].kanji}</span>
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="suido-kind-blurb">
        {SUIDO_KINDS[pipes].blurb}
      </p>
      <div className="grid grid-cols-2 gap-1.5 pt-1 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Pieces" data-testid="suido-squares">
        {SUIDO_SQUARES_LIST.map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={squares === each}
            className={`${PICK_WORD_CHIP} ${squares === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setSquares(each)}
            data-testid={`suido-squares-${each}`}
          >
            {SUIDO_SQUARES[each].label} <span className="font-mincho opacity-70">{SUIDO_SQUARES[each].kanji}</span>
          </button>
        ))}
      </div>
      <p className="min-h-12 text-xs text-muted" data-testid="suido-squares-blurb">
        {SUIDO_SQUARES[squares].blurb}
      </p>
    </>
  );
}
