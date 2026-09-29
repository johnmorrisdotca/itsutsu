// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PartyRules } from "../party.types";

import type { TenkaGame, TenkaMove } from "./tenka.types";
import { playTenka, tenkaOver } from "./tenka";
import { decodeTenka, encodeTenka } from "./tenkaKeep";
import { tenkaMoves } from "./tenkaMoves";
import { sensibleTenkaMove } from "./tenkaPolicy";
import { startTenka } from "./tenkaStart";

/**
 * Tenka as every party game's rules are asked (`PartyRules`): a size is how
 * many rounds before the count, and a game of chance takes its seed — the
 * gate's own, so every one of its games is dealt and thrown differently and
 * the same every run. Started this way the armies are placed at random, as
 * the set-up does unless asked otherwise.
 */
export const TENKA_RULES: PartyRules<TenkaGame, TenkaMove> = {
  // A game with no words ignores the language; the seed is what it is dealt and thrown from.
  start: (size, players, _language, seed = 0) => startTenka(size, players, seed >>> 0),
  moves: tenkaMoves,
  play: playTenka,
  over: tenkaOver,
  winners: (game) => game.winners,
  encode: encodeTenka,
  decode: decodeTenka,
  sensible: sensibleTenkaMove,
};
