"use client";

import { useState } from "react";

import { Board } from "@/components/board/Board";
import { AskIfAway } from "@/components/game/AskIfAway";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { canPass } from "@/lib/gomoku/engine";
import { GAME_STATUS, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { pairPlayerToMove } from "@/lib/gomoku/party/pairGo";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";
import { pairSeatStone, type PairGoMove } from "@/lib/party/online/onlinePairGo";

import { PairGoTurnLine, teamWords } from "../PairGoStatus";
import { PAIR_GO_COPY } from "../pairGo.constants";
import { ONLINE_COPY } from "./online.constants";
import type { OnlineBoardProps } from "./online.types";

/**
 * PAIR GO AT A TABLE ON SEVERAL DEVICES: the turn line and the site's own
 * `Board` that Pair Go on one device draws, the board answering a tap only on
 * the reader's own turn, and Pass and Resign offered then too. A stone, a
 * pass or a resignation is sent, and the table's answer is the board.
 */
export function PairGoOnline({ game, appearance, canMove, onMove }: OnlineBoardProps<PairGoGame, PairGoMove>) {
  const [confirming, setConfirming] = useState(false);
  const playing = game.state.status === GAME_STATUS.playing;
  const toMove = pairPlayerToMove(game);
  const send = (move: PairGoMove) => {
    setConfirming(false);
    onMove(move);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="pairgo" data-state={game.state.status} data-moves={game.state.moves.length} data-size={game.state.settings.size}>
      <PairGoTurnLine game={game} appearance={appearance} />
      <Board state={game.state} appearance={appearance} readOnly={!canMove || !playing} onPlay={(point) => send({ kind: "stone", row: point.row, col: point.col })} viewer={null} />
      {canMove && playing ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => send({ kind: "pass" })} disabled={!canPass(game.state)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="pairgo-pass">
            {PAIR_GO_COPY.pass}
          </button>
          {confirming && toMove !== null ? (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="pairgo-confirm-resign">
              <span>{PAIR_GO_COPY.confirmResign(teamWords(game, toMove.stone))}</span>
              <button type="button" onClick={() => send({ kind: "resign" })} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="pairgo-resign-yes">
                {PAIR_GO_COPY.resignYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                {PAIR_GO_COPY.confirmNo}
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="pairgo-resign">
              {PAIR_GO_COPY.resign}
            </button>
          )}
        </div>
      ) : null}
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks (`idleWatch.coverage.test.ts`). */}
      <AskIfAway watching={canMove && playing} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}

/** A seat's standing at Pair Go: the colour it plays, and that colour's captures. */
export function pairGoStanding(game: PairGoGame, seat: number): string {
  const stone = pairSeatStone(seat);
  return `${STONE_DISPLAY[stone].label} · ${game.state.captures[stone]} captured`;
}
