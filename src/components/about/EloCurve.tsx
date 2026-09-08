/**
 * The expected score of a player against an opponent, by the difference in
 * their ratings: the whole of Elo in one curve. Drawn as SVG from the formula
 * itself, so the chart cannot disagree with the text beside it.
 */
const WIDTH = 560;
const HEIGHT = 230;
const PAD = { left: 44, right: 16, top: 16, bottom: 34 };
const SPAN = 400;

const expected = (difference: number) => 1 / (1 + 10 ** (-difference / 400));

export function EloCurve() {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (d: number) => PAD.left + ((d + SPAN) / (2 * SPAN)) * plotW;
  const y = (e: number) => PAD.top + (1 - e) * plotH;
  const points = Array.from({ length: 81 }, (_, i) => -SPAN + i * 10);
  const path = points.map((d, i) => `${i === 0 ? "M" : "L"} ${x(d).toFixed(1)} ${y(expected(d)).toFixed(1)}`).join(" ");
  const marks = [-400, -200, -100, 0, 100, 200, 400];

  return (
    <figure className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2" data-testid="about-elo-curve">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="The expected score against an opponent, from a 400-point deficit to a 400-point lead: a smooth S-curve through one half at equal ratings.">
        {[0, 0.25, 0.5, 0.75, 1].map((e) => (
          <g key={e}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(e)} y2={y(e)} stroke="var(--rule)" />
            <text x={PAD.left - 6} y={y(e) + 3} textAnchor="end" fontSize={10} fill="var(--muted)">
              {Math.round(e * 100)}%
            </text>
          </g>
        ))}
        {marks.map((d) => (
          <g key={d}>
            <line x1={x(d)} x2={x(d)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--rule)" strokeDasharray="2 3" />
            <text x={x(d)} y={HEIGHT - PAD.bottom + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">
              {d > 0 ? `+${d}` : d}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--moss)" strokeWidth={2.5} />
        {[-200, 0, 200].map((d) => (
          <g key={d}>
            <circle cx={x(d)} cy={y(expected(d))} r={4} fill="var(--ink)" />
            <text x={x(d) + 8} y={y(expected(d)) - 6} fontSize={10} fill="var(--ink)">
              {Math.round(expected(d) * 100)}%
            </text>
          </g>
        ))}
        <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" fontSize={10} fill="var(--muted)">
          your rating minus theirs
        </text>
      </svg>
      <figcaption className="text-center text-xs leading-relaxed text-muted">
        What Elo expects of you. Equal ratings: half a point a game. Two hundred points ahead: three wins in four.
        Four hundred ahead: nine in ten. Beat the expectation and your rating rises by the shortfall times K.
      </figcaption>
    </figure>
  );
}
