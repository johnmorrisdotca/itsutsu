"use client";

import type { ReactNode } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import type { Appearance } from "@/components/board/board.types";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { tableTheme } from "@/components/puzzles/KumimojiTable";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { cardNamed } from "@/lib/cardGames/cardSay";
import { cardOfId } from "@/lib/cardGames/cards";
import type { CardId } from "@/lib/cardGames/cardGames.types";

import { CARD_TABLE_BOARD } from "./cardTable.constants";

const cqw = (value: number) => `${value}cqw`;

/**
 * THE TABLE IN THE MIDDLE OF A CARD GAME: a board of the reader's own wood, or
 * the felt they chose for it (`FeltPatches`, as Kumimoji's table is), in its
 * frame (`BoardFrame`), eight across to five down, as every table on the
 * site is drawn — the trick, the pile, the stock and the discards lie on it.
 * Its inside is its own size container, so what lies on it is placed in
 * hundredths of its width, the same on a phone and a desk. It is where a card
 * dragged from a hand is let go to play it (`data-card-drop`).
 */
export function CardTableSurface({ appearance, children }: { appearance?: Appearance; children: ReactNode }) {
  const theme = tableTheme(appearance ?? DEFAULT_APPEARANCE);
  return (
    <BoardFrame size={CARD_TABLE_BOARD.across} rows={CARD_TABLE_BOARD.down} theme={theme} flipped={false} inset={CARD_TABLE_BOARD.inset} lattice={false} shape="rhombus" coordinates={false}>
      <div className="absolute inset-0 [container-type:inline-size]" data-testid="cards-table" data-card-pile="table" data-card-drop="">
        {children}
      </div>
    </BoardFrame>
  );
}

/** A card lying on the table, face up (a card id) or face down (null), at a place in hundredths of the table's width. */
export function LaidCard({ card, left, top, width = CARD_TABLE_BOARD.card, turn = 0, testId }: { card: CardId | null; left: number; top: number; width?: number; turn?: number; testId?: string }) {
  const say = useSpeaker();
  return (
    <span
      className="absolute block"
      style={{ left: cqw(left), top: cqw(top), width: cqw(width), transform: turn === 0 ? undefined : `rotate(${turn}deg)` }}
      data-testid={testId}
      data-laid={card ?? "back"}
      role="img"
      aria-label={card === null ? say.say("pcard.pile.faceDown") : cardNamed(card, say)}
    >
      <PlayingCard card={card === null ? undefined : cardOfId(card)} faceUp={card !== null} />
    </span>
  );
}

/** Words written on the table itself, in the page's ink on the wood, at a place in hundredths of its width. */
export function TableWords({ left, top, width, children, testId }: { left: number; top: number; width: number; children: ReactNode; testId?: string }) {
  return (
    <span
      className="absolute block text-center font-semibold leading-tight text-[#2b1d0e] [font-size:max(0.7rem,2.6cqw)]"
      style={{ left: cqw(left), top: cqw(top), width: cqw(width) }}
      data-testid={testId}
    >
      {children}
    </span>
  );
}

/**
 * Where each seat's card lies in a trick, as the table is seen from the
 * viewer's seat: theirs at the foot, the next seat round on the left, and so
 * round — the positions a trick of three to four takes.
 */
export function trickPlace(seat: number, viewer: number, seats: number): { left: number; top: number } {
  const from = (seat - (viewer < 0 ? 0 : viewer) + seats) % seats;
  const card = CARD_TABLE_BOARD.card;
  const middle = 50 - card / 2;
  const places4 = [
    { left: middle, top: 30 },
    { left: 16, top: 15.5 },
    { left: middle, top: 1.5 },
    { left: 84 - card, top: 15.5 },
  ];
  const places3 = [places4[0], { left: 22, top: 6 }, { left: 78 - card, top: 6 }];
  return (seats === 3 ? places3 : places4)[from] ?? places4[0];
}
