import { computerSeats } from "../cardGameCodec.ts";
import { GO_FISH_SIZES } from "../cardGames.constants.ts";
import type { CardId, CardRank } from "../cardGames.types.ts";
import { dealRound, nextSeat, rankOf, shuffledDeck, suitOf } from "../cards.ts";

import type { GoFishEvent, GoFishGame, GoFishMove } from "./goFish.types.ts";

/**
 * GO FISH: the rules, and nothing else.
 *
 * Two to six players; seven cards each for two or three, five for four or
 * more, and the rest spread face down as the pond. On your turn, ask one
 * player for a rank you hold. If they have any, they hand you every one and
 * you ask again. If not, they say "Go fish" and you draw from the pond: draw
 * the rank you asked for and you show it and ask again; draw anything else
 * and your turn is over. Four of a rank is a book, laid down at once. A
 * player whose hand runs out draws a card when their turn comes, and sits out
 * once the pond is empty too. When all thirteen books are down, the most
 * books wins.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */

const ALL_BOOKS = 13;

/** Seven cards each for two or three players, five for more. */
export function goFishHandSize(seats: number): number {
  return seats <= 3 ? 7 : 5;
}

/** A hand as a player holds it: grouped by rank, ace to king. */
export function sortGoFish(hand: readonly CardId[]): CardId[] {
  return [...hand].sort((a, b) => rankOf(a) - rankOf(b) || suitOf(a).localeCompare(suitOf(b)));
}

/** Lays down every book in this seat's hand. */
function layBooks(game: GoFishGame, seat: number): GoFishGame {
  let hand = game.hands[seat];
  const laid: CardRank[] = [];
  for (const rank of new Set(hand.map(rankOf))) {
    if (hand.filter((card) => rankOf(card) === rank).length === 4) {
      hand = hand.filter((card) => rankOf(card) !== rank);
      laid.push(rank);
    }
  }
  if (laid.length === 0) return game;
  return {
    ...game,
    hands: game.hands.map((held, at) => (at === seat ? hand : held)),
    books: game.books.map((books, at) => (at === seat ? [...books, ...laid] : books)),
    log: [...game.log, ...laid.map((rank): GoFishEvent => ({ kind: "book", seat, rank }))],
  };
}

/** One card from the pond to this seat, face down; null when the pond is empty. */
function drawOne(game: GoFishGame, seat: number): { game: GoFishGame; card: CardId } | null {
  const [card, ...stock] = game.stock;
  if (card === undefined) return null;
  return { game: { ...game, stock, hands: game.hands.map((hand, at) => (at === seat ? sortGoFish([...hand, card]) : hand)) }, card };
}

/** Whether every book is down. */
function allBooked(game: GoFishGame): boolean {
  return game.books.reduce((sum, books) => sum + books.length, 0) === ALL_BOOKS;
}

/**
 * The turn goes to this seat if it can play: holding cards, or with an empty
 * hand while the pond still has one to draw. Otherwise on round the table;
 * the game is over when all the books are down (or, which is the same, nobody
 * can play).
 */
function turnTo(game: GoFishGame, seat: number): GoFishGame {
  if (allBooked(game)) return { ...game, phase: "over", toPlay: null };
  const seats = game.players.length;
  for (let step = 0; step < seats; step += 1) {
    const at = (seat + step) % seats;
    if (game.hands[at].length > 0) return { ...game, toPlay: at };
    const drawn = drawOne(game, at);
    if (drawn !== null) return turnTo(layBooks({ ...drawn.game, log: [...drawn.game.log, { kind: "draw", seat: at }] }, at), at);
  }
  return { ...game, phase: "over", toPlay: null };
}

export function startGoFish(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): GoFishGame | null {
  if (!(GO_FISH_SIZES as readonly number[]).includes(size)) return null;
  if (players.length < 2 || players.length > 6) return null;
  const seed = dealt ?? 1;
  const { hands, stock } = dealRound(shuffledDeck(seed, 0), players.length, goFishHandSize(players.length));
  let game: GoFishGame = {
    size,
    players: [...players],
    computers: computerSeats(players.length, computers),
    seed,
    moves: [],
    phase: "playing",
    hands: hands.map(sortGoFish),
    stock,
    books: players.map(() => []),
    toPlay: 0,
    log: [],
  };
  // A book dealt whole is laid down before anybody asks.
  for (let seat = 0; seat < players.length; seat += 1) game = layBooks(game, seat);
  return turnTo(game, 0);
}

/** The players the seat to move may ask: everybody else holding cards, or, when nobody else does, anybody else. */
export function goFishTargets(game: GoFishGame): number[] {
  if (game.toPlay === null) return [];
  const others = game.players.map((_, seat) => seat).filter((seat) => seat !== game.toPlay);
  const holding = others.filter((seat) => game.hands[seat].length > 0);
  return holding.length > 0 ? holding : others;
}

/** The ranks the seat to move may ask for: those it holds. */
export function goFishRanks(game: GoFishGame): CardRank[] {
  if (game.toPlay === null) return [];
  return [...new Set(game.hands[game.toPlay].map(rankOf))].sort((a, b) => a - b);
}

export function goFishMoves(game: GoFishGame): GoFishMove[] {
  if (game.phase === "over") return [];
  const ranks = goFishRanks(game);
  return goFishTargets(game).flatMap((ask) => ranks.map((rank) => ({ ask, rank })));
}

export function playGoFish(game: GoFishGame, move: GoFishMove): GoFishGame | null {
  const seat = game.toPlay;
  if (game.phase === "over" || seat === null) return null;
  if (!goFishTargets(game).includes(move.ask) || !goFishRanks(game).includes(move.rank)) return null;
  const asked = move.ask;
  const handed = game.hands[asked].filter((card) => rankOf(card) === move.rank);
  const moved = { ...game, moves: [...game.moves, move] };
  if (handed.length > 0) {
    const hands = moved.hands.map((hand, at) => (at === asked ? hand.filter((card) => rankOf(card) !== move.rank) : at === seat ? sortGoFish([...hand, ...handed]) : hand));
    const event: GoFishEvent = { kind: "ask", seat, asked, rank: move.rank, got: handed.length, fished: null };
    // A catch: ask again (or, with nothing left in hand, draw first).
    return turnTo(layBooks({ ...moved, hands, log: [...moved.log, event] }, seat), seat);
  }
  const drawn = drawOne(moved, seat);
  if (drawn === null) {
    const dry: GoFishEvent = { kind: "ask", seat, asked, rank: move.rank, got: 0, fished: "dry" };
    return turnTo({ ...moved, log: [...moved.log, dry] }, nextSeat(seat, game.players.length));
  }
  const caught = rankOf(drawn.card) === move.rank;
  const event: GoFishEvent = { kind: "ask", seat, asked, rank: move.rank, got: 0, fished: caught ? "caught" : "missed" };
  const after = layBooks({ ...drawn.game, log: [...drawn.game.log, event] }, seat);
  return turnTo(after, caught ? seat : nextSeat(seat, game.players.length));
}

/** The most books wins; level on the most shares it. */
export function goFishWinners(game: GoFishGame): number[] {
  if (game.phase !== "over") return [];
  const top = Math.max(...game.books.map((books) => books.length));
  return game.books.flatMap((books, seat) => (books.length === top ? [seat] : []));
}
