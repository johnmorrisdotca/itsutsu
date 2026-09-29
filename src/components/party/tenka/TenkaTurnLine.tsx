"use client";

import type { ReactNode } from "react";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import { usePartyMarbles } from "../partyMarbles";
import type { TenkaGame } from "@/lib/party/tenka/tenka.types";
import { cardKind, cardTerritory } from "@/lib/party/tenka/tenkaCards";
import { TENKA_TERRITORIES } from "@/lib/party/tenka/tenkaMap";
import { tenkaPlayerName, territoriesHeld } from "@/lib/party/tenka/tenkaTurn";

import { MarbleChip } from "../MarbleChip";

import { TENKA_COPY } from "./tenka.constants";

/**
 * WHOSE TURN IT IS, by name, colour and letter, and what just happened that
 * the table should hear: a card drawn at the end of the last turn, a set
 * traded, a player knocked out. At the end, who won — the whole world, or the
 * most territories at the count. Always one line tall and a second kept for
 * news, so the map never moves under a finger.
 *
 * At its right end, while the game is played, the player to move's colour
 * (`colour`, the table's `PartySeatColour`): their marble and "Change colour",
 * beside the marble that says whose turn it is, rather than a panel of
 * swatches beside the map.
 */
export function TenkaTurnLine({ game, colour = null }: { game: TenkaGame; colour?: ReactNode }) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  if (game.phase === TENKA_PHASES.over) {
    const names = game.winners.map((seat) => tenkaPlayerName(game, seat));
    const world = game.out.filter((out) => !out).length === 1;
    const held = TENKA_COPY.territories(territoriesHeld(game.owners, game.winners[0]));
    return (
      <p className={`${PANEL_CLASS} flex flex-wrap items-center gap-2 text-base font-semibold`} data-testid="tenka-winner" data-winners={game.winners.join(",")} aria-live="polite">
        {game.winners.map((seat) => (
          <MarbleChip key={seat} player={seat} />
        ))}
        <span>
          {world
            ? `${names[0]} takes the world. 天下統一!`
            : names.length === 1
              ? `${names[0]} wins the count, with ${held}.`
              : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} share the win, with ${held} each.`}
        </span>
      </p>
    );
  }
  const marble = marbles[game.toPlay];
  const news = [
    game.lastOut !== null ? `${tenkaPlayerName(game, game.lastOut.by)} knocked ${tenkaPlayerName(game, game.lastOut.seat)} out and took their cards.` : null,
    game.lastTrade !== null ? `${tenkaPlayerName(game, game.lastTrade.seat)} traded a set for ${TENKA_COPY.armies(game.lastTrade.armies)}.` : null,
    game.lastDraw !== null && game.lastDraw.seat !== game.toPlay && game.phase === TENKA_PHASES.reinforce
      ? `${tenkaPlayerName(game, game.lastDraw.seat)} took a card${cardTerritory(game.lastDraw.card) === null ? " (wild)" : ` (${cardKind(game.lastDraw.card)}, ${TENKA_TERRITORIES[cardTerritory(game.lastDraw.card)!].name})`}.`
      : null,
  ].filter((line) => line !== null);
  return (
    // Above the map (`relative z-20`): the panel's blur makes it a layer of its own, and the colour's picker opens over the map from it.
    <div className={`${PANEL_CLASS} relative z-20 flex items-center gap-2 py-3`} data-testid="tenka-turn" data-player={game.toPlay} aria-live="polite">
      <MarbleChip player={game.toPlay} />
      <span className="flex min-w-0 flex-col">
        <span className="text-base">
          <span className="font-semibold" data-testid="tenka-turn-name">
            {tenkaPlayerName(game, game.toPlay)}
          </span>
          <span className="text-muted">
            {"’s turn"} · {marble.label} ({marble.letter})
          </span>
        </span>
        <span className={`truncate text-sm ${news.length === 0 ? "invisible" : ""}`} data-testid="tenka-news">
          {news.length === 0 ? "Nothing yet." : news.join(" ")}
        </span>
      </span>
      {colour === null ? null : <div className="ml-auto shrink-0">{colour}</div>}
    </div>
  );
}
