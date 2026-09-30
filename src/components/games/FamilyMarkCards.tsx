import { HitotsuCardDrawing } from "@johnmorrisdotca/hitotsu/react";
import type { ReactNode } from "react";

import { CardBack } from "@/components/cards/CardBack";
import { CardFace } from "@/components/cards/CardFace";
import type { Card } from "@/lib/cards/cards.types";

/** A card of the French deck, as the Cards family's mark lays it. */
export type FrenchCard = Card;

/** A card's width in a mark, in cells: two cells and a little, so a fan of three fills the little board. */
const MARK_CARD_WIDTH = 2.3;

/** A card laid in a mark: the card (null for its back), its middle, and how far it is turned. */
export type LaidCard<T> = { card: T | null; x: number; y: number; angle: number };

/** One card of a fan, its middle at x and y, turned about its foot: drawn by whatever draws that deck at the table. */
function Laid({ x, y, angle, children }: { x: number; y: number; angle: number; children: ReactNode }) {
  return (
    <g transform={`rotate(${angle} ${x} ${y + MARK_CARD_WIDTH})`}>
      <svg x={x - MARK_CARD_WIDTH / 2} y={y - MARK_CARD_WIDTH * 0.7} width={MARK_CARD_WIDTH} height={MARK_CARD_WIDTH * 1.4} viewBox="0 0 100 140">
        {children}
      </svg>
    </g>
  );
}

/**
 * THE FANS OF CARDS IN A FAMILY'S MARK: the Cards family's from the French
 * deck (`CardFace`, `CardBack`), and the Colour cards family's from Hitotsu's
 * own (`HitotsuCardDrawing`, the package's design), each drawn by the code
 * that draws it at the table.
 */
export function MarkCardFans({ cards = [], colourCards = [] }: { cards?: LaidCard<Card>[]; colourCards?: LaidCard<string>[] }) {
  return (
    <>
      {cards.map(({ card, x, y, angle }, at) => (
        <Laid key={at} x={x} y={y} angle={angle}>
          {card === null ? <CardBack /> : <CardFace card={card} />}
        </Laid>
      ))}
      {colourCards.map(({ card, x, y, angle }, at) => (
        <Laid key={`colour-${at}`} x={x} y={y} angle={angle}>
          <HitotsuCardDrawing card={card} />
        </Laid>
      ))}
    </>
  );
}
