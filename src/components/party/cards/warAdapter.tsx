"use client";

import { WAR_RULES } from "@johnmorrisdotca/toranpu/war";
import type { WarGame, WarMove } from "@johnmorrisdotca/toranpu/war";

import { laidBy, warEnding, warWords } from "@/lib/cardGames/war/warWords";

import type { CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

/** The only move War has. */
const TURN: WarMove = { turn: true };

/**
 * The table: each player's pile of cards face down at their own end with its
 * name and count, and what the last turn laid between them. In a war the
 * card that tied, the three face down and the card that decided it all lie in
 * a row toward the middle, the deciding one last. Nothing is hidden: the whole
 * game is on the table.
 */
function WarCentre({ game, players }: CardCentreProps<WarGame>) {
  const name = (seat: number) => players[seat] ?? `Player ${seat + 1}`;
  const last = game.last;
  const seats = [0, 1] as const;
  // Where each seat's cards lie, as hundredths of the table's width: seat 0 on the left, seat 1 mirrored.
  const place = (seat: 0 | 1, step: 0 | 1 | 2) => (seat === 0 ? 22 + step * 7 : 65 - step * 7);
  return (
    <>
      {seats.map((seat) => {
        const count = game.hands[seat]?.length ?? 0;
        const left = seat === 0 ? 4 : 83;
        const laid = last === null ? null : laidBy(last, seat);
        return (
          <span key={seat} data-testid="war-seat" data-seat={seat} data-cards={count}>
            <TableWords left={left - 3} top={6} width={19} testId="war-name">
              {name(seat)}
            </TableWords>
            {count === 0 ? null : <LaidCard card={null} left={left} top={11.5} testId="war-pile" />}
            <TableWords left={left - 3} top={31} width={19} testId="war-count">
              {count === 1 ? "1 card" : `${count} cards`}
            </TableWords>
            {laid === null ? null : (
              <>
                {laid.final === null || laid.first === null ? null : <LaidCard card={laid.first} left={place(seat, 0)} top={13} testId="war-tied" />}
                {laid.down === 0 ? null : <LaidCard card={null} left={place(seat, 1)} top={13} testId="war-down" />}
                {(laid.final ?? laid.first) === null ? null : <LaidCard card={laid.final ?? laid.first} left={place(seat, 2)} top={13} testId="war-turned" />}
              </>
            )}
          </span>
        );
      })}
      <TableWords left={5} top={38} width={90} testId="war-said">
        {warWords(game, name)}
      </TableWords>
    </>
  );
}

/**
 * War at the table: no hand and nothing to choose, one press that turns the
 * cards over. Both players' piles are in plain view (`open`), so there is
 * nothing to hide between turns and no device to pass.
 */
export const WAR_ADAPTER: CardAdapter<WarGame, WarMove> = {
  kind: "war",
  rules: WAR_RULES,
  open: true,
  // A pile, never a hand: the table counts it and does not show it.
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 0,
  actions: () => [{ label: "Turn the cards over", move: TURN, testId: "cards-turn", strong: true }],
  quick: () => null,
  status: (game) => (game.phase === "over" ? "" : `Turn ${game.moves.length + 1} of ${game.size}. Turn the cards over.`),
  ending: warEnding,
  standing: (game, seat) => ({ score: String(game.hands[seat]?.length ?? 0) }),
  scoreWords: "Cards held, most wins",
  Centre: WarCentre,
};
