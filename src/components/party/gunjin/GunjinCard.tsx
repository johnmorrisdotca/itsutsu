"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { gunjinBoardOf } from "@/lib/party/gunjin/gunjin.constants";
import { gunjinOver, gunjinToPlay } from "@/lib/party/gunjin/gunjin";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { partyPlayerName } from "@/lib/party/partyNames";

import { PARTY_COPY } from "../party.constants";
import { GUNJIN_COPY } from "./gunjin.constants";
import { useKeptGunjin } from "./gunjinStore";

/**
 * A GAME OF GUNJIN, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games. Only while it is not finished. It names
 * whose turn it is and nothing of the board, which is nobody else's to see.
 */
export function GunjinCard() {
  const [game] = useKeptGunjin();
  if (game === undefined || game === null || gunjinOver(game)) return null;
  const variant = PARTY_KINDS.gunjin;
  const to = gunjinToPlay(game);
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={variant}>
      <GameThumb variant={variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{GUNJIN_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={variant} /> · {gunjinBoardOf(game.size)?.name}
          {to === null ? "" : ` · ${partyPlayerName(game, to)} to play`}
        </span>
      </div>
      <Link href={passAndPlayPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
