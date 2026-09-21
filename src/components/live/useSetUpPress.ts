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
 *  - SOMEBODY ELSE'S POSTED SEAT, which is a link and not a request: the rules
 *    agreed to there are theirs, so it goes to the doorstep to be read. That is
 *    the one case the two screens were NOT a repeat of each other, and the one
 *    case that still has two.
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
  toSeat,
  onBusy,
}: {
  /** This screen's whole address: what a remembered game is remembered against. */
  key: string;
  begin: BeginAction;
  variant: string;
  /** The doorstep for a seat somebody has already posted, or null where there is none. */
  toSeat: string | null;
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

  async function press() {
    if (made !== null) {
      router.push(made);
      return;
    }
    if (toSeat !== null) {
      onBusy(true);
      router.push(toSeat);
      return;
    }
    onBusy(true);
    setTrouble(null);
    try {
      const landed = await beginGame({ begin, variant, taking: false });
      if (typeof landed !== "string") {
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
    },
  };
}
