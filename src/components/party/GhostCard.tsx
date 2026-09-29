"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { partyPlayerName } from "@/lib/party/partyNames";
import { GHOST_PHASE } from "@/lib/party/superghost/superghost";

import { MarbleChip } from "./MarbleChip";
import { useKeptGhostGame } from "./ghostStore";
import { GHOST_COPY, PARTY_COPY, ghostShown } from "./party.constants";

/**
 * A GAME OF SUPERGHOST, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games — a row like theirs. Only while it is going.
 * Read back without the word list, so the tab fetches nothing to show it.
 */
export function GhostCard() {
  const [game] = useKeptGhostGame();
  if (game === undefined || game === null || game.phase === GHOST_PHASE.finished) return null;
  const variant = PARTY_KINDS.superghost;
  const language = GHOST_COPY.languages[game.language].name;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={variant}>
      <GameThumb variant={variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PARTY_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={variant} /> · {language} · {game.players.length} players · {GHOST_COPY.rounds(game.rounds.length)}
          {game.fragment === "" ? null : <span data-testid="party-game-fragment">· {ghostShown(game.fragment, game.language)} ·</span>}
          <MarbleChip player={game.toPlay} />
          {partyPlayerName(game, game.toPlay)} to play
        </span>
      </div>
      <Link href={passAndPlayPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
