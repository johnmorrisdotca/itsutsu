import { ResignedResult } from "@/components/play/ResignedResult";
import { resignedBy } from "@/lib/party/resign";
import type { PachisiEvent, PachisiGame } from "@/lib/party/pachisi/pachisi.types";

import { MarbleChip } from "../MarbleChip";
import { TrainComputerMark } from "../TrainComputerMark";
import { pachisiWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { seatedName } from "@/lib/party/partyNames";
import type { Speaker } from "@/lib/i18n/i18n";

/** What the last move did, as a sentence: the throw, the move, a capture, a pawn home, and whether anything else could move. */
function said(game: PachisiGame, last: PachisiEvent | null, say: Speaker): string {
  const PACHISI_COPY = pachisiWords(say.locale);
  if (last === null) return "";
  const name = seatedName(game, last.seat, say);
  if (last.kind === "thirdDouble") return PACHISI_COPY.thirdDouble(name);
  const stuck = last.stuck ? ` ${PACHISI_COPY.noMove}` : "";
  if (last.kind === "rolled") return `${say.say(last.dice[0] === last.dice[1] ? "party.pachisi.rolledDouble" : "party.pachisi.rolled", { name, a: String(last.dice[0]), b: String(last.dice[1]) })}${stuck}`;
  const took = last.took === null ? "" : PACHISI_COPY.took(seatedName(game, last.took, say));
  if (last.kind === "entered") return `${PACHISI_COPY.entered(name)}${took}${stuck}`;
  return `${PACHISI_COPY.moved(name, last.by)}${took}${last.home ? PACHISI_COPY.home : ""}${stuck}`;
}

/**
 * WHOSE TURN IT IS AND WHAT JUST HAPPENED: the line over the board. The
 * player to move by marble and name (and that a computer plays them), whether
 * they are to throw or to move, and the last move said in words.
 */
export function PachisiTurnLine({ game }: { game: PachisiGame }) {
  const say = useSpeaker();
  const PACHISI_COPY = pachisiWords(say.locale);
  if (resignedBy(game) !== null) return <ResignedResult game={game} seats={game.players.length} nameOf={(seat) => seatedName(game, seat, say)} />;
  if (game.phase === "finished") return null;
  const seat = game.toPlay;
  const name = seatedName(game, seat, say);
  const computer = game.computers[seat];
  return (
    <div className="flex min-h-[3.75rem] flex-col gap-1" data-testid="pachisi-turn" data-seat={seat} data-computer={computer ? "true" : undefined} aria-live="polite">
      <p className="flex min-w-0 items-center gap-2 text-base font-semibold">
        <MarbleChip player={seat} />
        <span className="min-w-0 truncate">{computer ? PACHISI_COPY.thinking(name) : game.phase === "roll" ? PACHISI_COPY.toRoll(name) : PACHISI_COPY.toMove(name)}</span>
        {computer ? <TrainComputerMark /> : null}
      </p>
      <p className="min-h-5 text-sm text-muted" data-testid="pachisi-last">
        {said(game, game.last, say)}
      </p>
    </div>
  );
}
