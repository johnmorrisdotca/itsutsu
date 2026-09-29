"use client";

import { SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";

import { MarbleChip } from "../MarbleChip";
import { CARD_TABLE_COPY } from "./cardTable.constants";

/**
 * THE SCORES, one row a seat: the marble and name, the score in the game's own
 * terms (`scoreWords` says what it counts and whether fewest or most wins), and
 * a word beside it — a title, the books laid down, this deal's points. The
 * winners are marked when the game is over.
 */
export function CardScores({ names, scoreWords, standing, winners }: { names: readonly string[]; scoreWords: string; standing: (seat: number) => { score: string; note?: string }; winners: readonly number[] }) {
  return (
    <section className="flex flex-col gap-1" data-testid="cards-scores" aria-label={CARD_TABLE_COPY.scores}>
      <h2 className={SECTION_TITLE}>
        {CARD_TABLE_COPY.scores} <span className="font-normal normal-case tracking-normal">· {scoreWords}</span>
      </h2>
      <div className={TABLE_SCROLL}>
      <table className="w-full text-sm">
        <tbody>
          {names.map((name, seat) => {
            const { score, note } = standing(seat);
            return (
              <tr key={seat} className="border-t border-rule" data-testid="cards-score-row" data-seat={seat} data-won={winners.includes(seat) ? "true" : undefined}>
                <td className="py-1 pr-2">
                  <span className="flex items-center gap-1.5">
                    <MarbleChip player={seat} />
                    <span className={winners.includes(seat) ? "font-semibold" : undefined}>
                      {name}
                      {winners.includes(seat) ? " ★" : ""}
                    </span>
                  </span>
                </td>
                <td className="py-1 pr-2 text-xs text-muted">{note ?? ""}</td>
                <td className="py-1 text-right font-semibold tabular-nums">{score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </section>
  );
}
