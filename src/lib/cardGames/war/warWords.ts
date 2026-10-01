import type { WarGame, WarTurn } from "@johnmorrisdotca/toranpu/war";

import { cardWords, rankOf, rankWords } from "../cards";
import type { CardId } from "../cardGames.types";

/*
 * WHAT WAR SAYS AT THE TABLE, in words: what the last turn laid and who took
 * it, and how a game ended. Pure, so the words are tested without a screen.
 */

/** What one seat laid in a turn: the card turned up first (the tie, in a war), how many lay face down, and the card turned up last. */
export function laidBy(last: WarTurn, seat: number): { first: CardId | null; down: number; final: CardId | null } {
  const mine = last.laid.filter((one) => one.seat === seat);
  const up = mine.filter((one) => !one.down);
  return { first: up[0]?.card ?? null, down: mine.length - up.length, final: up.length > 1 ? up[up.length - 1].card : null };
}

/** The last turn in a line: what each turned over, and who took the cards. */
export function warWords(game: WarGame, name: (seat: number) => string): string {
  const last = game.last;
  if (last === null) return "Turn the cards over to begin.";
  const [one, two] = [laidBy(last, 0), laidBy(last, 1)];
  const seen = (cards: ReturnType<typeof laidBy>) => cards.final ?? cards.first;
  if (last.wars === 0) {
    const [a, b] = [one.first, two.first];
    if (a === null || b === null) return "";
    return `${name(0)} turned ${cardWords(a)} and ${name(1)} turned ${cardWords(b)}.${last.winner === null ? "" : ` ${name(last.winner)} takes both.`}`;
  }
  const tied = one.first === null ? "" : `Both turned ${rankWords(rankOf(one.first))}: war! `;
  const [a, b] = [seen(one), seen(two)];
  if (a === null || b === null || last.winner === null) return `${tied}Neither player could finish the war.`.trim();
  return `${tied}${name(0)} turned ${cardWords(a)} and ${name(1)} turned ${cardWords(b)}. ${name(last.winner)} takes all ${last.laid.length} cards.`;
}

/** How the game ended, in a line, and whether it was a draw: nobody can call level piles a win. */
export function warEnding(game: WarGame, name: (seat: number) => string): { line: string; draw: boolean } {
  const [more, other] = game.hands[0].length >= game.hands[1].length ? [0, 1] : [1, 0];
  const draw = game.hands[0].length === game.hands[1].length && game.ended !== "cleared";
  if (game.ended === "cleared") return { line: `${name(more)} holds every card.`, draw: false };
  if (game.ended === "short") return { line: `${name(other)} could not finish a war, so ${name(more)} takes every card.`, draw };
  if (game.ended === "drawn") return { line: "Neither player could finish the war, and both had the same number of cards: a draw.", draw: true };
  return {
    line: draw ? `The turns have run out and both hold ${game.hands[0].length} cards: a draw.` : `The turns have run out, and ${name(more)} holds more cards.`,
    draw,
  };
}

