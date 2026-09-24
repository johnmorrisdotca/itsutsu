import { K_ESTABLISHED, K_PROVISIONAL, PROVISIONAL_BELOW, RATING_START, UNRATED_BELOW } from "@/lib/rating/elo";

/** How far the strip runs past the last boundary, so "established" has room to be read. */
const SHOWN_GAMES = PROVISIONAL_BELOW + 10;

/**
 * A rating's life in three bands, by rated games played: unrated, provisional,
 * established. The boundaries are read from `elo.ts`, the file that applies
 * them, so the picture moves when the rule does, and so are the K figures in
 * the caption.
 */
export function RatingTiers() {
  const bands = [
    { name: "Unrated", kanji: "未定", from: 0, to: UNRATED_BELOW, tone: "var(--rule)", note: "a dash, not a number" },
    { name: "Provisional", kanji: "仮", from: UNRATED_BELOW, to: PROVISIONAL_BELOW, tone: "var(--ochre-soft)", note: "moves fast" },
    { name: "Established", kanji: "確定", from: PROVISIONAL_BELOW, to: SHOWN_GAMES, tone: "var(--moss-soft)", note: "moves slowly" },
  ];
  return (
    <figure className="flex flex-col gap-2" data-testid="about-rating-tiers">
      <div className="flex overflow-hidden rounded-lg border border-rule text-xs" role="img" aria-label={`A rating is unrated for its first ${UNRATED_BELOW} rated games, provisional until ${PROVISIONAL_BELOW}, and established after that.`}>
        {bands.map((band) => (
          <div
            key={band.name}
            className="flex min-w-[5.5rem] flex-col gap-0.5 border-r border-rule px-2 py-2 last:border-r-0"
            style={{ flexGrow: band.to - band.from, flexBasis: 0, background: band.tone }}
          >
            <span className="font-semibold">
              {band.name} <span className="font-mincho font-normal opacity-70">{band.kanji}</span>
            </span>
            <span className="text-muted">
              games {band.from}
              {band.to === SHOWN_GAMES ? "+" : `–${band.to - 1}`}
            </span>
            <span className="text-muted">{band.note}</span>
          </div>
        ))}
      </div>
      <figcaption className="text-xs leading-relaxed text-muted">
        A rating’s three stages, by the number of rated games behind it. Everybody starts at {RATING_START}; the
        number moves by up to {K_PROVISIONAL} a game while provisional and up to {K_ESTABLISHED} once
        established.
      </figcaption>
    </figure>
  );
}
