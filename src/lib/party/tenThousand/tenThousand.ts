// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { diceTableCodec, leaders, nextSeat, seatsOf, throwDice } from "../diceTable/diceTable";
import type { DiceTableRules } from "../diceTable/diceTable.types";

import { diceInMask, tenThousandScore, scoringMasks } from "./tenThousandScore";
import type { TenThousandGame, TenThousandMove } from "./tenThousand.types";

/**
 * TEN THOUSAND: six dice, and how long to press your luck.
 *
 * Throw the six. Set aside at least one die that scores, then throw the rest or
 * bank the turn. A throw with nothing that scores is a bust, and the turn is
 * lost with everything it made. Score with all six and you throw all six again
 * ("hot dice"). Reach the score and everybody else has one more turn to pass
 * you; the highest total wins. Pure, as the engine is.
 *
 * An old folk game with many names. This is the plain one: the best-known boxed
 * name for it is its owner's, as Yacht's and Tenka's are, and appears nowhere here.
 */

export const TEN_THOUSAND_DICE = 6;
export const TEN_THOUSAND_SIZES = [2000, 5000, 10000] as const;
export const TEN_THOUSAND_DEFAULT_SIZE = 10000;
export const TEN_THOUSAND_FEWEST = 2;
export const TEN_THOUSAND_MOST = 8;

function start(size: number, players: readonly string[], _language?: unknown, seed = 1, computers?: readonly boolean[]): TenThousandGame | null {
  if (!TEN_THOUSAND_SIZES.includes(size as (typeof TEN_THOUSAND_SIZES)[number])) return null;
  const seats = seatsOf(players, computers, TEN_THOUSAND_FEWEST, TEN_THOUSAND_MOST);
  if (seats === null) return null;
  return { size, seed, ...seats, moves: [], thrown: 0, phase: "playing", toPlay: 0, winners: [], stage: "roll", dice: [], aside: [], turnPoints: 0, banked: players.map(() => 0), lastRoundFrom: null, last: null };
}

function moves(game: TenThousandGame): TenThousandMove[] {
  if (game.phase === "over") return [];
  if (game.stage === "roll") return [{ kind: "roll" }];
  if (game.stage === "keep") return scoringMasks(game.dice).map((mask) => ({ kind: "keep", mask }));
  return [{ kind: "roll" }, { kind: "bank" }];
}

/** The turn passed on, or the game over when the last round has come round to the player who began it. */
function turnEnds(game: TenThousandGame, banked: readonly number[]): TenThousandGame {
  const seat = game.toPlay;
  const reached = banked[seat]! >= game.size;
  const lastRoundFrom = game.lastRoundFrom ?? (reached ? seat : null);
  const next = nextSeat(game.players.length, seat, () => true);
  const cleared = { ...game, banked, turnPoints: 0, aside: [], stage: "roll" as const, lastRoundFrom };
  if (lastRoundFrom !== null && next === lastRoundFrom) return { ...cleared, phase: "over", winners: leaders(banked) };
  return { ...cleared, toPlay: next };
}

function play(game: TenThousandGame, move: TenThousandMove): TenThousandGame | null {
  if (game.phase === "over") return null;
  const seat = game.toPlay;
  const moved = [...game.moves, move];
  if (move.kind === "roll") {
    if (game.stage === "keep") return null;
    // Every die set aside, or a new turn: all six go back in the cup.
    const fresh = game.stage === "roll" || game.dice.length === 0;
    const dice = throwDice(game.seed, game.thrown, fresh ? TEN_THOUSAND_DICE : game.dice.length);
    const aside = fresh ? [] : game.aside;
    const thrown = { ...game, moves: moved, thrown: game.thrown + 1, dice, aside };
    if (scoringMasks(dice).length > 0) return { ...thrown, stage: "keep", last: { seat, kind: "rolled" } };
    return { ...turnEnds(thrown, game.banked), last: { seat, kind: "bust", lost: game.turnPoints } };
  }
  if (move.kind === "keep") {
    if (game.stage !== "keep" || !Number.isInteger(move.mask) || move.mask <= 0 || move.mask >= 1 << game.dice.length) return null;
    const chosen = diceInMask(game.dice, move.mask);
    const score = tenThousandScore(chosen);
    if (score === null) return null;
    const dice = game.dice.filter((_, at) => (move.mask & (1 << at)) === 0);
    return { ...game, moves: moved, stage: "more", dice, aside: [...game.aside, ...chosen], turnPoints: game.turnPoints + score, last: { seat, kind: "kept", points: score, hot: dice.length === 0 } };
  }
  if (move.kind !== "bank" || game.stage !== "more") return null;
  const banked = game.banked.map((points, at) => (at === seat ? points + game.turnPoints : points));
  return { ...turnEnds({ ...game, moves: moved }, banked), dice: [], last: { seat, kind: "banked", points: game.turnPoints } };
}

function isTenThousandMove(value: unknown): value is TenThousandMove {
  const move = value as { kind?: unknown; mask?: unknown } | null;
  return move?.kind === "roll" || move?.kind === "bank" || (move?.kind === "keep" && Number.isInteger(move.mask));
}

const codec = diceTableCodec<TenThousandGame, TenThousandMove>("tenThousand", start, play, isTenThousandMove);

/** What the dice left to throw are worth having, roughly: more dice score more and bust less. */
const WORTH_OF_DICE_LEFT = [500, 25, 50, 90, 150, 225, 500];

/** The turn it banks at, by how many dice it would throw next: the usual advice for a cautious player. */
const BANKS_AT = [Infinity, 300, 250, 400, 1000, 2000, Infinity];

/**
 * THE COMPUTER'S TURN: sets aside what leaves the turn worth most, counting the
 * dice left to throw, and banks at the figures above, unless the last round
 * demands it pass somebody. Reads the table and nothing else: Ten Thousand
 * hides nothing, and the dice to come are never looked at.
 */
function computer(game: TenThousandGame): TenThousandMove {
  if (game.stage === "roll") return { kind: "roll" };
  if (game.stage === "keep") {
    let best = 0;
    let bestWorth = -1;
    for (const mask of scoringMasks(game.dice)) {
      const chosen = diceInMask(game.dice, mask);
      const worth = tenThousandScore(chosen)! + WORTH_OF_DICE_LEFT[game.dice.length - chosen.length]!;
      if (worth > bestWorth) {
        best = mask;
        bestWorth = worth;
      }
    }
    return { kind: "keep", mask: best };
  }
  const total = game.banked[game.toPlay]! + game.turnPoints;
  const toBeat = game.lastRoundFrom === null ? null : Math.max(...game.banked);
  if (toBeat !== null && total <= toBeat) return { kind: "roll" };
  if (game.lastRoundFrom === null && total >= game.size) return { kind: "bank" };
  return game.turnPoints >= BANKS_AT[game.dice.length]! ? { kind: "bank" } : { kind: "roll" };
}

export const TEN_THOUSAND_RULES: DiceTableRules<TenThousandGame, TenThousandMove> = {
  start,
  moves,
  play,
  over: (game) => game.phase === "over",
  winners: (game) => game.winners,
  encode: codec.encode,
  decode: codec.decode,
  toPlay: (game) => (game.phase === "over" ? null : game.toPlay),
  computer,
  seats: (game) => ({ players: game.players, computers: game.computers }),
};
