// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { HITOTSU_CLASSIC, decodeHitotsu, encodeHitotsu, hitotsuComputer, hitotsuMoves, hitotsuWinners, playHitotsu, startHitotsu, type HitotsuGame, type HitotsuMove } from "../../../../packages/hitotsu/src/index.ts";
import type { PartyRules } from "../party.types";

/**
 * Hitotsu as every party game's rules answer (`PartyRules`): what the New
 * Game Gate plays out at every table it offers, by the published rules. The
 * house rules a table chooses are its set-up's, and the tests beside the rules
 * play each of them out too (`packages/hitotsu/src/rules.test.ts`); a table starts its game
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
