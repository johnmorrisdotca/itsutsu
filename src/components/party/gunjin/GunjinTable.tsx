"use client";

import { PlayingNow } from "@/components/layout/PlayingNow";
import { gunjinOver } from "@/lib/party/gunjin/gunjin";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { GunjinPlay } from "./GunjinPlay";
import { GunjinSetUp } from "./GunjinSetUp";
import { useKeptGunjin } from "./gunjinStore";

/**
 * GUNJIN ROUND ONE DEVICE, at /games/gunjin/pass-and-play: set up first — which
 * of the four games and who plays — then played, kept in this browser after
 * every move (`gunjinStore.ts`) and nowhere else. Or, chosen at the set-up,
 * a table on two devices, which the server keeps.
 */
export function GunjinTable({ appearance, gameHref, online }: PartyTableGameProps) {
  const hydrated = useHydrated();
  const [game, keep] = useKeptGunjin();
  // Not read yet: the server has no browser to ask, so it keeps the room the table will take and says nothing.
  if (game === undefined) return <section className="min-h-[36rem]" data-testid="gunjin-game" {...readyMark(false)} aria-busy="true" />;
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="gunjin-game" data-state="set-up">
        <GunjinSetUp appearance={appearance} ready={readyMark(hydrated)} online={online} onStart={(fresh) => keep(fresh)} />
      </section>
    );
  }
  return (
    <>
      {/* Quiet around the table while a game is played (`PlayingNow`). */}
      <PlayingNow on={!gunjinOver(game)} />
      <GunjinPlay game={game} keep={keep} appearance={appearance} gameHref={gameHref} ready={readyMark(hydrated)} />
    </>
  );
}
