// By package name, which resolves from node_modules for Playwright too; the rest of lib/party stays relative, as the browser specs resolve no alias.
import { HITOTSU_CLASSIC, decodeHitotsu, encodeHitotsu, hitotsuComputer, hitotsuMoves, hitotsuWinners, playHitotsu, startHitotsu, type HitotsuGame, type HitotsuMove } from "@johnmorrisdotca/hitotsu";
import type { PartyRules } from "../party.types";

/**
 * Hitotsu as every party game's rules answer (`PartyRules`): what the New
 * Game Gate plays out at every table it offers, by the published rules. The
 * house rules a table chooses are its set-up's, and the tests beside the rules
 * play each of them out too (`src/rules.test.ts` in the Hitotsu repository); a table starts its game
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
