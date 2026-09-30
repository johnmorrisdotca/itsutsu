"use client";

import type { ReactNode } from "react";

import type { CardSpot, PileCard } from "@/components/cards/cards.types";
import { cardAt } from "@/lib/cards/deck";

/**
 * WHAT FREECELL'S AND SPIDER'S TABLES SHARE with Solitaire's (`SolitaireTable`):
 * everything laid out in hundredths of the table's width (`cqw`, the table
 * being its own size container), so a phone and a desk lay the same cards in
 * the same places — a row of places along the top, and the columns under them
 * reaching to the rim.
 */

const cqw = (value: number) => `${value}cqw`;

/** A table's places across, its rows down, and the gap between cards and at the edges, in hundredths of its width. */
export type TableShape = { across: number; down: number; gap: number };

/** Where things go on a table of this shape: a card's width, each place's left edge, the columns' top, and the card heights a column has to the rim. */
export function tableGeometry({ across, down, gap }: TableShape) {
  const card = (100 - (across + 1) * gap) / across;
  const tall = card * 1.4;
  const columnsTop = gap + tall + 2 * gap;
  return {
    card,
    gap,
    leftOf: (place: number) => gap + place * (card + gap),
    columnsTop,
    room: ((100 * down) / across - columnsTop - gap) / tall,
  };
}

/** Card numbers as a pile draws them, every one face up unless `showing` says not. */
export function faceUpCards(cards: readonly number[], showing: (at: number) => boolean = () => true): PileCard[] {
  return cards.map((card, at) => ({ card: cardAt(card), faceUp: showing(at) }));
}

/** A place on the table, in hundredths of its width. */
export function TablePlace({ left, top, width, children }: { left: number; top: number; width: number; children: ReactNode }) {
  return (
    <div className="absolute" style={{ left: cqw(left), top: cqw(top), width: cqw(width) }}>
      {children}
    </div>
  );
}

/**
 * A column and the table under it, to the rim: where a drop on the column
 * lands (`data-card-drop`), and where a tap below its cards still means "here".
 */
export function ColumnZone({
  pile,
  left,
  top,
  card,
  gap,
  readOnly,
  onPress,
  children,
}: {
  pile: string;
  left: number;
  top: number;
  card: number;
  gap: number;
  readOnly: boolean;
  onPress?: (spot: CardSpot) => void;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute bottom-0"
      style={{ left: cqw(left - gap / 2), top: cqw(top), width: cqw(card + gap), paddingLeft: cqw(gap / 2), paddingRight: cqw(gap / 2) }}
      data-card-pile={pile}
      {...(readOnly ? {} : { "data-card-drop": "" })}
      onClick={(event) => {
        // Only a tap on the table itself, under the cards: a tap on a card is the card's own.
        if (event.target === event.currentTarget) onPress?.({ pile, index: -1 });
      }}
    >
      {children}
    </div>
  );
}
