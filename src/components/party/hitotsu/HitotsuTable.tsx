"use client";

import { PlayingNow } from "@/components/layout/PlayingNow";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { HitotsuPlay } from "./HitotsuPlay";
import { HitotsuSetUp } from "./HitotsuSetUp";
import { useKeptHitotsu } from "./hitotsuStore";

/**
 * HITOTSU ROUND ONE DEVICE, at /games/hitotsu/pass-and-play: set up first —
 * Classic or Party, how many, how long, who sits where and the house rules —
 * then the game, kept in this browser after every move (`hitotsuStore.ts`)
 * and nowhere else. Or, chosen at the set-up, a table on several devices,
 * which the server keeps (`onlineHitotsu.ts`).
 */
export function HitotsuTable({ appearance, gameHref, online }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptHitotsu();
  if (game === undefined) return <section className="min-h-[36rem]" data-testid="hitotsu-game" {...readyMark(false)} aria-busy="true" />;
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="hitotsu-game" data-state="set-up">
        <HitotsuSetUp appearance={appearance} ready={readyMark(hydrated)} online={online} onStart={(fresh) => keep(fresh)} />
      </section>
    );
  }
  return (
    <>
      {/* Quiet around the table while a hand is being played (`PlayingNow`). */}
      <PlayingNow on={game.phase !== "over"} />
      <HitotsuPlay game={game} keep={keep} appearance={appearance} gameHref={gameHref} ready={readyMark(hydrated)} />
    </>
  );
}
