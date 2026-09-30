"use client";

import { cardWords, suitWords } from "@/lib/cardGames/cards";
import type { CardSuit } from "@/lib/cardGames/cardGames.types";
import { dealerOf, partnerOf, teamOf } from "@/lib/cardGames/euchre/euchre";
import { EUCHRE_RULES } from "@/lib/cardGames/euchre/euchreRules";
import type { EuchreGame, EuchreMove } from "@/lib/cardGames/euchre/euchre.types";

import type { CardAction, CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords, trickPlace } from "./CardTableParts";

const SUIT_SIGNS: Record<CardSuit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

/**
 * THE TABLE: while trumps are being made, the card turned up in the middle
 * (turned down once everybody has passed it); then the trick, from the
 * viewer's seat as Hearts and Spades lay it, and which suit is trumps and who
 * made them.
 */
function EuchreCentre({ game, viewer, players }: CardCentreProps<EuchreGame>) {
  if (game.phase === "order" || game.phase === "call") {
    return (
      <>
        <LaidCard card={game.phase === "order" ? game.upcard : null} left={43.5} top={8} testId="cards-upcard" />
        <TableWords left={15} top={30} width={70} testId="cards-making">
          {game.phase === "order"
            ? `${players[dealerOf(game.deal)]} deals. Order up the ${cardWords(game.upcard)}, or pass?`
            : `The ${cardWords(game.upcard)} was turned down: name another suit, or pass.`}
        </TableWords>
      </>
    );
  }
  const showing = game.trick.length > 0 ? game.trick : (game.lastTrick?.plays ?? []);
  const taken = game.trick.length === 0 && game.lastTrick !== null && game.phase === "playing" ? game.lastTrick.winner : null;
  return (
    <>
      {showing.map((play) => (
        <LaidCard key={play.card} card={play.card} {...trickPlace(play.seat, viewer ?? 0, 4)} testId="cards-trick-card" />
      ))}
      {taken === null ? null : (
        <TableWords left={30} top={22} width={40} testId="cards-trick-taken">
          {players[taken]} took the trick
        </TableWords>
      )}
      {game.trump === null || game.maker === null ? null : (
        <TableWords left={1} top={1} width={42} testId="cards-trumps">
          {SUIT_SIGNS[game.trump]} {suitWords(game.trump)}, made by {players[game.maker]}
        </TableWords>
      )}
    </>
  );
}

/** Euchre at the table: the making of trumps, the dealer's discard, then one card played a trick. */
export const EUCHRE_ADAPTER: CardAdapter<EuchreGame, EuchreMove> = {
  kind: "euchre",
  rules: EUCHRE_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 1,
  actions: (game, chosen) => {
    const dealer = dealerOf(game.deal);
    if (game.phase === "order") {
      const up = game.toPlay === dealer ? `Pick up the ${cardWords(game.upcard)}` : `Order up the ${cardWords(game.upcard)}`;
      return [
        { label: up, move: { order: true }, testId: "cards-order" },
        { label: "Pass", move: { pass: true }, testId: "cards-pass" },
      ];
    }
    if (game.phase === "call") {
      const calls = EUCHRE_RULES.moves(game).flatMap((move): CardAction<EuchreMove>[] => ("call" in move ? [{ label: `${SUIT_SIGNS[move.call]} Call ${suitWords(move.call)}`, move, testId: `cards-call-${move.call}` }] : []));
      return game.toPlay === dealer ? calls : [...calls, { label: "Pass", move: { pass: true }, testId: "cards-pass" }];
    }
    const card = chosen.length === 1 ? chosen[0] : null;
    if (game.phase === "discard") {
      return [{ label: "Throw away", move: card === null ? null : { discard: card }, testId: "cards-discard-card", strong: true, why: "You picked up the turned card: choose one card to throw away." }];
    }
    const move: EuchreMove | null = card === null ? null : { play: card };
    const ok = move !== null && EUCHRE_RULES.play(game, move) !== null;
    return [{ label: "Play", move: ok ? move : null, testId: "cards-play", strong: true, why: card === null ? "Choose a card to play." : "Follow the suit led if you can: the left bower counts as a trump." }];
  },
  quick: (game, card) => {
    if (game.phase === "discard") return { discard: card };
    if (game.phase !== "playing") return null;
    const move: EuchreMove = { play: card };
    return EUCHRE_RULES.play(game, move) === null ? null : move;
  },
  // The turned card the dealer has just picked up, marked until one is thrown away.
  arrived: (game, seat) => (game.phase === "discard" && seat === dealerOf(game.deal) ? [game.upcard] : []),
  status: (game, name) => {
    if (game.toPlay === null) return "";
    const who = `${name(game.toPlay)}, partnered with ${name(partnerOf(game.toPlay))}`;
    if (game.phase === "order") return `${who}: order up the ${cardWords(game.upcard)} as trumps, or pass.`;
    if (game.phase === "call") return game.toPlay === dealerOf(game.deal) ? `${name(game.toPlay)} deals, and must name trumps.` : `${who}: name trumps, or pass.`;
    if (game.phase === "discard") return `${name(game.toPlay)} picked up the ${cardWords(game.upcard)}: throw one card away.`;
    return `${name(game.toPlay)} ${game.trick.length === 0 ? "to lead" : "to play"}.`;
  },
  standing: (game, seat) => {
    const team = teamOf(seat);
    const together = game.tricks[team] + game.tricks[team + 2];
    const making = game.maker !== null && teamOf(game.maker) === team;
    return {
      score: String(game.scores[team]),
      note: game.phase === "playing" ? `took ${game.tricks[seat]}; the pair ${together}${making ? ", making trumps" : ""}` : seat === dealerOf(game.deal) && game.phase !== "over" ? "deals" : undefined,
    };
  },
  scoreWords: "Partnership points, across the table",
  Centre: EuchreCentre,
};
