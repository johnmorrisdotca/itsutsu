import { cardName } from "@/lib/cards/deck";

import { CardBack } from "./CardBack";
import { CardFace } from "./CardFace";
import { ChosenCardBack } from "./ChosenCardBack";
import { CARD_BOX } from "./Cards.constants";
import type { PlayingCardProps } from "./cards.types";

/**
 * ONE PLAYING CARD, face or back, as wide as its parent makes it and 7/5 as
 * tall. Every card game on the site draws its cards with this.
 *
 * A LIGHT OBJECT IN BOTH THEMES (`.surface-light`): an ivory card on the table
 * at night as by day, with its ink fixed, as a Kumimoji tile is. It is a
 * picture and not a control: a game wraps it in the button or the drag
 * handle it needs (`CardPile`, `CardHand`), which carries the name a screen
 * reader says. A face-down card with no `card` names nothing, so a hidden
 * hand puts nothing about its cards in the page.
 */
export function PlayingCard({ card, faceUp, back, picked = false, hinted = false, lifted = false, className, style }: PlayingCardProps) {
  const showing = faceUp && card !== undefined;
  const ring = picked ? "ring-[3px] ring-moss -translate-y-[6%]" : hinted ? "ring-[3px] ring-ochre" : "";
  return (
    <span
      className={`surface-light relative block aspect-[5/7] rounded-[7%/5%] shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-transform ${ring} ${lifted ? "opacity-25" : ""} ${className ?? ""}`}
      style={style}
      data-card={showing ? cardName(card) : "back"}
      data-face-up={showing ? "true" : "false"}
    >
      <svg viewBox={`0 0 ${CARD_BOX.width} ${CARD_BOX.height}`} className="block h-full w-full" aria-hidden="true">
        {showing ? <CardFace card={card} /> : back !== undefined ? <CardBack field={back} /> : <ChosenCardBack />}
      </svg>
    </span>
  );
}

/** An empty place on the table where a card may go: a dashed outline in the ivory of a card, fixed like the cards are, with a letter or a suit to say what belongs there. */
export function CardSlot({ mark, className }: { mark?: string; className?: string }) {
  return (
    <span
      className={`relative flex aspect-[5/7] items-center justify-center rounded-[7%/5%] border-2 border-dashed border-[rgba(255,254,249,0.5)] bg-[rgba(0,0,0,0.08)] text-[min(6vw,1.6rem)] font-semibold text-[rgba(255,254,249,0.7)] ${className ?? ""}`}
    >
      {mark === undefined ? null : <span aria-hidden="true">{mark}</span>}
    </span>
  );
}
