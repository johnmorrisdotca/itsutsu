import type { PartyLanguage } from "../party.types";

/**
 * Superghost, as its rules module (`superghost.ts`) speaks of it.
 *
 * A LETTER is one character of the game's alphabet: a to z for English, and
 * for Japanese one of the forty-five base kana Kumimoji's tiles are
 * (`lib/puzzles/kumimoji/kana.ts`), が being played as か and ゃ as や. The
 * fragment and every word the rules judge are spelt in those letters only.
 */

/** Who did something: a player's place round the table, 0 first. */
export type GhostSeat = number;

/** Which end of the fragment a letter goes on. */
export type GhostEnd = "before" | "after";

/**
 * One move. On an ordinary turn, a letter at one end, or a challenge of the
 * player who added the last one. When challenged, a word the fragment is
 * part of, or the admission that they have none.
 */
export type GhostMove =
  | { kind: "letter"; letter: string; end: GhostEnd }
  | { kind: "challenge" }
  | { kind: "answer"; word: string }
  | { kind: "concede" };

/**
 * Where a game is: adding letters, waiting for the challenged player's word,
 * or over.
 */
export type GhostPhase = "adding" | "answering" | "finished";

/**
 * How a round was lost:
 *
 * - `spelled`: the loser's letter finished a word of the shortest length or more;
 * - `caught`: the loser was challenged and could not name a word;
 * - `named`: the loser challenged, and the player they challenged named a word.
 */
export type GhostLoss = "spelled" | "caught" | "named";

/** A round that is over: what the fragment came to, who took a letter for it and why. */
export type GhostRound = {
  fragment: string;
  loser: GhostSeat;
  how: GhostLoss;
  /** The word spelled, or the word named; null when the loser could not name one. */
  word: string | null;
  /** The seat who challenged, for a round ended by a challenge. */
  challenger: GhostSeat | null;
  /** The seat challenged: who named the word, or could not. */
  challenged: GhostSeat | null;
  /** The round's moves, as kept (`superghost.ts` writes and reads them). */
  record: string;
};

/**
 * A game, as its moves make it. Only the table (`language`, `shortest`,
 * `players`, `first`) and the moves, round by round, are ever kept
 * (`encodeGhost`); everything else is read again from them.
 */
export type GhostGame = {
  language: PartyLanguage;
  /** The shortest word that loses a round: four, as the game is traditionally played. */
  shortest: number;
  /** The names given at the table, in seat order: "" for one left blank. */
  players: readonly string[];
  /** The seat that began the first round. */
  first: GhostSeat;
  /** Every round played to its end, in order. */
  rounds: readonly GhostRound[];
  /** Per seat, the letters of GHOST taken so far: five and they are out. */
  letters: readonly number[];
  /** The seat that began the round being played. */
  starter: GhostSeat;
  /** The letters so far this round. */
  fragment: string;
  /** This round's moves so far, as kept. */
  record: string;
  /** Who added the last letter this round: the one a challenge is made of. Null before the first. */
  lastBy: GhostSeat | null;
  /** While answering, who challenged. */
  challenger: GhostSeat | null;
  /** The seat whose turn it is: to add or challenge, or, when answering, to name a word. On a finished game, the winner. */
  toPlay: GhostSeat;
  phase: GhostPhase;
  /** On a finished game, the one player left. Empty while playing. */
  winners: readonly GhostSeat[];
};

/**
 * What the rules ask of a word list, and nothing more. The game is played
 * with Kumimoji's lists (`ghostWords.ts`); a kept game is read back with the
 * verdicts it was played with, and a test with a list of its own.
 */
export type GhostJudge = {
  /** Whether these letters are a word in the list. */
  isWord: (letters: string) => boolean;
  /** A word in the list, `shortest` letters or more, that has `fragment` in it; null when there is none. */
  wordWith: (fragment: string, shortest: number) => string | null;
};

/** Why a word named in answer to a challenge is not taken, or null when it is. */
export type GhostAnswerProblem = "letters" | "short" | "missing" | "unknown";
