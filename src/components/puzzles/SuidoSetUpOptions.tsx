"use client";

import { useState } from "react";

import type { Kind } from "@johnmorrisdotca/suido";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { PuzzleAsked } from "@/lib/puzzles/puzzleAddress";

import { SUIDO_KINDS } from "./suido.constants";

/** Suido's own choice, held by the set-up (`PuzzleSetUp`): drains, the usual kind, or network. */
export function useSuidoChoice(asked: PuzzleAsked | undefined) {
  const [pipes, setPipes] = useState<Kind>(asked?.pipes ?? "drains");
  return { pipes, setPipes };
}

/**
 * SUIDO'S OWN SET-UP CHOICE, under the options: what the board asks of the
 * water. Drains is the default and what a kept board of any age was; network
 * is the other. A row of chips, and the line under it keeps the room its
 * longest wording takes, so the screen never changes height as they change.
 * The choice travels in the address until a seed is drawn, and the seed says
 * it from then on (`suidoKindOfSeed`).
 */
export function SuidoSetUpOptions({ pipes, setPipes }: ReturnType<typeof useSuidoChoice>) {
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
    </>
  );
}
