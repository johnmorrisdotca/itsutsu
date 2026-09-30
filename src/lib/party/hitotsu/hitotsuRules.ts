// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PartyRules } from "../party.types";

import { hitotsuComputer } from "./hitotsuComputer";
import { HITOTSU_CLASSIC, HITOTSU_COLOURS } from "./hitotsu.constants";
import { hitotsuMoves, hitotsuWinners, playHitotsu, startHitotsu } from "./hitotsu";
import type { HitotsuColour, HitotsuGame, HitotsuMove, HitotsuOptions } from "./hitotsu.types";
import { isHitotsuCard } from "./hitotsuDeck";

/**
 * A GAME OF HITOTSU AS TEXT, and back: its table (the size, the names, which
 * seats a computer plays, the house rules), the seed its deals are shuffled
 * from, and every move in order — never a hand or a pile, which the moves make
 * again. Read back, the game is started from its table and seed and every move
 * played again through the rules, so what comes back is exactly the game those
 * moves make, or nothing.
 */

const KEPT_VERSION = 1;
const KEPT_NAME = "hitotsu";

const isColour = (value: unknown) => typeof value === "string" && (HITOTSU_COLOURS as readonly string[]).includes(value);
const isSeat = (value: unknown) => Number.isInteger(value) && (value as number) >= 0 && (value as number) < 8;

/** House rules as something sent them, checked for shape, or null. */
export function readHitotsuOptions(value: unknown): HitotsuOptions | null {
  if (typeof value !== "object" || value === null) return null;
  const { stacking, jumpIn, sevenZero, drawToMatch, wildFour, deal } = value as Record<string, unknown>;
  if (stacking !== "off" && stacking !== "same" && stacking !== "any") return null;
  if (typeof jumpIn !== "boolean" || typeof sevenZero !== "boolean" || typeof drawToMatch !== "boolean") return null;
  if (wildFour !== "challenge" && wildFour !== "strict") return null;
  if (deal !== 7 && deal !== 5) return null;
  return { stacking, jumpIn, sevenZero, drawToMatch, wildFour, deal };
}

/** A move as something sent it, checked for its shape only: whether it may be made is the rules'. */
export function readHitotsuMove(value: unknown): HitotsuMove | null {
  if (typeof value !== "object" || value === null) return null;
  const move = value as Record<string, unknown>;
  const extras = (from: Record<string, unknown>) => {
    if (from.colour !== undefined && !isColour(from.colour)) return null;
    if (from.swap !== undefined && !isSeat(from.swap)) return null;
    if (from.call !== undefined && typeof from.call !== "boolean") return null;
    return {
      ...(from.colour === undefined ? {} : { colour: from.colour as HitotsuColour }),
      ...(from.swap === undefined ? {} : { swap: from.swap as number }),
      ...(from.call === undefined ? {} : { call: from.call as boolean }),
    };
  };
  if (isHitotsuCard(move.play)) {
    const more = extras(move);
    return more === null ? null : { play: move.play, ...more };
  }
  if (isHitotsuCard(move.jump) && isSeat(move.seat)) {
    const more = extras(move);
    return more === null ? null : { jump: move.jump, seat: move.seat as number, ...more };
  }
  if (move.draw === true) return { draw: true };
  if (move.pass === true) return { pass: true };
  if (move.take === true) return { take: true };
  if (move.challenge === true) return { challenge: true };
  return null;
}

export function encodeHitotsu(game: HitotsuGame): string {
  return JSON.stringify({ v: KEPT_VERSION, g: KEPT_NAME, size: game.size, players: game.players, computers: game.computers, seed: game.seed, options: game.options, moves: game.moves });
}

export function decodeHitotsu(text: string | null): HitotsuGame | null {
  if (text === null) return null;
  let kept: unknown;
  try {
    kept = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null) return null;
  const { v, g, size, players, computers, seed, options, moves } = kept as Record<string, unknown>;
  if (v !== KEPT_VERSION || g !== KEPT_NAME || typeof size !== "number" || typeof seed !== "number" || !Number.isInteger(seed)) return null;
  if (!Array.isArray(players) || !players.every((name) => typeof name === "string")) return null;
  if (!Array.isArray(computers) || computers.length !== players.length || !computers.every((seat) => typeof seat === "boolean")) return null;
  const house = readHitotsuOptions(options);
  if (house === null || !Array.isArray(moves)) return null;
  let game = startHitotsu(size, players as string[], seed, house, computers as boolean[]);
  for (const sent of moves) {
    const move = readHitotsuMove(sent);
    if (game === null || move === null) return null;
    game = playHitotsu(game, move);
  }
  return game;
}

/**
 * Hitotsu as every party game's rules answer (`PartyRules`): what the New
 * Game Gate plays out at every table it offers, by the published rules. The
 * house rules a table chooses are its set-up's, and the tests beside the rules
 * play each of them out too (`hitotsu.test.ts`); a table starts its game
 * with them through `startWith`.
 */
export const HITOTSU_RULES: PartyRules<HitotsuGame, HitotsuMove> & { startWith: typeof startHitotsu } = {
  start: (size, players, _language, seed, computers) => startHitotsu(size, players, seed ?? 1, HITOTSU_CLASSIC, computers),
  startWith: startHitotsu,
  moves: hitotsuMoves,
  play: playHitotsu,
  over: (game) => game.phase === "over",
  winners: hitotsuWinners,
  encode: encodeHitotsu,
  decode: decodeHitotsu,
  // A player who draws whenever it may never finishes a hand: the gate plays the table's own computer player, never jumping in.
  sensible: (game) => hitotsuComputer(game),
};
