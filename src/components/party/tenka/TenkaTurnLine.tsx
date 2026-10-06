"use client";

import { ResignedResult } from "@/components/play/ResignedResult";
import { resignedBy } from "@/lib/party/resign";
import type { ReactNode } from "react";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { TENKA_PHASES } from "@/lib/party/tenka/tenka.constants";
import { usePartyMarbles } from "../partyMarbles";
import type { TenkaGame } from "@/lib/party/tenka/tenka.types";
import { cardKind, cardTerritory } from "@/lib/party/tenka/tenkaCards";
import { tenkaMapOf } from "@/lib/party/tenka/tenkaMap";
import { territoriesHeld } from "@/lib/party/tenka/tenkaTurn";

import { MarbleChip } from "../MarbleChip";
import { territoryName } from "./tenkaWords";
import type { Speaker } from "@/lib/i18n/i18n";
import { marbleLabel, tenkaWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { partyPlayerName } from "@/lib/party/partyNames";


/** What the draw at the end of the last turn says: the kind and the territory of the card, or that it was wild. */
function drawLine(game: TenkaGame, say: Speaker): string {
  const draw = game.lastDraw!;
  const map = tenkaMapOf(game);
  const territory = cardTerritory(draw.card, map);
  const name = partyPlayerName(game, draw.seat, say);
  if (territory === null) return say.say("party.tenka.newsDrawWild", { name });
  const kind = say.say(({ land: "party.tenka.kindLand", sea: "party.tenka.kindSea", air: "party.tenka.kindAir", wild: "party.tenka.kindWild" } as const)[cardKind(draw.card, map)]);
  return say.say("party.tenka.newsDraw", { name, kind, territory: territoryName(map.territories[territory], say) });
}

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
  const say = useSpeaker();
  const TENKA_COPY = tenkaWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  if (resignedBy(game) !== null) return <ResignedResult game={game} seats={game.players.length} nameOf={(seat) => partyPlayerName(game, seat, say)} />;
  if (game.phase === TENKA_PHASES.over) {
    const names = game.winners.map((seat) => partyPlayerName(game, seat, say));
    const world = game.out.filter((out) => !out).length === 1;
    const held = TENKA_COPY.territories(territoriesHeld(game.owners, game.winners[0]));
    return (
      <p className={`${PANEL_CLASS} flex flex-wrap items-center gap-2 text-base font-semibold`} data-testid="tenka-winner" data-winners={game.winners.join(",")} aria-live="polite">
        <ResultMark kind={RESULT_MARKS.success} />
        {game.winners.map((seat) => (
          <MarbleChip key={seat} player={seat} />
        ))}
        <span>
          {world
            ? say.say("party.tenka.takesWorld", { name: names[0] })
            : names.length === 1
              ? say.say("party.tenka.winsCount", { name: names[0], held })
              : say.say("party.tenka.sharesCount", { names: say.joined(names), held })}
        </span>
      </p>
    );
  }
  const marble = marbles[game.toPlay];
  const news = [
    game.lastOut !== null ? say.say("party.tenka.newsOut", { by: partyPlayerName(game, game.lastOut.by, say), seat: partyPlayerName(game, game.lastOut.seat, say) }) : null,
    game.lastTrade !== null ? say.say("party.tenka.newsTrade", { name: partyPlayerName(game, game.lastTrade.seat, say), armies: TENKA_COPY.armies(game.lastTrade.armies) }) : null,
    game.lastDraw !== null && game.lastDraw.seat !== game.toPlay && game.phase === TENKA_PHASES.reinforce
      ? drawLine(game, say)
      : null,
  ].filter((line) => line !== null);
  return (
    // Above the map (`relative z-20`): the panel's blur makes it a layer of its own, and the colour's picker opens over the map from it.
    <div className={`${PANEL_CLASS} relative z-20 flex items-center gap-2 py-3`} data-testid="tenka-turn" data-player={game.toPlay} aria-live="polite">
      <MarbleChip player={game.toPlay} />
      <span className="flex min-w-0 flex-col">
        <span className="text-base">
          <span className="font-semibold" data-testid="tenka-turn-name">
            {partyPlayerName(game, game.toPlay, say)}
          </span>
          <span className="text-muted">
            {say.say("party.turnSuffix")} · {say.say("party.turnTrail", { colour: marbleLabel(marble, say.locale), letter: marble.letter })}
          </span>
        </span>
        <span className={`truncate text-sm ${news.length === 0 ? "invisible" : ""}`} data-testid="tenka-news">
          {news.length === 0 ? say.say("party.tenka.nothingYet") : news.join(" ")}
        </span>
      </span>
      {colour === null ? null : <div className="ml-auto shrink-0">{colour}</div>}
    </div>
  );
}
