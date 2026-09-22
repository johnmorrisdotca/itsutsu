"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { beginGame, type BeginAction } from "./beginGame";
import { useGameBegunHere } from "./doorstepMemory";

/**
 * PRESSING THE SET-UP SCREEN'S ONE BUTTON.
 *
 * The screen above is about choosing; this is the press, and it has three
 * answers rather than one:
 *
 *  - THE GAME THIS ADDRESS HAS ALREADY MADE. Begin writes a game and lands on
 *    a board; Back returns here, and without this a second press buys a second
 *    game — the oldest bug a confirmation screen has. Remembered in the tab,
 *    keyed by the whole address, because "is there already a game like this
 *    one" has no honest answer on the server: two identical games against the
 *    same program are a thing somebody may legitimately want. See
 *    `doorstepMemory`, which the doorstep uses for exactly the same reason.
 *  - SOMEBODY ELSE'S POSTED SEAT, taken on the press. It went to the doorstep
 *    until 2026-09-22, "to read their rules first" — but a seat this screen
 *    matches has EXACTLY the rules the reader just chose, and the button
 *    already names who is waiting, so that page printed both a third time and
 *    made the two routes whose rules a reader never chooses three presses long.
 *    `beginGame` takes the seat; when it has gone, the second press makes the
 *    game it stood in for, which the screen says in words rather than doing in
 *    silence — see `taking`.
 *  - OTHERWISE THE GAME ITSELF, through `beginGame` — the same request the
 *    doorstep sends, from the same function, so the two cannot drift.
 *
 * `onBusy` rather than a `busy` of its own, because the screen disables every
 * control with it while the request is in flight and two sources of "busy"
 * would eventually disagree.
 */
export function useSetUpPress({
  key,
  begin,
  variant,
  onBusy,
}: {
  /** This screen's whole address: what a remembered game is remembered against. */
  key: string;
  begin: BeginAction;
  variant: string;
  onBusy: (busy: boolean) => void;
}): {
  made: string | null;
  trouble: string | null;
  press: () => void;
  /** Forget the game this address made, so a deliberate second one is still possible. */
  forget: () => void;
} {
  const router = useRouter();
  const [made, setMade] = useGameBegunHere(key);
  /*
   * What went wrong when Begin was pressed, where it did — its own state, and
   * not the screen's `problem`, which is its reading of the ADDRESS (a rematch
   * of a game that has been swept) and says nothing about a request.
   */
  const [trouble, setTrouble] = useState<string | null>(null);
  /** Whether a posted seat has already been asked for once and refused. */
  const [seatTried, setSeatTried] = useState(false);

  async function press() {
    if (made !== null) {
      router.push(made);
      return;
    }
    onBusy(true);
    setTrouble(null);
    try {
      /*
       * A seat is tried once. If it has gone, the refusal is shown and the
       * NEXT press makes the game instead — stated rather than silently done,
       * because a press that named a person must not do something else
       * without saying so. `seatTried` is what remembers the first press.
       */
      const landed = await beginGame({ begin, variant, taking: begin.kind === "sit" && !seatTried });
      if (typeof landed !== "string") {
        if (begin.kind === "sit") setSeatTried(true);
        setTrouble(landed.error);
        return;
      }
      setMade(landed);
      router.push(landed);
    } finally {
      onBusy(false);
    }
  }

  return {
    made,
    trouble,
    press: () => {
      void press();
    },
    forget: () => {
      setMade(null);
      setTrouble(null);
      setSeatTried(false);
    },
  };
}
