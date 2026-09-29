"use client";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import { boardWords } from "@/lib/gomoku/boardWords";
import { GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { PAIR_GO_VARIANT, pairPlayerToMove } from "@/lib/gomoku/party/pairGo";
import { passAndPlayPath } from "@/lib/gomoku/slugs";

import { PAIR_GO_COPY } from "./pairGo.constants";
import { useKeptPairGo } from "./pairGoStore";

/**
 * PAIR GO, WAITING IN MY GAMES. "Anything a person plays is kept until it is
 * finished, and waits in My games" (AGENTS.md): the game is kept in this
 * browser, so it is listed from this browser, on the Pass and play tab beside
 * the board for two and the Chinese Checkers table. Only while it is going.
 */
export function PairGoCard() {
  const [game] = useKeptPairGo();
  if (game === undefined || game === null || game.state.status !== GAME_STATUS.playing) return null;
  const toMove = pairPlayerToMove(game);
  const { moves, settings } = game.state;
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="pairgo-game">
      <GameThumb variant={PAIR_GO_VARIANT} size="small" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{PAIR_GO_COPY.card}</span>
        <span className="text-sm font-medium">
          <GameName variant={PAIR_GO_VARIANT} />, two teams of two · {boardWords(settings.variant, settings.size)} · {moves.length}{" "}
          {moves.length === 1 ? "move" : "moves"}
          {toMove !== null ? ` · ${toMove.name} (${STONE_DISPLAY[toMove.stone].label}) to play` : ""}
        </span>
      </div>
      <Link href={passAndPlayPath(PAIR_GO_VARIANT)} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid="pairgo-game-continue">
        {PAIR_GO_COPY.resume} →
      </Link>
    </div>
  );
}
