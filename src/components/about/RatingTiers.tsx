import { Paired } from "@/components/i18n/Paired";
import type { Speaker } from "@/lib/i18n/i18n";
import { K_ESTABLISHED, K_PROVISIONAL, PROVISIONAL_BELOW, RATING_START, UNRATED_BELOW } from "@/lib/rating/elo";

/** How far the strip runs past the last boundary, so "established" has room to be read. */
const SHOWN_GAMES = PROVISIONAL_BELOW + 10;

/**
 * A rating's life in three bands, by rated games played: unrated, provisional,
 * established. The boundaries are read from `elo.ts`, the file that applies
 * them, so the picture moves when the rule does, and so are the K figures in
 * the caption.
 */
export function RatingTiers({ say }: { say: Speaker }) {
  const bands = [
    { name: say.say("about.tiers.unrated"), kanji: "未定", from: 0, to: UNRATED_BELOW, tone: "var(--rule)", note: say.say("about.tiers.unratedNote") },
    { name: say.say("about.tiers.provisional"), kanji: "仮", from: UNRATED_BELOW, to: PROVISIONAL_BELOW, tone: "var(--ochre-soft)", note: say.say("about.tiers.provisionalNote") },
    { name: say.say("about.tiers.established"), kanji: "確定", from: PROVISIONAL_BELOW, to: SHOWN_GAMES, tone: "var(--moss-soft)", note: say.say("about.tiers.establishedNote") },
  ];
  return (
    <figure className="flex flex-col gap-2" data-testid="about-rating-tiers">
      <div className="flex overflow-hidden rounded-lg border border-rule text-xs" role="img" aria-label={say.say("about.tiers.label", { unrated: String(UNRATED_BELOW), provisional: String(PROVISIONAL_BELOW) })}>
        {bands.map((band) => (
          <div
            key={band.name}
            className="flex min-w-[5.5rem] flex-col gap-0.5 border-r border-rule px-2 py-2 last:border-r-0"
            style={{ flexGrow: band.to - band.from, flexBasis: 0, background: band.tone }}
          >
            <span className="font-semibold">
              <Paired en={band.name} kanji={band.kanji} kanjiClassName="font-normal opacity-70" />
            </span>
            <span className="text-muted">
              {say.say("about.tiers.games", { range: `${band.from}${band.to === SHOWN_GAMES ? "+" : `–${band.to - 1}`}` })}
            </span>
            <span className="text-muted">{band.note}</span>
          </div>
        ))}
      </div>
      <figcaption className="text-xs leading-relaxed text-muted">
        {say.say("about.tiers.caption", { start: String(RATING_START), provisionalK: String(K_PROVISIONAL), establishedK: String(K_ESTABLISHED) })}
      </figcaption>
    </figure>
  );
}
