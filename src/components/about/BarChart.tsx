import type { BarChartProps, FigureTone } from "./about.types";

/** The fill for each tone, from the page's own palette so the dark theme follows. */
const FILL: Record<FigureTone, string> = {
  ink: "var(--ink)",
  moss: "var(--moss)",
  shu: "var(--shu)",
  ochre: "var(--ochre)",
};

/**
 * Counts as bars, one row each, longest first as the caller orders them.
 *
 * HTML rather than SVG, unlike the timelines beside it, because every row here
 * carries words — a label and a note — and words in an SVG shrink with the
 * picture: at a phone's width a 600-unit chart prints its labels at seven
 * pixels. A row of boxes keeps the page's own type size at every width, and the
 * bar is only a width, which CSS draws for nothing.
 */
export function BarChart({ rows, caption, label }: BarChartProps) {
  const most = Math.max(1, ...rows.map((row) => row.value));
  return (
    <figure className="flex flex-col gap-2" data-testid="about-bars">
      <ol className="flex flex-col gap-2 rounded-lg border border-rule p-3" aria-label={label}>
        {rows.map((row, i) => (
          <li key={i} className="grid grid-cols-[minmax(6.5rem,10rem)_1fr] items-center gap-x-3 gap-y-0.5 text-sm">
            <span className="text-ink-soft">{row.label}</span>
            <span className="flex items-center gap-2">
              <span
                className="h-3 rounded-sm"
                style={{ width: `${Math.max(2, (row.value / most) * 100)}%`, background: FILL[row.tone ?? "moss"] }}
                aria-hidden
              />
              <span className="font-mono text-xs tabular-nums">{row.value}</span>
            </span>
            {row.note ? <span className="col-start-2 text-xs text-muted">{row.note}</span> : null}
          </li>
        ))}
      </ol>
      <figcaption className="text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}
