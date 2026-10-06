"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { boardWords } from "@/lib/gomoku/boardWords";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import { PAIR_GO_VARIANT, pairPlayerToMove } from "@/lib/gomoku/party/pairGo";
import { passAndPlayPath } from "@/lib/gomoku/slugs";

import { useKeptPairGo } from "./pairGoStore";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { pairGoWords } from "@/components/party/partyWords";

/**
 * PAIR GO, WAITING IN MY GAMES. "Anything a person plays is kept until it is
 * finished, and waits in My games" (AGENTS.md): the game is kept in this
 * browser, so it is listed from this browser, on the Pass and play tab beside
 * the board for two and the Chinese Checkers table. Only while it is going.
 */
export function PairGoCard() {
  const say = useSpeaker();
  const PAIR_GO_COPY = pairGoWords(say.locale);
  const [game] = useKeptPairGo();
  if (game === undefined || game === null || game.state.status !== GAME_STATUS.playing) return null;
  const toMove = pairPlayerToMove(game, say);
  const { moves, settings } = game.state;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="pairgo-game">
      <GameThumb variant={PAIR_GO_VARIANT} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PAIR_GO_COPY.card}</span>
        <span className="text-sm font-medium">
          <GameName variant={PAIR_GO_VARIANT} />{say.say("party.pairgo.cardTeams")} · {boardWords(settings.variant, settings.size, say)} · {say.count("count.move", moves.length)}
          {toMove !== null ? say.say("party.pairgo.cardToPlay", { name: toMove.name, colour: stoneName(say, toMove.stone) }) : ""}
        </span>
      </div>
      <Link href={passAndPlayPath(PAIR_GO_VARIANT)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="pairgo-game-continue">
        {PAIR_GO_COPY.resume} →
      </Link>
    </div>
  );
}
