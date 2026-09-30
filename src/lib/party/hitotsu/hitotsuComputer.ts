// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { HITOTSU_COLOURS } from "./hitotsu.constants";
import { hitotsuJumpIns, hitotsuMoves } from "./hitotsu";
import type { HitotsuCard, HitotsuColour, HitotsuGame, HitotsuMove } from "./hitotsu.types";
import { DRAW_TWO, REVERSE, SKIP, WILD, WILD_FOUR, colourOf, faceOf, hitotsuPoints, isWild } from "./hitotsuDeck";

/**
 * A COMPUTER AT THE HITOTSU TABLE. It sees its own hand, the pile, the colour
 * to follow, what it faces, and how many cards each player holds — never
 * another hand, and never whether a Wild Draw Four it faces was a bluff.
 *
 * - Facing a draw, it stacks if it can (a Draw Two before a Wild Draw Four),
 *   and otherwise takes it — or challenges a Wild Draw Four played by a hand
 *   big enough that it most likely held the colour.
 * - On its turn it plays an ordinary card when it has one: an action card at
 *   the player next to go out, else the card that keeps it in the colour it
 *   holds most of and sheds the most points. Wilds are saved for when nothing
 *   else goes, and a Wild Draw Four for last, and it never bluffs one.
 * - A seven swaps with the smallest hand; a colour called is the one it holds
 *   most of. It always calls "Hitotsu!", and jumps in whenever it can.
 * - With nothing to play it draws, and plays the card drawn if it goes and is
 *   not a wild (which it keeps).
 */

export type HitotsuView = {
  seat: number;
  hand: readonly HitotsuCard[];
  counts: readonly number[];
  colour: HitotsuColour;
  /** The seat that plays after this one, as things stand. */
  next: number;
  drawn: HitotsuCard | null;
  /** A Wild Draw Four this seat may challenge: who played it. Nothing of whether it was a bluff. */
  challengeFrom: number | null;
  legal: readonly HitotsuMove[];
};

export function hitotsuView(game: HitotsuGame, seat: number = game.toPlay ?? 0): HitotsuView {
  const count = game.players.length;
  return {
    seat,
    hand: game.hands[seat],
    counts: game.hands.map((hand) => hand.length),
    colour: game.colour,
    next: (((seat + game.direction) % count) + count) % count,
    drawn: game.drawn,
    challengeFrom: game.challenge?.by ?? null,
    legal: seat === game.toPlay ? hitotsuMoves(game) : hitotsuJumpIns(game).filter((move) => "jump" in move && move.seat === seat),
  };
}

/** The colour this hand holds most of, red first among equals so the choice is always the same. */
export function longestColour(hand: readonly HitotsuCard[]): HitotsuColour {
  const count = (colour: HitotsuColour) => hand.filter((card) => colourOf(card) === colour).length;
  return HITOTSU_COLOURS.reduce((best, colour) => (count(colour) > count(best) ? colour : best));
}

type Play = Extract<HitotsuMove, { play: HitotsuCard }> | Extract<HitotsuMove, { jump: HitotsuCard }>;
const cardOf = (move: Play) => ("play" in move ? move.play : move.jump);

/** Of the ways to play one card, the one this computer means: its best colour, the smallest hand to swap with, and the call made. */
function bestWay(view: HitotsuView, ways: readonly Play[]): Play {
  const card = cardOf(ways[0]);
  const rest = view.hand.filter((held) => held !== card);
  const colour = longestColour(rest);
  const smallest = view.counts.reduce((best, count, seat) => (seat !== view.seat && (best < 0 || count < view.counts[best]) ? seat : best), -1);
  const score = (way: Play) => (way.colour === colour ? 4 : 0) + (way.swap === smallest ? 2 : 0) + (way.call === true ? 1 : 0);
  return ways.reduce((best, way) => (score(way) > score(best) ? way : best));
}

/** Every card offered, each with the way this computer would play it. */
function playsOf(view: HitotsuView): Play[] {
  const plays = view.legal.filter((move): move is Play => "play" in move || "jump" in move);
  const cards = [...new Set(plays.map(cardOf))];
  return cards.map((card) => bestWay(view, plays.filter((move) => cardOf(move) === card)));
}

export function hitotsuComputer(game: HitotsuGame): HitotsuMove {
  const view = hitotsuView(game);
  const plays = playsOf(view);
  const fallback = view.legal[view.legal.length - 1];
  // Facing a draw: stack a Draw Two before a Wild Draw Four; else challenge a big hand's four, or take it.
  if (view.legal.some((move) => "take" in move)) {
    const stack = plays.find((move) => faceOf(cardOf(move)) === DRAW_TWO) ?? plays[0];
    if (stack !== undefined) return stack;
    if (view.challengeFrom !== null && view.counts[view.challengeFrom] >= 6) return { challenge: true };
    return { take: true };
  }
  if (plays.length === 0) return fallback;
  if (view.drawn !== null) {
    // A card just drawn: played if it goes and is not a wild, unless the hand is nearly gone.
    const drawn = plays[0];
    return isWild(cardOf(drawn)) && view.hand.length > 2 ? { pass: true } : drawn;
  }
  const ordinary = plays.filter((move) => !isWild(cardOf(move)));
  if (ordinary.length > 0) {
    const threat = view.counts[view.next] <= 2;
    const worth = (move: Play) => {
      const card = cardOf(move);
      const face = faceOf(card);
      const left = view.hand.filter((held) => held !== card);
      const sameColour = left.filter((held) => colourOf(held) === colourOf(card)).length;
      const attack = threat && (face === SKIP || face === DRAW_TWO || face === REVERSE) ? 100 : 0;
      return attack + sameColour * 10 + hitotsuPoints(card);
    };
    return ordinary.reduce((best, move) => (worth(move) > worth(best) ? move : best));
  }
  // Only wilds go: a plain wild first, the four last — or the four at once at a player about to go out.
  const threat = view.counts[view.next] <= 2;
  const wild = plays.find((move) => faceOf(cardOf(move)) === WILD);
  const four = plays.find((move) => faceOf(cardOf(move)) === WILD_FOUR);
  return (threat ? (four ?? wild) : (wild ?? four)) ?? plays[0];
}

/**
 * A computer's card played out of turn, where the table jumps in: the first
 * computer seat round from the player to move that holds a card identical to
 * the top one. Null when none can, or jump-in is not played.
 */
export function hitotsuComputerJump(game: HitotsuGame): HitotsuMove | null {
  const jumps = hitotsuJumpIns(game);
  if (jumps.length === 0 || game.toPlay === null) return null;
  const count = game.players.length;
  for (let step = 1; step < count; step += 1) {
    const seat = (game.toPlay + step) % count;
    if (!game.computers[seat]) continue;
    const view = hitotsuView(game, seat);
    const mine = playsOf(view);
    if (mine.length > 0) return mine[0];
  }
  return null;
}
