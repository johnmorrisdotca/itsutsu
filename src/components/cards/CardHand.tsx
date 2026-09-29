"use client";

import { cardCode, cardName } from "@/lib/cards/deck";

import type { CardHandProps } from "./cards.types";
import { PlayingCard } from "./PlayingCard";

/** How much of a card a hand shows at most when there is room to spare: more and it stops reading as a hand. */
const WIDEST_STEP = 0.62;

/**
 * A PLAYER'S HAND: cards fanned along a row, overlapping as much as the width
 * needs and no more, each showing the rank and suit in its top-left corner.
 * A chosen card rises. For the family card games: Hearts, Big Two, President,
 * Go Fish, Crazy Eights.
 *
 * A HIDDEN hand is backs only, and puts nothing about its cards in the page —
 * no names, no codes, no data attributes — so looking at the source of a pass-
 * and-play table tells nobody what the next player holds.
 */
export function CardHand({ id, cards, hidden = false, back, chosen = [], hinted = [], onPress, onLift, lifted, label, cardWidth = 72, className }: CardHandProps) {
  const count = cards.length;
  const width = `min(${cardWidth}px, 100%)`;
  const reach = 1 + WIDEST_STEP * Math.max(0, count - 1);
  return (
    <div className={`w-full ${className ?? ""}`} role="group" aria-label={label} data-card-pile={id} data-card-hand="">
      <div className="relative mx-auto pt-[4%]" style={{ width: `min(100%, ${cardWidth * reach}px)` }}>
        {/* The hand's height: one card, standing where the others lie. */}
        <span aria-hidden="true" className="invisible block aspect-[5/7]" style={{ width }} />
        {cards.map((card, index) => {
          const up = chosen.includes(index);
          const isLifted = lifted !== null && lifted !== undefined && lifted.pile === id && lifted.index === index;
          return (
            <button
              key={hidden ? index : cardCode(card)}
              type="button"
              className="absolute block rounded-[7%/5%] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-moss"
              style={{
                width,
                top: 0,
                left: count > 1 ? `calc((100% - ${width}) * ${index / (count - 1)})` : 0,
                transform: up ? "translateY(-4%)" : "translateY(4%)",
                touchAction: onLift !== undefined && !hidden ? "none" : "manipulation",
                zIndex: index + 1,
              }}
              aria-label={hidden ? `card ${index + 1} of ${count}, face down` : `${cardName(card)}${up ? ", chosen" : ""}`}
              aria-pressed={hidden ? undefined : up}
              data-card-index={index}
              disabled={hidden && onPress === undefined}
              onPointerDown={(event) => (hidden ? undefined : onLift?.({ pile: id, index }, event))}
              onClick={() => onPress?.({ pile: id, index })}
            >
              <PlayingCard card={hidden ? undefined : card} faceUp={!hidden} back={back} picked={up} hinted={!hidden && hinted.includes(index)} lifted={isLifted} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
