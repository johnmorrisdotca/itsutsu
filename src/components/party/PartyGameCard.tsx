"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { PARTY_STATUS, partyPlayerName } from "@/lib/gomoku/party/partyRace";
import type { PartyRaceState } from "@/lib/gomoku/party/partyRace.types";
import { passAndPlayPath } from "@/lib/gomoku/slugs";

import { MarbleChip } from "./MarbleChip";
import { PARTY_COPY } from "./party.constants";
import type { PartyRaceKind } from "./party.types";

/**
 * A TABLE'S GAME, WAITING IN MY GAMES. "Anything a person plays is kept until
 * it is finished, and waits in My games" (AGENTS.md): a pass-and-play game is
 * kept in this browser, so it is listed from this browser, on the Pass and
 * play tab beside the board for two that is kept the same way — one card for
 * each kind of table with a game going. Only while it is going; a finished
 * one has nothing left to come back to.
 */
export function PartyGameCard<S extends PartyRaceState, C extends number>({ kind }: { kind: PartyRaceKind<S, C> }) {
  const [game] = kind.useKept();
  if (game === undefined || game === null || game.status !== PARTY_STATUS.playing) return null;
  const variant = kind.rules.variant;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={variant}>
      <GameThumb variant={variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PARTY_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={variant} /> · {game.players.length} players · {game.moves.length}{" "}
          {game.moves.length === 1 ? "move" : "moves"} ·
          <MarbleChip player={game.toPlay} />
          {partyPlayerName(game.players, game.toPlay)} to play
        </span>
      </div>
      <Link href={passAndPlayPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
