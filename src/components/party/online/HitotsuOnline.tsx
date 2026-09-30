"use client";

import { AskIfAway } from "@/components/game/AskIfAway";
import { HITOTSU_ONE_HAND, type HitotsuGame, type HitotsuMove, hitotsuWinners } from "@johnmorrisdotca/hitotsu";

import { CardScores } from "../cards/CardScores";
import { HITOTSU_COPY } from "../hitotsu/hitotsu.constants";
import { HitotsuDesk } from "../hitotsu/HitotsuDesk";
import { hitotsuNewsLine, hitotsuStatus } from "../hitotsu/hitotsuPresses";
import { HitotsuSeats } from "../hitotsu/HitotsuSeats";
import { HitotsuTableTop } from "../hitotsu/HitotsuTableTop";
import { ONLINE_COPY } from "./online.constants";
import type { OnlineBoardProps } from "./online.types";

/**
 * HITOTSU AT A TABLE ON SEVERAL DEVICES: everybody else along the top, the
 * table in the middle, and under it the reader's own hand — always face up,
 * since nobody else is looking at this screen, and played from on their own
 * turn exactly as on one device (`HitotsuDesk`). Nobody else's cards are
 * drawn: each seat says how many it holds.
 *
 * A computer's seat is played by a browser at the table (`useComputerTurn`),
 * one move at a time, by the table's own computer player.
 */
export function HitotsuOnline({ game, appearance, canMove, onMove, mySeat }: OnlineBoardProps<HitotsuGame, HitotsuMove>) {
  const over = game.phase === "over";
  const name = (seat: number) => game.players[seat] || `Player ${seat + 1}`;
  const names = game.players.map((_, seat) => name(seat));
  const winners = hitotsuWinners(game);
  const mine = game.hands[mySeat] !== undefined;
  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="hitotsu-game" data-state={over ? "finished" : "playing"} data-moves={game.moves.length} data-to-play={game.toPlay ?? undefined} data-viewer={mine ? mySeat : undefined}>
      <div className="flex min-h-16 flex-col gap-0.5">
        <p className="text-base font-semibold" data-testid="hitotsu-status" aria-live="polite">
          {over ? `${HITOTSU_COPY.over}: ${HITOTSU_COPY.won(winners.map(name).join(" and "))}` : hitotsuStatus(game, name)}
        </p>
        <p className="text-sm text-muted" data-testid="hitotsu-news">
          {hitotsuNewsLine(game, name)}
        </p>
      </div>
      <HitotsuSeats
        seats={names.map((_, seat) => seat).filter((seat) => seat !== mySeat)}
        names={names}
        computers={game.computers}
        counts={game.hands.map((hand) => hand.length)}
        scores={game.scores}
        toPlay={over ? null : game.toPlay}
      />
      <HitotsuTableTop game={game} appearance={appearance} />
      {mine && !over ? (
        <div data-bare-beside>
          <HitotsuDesk game={game} seat={mySeat} active={canMove && game.toPlay === mySeat} label={HITOTSU_COPY.yourHand} name={name} onMove={(move) => canMove && onMove(move)} />
        </div>
      ) : null}
      <div data-chrome>
        <CardScores names={names} scoreWords={game.size === HITOTSU_ONE_HAND ? HITOTSU_COPY.handWords : HITOTSU_COPY.scoreWords} standing={(seat) => ({ score: String(game.scores[seat]) })} winners={winners} />
      </div>
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every board a person plays on asks. */}
      <AskIfAway watching={canMove && !over} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}

/** A seat's standing at Hitotsu: its points so far and the cards it holds. */
export function hitotsuStanding(game: HitotsuGame, seat: number): string {
  return `${game.scores[seat] ?? 0} points · ${HITOTSU_COPY.cards(game.hands[seat]?.length ?? 0)}`;
}
