import type { RoleSummary } from "@/lib/sim/journeys.types";

import type { JourneySmallMultiplesProps } from "./journeyView.types";

const W = 220;
const H = 90;
const PAD = { left: 4, right: 4, top: 6, bottom: 6 };

/** One role's median XP and median IP across the twelve months, each on its own 0-to-its-own-max scale. */
function sparklinePaths(series: readonly number[]): string {
  const max = Math.max(1, ...series);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  return series
    .map((v, i) => {
      const px = PAD.left + (i / (series.length - 1)) * plotW;
      const py = PAD.top + (1 - v / max) * plotH;
      return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(" ");
}

function RolePanel({ summary }: { summary: RoleSummary }) {
  return (
    <figure className="flex flex-col gap-1 rounded-lg border border-rule p-2" data-testid="journey-small-multiple">
      <figcaption className="truncate text-xs font-medium text-ink" title={summary.role.name}>
        {summary.role.name}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${summary.role.name}'s median XP and IP over twelve months, each on its own scale so the SHAPE of the climb can be compared, not the size.`}
      >
        <path d={sparklinePaths(summary.medianMonthlyXpSeries)} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
        <path d={sparklinePaths(summary.medianMonthlyIpSeries)} fill="none" stroke="var(--moss)" strokeWidth={1.5} />
      </svg>
      <p className="text-[0.65rem] text-muted">
        <span className="text-ink">— XP</span> <span className="text-moss">— IP</span> · each own scale
      </p>
    </figure>
  );
}

/**
 * ONE SMALL PANEL PER ROLE (SMALL MULTIPLES), rather than one chart of
 * eighteen overlapping lines. The `dataviz` skill's own guidance for a
 * many-series line chart is to fold into "Other" or facet; eighteen roles
 * facet naturally into eighteen small panels, and it means only two colours
 * — XP and IP — are ever asked to be told apart in any one picture, which is
 * a trivial contrast rather than an eighteen-way one.
 *
 * Each panel is scaled to ITS OWN maximum, not a shared one, on purpose: the
 * point of this view is the SHAPE of a role's climb (does it ramp early and
 * flatten, or compound?), which a shared scale would flatten every low-volume
 * role into a line along the bottom of. The roles table above is where the
 * actual numbers, comparable across roles, live.
 */
export function JourneySmallMultiples({ result }: JourneySmallMultiplesProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="journey-small-multiples">
      {result.roles.map((summary) => (
        <RolePanel key={summary.role.key} summary={summary} />
      ))}
    </div>
  );
}
