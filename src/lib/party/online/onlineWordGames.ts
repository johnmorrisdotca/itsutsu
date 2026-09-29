// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { MANCALA_RULES, MANCALA_STATUS } from "../mancala/mancala";
import type { MancalaGame } from "../mancala/mancala.types";
import { PARTY_SPECS } from "../party.constants";
import type { PartyLanguage } from "../party.types";
import { GHOST_END, GHOST_PHASE, decodeGhost, encodeGhost, playGhost, startGhost } from "../superghost/superghost";
import type { GhostGame, GhostJudge, GhostMove } from "../superghost/superghost.types";

import { fromPartyRules } from "./onlineGames.parts";
import type { OnlineRules } from "./online.types";

/**
 * THE PARTY KINDS THAT JOINED AFTER DOTS AND BOXES: Superghost and Mancala at
 * a table on several devices.
 */

/** Every count from the fewest to the most. */
function countsBetween(fewest: number, most: number): number[] {
  return Array.from({ length: most - fewest + 1 }, (_, index) => fewest + index);
}

const MANCALA_SPEC = PARTY_SPECS.mancala;

/** Mancala, straight from its party rules (`fromPartyRules`): a move is the pit sown from. */
export const MANCALA_ONLINE: OnlineRules<MancalaGame, number> = fromPartyRules(
  MANCALA_RULES,
  { sizes: MANCALA_SPEC.sizes, counts: countsBetween(MANCALA_SPEC.fewestPlayers, MANCALA_SPEC.mostPlayers) },
  {
    toPlay: (game) => (game.status === MANCALA_STATUS.playing ? game.toPlay : null),
    moveCount: (game) => game.moves.length,
    readMove: (sent) => (Number.isInteger(sent) ? (sent as number) : null),
    named: (game, names) => ({ ...game, players: game.players.map((was, seat) => names[seat] ?? was) }),
  },
);

/**
 * A MOVE AT SUPERGHOST: the move, and the browser's word on the one thing the
 * word list decides about it — whether the letter finished a word, or the
 * word named in answer is one. John, 2026-09-29, for Kumimoji and every word
 * game after it: "browser checks to save $$$". So the server plays it with a
 * judge that answers what the browser said (the same `recordedJudge` shape a
 * kept game is read back with), and never loads a list; everything else —
 * whose turn, a letter of the alphabet, an answer long enough and holding the
 * fragment — is the rules' own check.
 */
export type GhostTableMove = { move: GhostMove; word: boolean };

/** The judge a move is played with at a table: the browser's word, and no list. */
function saidJudge(word: boolean): GhostJudge {
  return { isWord: () => word, wordWith: () => null };
}

/** The length of a game's record, round by round: each move adds to it, so it never repeats. */
function marksOf(game: GhostGame): number {
  return game.rounds.reduce((sum, round) => sum + [...round.record].length, 0) + [...game.record].length;
}

const GHOST_SPEC = PARTY_SPECS.superghost;
const GHOST_LANGUAGES: readonly PartyLanguage[] = GHOST_SPEC.languages ?? [];

/**
 * Superghost, from its own pure moves rather than its party rules row, which
 * reads the word list (`ghostRules.ts`): the table's language comes with the
 * set-up (`{ language }`), the first the game offers when none is said.
 */
export const SUPERGHOST_ONLINE: OnlineRules<GhostGame, GhostTableMove> = {
  sizes: GHOST_SPEC.sizes,
  counts: countsBetween(GHOST_SPEC.fewestPlayers, GHOST_SPEC.mostPlayers),
  start: (size, count, extra) => {
    const asked = (extra?.setup as { language?: unknown } | undefined)?.language;
    const language = asked === undefined ? GHOST_LANGUAGES[0] : GHOST_LANGUAGES.find((one) => one === asked);
    return language === undefined ? null : startGhost(size, new Array<string>(count).fill(""), language);
  },
  encode: encodeGhost,
  decode: (text) => decodeGhost(text),
  toPlay: (game) => (game.phase === GHOST_PHASE.finished ? null : game.toPlay),
  winners: (game) => (game.phase === GHOST_PHASE.finished ? game.winners : []),
  moveCount: marksOf,
  readMove: (sent) => {
    if (typeof sent !== "object" || sent === null) return null;
    const { move, word } = sent as { move?: unknown; word?: unknown };
    if (typeof word !== "boolean" || typeof move !== "object" || move === null) return null;
    const { kind, letter, end, word: named } = move as Record<string, unknown>;
    if (kind === "challenge" || kind === "concede") return { move: { kind }, word };
    if (kind === "letter" && typeof letter === "string" && [...letter].length === 1 && (end === GHOST_END.before || end === GHOST_END.after)) {
      return { move: { kind, letter, end }, word };
    }
    if (kind === "answer" && typeof named === "string" && named.length > 0 && named.length <= 40) return { move: { kind, word: named }, word };
    return null;
  },
  play: (game, sent) => playGhost(game, sent.move, saidJudge(sent.word)),
  named: (game, names) => ({ ...game, players: game.players.map((was, seat) => names[seat] ?? was) }),
};
