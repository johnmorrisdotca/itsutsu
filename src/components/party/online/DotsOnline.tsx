"use client";

import { AskIfAway } from "@/components/game/AskIfAway";
import { DOTS_STATUS } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import type { DotsGame } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";

import { DotsBoard } from "../DotsBoard";
import { DotsTurnLine } from "../DotsTurnLine";
import { DOTS_COPY } from "../party.constants";
import { ONLINE_COPY } from "./online.constants";
import type { OnlineBoardProps } from "./online.types";

/**
 * DOTS AND BOXES AT A TABLE ON SEVERAL DEVICES: the same turn line and board
 * the table on one device draws, the board answering a tap only on the
 * reader's own turn. A line tapped is sent; the table's answer is the board.
 */
export function DotsOnline({ game, appearance, canMove, onMove }: OnlineBoardProps<DotsGame, number>) {
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="dots-game" data-state={game.status} data-lines={game.lines.length}>
      <DotsTurnLine game={game} />
      <DotsBoard game={game} appearance={appearance} onLine={onMove} readOnly={!canMove} />
      {canMove && game.status === DOTS_STATUS.playing ? <p className="text-xs text-muted">{DOTS_COPY.tap}</p> : null}
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks (`idleWatch.coverage.test.ts`). */}
      <AskIfAway watching={canMove && game.status === DOTS_STATUS.playing} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
