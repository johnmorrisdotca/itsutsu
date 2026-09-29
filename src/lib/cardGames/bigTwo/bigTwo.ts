import { computerSeats } from "../cardGameCodec";
import { BIG_TWO_DEALS } from "../cardGames.constants";
import type { CardId } from "../cardGames.types";
import { dealRound, shuffledDeck } from "../cards";
import { afterTurn, freshTrick, laid, passedOn } from "../climbing/climbing";
import type { ClimbMove } from "../climbing/climbing.types";

import { bigTwoBeats, bigTwoPlays, bigTwoValue, sortBigTwo } from "./bigTwoHands";
import type { BigTwoGame } from "./bigTwo.types";

/**
 * BIG TWO: the rules, and nothing else.
 *
 * Two to four players, thirteen cards each (seventeen with three, the last
 * card going to whoever holds the three of diamonds). Whoever holds the lowest
 * card dealt leads, and that first play must include it. Round the table,
 * each player beats what is on the table with a play of the same number of
 * cards, or passes, and a pass holds until the trick is over; when everybody
 * else has passed, the last to play leads anything. The first to be rid of
 * every card wins the deal, and everybody else is charged a point a card left
 * — double for ten or more, treble for thirteen or more. After the game's
 * deals, the fewest points wins.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */


/** A new deal from the game's seed: hands dealt and sorted, and the lowest card's holder to lead. */
function dealBigTwo(game: Omit<BigTwoGame, "hands" | "pile" | "passed" | "toPlay" | "played" | "opening">): BigTwoGame {
  const seats = game.players.length;
  const deck = shuffledDeck(game.seed, game.deal);
  const { hands } = seats === 3 ? threeHanded(deck) : dealRound(deck, seats, 13);
  const sorted = hands.map(sortBigTwo);
  const opening = sortBigTwo(sorted.flat())[0];
  const leader = sorted.findIndex((hand) => hand.includes(opening));
  return { ...game, ...freshTrick(sorted, leader), opening };
}

/** Three at the table: seventeen each, and the fifty-second card to whoever holds the three of diamonds. */
function threeHanded(deck: readonly CardId[]): { hands: CardId[][] } {
  const { hands, stock } = dealRound(deck, 3, 17);
  const holder = hands.findIndex((hand) => hand.includes("3D"));
  return { hands: hands.map((hand, seat) => (seat === holder ? [...hand, ...stock] : hand)) };
}

export function startBigTwo(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): BigTwoGame | null {
  if (!(BIG_TWO_DEALS as readonly number[]).includes(size)) return null;
  if (players.length < 2 || players.length > 4) return null;
  return dealBigTwo({
    size,
    players: [...players],
    computers: computerSeats(players.length, computers),
    seed: dealt ?? 1,
    moves: [],
    deal: 0,
    phase: "playing",
    penalties: new Array<number>(players.length).fill(0),
    deals: [],
  });
}

/** Whether these cards may be played now by the seat to play. */
export function bigTwoMayPlay(game: BigTwoGame, cards: readonly CardId[]): boolean {
  if (game.toPlay === null) return false;
  const value = bigTwoValue(cards);
  if (value === null) return false;
  const hand = game.hands[game.toPlay];
  if (!cards.every((card) => hand.includes(card))) return false;
  if (game.opening !== null && !cards.includes(game.opening)) return false;
  if (game.pile === null) return true;
  const table = bigTwoValue(game.pile.cards);
  return table !== null && bigTwoBeats(value, table);
}

export function bigTwoMoves(game: BigTwoGame): ClimbMove[] {
  if (game.phase === "over" || game.toPlay === null) return [];
  const plays = bigTwoPlays(game.hands[game.toPlay])
    .filter((cards) => bigTwoMayPlay(game, cards))
    .map((cards): ClimbMove => ({ play: cards }));
  return game.pile === null ? plays : [...plays, { pass: true }];
}

/** What a hand left in is charged when somebody goes out: a point a card, double for ten or more, treble for thirteen or more. */
export function bigTwoCharge(left: number): number {
  return left >= 13 ? left * 3 : left >= 10 ? left * 2 : left;
}

function endDeal(game: BigTwoGame, winner: number): BigTwoGame {
  const charged = game.hands.map((hand) => bigTwoCharge(hand.length));
  const penalties = game.penalties.map((had, seat) => had + charged[seat]);
  const finished = { ...game, penalties, deals: [...game.deals, { winner, charged }] };
  if (finished.deals.length >= game.size) return { ...finished, phase: "over", toPlay: null, pile: null };
  return dealBigTwo({ ...finished, deal: game.deal + 1 });
}

export function playBigTwo(game: BigTwoGame, move: ClimbMove): BigTwoGame | null {
  if (game.phase === "over" || game.toPlay === null) return null;
  const seat = game.toPlay;
  let next: BigTwoGame | null;
  if ("pass" in move) {
    if (move.pass !== true || game.pile === null) return null;
    next = afterTurn(passedOn(game, seat), seat);
  } else {
    if (!bigTwoMayPlay(game, move.play)) return null;
    const after = laid({ ...game, opening: null }, seat, sortBigTwo(move.play));
    if (after === null) return null;
    next = after.hands[seat].length === 0 ? endDeal(after, seat) : afterTurn(after, seat);
  }
  return { ...next, moves: [...game.moves, move] };
}

/** The fewest penalty points wins; level on the fewest shares it. */
export function bigTwoWinners(game: BigTwoGame): number[] {
  if (game.phase !== "over") return [];
  const best = Math.min(...game.penalties);
  return game.penalties.flatMap((points, seat) => (points === best ? [seat] : []));
}
