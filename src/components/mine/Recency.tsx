import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import type { Recency } from "@/lib/social/presence";

const MARK: Record<Exclude<Recency, null>, { glyph: string; className: string; title: PhraseKey }> = {
  now: { glyph: "★", className: "text-shu", title: "mine.recencyNow" },
  recent: { glyph: "■", className: "text-moss", title: "mine.recencyRecent" },
  today: { glyph: "●", className: "text-ochre", title: "mine.recencyToday" },
};

/** IYT's three marks: a red star, a green square, a blue dot — ours in the site's inks. */
export function RecencyMark({ recency, say }: { recency: Recency; say: Speaker }) {
  if (recency === null) return null;
  const mark = MARK[recency];
  const title = say.say(mark.title);
  return (
    <span className={`text-xs ${mark.className}`} title={title} aria-label={title}>
      {mark.glyph}
    </span>
  );
}

export function RecencyLegend({ say }: { say: Speaker }) {
  return (
    <span className="flex flex-wrap gap-3 text-xs text-muted">
      <span><span className="text-shu">★</span> {say.say("mine.legendNow")}</span>
      <span><span className="text-moss">■</span> {say.say("mine.legendRecent")}</span>
      <span><span className="text-ochre">●</span> {say.say("mine.legendToday")}</span>
    </span>
  );
}
