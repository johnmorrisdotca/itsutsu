import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

import type { Card } from "@/lib/cards/cards.types";

/** The colour a card's back is laid on (`CARD_BACK_FIELDS`). */
export type CardBackField = "ink" | "shu" | "moss";

export type PlayingCardProps = {
  /** The card. Left out for a face-down card nobody at this table may know, such as another player's hand. */
  card?: Card;
  faceUp: boolean;
  back?: CardBackField;
  /** Picked up by a tap, waiting to be placed: drawn raised with a moss ring. */
  picked?: boolean;
  /** Offered as a place to play or a card to move (a hint): drawn with an ochre ring. */
  hinted?: boolean;
  /** Being dragged: left in place as a faint outline while the ghost follows the pointer. */
  lifted?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** One card in a pile: face up or down, as the game has it. */
export type PileCard = { card: Card; faceUp: boolean };

/**
 * How a pile lays its cards out. `stack`: squared up, only the top one seen
 * (a stock, a foundation); `down`: overlapped down the table so each top strip
 * shows (a Klondike column); `right`: overlapped along it (a waste of three).
 */
export type PileSpread = "stack" | "down" | "right";

/** Where a card is on the table, as a drag or a tap reports it: the pile it is in, and its place from the bottom. */
export type CardSpot = { pile: string; index: number };

export type CardPileProps = {
  /** The pile's name, reported by every press on it and found by a drop (`data-card-pile`). */
  id: string;
  cards: readonly PileCard[];
  spread: PileSpread;
  /**
   * The step between two cards as a share of a card's height (`down`) or width
   * (`right`): face-down cards and face-up ones. A pile given `room` squeezes
   * both to fit it.
   */
  step?: { faceDown: number; faceUp: number };
  /** The most height (for `down`), in card heights, the pile may take; its steps shrink to fit. */
  room?: number;
  /** For `right`: only the last this many cards are spread; the rest lie squared under them. */
  showLast?: number;
  /** What an empty place shows: a letter, a suit, or nothing. */
  emptyMark?: string;
  /** Whether a drop may land here (`data-card-drop`). */
  accepts?: boolean;
  back?: CardBackField;
  picked?: CardSpot | null;
  hinted?: readonly CardSpot[];
  lifted?: CardSpot | null;
  /** A press on a card (its index) or on the empty place (-1). */
  onPress?: (spot: CardSpot) => void;
  /** Where a drag begins: the game says whether this card can be lifted. */
  onLift?: (spot: CardSpot, event: ReactPointerEvent<HTMLElement>) => void;
  /** An accessible label for a card at an index, when the game has something to add ("move", "turn over"). */
  labelFor?: (spot: CardSpot) => string;
  /** The pile's name for a screen reader: "column 3", "the stock". */
  label: string;
  className?: string;
};

export type CardHandProps = {
  id: string;
  cards: readonly Card[];
  /** Face down: another player's hand, drawn as backs, with nothing about the cards in the page. */
  hidden?: boolean;
  back?: CardBackField;
  /** Which cards are raised: chosen to play. */
  chosen?: readonly number[];
  onPress?: (spot: CardSpot) => void;
  onLift?: (spot: CardSpot, event: ReactPointerEvent<HTMLElement>) => void;
  lifted?: CardSpot | null;
  label: string;
  /** The widest a card is drawn, in pixels; a hand narrower than its cards overlaps them. */
  cardWidth?: number;
  className?: string;
};

/** What the finger is carrying: the cards, where the pointer is, and where on the top card it took hold. */
export type CardGhost = { cards: readonly Card[]; x: number; y: number; grabX: number; grabY: number; width: number; step: number };
