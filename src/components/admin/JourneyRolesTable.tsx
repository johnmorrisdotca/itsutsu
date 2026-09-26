import { SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { formatCount as fmt } from "@/lib/sim/journeyFormat";

import type { JourneyRolesTableProps } from "./journeyView.types";

/**
 * ONE ROW PER ROLE: its share of the 1000, its median XP and IP at 1, 3, 6
 * and 12 months, its median level at 12 months, and its XP-to-IP ratio.
 *
 * This is the "table view" the `dataviz` skill asks for beside the scatter
 * (`JourneyScatter.tsx`) and the small multiples: the scatter shows the
 * spread of 1000 individual outcomes, coloured by group of role because
 * eighteen individual hues cannot all be told apart on one busy chart — this
 * table names every one of the eighteen roles exactly, with its numbers
 * beside it, so nothing the grouping hides on the picture is hidden here too.
 */
export function JourneyRolesTable({ result }: JourneyRolesTableProps) {
  return (
    <div className={TABLE_SCROLL}>
      <table className="w-full min-w-208 border-collapse text-sm">
        <caption className={`${SECTION_TITLE} sr-only`}>Every role, its share of the 1000, and its XP and IP at each snapshot</caption>
        <thead>
          <tr className="border-b border-rule text-left text-xs text-muted">
            <th className="py-2 pr-3 font-medium">Role</th>
            <th className="py-2 pr-3 font-medium">Players</th>
            <th className="py-2 pr-3 text-right font-medium">XP · 1mo</th>
            <th className="py-2 pr-3 text-right font-medium">XP · 3mo</th>
            <th className="py-2 pr-3 text-right font-medium">XP · 6mo</th>
            <th className="py-2 pr-3 text-right font-medium">XP · 12mo</th>
            <th className="py-2 pr-3 text-right font-medium">IP · 1mo</th>
            <th className="py-2 pr-3 text-right font-medium">IP · 3mo</th>
            <th className="py-2 pr-3 text-right font-medium">IP · 6mo</th>
            <th className="py-2 pr-3 text-right font-medium">IP · 12mo</th>
            <th className="py-2 pr-3 text-right font-medium">Level · 12mo</th>
            <th className="py-2 text-right font-medium">XP:IP</th>
          </tr>
        </thead>
        <tbody>
          {result.roles.map((summary) => (
            <tr key={summary.role.key} className="border-b border-rule/60 align-top">
              <td className="py-2 pr-3">
                <div className="font-medium text-ink">{summary.role.name}</div>
                <div className="max-w-64 text-xs text-muted">{summary.role.description}</div>
              </td>
              <td className="py-2 pr-3 tabular-nums">{summary.players}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(summary.atMonth[1].xp.p50)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(summary.atMonth[3].xp.p50)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(summary.atMonth[6].xp.p50)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(summary.atMonth[12].xp.p50)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(summary.atMonth[1].ip.p50)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(summary.atMonth[3].ip.p50)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(summary.atMonth[6].ip.p50)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt(summary.atMonth[12].ip.p50)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{summary.levelAt12.p50}</td>
              <td className="py-2 text-right tabular-nums">{summary.medianXpToIpRatio.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
