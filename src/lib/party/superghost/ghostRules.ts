import { PARTY_SPECS } from "../party.constants";
import type { PartyRules } from "../party.types";

import { ghostJudge, loadGhostWords } from "./ghostWords";
import { GHOST_PHASE, decodeGhost, encodeGhost, ghostMoves, playGhost, startGhost } from "./superghost";
import type { GhostGame, GhostMove } from "./superghost.types";

/**
 * Superghost as every party game's rules are asked (`PartyRules`), judged by
 * Kumimoji's lists in the game's own language (`ghostWords.ts`), which
 * `prepare` fetches first. A move is a letter at one end, a challenge, a word
 * named or none.
 */
export const SUPERGHOST_RULES: PartyRules<GhostGame, GhostMove> = {
  start: (size, players, language = PARTY_SPECS.superghost.languages?.[0]) =>
    language === undefined ? null : startGhost(size, players, language),
  moves: (game) => ghostMoves(game, ghostJudge(game.language)),
  play: (game, move) => playGhost(game, move, ghostJudge(game.language)),
  over: (game) => game.phase === GHOST_PHASE.finished,
  winners: (game) => game.winners,
  encode: encodeGhost,
  decode: decodeGhost,
  prepare: async () => {
    await Promise.all((PARTY_SPECS.superghost.languages ?? []).map((language) => loadGhostWords(language)));
  },
};
