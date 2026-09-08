import type { Recency } from "@/lib/social/presence";

const MARK: Record<Exclude<Recency, null>, { glyph: string; className: string; title: string }> = {
  now: { glyph: "★", className: "text-shu", title: "Seen in the last 5 minutes" },
  recent: { glyph: "■", className: "text-moss", title: "Seen in the last 15 minutes" },
  today: { glyph: "●", className: "text-ochre", title: "Seen in the last 30 minutes" },
};

/** IYT's three marks: a red star, a green square, a blue dot — ours in the site's inks. */
export function RecencyMark({ recency }: { recency: Recency }) {
  if (recency === null) return null;
  const mark = MARK[recency];
  return (
    <span className={`text-xs ${mark.className}`} title={mark.title} aria-label={mark.title}>
      {mark.glyph}
    </span>
  );
}

export function RecencyLegend() {
  return (
    <span className="flex flex-wrap gap-3 text-xs text-muted">
      <span><span className="text-shu">★</span> 5 min</span>
      <span><span className="text-moss">■</span> 15 min</span>
      <span><span className="text-ochre">●</span> 30 min</span>
    </span>
  );
}
