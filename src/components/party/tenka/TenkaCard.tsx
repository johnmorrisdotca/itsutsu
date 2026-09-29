"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { TENKA_PHASES, TENKA_WORLD_ROUNDS } from "@/lib/party/tenka/tenka.constants";
import { tenkaPlayerName } from "@/lib/party/tenka/tenkaTurn";

import { MarbleChip } from "../MarbleChip";
import { PARTY_COPY } from "../party.constants";
import { TENKA_COPY } from "./tenka.constants";
import { useKeptTenkaGame } from "./tenkaStore";

/**
 * A GAME OF TENKA, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games — a row like theirs. Only while it is going;
 * a finished one has nothing left to come back to.
 */
export function TenkaCard() {
  const [game] = useKeptTenkaGame();
  if (game === undefined || game === null || game.phase === TENKA_PHASES.over) return null;
  const variant = PARTY_KINDS.tenka;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={variant}>
      <GameThumb variant={variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PARTY_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={variant} /> · {game.players.length} players · {TENKA_COPY.roundOf(game.round, game.rounds, TENKA_WORLD_ROUNDS)} ·
          <MarbleChip player={game.toPlay} />
          {tenkaPlayerName(game, game.toPlay)} to play
        </span>
      </div>
      <Link href={passAndPlayPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
