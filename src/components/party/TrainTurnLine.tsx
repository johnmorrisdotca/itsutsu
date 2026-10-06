import { ResignedResult } from "@/components/play/ResignedResult";
import { resignedBy } from "@/lib/party/resign";
import { TRAIN_PHASES, mexicanOf, openEnd, tileOf, tileWords } from "@johnmorrisdotca/domino";
import type { TrainGame } from "@johnmorrisdotca/domino";

import { MarbleChip } from "./MarbleChip";
import { TrainComputerMark } from "./TrainComputerMark";
import { trainWords as trainScreenWords } from "@/components/party/partyWords";
import type { Speaker } from "@/lib/i18n/i18n";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { seatedName } from "@/lib/party/partyNames";

/** Where a train is, in words: "the Mexican Train", "their own train", "Ann’s train". */
function trainOf(game: TrainGame, train: number, by: number, say: Speaker): string {
  const TRAIN_COPY = trainScreenWords(say.locale);
  if (train === mexicanOf(game)) return say.say("party.train.theMexican", { train: TRAIN_COPY.mexicanTrain });
  if (train === by) return say.say("party.train.ownTrain");
  return TRAIN_COPY.their(seatedName(game, train, say));
}

/** What the last move did, in a sentence, or null before the first. */
export function lastMoveWords(game: TrainGame, say: Speaker): string | null {
  const TRAIN_COPY = trainScreenWords(say.locale);
  const last = game.last;
  if (last === null || last.move.kind === "next") return null;
  const name = seatedName(game, last.seat, say);
  switch (last.move.kind) {
    case "play":
      return TRAIN_COPY.laid(name, tileWords(last.move.tile), trainOf(game, last.move.train, last.seat, say));
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
  const say = useSpeaker();
  const TRAIN_COPY = trainScreenWords(say.locale);
  if (resignedBy(game) !== null) return <ResignedResult game={game} seats={game.players.length} nameOf={(seat) => seatedName(game, seat, say)} />;
  if (game.phase !== TRAIN_PHASES.playing) return null;
  const seat = game.toPlay;
  const name = seatedName(game, seat, say);
  const computer = game.computers[seat];
  const said = lastMoveWords(game, say);
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
          {TRAIN_COPY.cover(tileWords(tileOf(openEnd(game, waiting), openEnd(game, waiting))), waiting === mexicanOf(game) ? say.say("party.train.theMexican", { train: TRAIN_COPY.mexicanTrain }) : TRAIN_COPY.their(seatedName(game, waiting, say)))}
        </p>
      )}
    </div>
  );
}
