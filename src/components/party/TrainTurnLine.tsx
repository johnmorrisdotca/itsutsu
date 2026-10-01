import { TRAIN_PHASES, mexicanOf, openEnd, tileOf, tileWords, trainPlayerName } from "@johnmorrisdotca/domino";
import type { TrainGame } from "@johnmorrisdotca/domino";

import { MarbleChip } from "./MarbleChip";
import { TRAIN_COPY } from "./party.constants";
import { TrainComputerMark } from "./TrainComputerMark";

/** Where a train is, in words: "the Mexican Train", "their own train", "Ann’s train". */
function trainWords(game: TrainGame, train: number, by: number): string {
  if (train === mexicanOf(game)) return `the ${TRAIN_COPY.mexicanTrain}`;
  if (train === by) return "their own train";
  return TRAIN_COPY.their(trainPlayerName(game, train));
}

/** What the last move did, in a sentence, or null before the first. */
export function lastMoveWords(game: TrainGame): string | null {
  const last = game.last;
  if (last === null || last.move.kind === "next") return null;
  const name = trainPlayerName(game, last.seat);
  switch (last.move.kind) {
    case "play":
      return TRAIN_COPY.laid(name, tileWords(last.move.tile), trainWords(game, last.move.train, last.seat));
    case "draw":
      return TRAIN_COPY.drew(name);
    case "pass":
      return TRAIN_COPY.passed(name);
  }
}

/**
 * WHOSE TURN IT IS, AND WHAT JUST HAPPENED: the line over the table. The
 * player to move by marble and name (and that a computer plays them), the
 * last move in a sentence, and — while a double waits to be covered — whose
 * train it is on, since nothing else may be laid until it is.
 */
export function TrainTurnLine({ game }: { game: TrainGame }) {
  if (game.phase !== TRAIN_PHASES.playing) return null;
  const seat = game.toPlay;
  const name = trainPlayerName(game, seat);
  const computer = game.computers[seat];
  const said = lastMoveWords(game);
  const waiting = game.uncovered.length === 0 ? null : game.uncovered[game.uncovered.length - 1];
  return (
    <div className="flex min-h-[4.5rem] flex-col gap-1" data-testid="train-turn" data-seat={seat} data-computer={computer ? "true" : undefined} aria-live="polite">
      <p className="flex min-w-0 items-center gap-2 text-base font-semibold">
        <MarbleChip player={seat} />
        <span className="min-w-0 truncate">{computer ? TRAIN_COPY.thinking(name) : TRAIN_COPY.turn(name)}</span>
        {computer ? <TrainComputerMark /> : null}
      </p>
      <p className="min-h-5 text-sm text-muted" data-testid="train-last">
        {said ?? ""}
      </p>
      {waiting === null ? null : (
        <p className="text-sm font-semibold text-shu" data-testid="train-cover-double">
          {TRAIN_COPY.cover(tileWords(tileOf(openEnd(game, waiting), openEnd(game, waiting))), waiting === mexicanOf(game) ? `the ${TRAIN_COPY.mexicanTrain}` : TRAIN_COPY.their(trainPlayerName(game, waiting)))}
        </p>
      )}
    </div>
  );
}
