// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PartyRules } from "../party.types";

import { gunjinMoves, gunjinOver, gunjinWinners, playGunjin, startGunjin } from "./gunjin";
import { decodeGunjin, encodeGunjin } from "./gunjinCodec";
import type { GunjinGame, GunjinMove } from "./gunjin.types";

/**
 * Gunjin as every party game's rules answer (`PartyRules`): two players, one of
 * four boards, each side's arrangement and every move kept. The gate plays
 * it with the arrangements `gunjinMoves` offers; a person's own are a move the
 * same rules take.
 */
export const GUNJIN_RULES: PartyRules<GunjinGame, GunjinMove> = {
  start: (size, players) => startGunjin(size, players),
  moves: gunjinMoves,
  play: playGunjin,
  over: gunjinOver,
  winners: gunjinWinners,
  encode: encodeGunjin,
  decode: decodeGunjin,
};
