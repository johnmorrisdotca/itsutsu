"use client";

import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { PANEL_CLASS, BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { TRAIN_PHASES, tileWords, trainMoves, trainTotals } from "@johnmorrisdotca/domino";
import type { Domino, TrainGame, TrainMove } from "@johnmorrisdotca/domino";

import { TRAIN_COPY } from "../party.constants";
import { TrainHand } from "../TrainHand";
import { TrainRoundOver, TrainScores } from "../TrainScores";
import { TrainTable } from "../TrainTable";
import { TrainTurnLine } from "../TrainTurnLine";
import { ONLINE_COPY } from "./online.constants";
import type { OnlineBoardProps } from "./online.types";

/**
 * MEXICAN TRAIN AT A TABLE ON SEVERAL DEVICES: the turn line, the trains, the
 * scores and the round's end the table on one device draws, and under them
 * the reader's own tiles — always face up, since nobody else is looking at
 * this screen, and laid from on their own turn by a drag, a tap and a tap, or
 * a double-tap, as on one device. Nobody else's tiles are drawn: the scores
 * say how many each holds. Draw and Pass are there when the rules ask for
 * them; the next round is dealt by whoever the table waits on.
 *
 * A computer's seat is played by a browser at the table (`useComputerTurn`),
 * one move at a time, by the table's own computer player.
 */
export function TrainOnline({ game, appearance, canMove, onMove, mySeat }: OnlineBoardProps<TrainGame, TrainMove>) {
  const [held, setHeld] = useState<{ turn: number; tile: Domino | null }>({ turn: -1, tile: null });
  const [dragging, setDragging] = useState<Domino | null>(null);
  const playing = game.phase === TRAIN_PHASES.playing;
  const active = canMove && playing && game.toPlay === mySeat;
  // A tile chosen is kept for the turn it was chosen on, so a move arriving from elsewhere never leaves one lifted.
  const chosen = active && held.turn === game.turn ? held.tile : null;
  const choose = (tile: Domino | null) => setHeld({ turn: game.turn, tile });
  const moves = active ? trainMoves(game) : [];
  const mustDraw = moves.length === 1 && moves[0]!.kind === "draw";
  const mustPass = moves.length === 1 && moves[0]!.kind === "pass";
  const holding = active ? (dragging ?? chosen) : null;
  const send = (move: TrainMove) => {
    if (!canMove) return;
    choose(null);
    onMove(move);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="train-game" data-state={game.phase} data-turn={game.turn} data-to-play={game.toPlay} data-moves={game.history?.count ?? 0}>
      <TrainTurnLine game={game} />
      <TrainTable game={game} appearance={appearance} holding={holding} onTrain={(train) => holding !== null && send({ kind: "play", tile: holding, train })} />
      {playing ? null : <TrainRoundOver game={game} onNext={canMove && game.phase === TRAIN_PHASES.roundOver ? () => send({ kind: "next" }) : undefined} />}
      {playing && game.hands[mySeat] !== undefined ? (
        <div className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="train-desk" data-bare-beside>
          <TrainHand game={game} seat={mySeat} active={active} chosen={chosen} onChoose={choose} onLay={(tile, train) => send({ kind: "play", tile, train })} onDragging={setDragging} />
          <p className="min-h-10 text-xs text-muted" data-testid="train-hint">
            {!active ? "" : mustDraw ? TRAIN_COPY.mustDraw : mustPass ? TRAIN_COPY.mustPass(game.drew) : chosen !== null ? TRAIN_COPY.pick(tileWords(chosen)) : TRAIN_COPY.tap}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => send({ kind: "draw" })} disabled={!mustDraw} className={`${BUTTON_BASE} ${mustDraw ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="train-draw">
              {TRAIN_COPY.draw}
            </button>
            <button type="button" onClick={() => send({ kind: "pass" })} disabled={!mustPass} className={`${BUTTON_BASE} ${mustPass ? BUTTON_STRONG : BUTTON_QUIET}`} data-testid="train-pass">
              {TRAIN_COPY.passTurn}
            </button>
          </div>
        </div>
      ) : null}
      <div data-chrome>
        <TrainScores game={game} />
      </div>
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks. */}
      <AskIfAway watching={canMove && game.phase !== TRAIN_PHASES.finished} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}

/** A seat's standing at Mexican Train: its total so far, lowest best, and the tiles it holds. */
export function trainStanding(game: TrainGame, seat: number): string {
  const tiles = game.hands[seat]?.length ?? 0;
  return `${trainTotals(game)[seat] ?? 0} points, ${tiles} ${tiles === 1 ? "tile" : "tiles"}`;
}
