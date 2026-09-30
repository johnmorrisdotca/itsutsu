"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

import { BoardFrame } from "@/components/board/BoardFrame";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { CardPile } from "@/components/cards/CardPile";
import type { CardSpot } from "@/components/cards/cards.types";
import { SUIT_DISPLAY, SUITS } from "@/lib/cards/cards.constants";
import { cardAt, cardName } from "@/lib/cards/deck";
import { COLUMNS, RANKS_A_SUIT, RUNS_TO_WIN, canDeal } from "@johnmorrisdotca/toranpu/spider";
import type { SpiderSpot, SpiderTable as Table } from "@johnmorrisdotca/toranpu/spider";

import { SPIDER_TABLE } from "./puzzles.constants";
import { ColumnZone, TablePlace, faceUpCards, tableGeometry } from "./patienceTable";

const geometry = tableGeometry(SPIDER_TABLE);

/**
 * THE SPIDER TABLE: a board like every board here (`BoardFrame`, in the
 * reader's own wood), ten places across: the stock at the left of the top
 * row, a card back for every deal it has left, and the eight made runs along
 * the right, each shown by its King; the ten columns under them.
 *
 * A picture of a table and nothing more: the solve says what a press or a drag
 * means (`SpiderSolve`); the set-up's preview and a finished game's page draw
 * it read-only. A column is named `0`–`9` for a drop to find, the stock `s`,
 * and each column's drop zone runs to the foot of the table.
 */
export function SpiderTable({
  table,
  theme,
  picked = null,
  lifted = null,
  readOnly = false,
  onPress,
  onLift,
}: {
  table: Table;
  theme: BoardThemeTokens;
  picked?: SpiderSpot | null;
  lifted?: SpiderSpot | null;
  readOnly?: boolean;
  onPress?: (spot: SpiderSpot) => void;
  onLift?: (spot: SpiderSpot, event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const press = readOnly ? undefined : (spot: CardSpot) => onPress?.(spot);
  const lift = readOnly ? undefined : (spot: CardSpot, event: ReactPointerEvent<HTMLElement>) => onLift?.(spot, event);
  const shared = { picked: picked as CardSpot | null, lifted: lifted as CardSpot | null, onPress: press, onLift: lift };
  const { card, gap, leftOf, columnsTop, room } = geometry;
  const deals = table.stock.length / COLUMNS;
  // One back a deal left, from its first card: the stock is drawn as the deals it still holds.
  const stock = Array.from({ length: deals }, (_, at) => table.stock[at * COLUMNS]);
  return (
    <BoardFrame size={SPIDER_TABLE.across} rows={SPIDER_TABLE.down} theme={theme} flipped={false} inset={SPIDER_TABLE.inset} lattice={false} shape="rhombus" coordinates={false}>
      <div className="absolute inset-0 [container-type:inline-size]" data-testid="spider-table" data-deals={deals} data-runs={table.done.length}>
        <TablePlace left={leftOf(0)} top={gap} width={card}>
          <CardPile
            id="s"
            label="The stock"
            spread="stack"
            cards={faceUpCards(stock, () => false)}
            labelFor={() => (canDeal(table) ? `The stock: ${deals} ${deals === 1 ? "deal" : "deals"} left. Deal a card to every column` : "The stock")}
            {...shared}
          />
        </TablePlace>
        {Array.from({ length: RUNS_TO_WIN }, (_, at) => {
          const suit = table.done[at];
          return (
            <TablePlace key={at} left={leftOf(COLUMNS - RUNS_TO_WIN + at)} top={gap} width={card}>
              <CardPile
                id={`f${at}`}
                label={suit === undefined ? `Run ${at + 1}: not made yet` : `Run ${at + 1}: the ${SUIT_DISPLAY[SUITS[suit]].name}, made`}
                spread="stack"
                cards={suit === undefined ? [] : faceUpCards([suit * RANKS_A_SUIT + RANKS_A_SUIT - 1])}
                {...shared}
              />
            </TablePlace>
          );
        })}
        {table.tableau.map((column, index) => (
          <ColumnZone key={index} pile={String(index)} left={leftOf(index)} top={columnsTop} card={card} gap={gap} readOnly={readOnly} onPress={press}>
            <CardPile
              id={String(index)}
              label={`Column ${index + 1}`}
              spread="down"
              room={room}
              cards={faceUpCards(column.cards, (at) => at >= column.down)}
              labelFor={(spot) => (spot.index >= column.down ? cardName(cardAt(column.cards[spot.index])) : "a face-down card")}
              {...shared}
            />
          </ColumnZone>
        ))}
      </div>
    </BoardFrame>
  );
}
