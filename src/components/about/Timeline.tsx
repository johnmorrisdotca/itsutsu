import type { TimelineEvent, TimelineProps, Verdict } from "./about.types";

const WIDTH = 600;
const PAD = 36;
const AXIS_Y = 96;
const LANE = 26;
const DOT = 6;

/**
 * Years on a line, with a name above or below each. Drawn as SVG so it
 * follows the page's type and colours; the lanes are set by hand in the data
 * because a chart with six labels does not need a layout engine.
 */
export function Timeline({ from, to, step, events, caption, label, verdicts = false }: TimelineProps) {
  const deepest = Math.max(...events.map((e) => Math.abs(e.lane)));
  const height = AXIS_Y + LANE * deepest + 40 + (verdicts ? 18 : 0);
  const x = (year: number) => PAD + ((year - from) / (to - from)) * (WIDTH - PAD * 2);
  const ticks = [];
  for (let year = from; year <= to; year += step) ticks.push(year);

  return (
    <figure className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2" data-testid="about-timeline">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="img" aria-label={label}>
        <line x1={PAD} x2={WIDTH - PAD} y1={AXIS_Y} y2={AXIS_Y} stroke="var(--rule-strong)" strokeWidth={1.5} />
        {ticks.map((year) => (
          <g key={year}>
            <line x1={x(year)} x2={x(year)} y1={AXIS_Y - 4} y2={AXIS_Y + 4} stroke="var(--rule-strong)" />
            <text x={x(year)} y={AXIS_Y + 18} textAnchor="middle" fontSize={10} fill="var(--muted)">
              {year}
            </text>
          </g>
        ))}
        {events.map((event) => (
          <Event key={`${event.year}-${event.name}`} event={event} cx={x(event.year)} />
        ))}
        {verdicts ? <Legend y={height - 10} /> : null}
      </svg>
      <figcaption className="text-center text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

function Event({ event, cx }: { event: TimelineEvent; cx: number }) {
  const above = event.lane > 0;
  const tip = AXIS_Y - event.lane * LANE;
  const nameY = above ? tip - 6 : tip + 14;
  const noteY = above ? tip + 6 : tip + 26;
  return (
    <g>
      <line x1={cx} x2={cx} y1={AXIS_Y} y2={tip} stroke="var(--rule-strong)" strokeDasharray="2 3" />
      <Dot cx={cx} cy={AXIS_Y} verdict={event.verdict} />
      <text x={cx} y={above ? nameY - 10 : nameY} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">
        {event.name}
      </text>
      {event.note ? (
        <text x={cx} y={above ? noteY - 10 : noteY} textAnchor="middle" fontSize={10} fill="var(--muted)">
          {event.note}
        </text>
      ) : null}
    </g>
  );
}

/** A stone: black for a first-player win, white for the second, half for a draw. */
function Dot({ cx, cy, verdict }: { cx: number; cy: number; verdict?: Verdict }) {
  if (verdict === "draw") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={DOT} fill="var(--ivory)" stroke="var(--ink)" strokeWidth={1.2} />
        <path d={`M ${cx} ${cy - DOT} A ${DOT} ${DOT} 0 0 0 ${cx} ${cy + DOT} Z`} fill="var(--ink)" />
      </g>
    );
  }
  const black = verdict !== "second";
  return (
    <circle
      cx={cx}
      cy={cy}
      r={DOT}
      fill={black ? "var(--ink)" : "var(--ivory)"}
      stroke="var(--ink)"
      strokeWidth={1.2}
    />
  );
}

function Legend({ y }: { y: number }) {
  const items: { verdict: Verdict; text: string }[] = [
    { verdict: "first", text: "first player wins" },
    { verdict: "second", text: "second player wins" },
    { verdict: "draw", text: "a draw" },
  ];
  return (
    <g>
      {items.map((item, i) => {
        const cx = PAD + 10 + i * 150;
        return (
          <g key={item.verdict}>
            <Dot cx={cx} cy={y - 4} verdict={item.verdict} />
            <text x={cx + 12} y={y} fontSize={10} fill="var(--muted)">
              {item.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
