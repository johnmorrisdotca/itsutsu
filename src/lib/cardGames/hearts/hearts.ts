import { computerSeats } from "../cardGameCodec";
import { HEARTS_SIZES } from "../cardGames.constants";
import type { CardId } from "../cardGames.types";
import { allDifferent, choices, dealRound, nextSeat, rankOf, shuffledDeck, suitOf, without } from "../cards";

import type { HeartsGame, HeartsMove, HeartsPlay } from "./hearts.types";

/**
 * HEARTS: the rules, and nothing else.
 *
 * Three or four players; every heart taken is a point and the queen of spades
 * thirteen, and the lowest score when somebody reaches the game's size (50 or
 * 100) wins. Before each deal three cards are passed — left, right, across
 * and then held, round and round (with three at the table: left, right,
 * held). The two of clubs leads the first trick, no points may be played to
 * it, and hearts may not be led until one has been thrown. Take all
 * twenty-six points in one deal and you have shot the moon: you score
 * nothing, and everybody else twenty-six.
 *
 * Pure: every function returns a new game and leaves the one given alone.
 */

export const QUEEN_OF_SPADES = "QS";
export const TWO_OF_CLUBS = "2C";
const PASSED = 3;
/** Every point in a deal: thirteen hearts and the queen. */
export const HEARTS_ALL_POINTS = 26;

/** A card's height in a trick: ace high. */
export function heartsHeight(card: CardId): number {
  const rank = rankOf(card);
  return rank === 1 ? 14 : rank;
}

/** A card's points: a heart one, the queen of spades thirteen. */
export function heartsPoints(card: CardId): number {
  if (card === QUEEN_OF_SPADES) return 13;
  return suitOf(card) === "H" ? 1 : 0;
}

/** The cards left out: none for four; for three, the two of diamonds, so each holds seventeen. */
function leftOut(seats: number): CardId[] {
  return seats === 3 ? ["2D"] : [];
}

/** How far round the table the cards go this deal: 1 to the left, seats − 1 to the right, 2 across, 0 held. */
export function passOffset(deal: number, seats: number): number {
  const cycle = seats === 4 ? [1, 3, 2, 0] : [1, seats - 1, 0];
  return cycle[deal % cycle.length];
}

/** A hand sorted as a player holds it: clubs, diamonds, spades, hearts, low to high within each. */
export function sortHearts(hand: readonly CardId[]): CardId[] {
  const order = "CDSH";
  return [...hand].sort((a, b) => order.indexOf(suitOf(a)) - order.indexOf(suitOf(b)) || heartsHeight(a) - heartsHeight(b));
}

/** A new deal: the cards shuffled from the game's seed and this deal's number, and passing begun (or play, on a held deal). */
function dealHearts(game: Omit<HeartsGame, "hands" | "passing" | "received" | "trick" | "played" | "toPlay" | "heartsBroken" | "points" | "phase">): HeartsGame {
  const seats = game.players.length;
  const { hands } = dealRound(shuffledDeck(game.seed, game.deal, leftOut(seats)), seats);
  const dealt: HeartsGame = {
    ...game,
    phase: "passing",
    hands: hands.map(sortHearts),
    passing: new Array<CardId[] | null>(seats).fill(null),
    received: hands.map(() => []),
    trick: [],
    played: [],
    toPlay: 0,
    heartsBroken: false,
    points: new Array<number>(seats).fill(0),
  };
  return passOffset(game.deal, seats) === 0 ? beginPlay(dealt) : dealt;
}

/** Play begins: whoever holds the two of clubs leads it. */
function beginPlay(game: HeartsGame): HeartsGame {
  const leader = game.hands.findIndex((hand) => hand.includes(TWO_OF_CLUBS));
  return { ...game, phase: "playing", toPlay: leader };
}

export function startHearts(size: number, players: readonly string[], _language?: unknown, dealt?: number, computers?: readonly boolean[]): HeartsGame | null {
  if (size !== HEARTS_SIZES.short && size !== HEARTS_SIZES.full) return null;
  if (players.length < 3 || players.length > 4) return null;
  return dealHearts({
    size,
    players: [...players],
    computers: computerSeats(players.length, computers),
    seed: dealt ?? 1,
    moves: [],
    deal: 0,
    lastTrick: null,
    scores: new Array<number>(players.length).fill(0),
    dealScores: [],
    moon: null,
  });
}

/** Whether this is the first trick of the deal, to which no points may be played. */
function firstTrick(game: HeartsGame): boolean {
  return game.played.length === 0;
}

/** The cards the seat to play may lay on the trick now. */
export function heartsPlayable(game: HeartsGame): CardId[] {
  if (game.phase !== "playing" || game.toPlay === null) return [];
  const hand = game.hands[game.toPlay];
  if (game.trick.length === 0) {
    if (firstTrick(game)) return hand.filter((card) => card === TWO_OF_CLUBS);
    const notHearts = hand.filter((card) => suitOf(card) !== "H");
    return game.heartsBroken || notHearts.length === 0 ? hand : notHearts;
  }
  const led = suitOf(game.trick[0].card);
  const following = hand.filter((card) => suitOf(card) === led);
  if (following.length > 0) return following;
  if (!firstTrick(game)) return hand;
  const safe = hand.filter((card) => heartsPoints(card) === 0);
  return safe.length > 0 ? safe : hand;
}

/** Who takes a finished trick: the highest card of the suit led. */
export function trickWinner(trick: readonly HeartsPlay[]): number {
  const led = suitOf(trick[0].card);
  let best = trick[0];
  for (const play of trick) if (suitOf(play.card) === led && heartsHeight(play.card) > heartsHeight(best.card)) best = play;
  return best.seat;
}

export function heartsMoves(game: HeartsGame): HeartsMove[] {
  if (game.phase === "passing" && game.toPlay !== null) return choices(game.hands[game.toPlay], PASSED).map((pass) => ({ pass }));
  return heartsPlayable(game).map((play) => ({ play }));
}

function passCards(game: HeartsGame, seat: number, cards: readonly CardId[]): HeartsGame | null {
  if (cards.length !== PASSED || !allDifferent(cards) || without(game.hands[seat], cards) === null) return null;
  const passing = game.passing.map((chosen, at) => (at === seat ? [...cards] : chosen));
  const waiting = passing.findIndex((chosen) => chosen === null);
  if (waiting >= 0) return { ...game, passing, toPlay: waiting };
  // Everybody has chosen: the cards change hands all at once, as at a table.
  const seats = game.players.length;
  const offset = passOffset(game.deal, seats);
  const received = passing.map((_, seat) => passing[(seat - offset + seats) % seats] as CardId[]);
  const hands = game.hands.map((hand, seat) => sortHearts([...(without(hand, passing[seat] as CardId[]) as CardId[]), ...received[seat]]));
  return beginPlay({ ...game, passing, received, hands });
}

function playCard(game: HeartsGame, seat: number, card: CardId): HeartsGame | null {
  if (!heartsPlayable(game).includes(card)) return null;
  const hands = game.hands.map((hand, at) => (at === seat ? hand.filter((held) => held !== card) : hand));
  const trick = [...game.trick, { seat, card }];
  const heartsBroken = game.heartsBroken || suitOf(card) === "H";
  if (trick.length < game.players.length) return { ...game, hands, trick, heartsBroken, toPlay: nextSeat(seat, game.players.length) };
  const winner = trickWinner(trick);
  const taken = trick.reduce((sum, play) => sum + heartsPoints(play.card), 0);
  const points = game.points.map((had, at) => (at === winner ? had + taken : had));
  const after: HeartsGame = { ...game, hands, trick: [], heartsBroken, points, played: [...game.played, ...trick.map((play) => play.card)], lastTrick: { plays: trick, winner }, toPlay: winner };
  return hands[0].length === 0 ? endDeal(after) : after;
}

/** The deal is played out: the points go on the scores (or the moon is shot), and the game ends or the next deal is dealt. */
function endDeal(game: HeartsGame): HeartsGame {
  const moon = game.points.findIndex((points) => points === HEARTS_ALL_POINTS);
  const dealt = moon >= 0 ? game.points.map((_, seat) => (seat === moon ? 0 : HEARTS_ALL_POINTS)) : game.points;
  const scores = game.scores.map((score, seat) => score + dealt[seat]);
  const finished = { ...game, scores, dealScores: [...game.dealScores, dealt], moon: moon >= 0 ? moon : null };
  if (Math.max(...scores) >= game.size) return { ...finished, phase: "over", toPlay: null };
  return dealHearts({ ...finished, deal: game.deal + 1 });
}

export function playHearts(game: HeartsGame, move: HeartsMove): HeartsGame | null {
  if (game.toPlay === null) return null;
  const seat = game.toPlay;
  const next = "pass" in move ? (game.phase === "passing" ? passCards(game, seat, move.pass) : null) : game.phase === "playing" ? playCard(game, seat, move.play) : null;
  return next === null ? null : { ...next, moves: [...game.moves, move] };
}

/** The lowest score wins; level on the lowest shares it. */
export function heartsWinners(game: HeartsGame): number[] {
  if (game.phase !== "over") return [];
  const best = Math.min(...game.scores);
  return game.scores.flatMap((score, seat) => (score === best ? [seat] : []));
}
