"use client";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { PachisiPlay } from "./PachisiPlay";
import { PachisiSetUp } from "./PachisiSetUp";
import { useKeptPachisiGame } from "./pachisiStore";

/** PACHISI ROUND ONE DEVICE, at /games/pachisi/pass-and-play: set up first, then played, kept in this browser after every move. */
export function PachisiTable({ appearance, gameHref }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptPachisiGame();
  if (game === undefined) return <section className="min-h-[32rem]" data-testid="pachisi-table" {...readyMark(false)} aria-busy="true" />;
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="pachisi-game" data-state="set-up">
        <PachisiSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} />
      </section>
    );
  }
  return <PachisiPlay game={game} keep={keep} appearance={appearance} gameHref={gameHref} />;
}
