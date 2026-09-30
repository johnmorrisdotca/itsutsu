"use client";

import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import { CARD_GAME_DISPLAY } from "@/lib/cardGames/cardGames.copy";
import { CARD_GAME_RULES } from "@/lib/cardGames/cardGameRules";
import { PlayingNow } from "@/components/layout/PlayingNow";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { PartyTableGameProps } from "../party.types";
import { CARD_ADAPTERS } from "./cardAdapters";
import { CardPlay } from "./CardPlay";
import { CardSetUp } from "./CardSetUp";
import { CARD_TABLE_STORES } from "./cardTableStores";

/**
 * A FAMILY CARD GAME PASSED ROUND THE TABLE, at /games/<slug>/pass-and-play:
 * set up first — how many, how long, who sits where — then the game, kept in
 * this browser after every move, and filed in the player's history as it
 * starts and ends (`keptRecord.ts`). Nothing is rated, and play never waits on
 * a server. Leave half way and it is here when you come back, and waiting on
 * My games meanwhile. One component for all five
 * games; what each plays is its adapter (`cardAdapters.ts`) and its rules.
 */
export function CardGameTable({ kind, appearance, gameHref }: PartyTableGameProps & { kind: CardGameKind }) {
  const hydrated = useHydrated();
  const [game, keep] = CARD_TABLE_STORES[kind].useKept();
  if (game === undefined) return <section className="min-h-[36rem]" data-testid="cards-game" {...readyMark(false)} aria-busy="true" />;
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="cards-game" data-state="set-up" data-kind={kind}>
        <CardSetUp
          kind={kind}
          appearance={appearance}
          ready={readyMark(hydrated)}
          onStart={(seed, size, players, computers) => {
            const fresh = CARD_GAME_RULES[kind].start(size, players, undefined, seed, computers);
            if (fresh !== null) keep(fresh);
          }}
        />
      </section>
    );
  }
  return (
    <>
      {/* Quiet around the table while a hand is being played (`PlayingNow`); here rather than in CardPlay, whose every edit asks for the card pictures to be re-taken. */}
      <PlayingNow on={!CARD_ADAPTERS[kind].rules.over(game)} />
      <CardPlay adapter={CARD_ADAPTERS[kind]} game={game} keep={keep} appearance={appearance} gameHref={gameHref} gameName={CARD_GAME_DISPLAY[kind].label} ready={readyMark(hydrated)} />
    </>
  );
}
