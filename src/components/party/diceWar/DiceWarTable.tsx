"use client";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { DiceWarPlay } from "./DiceWarPlay";
import { DiceWarSetUp } from "./DiceWarSetUp";
import { useKeptDiceWarGame } from "./diceWarStore";

/**
 * DICE WAR ROUND ONE DEVICE, at /games/dice-war/pass-and-play: set up first,
 * then played, kept in this browser after every throw (`diceWarStore.ts`) and
 * nowhere else.
 */
export function DiceWarTable({ gameHref }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptDiceWarGame();

  // Not read yet: the server has no browser to ask, so it keeps the room the table will take and says nothing.
  if (game === undefined) return <section className="min-h-[32rem]" data-testid="dicewar-table" {...readyMark(false)} aria-busy="true" />;
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="dicewar-game" data-state="set-up">
        <DiceWarSetUp onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} />
      </section>
    );
  }
  return <DiceWarPlay game={game} keep={keep} gameHref={gameHref} />;
}
