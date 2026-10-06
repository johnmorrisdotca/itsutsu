"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { pawnsHome } from "@/lib/party/pachisi/pachisi";
import { PARTY_KINDS } from "@/lib/party/party.constants";

import { MarbleChip } from "../MarbleChip";
import { useKeptPachisiGame } from "./pachisiStore";
import { pachisiWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { seatedName } from "@/lib/party/partyNames";

/**
 * A GAME OF PACHISI, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in this
 * browser, so it is listed from this browser, on the Pass and play tab beside
 * the other tables' games. Only while it is not finished.
 */
export function PachisiCard() {
  const say = useSpeaker();
  const PACHISI_COPY = pachisiWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptPachisiGame();
  if (game === undefined || game === null || game.phase === "finished") return null;
  const variant = PARTY_KINDS.pachisi;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={variant}>
      <GameThumb variant={variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PARTY_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={variant} /> · {PACHISI_COPY.home4(pawnsHome(game, game.toPlay))} ·
          <MarbleChip player={game.toPlay} />
          {say.say("party.toPlay", { name: seatedName(game, game.toPlay, say) })}
        </span>
      </div>
      <Link href={passAndPlayPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
