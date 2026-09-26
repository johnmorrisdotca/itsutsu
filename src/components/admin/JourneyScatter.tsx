import { formatCount } from "@/lib/sim/journeyFormat";

import { JOURNEY_GROUPS, JOURNEY_ROLE_GROUP, type JourneyGroupKey } from "./journeyView.constants";
import type { JourneyScatterProps } from "./journeyView.types";

const WIDTH = 640;
const HEIGHT = 440;
const PAD = { left: 52, right: 16, top: 16, bottom: 40 };

/** log10(n + 1): spreads out the many low-XP, low-IP players without losing the few very high ones. */
function logScale(n: number): number {
  return Math.log10(Math.max(0, n) + 1);
}

const TICKS = [0, 10, 100, 1000, 10000, 100000, 1000000];

/**
 * ALL 1000 SIMULATED PLAYERS, ALL-TIME XP AGAINST ALL-TIME IP, ONE DOT EACH.
 *
 * Drawn on a log scale on both axes: XP and IP each span from nought to the
 * hundreds of thousands, and a linear plot would crush every Occasional and
 * Newcomer into the bottom-left corner under the Elites and Grinders.
 *
 * Coloured by GROUP OF ROLE, not by role — see `journeyView.constants.ts` for
 * why eighteen individual hues do not survive a scatter's all-pairs
 * legibility test, per the `dataviz` skill. `JourneyRolesTable` beside this
 * chart names every one of the eighteen roles exactly, with its own numbers,
 * so the grouping here hides nothing that is not shown plainly elsewhere.
 */
export function JourneyScatter({ result }: JourneyScatterProps) {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const maxXp = Math.max(1000, ...result.players.map((p) => p.xpAllTime));
  const maxIp = Math.max(1000, ...result.players.map((p) => p.ipAllTime));
  const domainX = logScale(maxXp) * 1.05;
  const domainY = logScale(maxIp) * 1.05;
  const x = (xp: number) => PAD.left + (logScale(xp) / domainX) * plotW;
  const y = (ip: number) => HEIGHT - PAD.bottom - (logScale(ip) / domainY) * plotH;

  const xTicks = TICKS.filter((t) => t === 0 || logScale(t) <= domainX);
  const yTicks = TICKS.filter((t) => t === 0 || logScale(t) <= domainY);

  return (
    <figure className="flex flex-col gap-3" data-testid="journey-scatter">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="A scatter of all 1000 simulated players, all-time experience points against all-time Itsutsu Points, both on a log scale, coloured by the kind of player. The exact numbers behind it are in the roles table above."
      >
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="var(--muted)">
              {formatCount(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x${t}`}>
            <line x1={x(t)} x2={x(t)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--rule)" strokeDasharray="2 3" />
            <text x={x(t)} y={HEIGHT - PAD.bottom + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">
              {formatCount(t)}
            </text>
          </g>
        ))}
        {result.players.map((player) => {
          const group = JOURNEY_ROLE_GROUP[player.roleKey] as JourneyGroupKey | undefined;
          const spec = group !== undefined ? JOURNEY_GROUPS[group] : undefined;
          const cx = x(player.xpAllTime);
          const cy = y(player.ipAllTime);
          if (spec === undefined) return null;
          return spec.shape === "square" ? (
            <rect key={player.index} x={cx - 2} y={cy - 2} width={4} height={4} fill={spec.light} fillOpacity={0.75} />
          ) : (
            <circle key={player.index} cx={cx} cy={cy} r={2.2} fill={spec.light} fillOpacity={0.75} />
          );
        })}
        <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" fontSize={10} fill="var(--muted)">
          all-time XP (log scale)
        </text>
        <text x={14} y={HEIGHT / 2} textAnchor="middle" fontSize={10} fill="var(--muted)" transform={`rotate(-90 14 ${HEIGHT / 2})`}>
          all-time IP (log scale)
        </text>
      </svg>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft" aria-hidden={false}>
        {(Object.entries(JOURNEY_GROUPS) as [JourneyGroupKey, (typeof JOURNEY_GROUPS)[JourneyGroupKey]][]).map(([key, spec]) => (
          <li key={key} className="flex items-center gap-1.5">
            {spec.shape === "square" ? (
              <span className="inline-block size-2.5" style={{ background: spec.light }} aria-hidden />
            ) : (
              <span className="inline-block size-2.5 rounded-full" style={{ background: spec.light }} aria-hidden />
            )}
            {spec.label}
          </li>
        ))}
      </ul>
      <figcaption className="text-xs leading-relaxed text-muted">
        Each dot is one of the 1000 simulated players. A square marks a role that never plays a two-player game (its IP comes only from
        puzzles). See the roles table above for exactly which role is which, with its own numbers.
      </figcaption>
    </figure>
  );
}
