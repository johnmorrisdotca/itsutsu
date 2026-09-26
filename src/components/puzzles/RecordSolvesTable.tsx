import Link from "@/components/ui/Link";

import { PlayerName } from "@/components/players/PlayerName";
import { TABLE_SCROLL } from "@/components/ui/ui.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import type { RecordSolve } from "@/lib/puzzles/server/puzzleRecord";

import { sizeWord } from "./puzzles.constants";
import { OneSolvePoints } from "./SolvePoints";
import { SolveTime } from "./SolveTime";
import type { NameTag } from "@/lib/xp/nameTag.types";

/**
 * The rows of a puzzle's record: who, which size and level, the time (the way
 * into that solve), its points, and when. Drawn with its headings when it is
 * empty, as every empty table here is, with the way in beside it.
 *
 * `counted` marks the rows a member's points were made of, when the record is
 * one member's — so the figure a board linked from can be read off the rows.
 */
export function RecordSolvesTable({
  kind,
  solves,
  names,
  tags,
  me,
  counted,
  filtered,
}: {
  kind: PuzzleKind;
  solves: readonly RecordSolve[];
  names: ReadonlyMap<string, string>;
  /** The flag, badge and level beside each name, read with the names. */
  tags: ReadonlyMap<string, NameTag>;
  me: string | null;
  counted: ReadonlySet<string> | null;
  /** Whether a filter is on, which changes what an empty table says. */
  filtered: boolean;
}) {
  return (
    <div className={TABLE_SCROLL}>
      <table className="w-full text-sm" data-testid="record-solves">
        <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
          <tr>
            <th className="py-1 pr-2 text-left">Player</th>
            <th className="py-1 pr-2 text-left">Puzzle</th>
            <th className="py-1 pr-2 text-left">Time</th>
            <th className="py-1 pr-2 text-right">Points</th>
            <th className="py-1 text-left">When</th>
          </tr>
        </thead>
        <tbody>
          {solves.length === 0 ? (
            <tr className="border-t border-rule">
              <td colSpan={5} className="py-2 text-muted" data-testid="record-empty">
                {filtered ? "No solves match what this record is narrowed to. " : "Nobody has solved this here yet. "}
                <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
                  {filtered ? "Play one →" : "Be the first →"}
                </Link>
              </td>
            </tr>
          ) : (
            solves.map((solve) => {
              const mine = solve.memberId === me;
              return (
                <tr key={solve.id} className="border-t border-rule" data-testid="record-solve" data-solve={solve.id} data-member={solve.memberId} data-counted={counted?.has(solve.id) ? "true" : undefined}>
                  <td className="py-1 pr-2">
                    <PlayerName name={names.get(solve.memberId) ?? ""} memberId={solve.memberId} fallback="A member" tag={tags.get(solve.memberId)} />
                  </td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    {sizeWord(solve.size, kind)} <span className="text-muted">{PUZZLE_LEVEL_DISPLAY[solve.level]?.label.toLowerCase() ?? solve.level}</span>
                  </td>
                  <td className="py-1 pr-2 whitespace-nowrap">
                    <SolveTime kind={kind} solveId={solve.id} elapsedMs={solve.elapsedMs} mine={mine} testId="record-solve-time" />
                    {solve.solved ? null : <span className="ml-1 text-xs text-muted">not found</span>}
                    {solve.guesses === null || !solve.solved ? null : <span className="ml-1 text-xs text-muted tabular-nums">{guessesText(solve.guesses)}</span>}
                    {solve.raceId === null ? null : <span className="ml-1 text-xs text-muted">race</span>}
                  </td>
                  <td className="py-1 pr-2 text-right whitespace-nowrap">
                    {counted?.has(solve.id) ? (
                      <span className="mr-1 text-xs text-muted" title="Counted in the points above" data-testid="record-solve-counted">
                        ★
                      </span>
                    ) : null}
                    {/* This one solve's points, and so the way into it, like its time. */}
                    <OneSolvePoints kind={kind} solveId={solve.id} points={solve.points} mine={mine} testId="record-solve-points" />
                  </td>
                  <td className="py-1 whitespace-nowrap text-muted">{solve.finishedAt.toISOString().slice(0, 10)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
