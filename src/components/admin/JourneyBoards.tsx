import { SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { formatCount as fmt } from "@/lib/sim/journeyFormat";
import type { BoardRow } from "@/lib/sim/journeys.types";

import type { JourneyBoardsProps } from "./journeyView.types";

function roleName(result: JourneyBoardsProps["result"], key: string): string {
  return result.roles.find((r) => r.role.key === key)?.role.name ?? key;
}

function BoardTable({ title, unit, rows, result }: { title: string; unit: string; rows: readonly BoardRow[]; result: JourneyBoardsProps["result"] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={SECTION_TITLE}>{title}</h3>
      <div className={TABLE_SCROLL}>
        <table className="w-full min-w-72 border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-xs text-muted">
              <th className="py-1.5 pr-2 font-medium">#</th>
              <th className="py-1.5 pr-2 font-medium">Simulated player</th>
              <th className="py-1.5 text-right font-medium">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank} className="border-b border-rule/60">
                <td className="py-1.5 pr-2 tabular-nums text-muted">{row.rank}</td>
                <td className="py-1.5 pr-2">
                  #{row.index} · {roleName(result, row.roleKey)}
                </td>
                <td className="py-1.5 text-right tabular-nums">{fmt(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * THE TWO BOARDS THIS MONTH: IP and XP, side by side, so it is plain at a
 * glance how differently they rank the same 1000 players. IP is IN-MONTH gain
 * (the last of the twelve simulated months), the way a real monthly IP race
 * would read it — see `docs/plans/points/README.md`, "all time and this
 * month, the month starting at 00:00 UTC on the 1st."
 */
export function JourneyBoards({ result }: JourneyBoardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <BoardTable title="Top 10 this month — IP" unit="IP gained" rows={result.ipTop10ThisMonth} result={result} />
      <BoardTable title="Top 10 this month — XP" unit="XP gained" rows={result.xpTop10ThisMonth} result={result} />
    </div>
  );
}
