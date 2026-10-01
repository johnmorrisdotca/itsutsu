import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { namesAndTagsOf } from "@/lib/xp/nameTagsOf";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import type { LevelFastest } from "@/lib/puzzles/server/tsunagiRecords";

import { SolveTime } from "./SolveTime";

/**
 * THE FASTEST ON ONE LEVEL, under the board, for any game of fixed levels. A
 * level is one board for everybody, so its times are one race run apart: this
 * is that race's leaderboard, each member once at their best. An empty board is
 * data — its headings and a line saying nobody has solved it yet.
 *
 * The rows are read by the game (`tsunagiLevelFastest`, `suidoLevelFastest`),
 * since each keeps its levels its own way; the table, its words and its test
 * ids (`<prefix>-level-fastest`) are one component. `where` is the size as a
 * reader says it ("7×7").
 */
export async function LevelFastestTable({ prefix, kind, level, where, rows }: { prefix: string; kind: PuzzleKind; level: number; where: string; rows: LevelFastest[] }) {
  // The play page is behind the invite gate, so whoever reads this is a player here.
  const { names, tags } = await namesAndTagsOf(rows.map((row) => row.memberId));
  return (
    <section className={`${PANEL_CLASS} mx-auto flex w-full max-w-xl flex-col gap-2`} data-testid={`${prefix}-level-fastest`}>
      <h2 className={SECTION_TITLE}>
        Fastest on level {level} <span className="font-mincho normal-case tracking-normal">最速</span>
      </h2>
      <div className={TABLE_SCROLL}>
        <table className="w-full text-sm">
          <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
            <tr>
              <th className="py-1 pr-2 text-left">#</th>
              <th className="py-1 pr-2 text-left">Time</th>
              <th className="py-1 text-left">Player</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-t border-rule">
                <td colSpan={3} className="py-1 text-muted" data-testid={`${prefix}-level-fastest-nobody`}>
                  Nobody has solved level {level} at {where} yet. The first time here is the one to beat.
                </td>
              </tr>
            ) : (
              rows.map((row, at) => (
                <tr key={row.memberId} className="border-t border-rule" data-testid={`${prefix}-level-fastest-row`}>
                  <td className="py-1 pr-2 tabular-nums">{at + 1}</td>
                  <td className="py-1 pr-2 font-mono tabular-nums">
                    {/* The time opens that solve, as every puzzle time does (`SolveTime`). */}
                    <SolveTime kind={kind} solveId={row.id} elapsedMs={row.elapsedMs} />
                  </td>
                  <td className="py-1">
                    <PlayerName name={names.get(row.memberId) ?? ""} memberId={row.memberId} fallback="A member" tag={tags.get(row.memberId)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
