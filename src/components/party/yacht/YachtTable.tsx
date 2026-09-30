"use client";

import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { YachtPlay } from "./YachtPlay";
import { YachtSetUp } from "./YachtSetUp";
import { useKeptYachtGame } from "./yachtStore";

/**
 * YACHT ROUND ONE DEVICE, at /games/yacht/pass-and-play: set up first, then
 * played, kept in this browser after every move (`yachtStore.ts`) and nowhere
 * else.
 */
export function YachtTable({ appearance, gameHref }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptYachtGame();

  // Not read yet: the server has no browser to ask, so it keeps the room the table will take and says nothing.
  if (game === undefined) return <section className="min-h-[32rem]" data-testid="yacht-table" {...readyMark(false)} aria-busy="true" />;
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="yacht-game" data-state="set-up">
        <YachtSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} />
      </section>
    );
  }
  return <YachtPlay game={game} keep={keep} appearance={appearance} gameHref={gameHref} />;
}
