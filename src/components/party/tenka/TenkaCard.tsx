"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { TENKA_PHASES, TENKA_WORLD_ROUNDS } from "@/lib/party/tenka/tenka.constants";

import { MarbleChip } from "../MarbleChip";
import { useKeptTenkaGame } from "./tenkaStore";
import { partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { tenkaRoundLine } from "./tenkaWords";
import { partyPlayerName } from "@/lib/party/partyNames";

/**
 * A GAME OF TENKA, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in
 * this browser, so it is listed from this browser, on the Pass and play tab
 * beside the other tables' games — a row like theirs. Only while it is going;
 * a finished one has nothing left to come back to.
 */
export function TenkaCard() {
  const say = useSpeaker();
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptTenkaGame();
  if (game === undefined || game === null || game.phase === TENKA_PHASES.over) return null;
  const variant = PARTY_KINDS.tenka;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={variant}>
      <GameThumb variant={variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PARTY_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={variant} /> · {say.count("count.player", game.players.length)} · {tenkaRoundLine(say, game.round, game.rounds, TENKA_WORLD_ROUNDS)} ·
          <MarbleChip player={game.toPlay} />
          {say.say("party.toPlay", { name: partyPlayerName(game, game.toPlay, say) })}
        </span>
      </div>
      <Link href={passAndPlayPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
