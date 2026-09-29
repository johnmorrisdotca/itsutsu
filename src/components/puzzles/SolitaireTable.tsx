"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

import { BoardFrame } from "@/components/board/BoardFrame";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { CardPile } from "@/components/cards/CardPile";
import type { CardSpot, PileCard } from "@/components/cards/cards.types";
import { DEFAULT_STEP } from "@/components/cards/pileLayout";
import { SUIT_DISPLAY, SUITS } from "@/lib/cards/cards.constants";
import { cardAt, cardName } from "@/lib/cards/deck";
import { COLUMN_PILES, FOUNDATION_PILES, recyclesLeft } from "@/lib/puzzles/solitaire/klondike";
import { pileCards, type TableSpot } from "@/lib/puzzles/solitaire/intent";
import type { KlondikePile, KlondikeTable } from "@/lib/puzzles/solitaire/solitaire.types";

import { SOLITAIRE_TABLE } from "./puzzles.constants";

const { across, down, inset, gap } = SOLITAIRE_TABLE;
/** A card's width, and the left edge of each of the seven places, in hundredths of the table's width. */
const CARD = (100 - (across + 1) * gap) / across;
const leftOf = (place: number) => gap + place * (CARD + gap);
const CARD_TALL = CARD * 1.4;
const COLUMNS_TOP = gap + CARD_TALL + 2 * gap;
/** How many card heights the columns have on a table so many squares down, from under the top row to the rim: what a long column squeezes into. */
const columnRoom = (rows: number) => ((100 * rows) / across - COLUMNS_TOP - gap) / CARD_TALL;

const cqw = (value: number) => `${value}cqw`;

function faceUp(cards: readonly number[], showing: (at: number) => boolean): PileCard[] {
  return cards.map((card, at) => ({ card: cardAt(card), faceUp: showing(at) }));
}

/**
 * THE SOLITAIRE TABLE: a board like every board on the site (`BoardFrame`, in
 * the reader's own wood — John asked for "a regular desk… unless it can still
 * work on a board", and a board of wood is a desk), with the stock, the waste
 * and the four foundations along the top and the seven columns under them.
 *
 * A picture of a table and nothing more: the solve says what a press or a drag
 * means (`SolitaireSolve`); the set-up's preview and a finished game's page
 * draw it read-only. Every place is a pile the site's deck draws (`CardPile`),
 * named by its `KlondikePile` letter for a drop to find, and each column's drop
 * zone runs to the foot of the table, so a card let go under a short column
 * still lands on it.
 */
export function SolitaireTable({
  table,
  theme,
  picked = null,
  lifted = null,
  readOnly = false,
  onPress,
  onLift,
  rows = down,
}: {
  /** How many squares down the table is, to seven across: seven, a square, as every board is (`SOLITAIRE_TABLE`). */
  rows?: number;
  table: KlondikeTable;
  theme: BoardThemeTokens;
  picked?: TableSpot | null;
  lifted?: TableSpot | null;
  readOnly?: boolean;
  onPress?: (spot: TableSpot) => void;
  onLift?: (spot: TableSpot, event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const press = readOnly ? undefined : (spot: CardSpot) => onPress?.(spot as TableSpot);
  const lift = readOnly ? undefined : (spot: CardSpot, event: ReactPointerEvent<HTMLElement>) => onLift?.(spot as TableSpot, event);
  const shared = { picked: picked as CardSpot | null, lifted: lifted as CardSpot | null, onPress: press, onLift: lift };
  const draw3 = table.rules.draw === 3;
  const wasteStep = DEFAULT_STEP.faceUp;
  const canRecycle = table.stock.length === 0 && table.waste.length > 0 && recyclesLeft(table) > 0;
  return (
    <BoardFrame size={across} rows={rows} theme={theme} flipped={false} inset={inset} lattice={false} shape="rhombus" coordinates={false}>
      <div className="absolute inset-0 [container-type:inline-size]" data-testid="solitaire-table" data-draw={table.rules.draw}>
        <Place left={leftOf(0)} top={gap} width={CARD}>
          <CardPile
            id="s"
            label="The stock"
            spread="stack"
            cards={faceUp(table.stock, () => false)}
            emptyMark={canRecycle ? "↻" : undefined}
            labelFor={() => (table.stock.length > 0 ? `The stock: ${table.stock.length} cards. Turn ${draw3 ? "three" : "one"}` : "The stock")}
            {...shared}
          />
        </Place>
        <Place left={leftOf(1)} top={gap} width={draw3 ? CARD * (1 + 2 * wasteStep) : CARD}>
          <CardPile
            id="w"
            label="The waste"
            spread={draw3 ? "right" : "stack"}
            showLast={draw3 ? 3 : undefined}
            step={{ faceDown: wasteStep, faceUp: wasteStep }}
            cards={faceUp(table.waste, () => true)}
            accepts={false}
            {...shared}
          />
        </Place>
        {FOUNDATION_PILES.map((pile, suit) => (
          <Place key={pile} left={leftOf(3 + suit)} top={gap} width={CARD}>
            <CardPile
              id={pile}
              label={`The ${SUIT_DISPLAY[SUITS[suit]].name} foundation`}
              spread="stack"
              cards={faceUp(pileCards(table, pile), () => true)}
              emptyMark={SUIT_DISPLAY[SUITS[suit]].symbol}
              accepts={!readOnly}
              {...shared}
            />
          </Place>
        ))}
        {COLUMN_PILES.map((pile, index) => {
          const column = table.tableau[index];
          return (
            <ColumnZone key={pile} pile={pile} left={leftOf(index)} readOnly={readOnly} onPress={press}>
              <CardPile
                id={pile}
                label={`Column ${index + 1}`}
                spread="down"
                room={columnRoom(rows)}
                cards={faceUp(column.cards, (at) => at >= column.down)}
                emptyMark="K"
                labelFor={(spot) => (spot.index >= column.down ? cardName(cardAt(column.cards[spot.index])) : "a face-down card")}
                {...shared}
              />
            </ColumnZone>
          );
        })}
      </div>
    </BoardFrame>
  );
}

/** A place on the table, in hundredths of its width. */
function Place({ left, top, width, children }: { left: number; top: number; width: number; children: ReactNode }) {
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
function ColumnZone({ pile, left, readOnly, onPress, children }: { pile: KlondikePile; left: number; readOnly: boolean; onPress?: (spot: CardSpot) => void; children: ReactNode }) {
  return (
    <div
      className="absolute bottom-0"
      style={{ left: cqw(left - gap / 2), top: cqw(COLUMNS_TOP), width: cqw(CARD + gap), paddingLeft: cqw(gap / 2), paddingRight: cqw(gap / 2) }}
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
