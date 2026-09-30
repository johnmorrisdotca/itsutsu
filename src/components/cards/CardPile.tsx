"use client";

import { cardCode, cardName } from "@/lib/cards/deck";

import { CARD_ASPECT } from "./Cards.constants";
import type { CardPileProps, CardSpot } from "./cards.types";
import { pileLayout } from "./pileLayout";
import { CardSlot, PlayingCard } from "./PlayingCard";

function covers(spot: CardSpot | null | undefined, pile: string, index: number): boolean {
  return spot !== null && spot !== undefined && spot.pile === pile && index >= spot.index;
}

/**
 * A PILE OF CARDS ON THE TABLE: squared up, overlapped down the table, or
 * spread along it (`PileSpread`), in the width its parent gives it.
 *
 * Every card in it is a button, so a tap, a click and a keyboard all reach the
 * game's `onPress`, and a press that moves reaches its `onLift` to become a
 * drag. The pile names itself for a drop (`data-card-pile`, and
 * `data-card-drop` where one may land) and an empty pile is a place too, with
 * its mark (`CardSlot`), which a tap or a drop can still reach.
 *
 * A face-up card that can be lifted says `touch-action: none`, or a finger's
 * drag would scroll the page instead of carrying the card; everything else
 * leaves the page to scroll as usual.
 */
export function CardPile({ id, cards, spread, step, room, showLast, emptyMark, accepts = false, back, picked, hinted = [], lifted, onPress, onLift, labelFor, label, className }: CardPileProps) {
  const layout = pileLayout({ cards, spread, step, room, showLast });
  const box =
    spread === "right"
      ? { aspectRatio: `${1 + layout.extent} / ${CARD_ASPECT}` }
      : { aspectRatio: `1 / ${CARD_ASPECT * (1 + layout.extent)}` };
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={box}
      data-card-pile={id}
      {...(accepts ? { "data-card-drop": "" } : {})}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className="absolute top-0 left-0 block"
        style={spread === "right" ? { width: `${100 / (1 + layout.extent)}%` } : { width: "100%" }}
        aria-label={`${label}: empty`}
        tabIndex={cards.length === 0 ? 0 : -1}
        onClick={() => onPress?.({ pile: id, index: -1 })}
        data-card-index={-1}
      >
        <CardSlot mark={emptyMark} />
      </button>
      {cards.map(({ card, faceUp }, index) => {
        // A squared-up pile shows its top card, and the one under it for when the top is lifted: the rest are drawn by nobody.
        if (spread === "stack" && index < cards.length - 2) return null;
        // And a waste spread only at its last few shows those and the one squared under them.
        if (spread === "right" && showLast !== undefined && index < cards.length - showLast - 1) return null;
        const spot = { pile: id, index };
        const at = layout.offsets[index];
        const top = index === cards.length - 1;
        const liftable = faceUp && onLift !== undefined;
        const position =
          spread === "right"
            ? { left: `${(at / (1 + layout.extent)) * 100}%`, width: `${100 / (1 + layout.extent)}%`, top: 0 }
            : { top: `${(at / (1 + layout.extent)) * 100}%`, left: 0, width: "100%" };
        return (
          <button
            // With its place, since two decks (Spider) can put the same card twice in one pile.
            key={`${cardCode(card)}-${index}`}
            type="button"
            className="absolute block rounded-[7%/5%] outline-none focus-visible:ring-2 focus-visible:ring-moss"
            style={{ ...position, touchAction: liftable ? "none" : "manipulation", zIndex: index + 1 }}
            tabIndex={faceUp || top ? 0 : -1}
            aria-label={labelFor?.(spot) ?? (faceUp ? cardName(card) : "a face-down card")}
            data-card-index={index}
            onPointerDown={(event) => onLift?.(spot, event)}
            onClick={() => onPress?.(spot)}
          >
            <PlayingCard
              card={faceUp ? card : undefined}
              faceUp={faceUp}
              back={back}
              picked={covers(picked, id, index)}
              hinted={hinted.some((hint) => hint.pile === id && hint.index === index)}
              lifted={covers(lifted, id, index)}
            />
          </button>
        );
      })}
    </div>
  );
}
