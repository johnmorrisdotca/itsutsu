"use client";

import { WAR_RULES } from "@johnmorrisdotca/toranpu/war";
import type { WarGame, WarMove } from "@johnmorrisdotca/toranpu/war";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { laidBy, warEnding, warWords } from "@/lib/cardGames/war/warWords";
import { playerNumberName } from "@/lib/gomoku/seatWords";

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
  const say = useSpeaker();
  const name = (seat: number) => players[seat] ?? playerNumberName(say, seat + 1);
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
              {say.count("ctable.war.cards", count)}
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
        {warWords(game, name, say)}
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
  actions: (_game, _chosen, _target, _name, say) => [{ label: say.say("ctable.war.turnButton"), move: TURN, testId: "cards-turn", strong: true }],
  quick: () => null,
  status: (game, _name, say) => (game.phase === "over" ? "" : say.say("ctable.war.turnStatus", { n: String(game.moves.length + 1), size: String(game.size) })),
  ending: warEnding,
  standing: (game, seat) => ({ score: String(game.hands[seat]?.length ?? 0) }),
  scoreWords: (say) => say.say("ctable.war.scoreWords"),
  Centre: WarCentre,
};
