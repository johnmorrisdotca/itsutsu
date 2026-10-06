import { hitotsuWords, type HitotsuCard, type HitotsuColour } from "@johnmorrisdotca/hitotsu";
import { HitotsuCardDrawing } from "@johnmorrisdotca/hitotsu/react";

/**
 * ONE HITOTSU CARD, face or back, as wide as its parent makes it and 7/5 as
 * tall: the deck's own design (`HitotsuCardDrawing`, from the package, where
 * the design is decided once), on the table, in a hand and in a seat's row.
 *
 * A picture and not a control, as `PlayingCard` is: the hand wraps it in the
 * button that says its name. A face-down card names nothing.
 */
export function HitotsuCardView({ card, faceUp = true, chosen = false, called, className }: { card?: HitotsuCard; faceUp?: boolean; chosen?: boolean; called?: HitotsuColour; className?: string }) {
  const showing = faceUp && card !== undefined;
  return (
    <span
      className={`surface-light relative block aspect-[5/7] rounded-[9%/6.5%] shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-transform ${chosen ? "-translate-y-[6%] ring-[3px] ring-moss" : ""} ${className ?? ""}`}
      data-hitotsu-card={showing ? card : "back"}
      data-face-up={showing ? "true" : "false"}
    >
      <svg viewBox="0 0 100 140" className="block h-full w-full" aria-hidden="true">
        <HitotsuCardDrawing card={showing ? card : null} called={called} />
      </svg>
    </span>
  );
}

/** What a card is called aloud, for its button and the table's lines. */
export function hitotsuCardLabel(card: HitotsuCard, language: "en" | "ja" = "en"): string {
  return hitotsuWords(card, language);
}
