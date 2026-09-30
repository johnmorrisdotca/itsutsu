import { YACHT_BOXES } from "@/lib/party/yacht/yacht.constants";
import { YACHT_PHASES, yachtPlayerName } from "@/lib/party/yacht/yacht";
import type { YachtGame } from "@/lib/party/yacht/yacht.types";

import { MarbleChip } from "../MarbleChip";
import { TrainComputerMark } from "../TrainComputerMark";
import { YACHT_BOX_WORDS, YACHT_COPY } from "./yacht.constants";

/**
 * WHOSE TURN IT IS, WHICH ROLL, AND WHAT JUST HAPPENED: the line over the
 * tray. The player to move by marble and name (and that a computer plays
 * them), which of their three rolls this is, and the last box written.
 */
export function YachtTurnLine({ game }: { game: YachtGame }) {
  if (game.phase !== YACHT_PHASES.playing) return null;
  const seat = game.toPlay;
  const name = yachtPlayerName(game, seat);
  const computer = game.computers[seat];
  const last = game.last;
  const said =
    last !== null && last.move.kind === "score" && last.score !== undefined ? YACHT_COPY.wrote(yachtPlayerName(game, last.seat), last.score, YACHT_BOX_WORDS[YACHT_BOXES[last.move.box]].name) : "";
  return (
    <div className="flex min-h-[3.75rem] flex-col gap-1" data-testid="yacht-turn" data-seat={seat} data-computer={computer ? "true" : undefined} aria-live="polite">
      <p className="flex min-w-0 items-center gap-2 text-base font-semibold">
        <MarbleChip player={seat} />
        <span className="min-w-0 truncate">{computer ? YACHT_COPY.thinking(name) : YACHT_COPY.turn(name, game.rolls)}</span>
        {computer ? <TrainComputerMark /> : null}
      </p>
      <p className="min-h-5 text-sm text-muted" data-testid="yacht-last">
        {said}
      </p>
    </div>
  );
}
