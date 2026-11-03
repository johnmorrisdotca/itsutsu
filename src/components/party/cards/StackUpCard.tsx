import type { CardId } from "@/lib/cardGames/cardGames.types";

/**
 * A CARD OF STACK UP'S OWN DECK, drawn here: the deck has no suits, so the standard faces cannot draw it. A number is a
 * number on a field coloured by its third (1 to 4 blue, 5 to 8 green, 9 to 12 red), a wild is gold with a star. In the
 * card's 100 by 140 box, like every card on the site.
 */
const FIELD = { low: "#2b5f9e", mid: "#2f7d4f", high: "#b23a3a", wild: "#b88a1a" } as const;

/** What a card of Stack Up says: its number, or that it is wild. */
export function stackUpValue(card: CardId): number {
  return card === "nw" ? 0 : Number.parseInt(card.slice(1), 10);
}

/** One card, as wide as its parent makes it and 7/5 as tall; `null` is the draw pile's back. */
export function StackUpFace({ card, label }: { card: CardId | null; label: string }) {
  if (card === null) {
    return (
      <svg viewBox="0 0 100 140" className="block h-full w-full" role="img" aria-label={label}>
        <rect x="2" y="2" width="96" height="136" rx="10" fill="#33415c" stroke="#f4f0e6" strokeWidth="3" />
        <rect x="12" y="12" width="76" height="116" rx="6" fill="none" stroke="#f4f0e6" strokeOpacity=".4" strokeWidth="1.5" />
      </svg>
    );
  }
  const value = stackUpValue(card);
  const field = value === 0 ? FIELD.wild : value <= 4 ? FIELD.low : value <= 8 ? FIELD.mid : FIELD.high;
  return (
    <svg viewBox="0 0 100 140" className="block h-full w-full" role="img" aria-label={label}>
      <rect x="2" y="2" width="96" height="136" rx="10" fill={field} stroke="#f4f0e6" strokeWidth="3" />
      {value === 0 ? (
        <path d="M50 36 L58.8 58.4 L82.6 60 L64.2 75.4 L70.2 98.6 L50 85.8 L29.8 98.6 L35.8 75.4 L17.4 60 L41.2 58.4 Z" fill="#fff6d0" />
      ) : (
        <>
          <rect x="12" y="12" width="76" height="116" rx="6" fill="none" stroke="#f4f0e6" strokeOpacity=".45" strokeWidth="1.5" />
          <text x="50" y="84" textAnchor="middle" fontWeight={700} fontSize={value > 9 ? 46 : 58} fill="#fbf8ee" style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}>
            {value}
          </text>
          <text x="16" y="30" fontWeight={700} fontSize={15} fill="#fbf8ee" style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}>
            {value}
          </text>
          <text x="84" y="124" textAnchor="end" fontWeight={700} fontSize={15} fill="#fbf8ee" style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}>
            {value}
          </text>
        </>
      )}
    </svg>
  );
}
