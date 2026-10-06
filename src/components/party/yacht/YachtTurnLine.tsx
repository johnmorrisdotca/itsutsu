import { ResignedResult } from "@/components/play/ResignedResult";
import { resignedBy } from "@/lib/party/resign";
import { YACHT_BOXES } from "@/lib/party/yacht/yacht.constants";
import { YACHT_PHASES } from "@/lib/party/yacht/yacht";
import type { YachtGame } from "@/lib/party/yacht/yacht.types";

import { MarbleChip } from "../MarbleChip";
import { TrainComputerMark } from "../TrainComputerMark";
import { yachtBoxWords, yachtWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { seatedName } from "@/lib/party/partyNames";

/**
 * WHOSE TURN IT IS, WHICH ROLL, AND WHAT JUST HAPPENED: the line over the
 * tray. The player to move by marble and name (and that a computer plays
 * them), which of their three rolls this is, and the last box written.
 */
export function YachtTurnLine({ game }: { game: YachtGame }) {
  const say = useSpeaker();
  const YACHT_BOX_WORDS = yachtBoxWords(say.locale);
  const YACHT_COPY = yachtWords(say.locale);
  if (resignedBy(game) !== null) return <ResignedResult game={game} seats={game.players.length} nameOf={(seat) => seatedName(game, seat, say)} />;
  if (game.phase !== YACHT_PHASES.playing) return null;
  const seat = game.toPlay;
  const name = seatedName(game, seat, say);
  const computer = game.computers[seat];
  const last = game.last;
  const said =
    last !== null && last.move.kind === "score" && last.score !== undefined ? YACHT_COPY.wrote(seatedName(game, last.seat, say), last.score, YACHT_BOX_WORDS[YACHT_BOXES[last.move.box]].name) : "";
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
