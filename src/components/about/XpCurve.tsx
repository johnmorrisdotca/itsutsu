import { LEVEL_MILESTONES } from "@/lib/xp/levelLadder";
import { xpLevelName } from "@/lib/xp/levelNames";
import { XP_LEVELS, xpForLevel } from "@/lib/xp/xpCurve";

const WIDTH = 560;
const HEIGHT = 250;
const PAD = { left: 52, right: 18, top: 18, bottom: 34 };

/**
 * A whole number with its thousands marked, the same on the server and in the
 * browser. Not `toLocaleString`: the two can disagree about the separator, and
 * `localTime.coverage.test.ts` keeps it out of anything a page draws.
 */
export const thousands = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** The share of the whole ladder the last ten rungs cost, read from the table. */
export const LAST_TEN_SHARE = (xpForLevel(XP_LEVELS) - xpForLevel(XP_LEVELS - 10)) / xpForLevel(XP_LEVELS);

/**
 * THE XP LADDER, drawn from the table that prices it.
 *
 * Total experience needed to stand on each level, 1 to the top, with the
 * milestone rungs named. Read from `xpForLevel` at render, never copied: the
 * curve is held as a table precisely so it can be retuned, and a picture of
 * last month's curve is the stale-figure fault this page is built to avoid.
 */
export function XpCurve() {
  const top = xpForLevel(XP_LEVELS);
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (level: number) => PAD.left + ((level - 1) / (XP_LEVELS - 1)) * plotW;
  const y = (xp: number) => PAD.top + (1 - xp / top) * plotH;
  const levels = Array.from({ length: XP_LEVELS }, (_, i) => i + 1);
  const line = levels.map((l, i) => `${i === 0 ? "M" : "L"} ${x(l).toFixed(1)} ${y(xpForLevel(l)).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(XP_LEVELS)} ${y(0)} L ${x(1)} ${y(0)} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => Math.round(share * top));

  return (
    <figure className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2" data-testid="about-xp-curve">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`Total experience needed for each level from 1 to ${XP_LEVELS}: nearly flat for the first twenty levels, then climbing ever more steeply to ${thousands(top)} at the top.`}
      >
        {ticks.map((xp) => (
          <g key={xp}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(xp)} y2={y(xp)} stroke="var(--rule)" />
            <text x={PAD.left - 6} y={y(xp) + 3} textAnchor="end" fontSize={10} fill="var(--muted)">
              {xp === 0 ? "0" : `${Math.round(xp / 1000)}k`}
            </text>
          </g>
        ))}
        {[1, 10, 20, 50, 90, XP_LEVELS].map((level) => (
          <text key={level} x={x(level)} y={HEIGHT - PAD.bottom + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">
            {level}
          </text>
        ))}
        <rect
          x={x(XP_LEVELS - 10)}
          y={PAD.top}
          width={x(XP_LEVELS) - x(XP_LEVELS - 10)}
          height={plotH}
          fill="var(--ochre-soft)"
        />
        <path d={area} fill="var(--moss-soft)" />
        <path d={line} fill="none" stroke="var(--moss)" strokeWidth={2.5} />
        {LEVEL_MILESTONES.map((level, i) => {
          const cx = x(level);
          const cy = y(xpForLevel(level));
          const left = level === XP_LEVELS;
          return (
            <g key={level}>
              <circle cx={cx} cy={cy} r={4} fill="var(--ink)" />
              <text
                x={left ? cx - 8 : cx - 4}
                y={cy - 10 - (i % 2) * 12}
                textAnchor={left ? "end" : "start"}
                fontSize={10}
                fill="var(--ink)"
              >
                {level} · {xpLevelName(level)}
              </text>
            </g>
          );
        })}
        <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" fontSize={10} fill="var(--muted)">
          level
        </text>
      </svg>
      <figcaption className="text-center text-xs leading-relaxed text-muted">
        Total XP to stand on each level, with the milestone rungs named. The shaded band is the last ten levels, which
        cost {Math.round(LAST_TEN_SHARE * 100)}% of the whole climb to {thousands(top)}.
      </figcaption>
    </figure>
  );
}
