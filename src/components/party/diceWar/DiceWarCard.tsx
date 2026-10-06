"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { passAndPlayPath } from "@/lib/gomoku/slugs";
import { PARTY_KINDS } from "@/lib/party/party.constants";
import { diceWarSeatName } from "@/lib/party/diceWar/diceWar.constants";
import { waitsOnPerson } from "@/lib/party/diceWar/diceWarThrow";

import { useKeptDiceWarGame } from "./diceWarStore";
import { diceWarScreenWords, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A GAME OF DICE WAR, WAITING IN MY GAMES. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md): it is kept in this
 * browser, so it is listed from this browser, on the Pass and play tab beside
 * the other tables' games. Only while it is not finished.
 */
export function DiceWarCard() {
  const say = useSpeaker();
  const DICE_WAR_COPY = diceWarScreenWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const [game] = useKeptDiceWarGame();
  if (game === undefined || game === null || game.phase === "over") return null;
  const variant = PARTY_KINDS.diceWar;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="party-game" data-variant={variant}>
      <GameThumb variant={variant} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{DICE_WAR_COPY.card}</span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
          <GameName variant={variant} /> · Round {game.round}
          {waitsOnPerson(game) ? ` · ${game.players.length} players` : ` · ${diceWarSeatName(game.players, game.computers, game.rollers[0] ?? 0)} to roll`}
        </span>
      </div>
      <Link href={passAndPlayPath(variant)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="party-game-continue">
        {PARTY_COPY.resume} →
      </Link>
    </div>
  );
}
