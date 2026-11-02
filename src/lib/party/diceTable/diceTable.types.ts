import type { PartyRules } from "../party.types";

/**
 * WHAT THE PLAIN DICE TABLES SHARE (Pig, Ten Thousand, Liar's Dice, Sayu): a game is
 * its table and its moves, and everything else is read again from them, as
 * every party game's is. `size` is the game's one choice at the set-up: the
 * score it is played to, or how many dice or counters each player starts with.
 *
 * Nothing is at stake in any of them. What a game counts (points, dice,
 * counters) exists inside that one game, starts level for everybody, and is
 * never bought, carried over or swapped for XP, IP or stars.
 */
export type DiceTableBase<M> = {
  size: number;
  /** Every throw is drawn from this and how many throws came before, so a reload throws nothing new. */
  seed: number;
  players: readonly string[];
  /** One a seat: true where a computer plays. */
  computers: readonly boolean[];
  moves: readonly M[];
  /** How many throws the game has made. */
  thrown: number;
  phase: "playing" | "over";
  /** Whose move it is; once over, whoever moved last. */
  toPlay: number;
  /** On a game that is over, every seat that won. */
  winners: readonly number[];
};

/** A dice table's rules: what every party game's answer, whose move it is, what a computer in that seat does, and who sits where, as a card game's do. */
export type DiceTableRules<S, M> = PartyRules<S, M> & {
  toPlay: (game: S) => number | null;
  /** The move a computer in the seat to move makes, read only from what that seat may know: always one of `moves(game)`. */
  computer: (game: S) => M;
  seats: (game: S) => { players: readonly string[]; computers: readonly boolean[] };
};
