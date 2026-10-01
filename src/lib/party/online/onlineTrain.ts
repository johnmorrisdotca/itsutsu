// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { TRAIN_DOUBLES, TRAIN_LENGTHS, TRAIN_MEXICAN, TRAIN_PHASES, decodeTrain, encodeTrain, moveCount, playTrain, startTrain } from "@johnmorrisdotca/domino";
import type { TrainGame, TrainMove, TrainOptions } from "@johnmorrisdotca/domino";
import { PARTY_SPECS } from "../party.constants";

import { COMPUTER_SEAT_NAME } from "./online.constants";
import type { OnlineRules } from "./online.types";

/**
 * MEXICAN TRAIN AT A TABLE ON SEVERAL DEVICES (docs/plans/dominoes/README.md,
 * "Several devices"): the same pure rules the table on one device plays
 * (`playTrain`), and the same text it keeps a game as (`encodeTrain`: the set,
 * the house rules, the seed and the moves, every hand and the boneyard made
 * again from them).
 *
 * Not through `fromPartyRules`: every shuffle is drawn from the seed, which the
 * set-up's browser draws (as on one device) and sends with the house rules,
 * where the party rules' `start` would deal every table alike; and a seat may
 * be the game's own computer player, which the party rules leave to the table.
 * A move is one move — a tile laid on a train, a draw, a pass, or the next
 * round dealt — exactly as on one device.
 */

/** What Mexican Train's set-up sends beyond a set and the seats: the seed it was dealt from, and the house rules. */
export type TrainTableSetUp = { seed: number; options: TrainOptions };

/** The largest seed a table takes: a whole number the size a browser's `freshSeed` draws. */
const TRAIN_SEED_MOST = 2 ** 31 - 1;

/** The largest tile or train number a move can name: a double-fifteen tile is 255, and there are nine trains at most. */
const TRAIN_NUMBER_MOST = 255;

const SPEC = PARTY_SPECS.mexicanTrain;

const isOneOf = <T extends string>(values: Record<string, T>, value: unknown): value is T => Object.values(values).includes(value as T);

/** The set-up as the browser sent it, checked for its shape, or null. */
function readSetUp(sent: unknown): TrainTableSetUp | null {
  if (typeof sent !== "object" || sent === null) return null;
  const { seed, options } = sent as Record<string, unknown>;
  if (typeof seed !== "number" || !Number.isInteger(seed) || seed < 1 || seed > TRAIN_SEED_MOST) return null;
  if (typeof options !== "object" || options === null) return null;
  const { length, doubles, mexican } = options as Record<string, unknown>;
  if (!isOneOf(TRAIN_LENGTHS, length) || !isOneOf(TRAIN_DOUBLES, doubles) || !isOneOf(TRAIN_MEXICAN, mexican)) return null;
  return { seed, options: { length, doubles, mexican } };
}

const smallWhole = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= TRAIN_NUMBER_MOST;

export const TRAIN_ONLINE: OnlineRules<TrainGame, TrainMove> = {
  sizes: SPEC.sizes,
  counts: Array.from({ length: SPEC.mostPlayers - SPEC.fewestPlayers + 1 }, (_, at) => SPEC.fewestPlayers + at),
  start: (size, count, extra) => {
    const setUp = readSetUp(extra?.setup);
    if (setUp === null) return null;
    const computers = new Set(extra?.computers ?? []);
    // A table of blank names: the names are the seats', written in for a page by `named`.
    const blanks = new Array<string>(count).fill("");
    return startTrain(size, blanks, setUp.seed, setUp.options, blanks.map((_, seat) => computers.has(seat)));
  },
  encode: encodeTrain,
  decode: (text) => decodeTrain(text),
  toPlay: (game) => (game.phase === TRAIN_PHASES.finished ? null : game.toPlay),
  winners: (game) => (game.phase === TRAIN_PHASES.finished ? game.winners : []),
  moveCount,
  readMove: (sent) => {
    if (typeof sent !== "object" || sent === null) return null;
    const { kind, tile, train } = sent as Record<string, unknown>;
    if (kind === "draw" || kind === "pass" || kind === "next") return { kind };
    return kind === "play" && smallWhole(tile) && smallWhole(train) ? { kind, tile, train } : null;
  },
  play: playTrain,
  named: (game, names) => ({ ...game, players: game.players.map((was, seat) => names[seat] ?? was) }),
  // The table's own computer player (`trainComputer.ts`), one level of it, sitting as "Computer"; its move is the worker's.
  computers: {
    levels: ["computer"],
    seat: () => ({ memberId: null, name: COMPUTER_SEAT_NAME }),
    levelOf: (seat) => (seat.memberId === null ? "computer" : null),
  },
};
