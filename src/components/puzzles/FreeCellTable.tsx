"use client";

import type { PointerEvent as ReactPointerEvent } from "react";

import { BoardFrame } from "@/components/board/BoardFrame";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { CardPile } from "@/components/cards/CardPile";
import type { CardSpot } from "@/components/cards/cards.types";
import { SUIT_DISPLAY, SUITS } from "@/lib/cards/cards.constants";
import { cardAt, cardName } from "@/lib/cards/deck";
import type { FreeCellPile, FreeCellTable as Table } from "@/lib/puzzles/freecell/freecell.types";
import { freeCellPileCards, type FreeCellSpot } from "@/lib/puzzles/freecell/intent";
import { CELL_PILES, COLUMN_PILES, FOUNDATION_PILES } from "@/lib/puzzles/freecell/rules";

import { FREECELL_TABLE } from "./puzzles.constants";
import { ColumnZone, TablePlace, faceUpCards, tableGeometry } from "./patienceTable";

const geometry = tableGeometry(FREECELL_TABLE);

/**
 * THE FREECELL TABLE: a board like every board here (`BoardFrame`, in the
 * reader's own wood), as Solitaire's is (`SolitaireTable`), eight places
 * across: the free cells on the left of the top row and the four foundations
 * on the right, and the eight columns under them, every card face up.
 *
 * A picture of a table and nothing more: the solve says what a press or a drag
 * means (`FreeCellSolve`); the set-up's preview and a finished game's page
 * draw it read-only. Each place is named by its `FreeCellPile` letter for a
 * drop to find, and each column's drop zone runs to the foot of the table.
 */
export function FreeCellTable({
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
  picked?: FreeCellSpot | null;
  lifted?: FreeCellSpot | null;
  readOnly?: boolean;
  onPress?: (spot: FreeCellSpot) => void;
  onLift?: (spot: FreeCellSpot, event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const press = readOnly ? undefined : (spot: CardSpot) => onPress?.(spot as FreeCellSpot);
  const lift = readOnly ? undefined : (spot: CardSpot, event: ReactPointerEvent<HTMLElement>) => onLift?.(spot as FreeCellSpot, event);
  const shared = { picked: picked as CardSpot | null, lifted: lifted as CardSpot | null, onPress: press, onLift: lift };
  const { card, gap, leftOf, columnsTop, room } = geometry;
  return (
    <BoardFrame size={FREECELL_TABLE.across} rows={FREECELL_TABLE.down} theme={theme} flipped={false} inset={FREECELL_TABLE.inset} lattice={false} shape="rhombus" coordinates={false}>
      <div className="absolute inset-0 [container-type:inline-size]" data-testid="freecell-table" data-cells={table.cells.length}>
        {CELL_PILES.slice(0, table.cells.length).map((pile: FreeCellPile, at) => (
          <TablePlace key={pile} left={leftOf(at)} top={gap} width={card}>
            <CardPile id={pile} label={`Free cell ${at + 1}`} spread="stack" cards={faceUpCards(freeCellPileCards(table, pile))} emptyMark="□" accepts={!readOnly} {...shared} />
          </TablePlace>
        ))}
        {FOUNDATION_PILES.map((pile, suit) => (
          <TablePlace key={pile} left={leftOf(4 + suit)} top={gap} width={card}>
            <CardPile
              id={pile}
              label={`The ${SUIT_DISPLAY[SUITS[suit]].name} foundation`}
              spread="stack"
              cards={faceUpCards(freeCellPileCards(table, pile))}
              emptyMark={SUIT_DISPLAY[SUITS[suit]].symbol}
              accepts={!readOnly}
              {...shared}
            />
          </TablePlace>
        ))}
        {COLUMN_PILES.map((pile, index) => {
          const column = table.tableau[index];
          return (
            <ColumnZone key={pile} pile={pile} left={leftOf(index)} top={columnsTop} card={card} gap={gap} readOnly={readOnly} onPress={press}>
              <CardPile
                id={pile}
                label={`Column ${index + 1}`}
                spread="down"
                room={room}
                cards={faceUpCards(column)}
                labelFor={(spot) => cardName(cardAt(column[spot.index]))}
                {...shared}
              />
            </ColumnZone>
          );
        })}
      </div>
    </BoardFrame>
  );
}
