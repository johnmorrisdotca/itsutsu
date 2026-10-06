"use client";

import { useMemo } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { EndGameButton, GameEnding } from "@/components/play/GameEnding";
import { gunjinDrawOfferedTo, gunjinOver } from "@/lib/party/gunjin/gunjin";
import { GUNJIN_BOARDS } from "@/lib/party/gunjin/gunjin.constants";
import type { GunjinGame, GunjinMove } from "@/lib/party/gunjin/gunjin.types";
import { gunjinFinalView, gunjinSeatView } from "@/lib/party/gunjin/gunjinView";
import { partyPlayerName } from "@/lib/party/partyNames";

import { GUNJIN_COPY } from "../gunjin/gunjin.constants";
import { GunjinArrange } from "../gunjin/GunjinArrange";
import { GunjinBoard } from "../gunjin/GunjinBoard";
import { GunjinDrawAnswer, GunjinDrawOffer, GunjinDrawWaiting, GunjinResult } from "../gunjin/GunjinDraw";
import { GunjinMoving, MovesPanel } from "../gunjin/GunjinMoving";
import { ONLINE_COPY } from "./online.constants";
import type { OnlineBoardProps } from "./online.types";

/**
 * GUNJIN AT A TABLE ON TWO DEVICES: the same screens the table on one device
 * draws — the arranging of a side (`GunjinArrange`) and the board with its moves
 * (`GunjinMoving`) — for the reader's own seat, with no hand-over to make since
 * nobody shares a phone. The game it is given is already the game as THIS seat
 * may see it (`seatState`), sent by the server, so nothing here could draw a
 * rank it was not sent. The other seat's moves arrive at the poll.
 */
export function GunjinOnline({ game, appearance, canMove, onMove, mySeat }: OnlineBoardProps<GunjinGame, GunjinMove>) {
  const seat = (mySeat === 1 ? 1 : 0) as 0 | 1;
  const { match } = game;
  const over = gunjinOver(game);
  const names = [partyPlayerName(game, 0), partyPlayerName(game, 1)];
  const board = GUNJIN_BOARDS[game.size]!;
  // A side that has arranged and waits for the other: its own arrangement, drawn as the draft, and nothing else.
  const waitingView = useMemo(() => gunjinSeatView(game, seat).view, [game, seat]);
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="gunjin-game" data-state={over ? "finished" : "playing"} data-phase={match.phase} data-viewer={seat} data-to-play={over ? undefined : match.currentPlayer}>
      {over ? (
        <>
          <GunjinBoard
            view={gunjinFinalView(game)!}
            appearance={appearance}
            label={GUNJIN_COPY.boardLabel(board.name)}
            last={match.log.at(-1)?.from !== undefined && match.log.at(-1)?.to !== undefined ? { from: match.log.at(-1)!.from!, to: match.log.at(-1)!.to! } : null}
          />
          <GunjinResult game={game} names={names} />
          <div data-chrome>
            <MovesPanel game={game} names={names} note={GUNJIN_COPY.finalNote} />
          </div>
        </>
      ) : match.phase === "setup" && match.currentPlayer === seat ? (
        <GunjinArrange key={match.setupStep} game={game} appearance={appearance} framed={false} busy={!canMove} onFinish={(placements) => onMove({ kind: "setup", placements })} />
      ) : match.phase === "setup" ? (
        <div className="flex min-w-0 flex-col gap-3" data-testid="gunjin-waiting">
          <GunjinBoard view={waitingView} appearance={appearance} label={GUNJIN_COPY.boardLabel(board.name)} draft={waitingView.ownSetup ?? undefined} testId="gunjin-waiting-board" />
          <p className="text-sm font-semibold" data-testid="gunjin-waiting-note">
            {GUNJIN_COPY.waitingToArrange(names[match.currentPlayer]!)}
          </p>
        </div>
      ) : (
        <>
          {/* A draw offered to this seat is answered before the board, or by a move, which declines it. */}
          {canMove && gunjinDrawOfferedTo(game) === seat ? <GunjinDrawAnswer game={game} names={names} onAccept={() => onMove({ kind: "accept-draw" })} onDecline={() => onMove({ kind: "decline-draw" })} /> : null}
          <GunjinDrawWaiting game={game} names={names} seat={seat} />
          <GunjinMoving game={game} seat={seat} names={names} appearance={appearance} framed={false} active={canMove && match.currentPlayer === seat} onMove={(from, to) => onMove({ kind: "move", from, to })} />
          {/* The seat to move may give the game up or offer the other a draw: the shared row, quiet in just the board. */}
          {canMove && match.phase === "play" ? (
            <GameEnding testId="gunjin-ending">
              <EndGameButton onEnd={() => onMove({ kind: "resign" })} testId="gunjin-resign" />
              <GunjinDrawOffer game={game} names={names} onOffer={() => onMove({ kind: "offer-draw" })} />
            </GameEnding>
          ) : null}
        </>
      )}
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks. */}
      <AskIfAway watching={canMove && !over} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}
