import { resignedBy } from "@/lib/party/resign";
import { BUTTON_LEAD, BUTTON_STRONG, PANEL_CLASS, SECTION_HEADING, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { TRAIN_PHASES, trainPlayerName, trainTotals } from "@johnmorrisdotca/domino";
import type { TrainGame } from "@johnmorrisdotca/domino";

import { MarbleChip } from "./MarbleChip";
import { TRAIN_COPY } from "./party.constants";
import { TrainComputerMark } from "./TrainComputerMark";

/** Names in a line: "Ann", "Ann and Ben", "Ann, Ben and Cy". */
function inALine(names: readonly string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/**
 * THE TABLE OF SCORES, beside the trains: every player by marble and name, how
 * many tiles each holds (public at any table: a hand's size, never its
 * tiles), and each total so far, lowest best. The player to move is marked.
 */
export function TrainScores({ game }: { game: TrainGame }) {
  const totals = trainTotals(game);
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="train-scores">
      <h2 className={SECTION_TITLE}>
        {TRAIN_COPY.scores} <span className="font-mincho normal-case tracking-normal">得点</span>
      </h2>
      <ol className="flex flex-col gap-1">
        {game.players.map((_, seat) => (
          <li
            key={seat}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${seat === game.toPlay && game.phase === TRAIN_PHASES.playing ? "bg-rule/60 font-semibold" : ""}`}
            data-testid="train-player"
            data-player={seat}
            data-total={totals[seat]}
          >
            <MarbleChip player={seat} />
            <span className="min-w-0 flex-1 truncate">{trainPlayerName(game, seat)}</span>
            {game.computers[seat] ? <TrainComputerMark /> : null}
            <span className="shrink-0 text-xs text-muted tabular-nums">{TRAIN_COPY.tiles(game.hands[seat]?.length ?? 0)}</span>
            <span className="w-10 shrink-0 text-right tabular-nums" title={TRAIN_COPY.total}>
              {totals[seat]}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">{TRAIN_COPY.lowestWins}</p>
    </section>
  );
}

/**
 * A ROUND OVER, OR THE GAME: how it ended, every player's pips this round and
 * total, and the way on — the next round dealt, or who won. Everything is
 * face up now, as at a real table when the hands are counted.
 */
export function TrainRoundOver({ game, onNext }: { game: TrainGame; onNext?: () => void }) {
  const result = game.results.at(-1);
  if (result === undefined) return null;
  const totals = trainTotals(game);
  // A table that ended by a resignation says so in its turn line, not here.
  const finished = game.phase === TRAIN_PHASES.finished && resignedBy(game) === null;
  const winners = game.winners.map((seat) => trainPlayerName(game, seat));
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="train-round-over" data-round={game.results.length} data-finished={finished ? "true" : undefined}>
      <h2 className={SECTION_HEADING}>{TRAIN_COPY.roundOver(game.results.length)}</h2>
      <p className="text-sm" data-testid="train-round-ending">
        {result.out === null ? TRAIN_COPY.blocked : TRAIN_COPY.wentOut(trainPlayerName(game, result.out))}
      </p>
      <div className={TABLE_SCROLL}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="py-1 font-normal">Player</th>
            <th className="py-1 text-right font-normal">This round</th>
            <th className="py-1 text-right font-normal">{TRAIN_COPY.total}</th>
          </tr>
        </thead>
        <tbody>
          {game.players.map((_, seat) => (
            <tr key={seat} className="border-t border-rule" data-testid="train-round-row" data-player={seat}>
              <td className="py-1">
                <span className="flex min-w-0 items-center gap-2">
                  <MarbleChip player={seat} />
                  <span className="truncate">{trainPlayerName(game, seat)}</span>
                </span>
              </td>
              <td className="py-1 text-right tabular-nums">{TRAIN_COPY.pips(result.pips[seat])}</td>
              <td className="py-1 text-right font-semibold tabular-nums">{totals[seat]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {finished ? (
        <p className="flex items-center gap-2 text-base font-semibold" data-testid="train-winners">
          <ResultMark kind={RESULT_MARKS.success} />
          {winners.length === 1 ? TRAIN_COPY.wins(winners[0]) : TRAIN_COPY.share(inALine(winners))}
        </p>
      ) : onNext === undefined ? null : (
        // At a table on several devices only the seat to play deals the next round; everybody else is told who they wait on.
        <button type="button" onClick={onNext} className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} data-testid="train-next-round">
          {TRAIN_COPY.nextRound} →
        </button>
      )}
    </section>
  );
}
