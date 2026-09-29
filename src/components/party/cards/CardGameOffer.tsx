"use client";

import { PlayButton } from "@/components/games/PlayButton";
import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import { CARD_GAME_RULES } from "@/lib/cardGames/cardGameRules";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { CARD_TABLE_COPY } from "./cardTable.constants";
import { CARD_TABLE_STORES } from "./cardTableStores";

/**
 * THE ONE PLAY BUTTON on a card game's own page and its rules page, under the
 * picture as every game's is (`PlayButton`), leading to the table. It reads
 * Continue while this browser holds a game not yet finished, because the
 * table opens on that game rather than a new one.
 */
export function CardGameOffer({ kind, href }: { kind: CardGameKind; href: string }) {
  const hydrated = useHydrated();
  const [game] = CARD_TABLE_STORES[kind].useKept();
  const going = game !== undefined && game !== null && !CARD_GAME_RULES[kind].over(game as never);
  return (
    <div className="flex flex-col" data-testid="party-kind-offer" data-going={going ? "true" : undefined} {...readyMark(hydrated)}>
      <PlayButton href={href} label={going ? CARD_TABLE_COPY.continue : CARD_TABLE_COPY.play} />
    </div>
  );
}
