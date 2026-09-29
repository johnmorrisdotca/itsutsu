"use client";

import type { RefObject } from "react";

import { cardCode } from "@/lib/cards/deck";

import { CARD_ASPECT } from "./Cards.constants";
import type { CardGhost } from "./cards.types";
import { PlayingCard } from "./PlayingCard";

/**
 * THE CARDS UNDER THE FINGER while they are dragged, drawn over everything at
 * the pointer, where they were taken hold of. Fixed to the viewport and deaf to
 * the pointer, so the pile under it is what a drop finds. `useCardDrag` moves
 * it through `ghostRef` without a render.
 */
export function CardDragGhost({ ghost, ghostRef }: { ghost: CardGhost | null; ghostRef: RefObject<HTMLDivElement | null> }) {
  if (ghost === null) return null;
  const height = ghost.width * CARD_ASPECT;
  return (
    <div
      ref={ghostRef}
      aria-hidden="true"
      data-testid="card-drag-ghost"
      className="pointer-events-none fixed top-0 left-0 z-50"
      style={{ width: ghost.width, height: height * (1 + ghost.step * (ghost.cards.length - 1)), transform: `translate(${ghost.x - ghost.grabX}px, ${ghost.y - ghost.grabY}px)` }}
    >
      {ghost.cards.map((card, at) => (
        <PlayingCard
          key={cardCode(card)}
          card={card}
          faceUp
          className="absolute left-0 w-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)]"
          style={{ top: at * ghost.step * height }}
        />
      ))}
    </div>
  );
}
