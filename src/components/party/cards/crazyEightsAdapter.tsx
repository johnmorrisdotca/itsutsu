"use client";

import { rankOf, suitWords } from "@/lib/cardGames/cards";
import type { CardSuit } from "@/lib/cardGames/cardGames.types";
import { EIGHT, crazyTop } from "@/lib/cardGames/crazyEights/crazyEights";
import { CRAZY_EIGHTS_RULES } from "@/lib/cardGames/crazyEights/crazyEightsRules";
import type { CrazyEightsGame, CrazyEightsMove } from "@/lib/cardGames/crazyEights/crazyEights.types";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

const SUITS: readonly CardSuit[] = ["S", "H", "D", "C"];
const SUIT_SIGNS: Record<CardSuit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

/** The stock face down and the discard pile face up beside it, and the suit to follow when an eight called one. */
function CrazyEightsCentre({ game }: CardCentreProps<CrazyEightsGame>) {
  const top = crazyTop(game);
  const called = rankOf(top) === EIGHT;
  return (
    <>
      {game.stock.length === 0 ? null : <LaidCard card={null} left={30} top={6} testId="cards-stock" />}
      <TableWords left={22} top={29} width={30}>
        {game.stock.length === 0 ? "No stock" : `${game.stock.length} in the stock`}
      </TableWords>
      <LaidCard card={top} left={55} top={6} testId="cards-discard" />
      {called ? (
        <TableWords left={45} top={29} width={35} testId="cards-called">
          {SUIT_SIGNS[game.suit]} {suitWords(game.suit)} called
        </TableWords>
      ) : null}
    </>
  );
}

/** Crazy Eights at the table: a card that matches, an eight and the suit it calls, or a draw. */
export const CRAZY_EIGHTS_ADAPTER: CardAdapter<CrazyEightsGame, CrazyEightsMove> = {
  kind: "crazyEights",
  rules: CRAZY_EIGHTS_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 1,
  actions: (game, chosen) => {
    const moves = CRAZY_EIGHTS_RULES.moves(game);
    const actions: CardAction<CrazyEightsMove>[] = [];
    const card = chosen.length === 1 ? chosen[0] : null;
    if (card !== null && rankOf(card) === EIGHT) {
      // An eight calls a suit: one press a suit, each the whole move.
      for (const suit of SUITS) {
        const move: CrazyEightsMove = { play: card, suit };
        actions.push({ label: `${SUIT_SIGNS[suit]} Call ${suitWords(suit)}`, move: CRAZY_EIGHTS_RULES.play(game, move) === null ? null : move, testId: `cards-call-${suit}`, strong: true });
      }
    } else {
      const move: CrazyEightsMove | null = card === null ? null : { play: card };
      const ok = move !== null && CRAZY_EIGHTS_RULES.play(game, move) !== null;
      actions.push({ label: "Play", move: ok ? move : null, testId: "cards-play", strong: true, why: card === null ? "Choose a card that matches the suit or the rank." : "That card does not match the suit or the rank." });
    }
    const draw = moves.find((move) => "draw" in move);
    if (draw !== undefined) actions.push({ label: "Draw", move: draw, testId: "cards-draw" });
    const pass = moves.find((move) => "pass" in move);
    if (pass !== undefined) actions.push({ label: "Pass", move: pass, testId: "cards-pass" });
    return actions;
  },
  // A double tap plays a card that matches; an eight waits for its suit to be called.
  quick: (game, card) => {
    if (rankOf(card) === EIGHT) return null;
    const move: CrazyEightsMove = { play: card };
    return CRAZY_EIGHTS_RULES.play(game, move) === null ? null : move;
  },
  status: (game, name) => {
    if (game.toPlay === null) return "";
    if (game.drawn !== null) return `${name(game.toPlay)} drew: play the card drawn if it matches, or pass.`;
    return `${name(game.toPlay)} to play: ${SUIT_SIGNS[game.suit]} ${suitWords(game.suit)}, or a card of the same rank, or an eight.`;
  },
  standing: (game, seat) => ({ score: String(game.scores[seat]) }),
  scoreWords: "Points, first to the total wins",
  Centre: CrazyEightsCentre,
};
