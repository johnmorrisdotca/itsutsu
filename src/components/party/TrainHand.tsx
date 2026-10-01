"use client";

import { endsOf, legalPlays, tileWords, trainPlayerName } from "@johnmorrisdotca/domino";

import { DominoFace } from "./DominoFace";
import { TRAIN_COPY } from "./party.constants";
import type { TrainHandProps } from "./train.types";
import { useTileDrag } from "./useTileDrag";

/** A hand in the order a player sorts one: by the larger end, then the smaller, highest first, so a suit of sixes sits together. */
function sorted(hand: readonly number[]): number[] {
  return [...hand].sort((a, b) => {
    const [aLow, aHigh] = endsOf(a);
    const [bLow, bHigh] = endsOf(b);
    return bHigh - aHigh || bLow - aLow;
  });
}

/** One tile standing in the hand, as an SVG of its own. */
function StandingTile({ tile }: { tile: number }) {
  return (
    <svg viewBox="0 0 10 20" className="surface-light block h-full w-full" aria-hidden="true">
      <DominoFace x={0} y={0} size={10} ends={endsOf(tile)} lie="down" />
    </svg>
  );
}

/**
 * A PLAYER'S HAND, FACE UP: every tile standing, each one a control. Drag a
 * tile onto a lit train, tap it and then the train, or tap it twice to lay it
 * where it alone fits (`useTileDrag`). On the player's turn the tiles that
 * may go somewhere are marked, and the one chosen stands a little proud.
 *
 * Only ever drawn for the one person whose hand it is: at a table of several
 * people it waits under the cover until that player says it is them.
 */
export function TrainHand({ game, seat, active, chosen, onChoose, onLay, onDragging }: TrainHandProps) {
  const plays = active ? legalPlays(game) : [];
  const targetsOf = (tile: number) => plays.filter((play) => play.tile === tile).map((play) => play.train);
  const { handlers, floating } = useTileDrag({ enabled: active, chosen, targetsOf, onChoose, onLay, onDragging });
  const hand = sorted(game.hands[seat] ?? []);

  return (
    <div className="flex flex-col gap-2" data-testid="train-hand" data-seat={seat} data-active={active ? "true" : "false"}>
      <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">{TRAIN_COPY.yourTiles(trainPlayerName(game, seat))}</p>
      <ul className="flex flex-wrap gap-1.5" aria-label={TRAIN_COPY.yourTiles(trainPlayerName(game, seat))}>
        {hand.map((tile) => {
          const targets = targetsOf(tile);
          const isChosen = chosen === tile;
          const lifted = isChosen || floating?.tile === tile;
          return (
            <li key={tile}>
              <button
                type="button"
                className={`block h-20 w-10 touch-none rounded-md transition-transform outline-none focus-visible:ring-2 focus-visible:ring-moss ${
                  lifted ? "-translate-y-1.5 ring-2 ring-moss" : ""
                } ${active && targets.length === 0 ? "opacity-55" : ""} ${floating?.tile === tile ? "opacity-30" : ""}`}
                aria-pressed={isChosen}
                aria-label={`${tileWords(tile)}${active ? (targets.length === 0 ? ", goes nowhere now" : `, goes on ${targets.length} ${targets.length === 1 ? "train" : "trains"}`) : ""}`}
                data-testid="train-hand-tile"
                data-tile={tile}
                data-targets={active ? targets.length : undefined}
                data-chosen={isChosen ? "true" : undefined}
                {...handlers(tile)}
              >
                <StandingTile tile={tile} />
              </button>
            </li>
          );
        })}
      </ul>
      {floating === null ? null : (
        <div className="pointer-events-none fixed z-50 h-20 w-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" style={{ left: floating.x, top: floating.y }} data-testid="train-dragging" aria-hidden="true">
          <StandingTile tile={floating.tile} />
        </div>
      )}
    </div>
  );
}
