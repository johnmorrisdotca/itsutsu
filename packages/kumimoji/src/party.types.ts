import type { Tiles } from "./grid.ts";
import type { KumimojiLanguage, KumimojiLength, KumimojiLevel } from "./kumimoji.types.ts";

/** What a pass-and-play game was set up as: the address's own choices, which a kept game is matched to. */
export type PartySettings = {
  /** The hand each player is dealt: 7 Quick or 11 Classic (3 in the browser tests alone). */
  size: number;
  level: KumimojiLevel;
  /** The seed the bag was made from; the bag itself is kept too, so a kept game never depends on the generator. */
  seed: number;
  gameLength: KumimojiLength;
  language: KumimojiLanguage;
  doubleSet: boolean;
  /** Whether Diagonals was chosen: every table in the game is read along its diagonals too (`judgeGrid`). */
  diagonals: boolean;
  /** Whether Help was chosen on the set-up screen. */
  hints: boolean;
};

/**
 * One player: their name as typed (empty for "Player N"), their hand and
 * their own table, and whether the seat is a computer's (`computerTurn.ts`),
 * whose turns play themselves in the browser. A computer's name is always
 * written out ("Computer 1"), never left for its number.
 */
export type PartyPlayer = {
  name: string;
  hand: readonly string[];
  tiles: Tiles;
  computer?: boolean;
};

/** A seat asked for before the deal or at a join: a name (empty for its number) and whether a computer plays it. */
export type PartySeat = { name: string; computer?: boolean };

/**
 * A PASS-AND-PLAY KUMIMOJI: one bag, read as a line the way the solo game
 * reads it (`TilePlay`), and a hand and a table for each player.
 */
export type PartyGame = {
  settings: PartySettings;
  /** The tiles in the order they come out. */
  bag: string;
  /** Tiles traded back, in order; they come out after the bag. */
  returned: string;
  /** How many tiles have been taken from `bag + returned`, by every player together. */
  taken: number;
  /** Up to eight; two to eight when dealt, and one or more after players leave (`partySeats.ts`). */
  players: readonly PartyPlayer[];
  /**
   * How many the game was dealt to: the address's own `players`, which a
   * kept game is matched to, however many have joined or left since.
   */
  dealt: number;
  /** Whose turn it is, by place in `players`. */
  turn: number;
  /** How many turns have been ended, and seats left: a turn's own number, so each one opens on a fresh view. */
  turns: number;
  /** The players who went out, in the order they did; the first is the one who began the last round. */
  out: readonly number[];
  /**
   * THE LAST ROUND: null until somebody goes out, then the players still to
   * take their one last turn, in order. John, 2026-09-28: "once one person
   * goes out the remaining players get one last move. That should make it
   * fair."
   */
  lastTurns: readonly number[] | null;
  /** The players who resigned, in the order they did: their turns are passed over from then on. */
  resigned: readonly number[];
  /** The resignations since a player still in last pressed Done: who is tied if nobody is left standing. */
  resignRun: readonly number[];
  /** How the game ended (`PartyEnding`), or null while it is played. */
  ending: PartyEnding | null;
  /** The tiles on the table of the player whose turn it is when the turn began, in order (`tableTally`): whether they have laid anything since. */
  startTable: string;
  /** Whether the player whose turn it is has traded this turn. */
  traded: boolean;
  /** Who played the turn before this one — pressed Done or resigned — or null before anybody has: whose table the pass screen opens on. */
  passedBy: number | null;
};

/**
 * HOW A PASS-AND-PLAY GAME ENDS. `out`: somebody went out and everybody else
 * had a last turn; the winners are everybody who went out. `standing`: every
 * other player resigned and the last one in laid a tile. `tied`: nobody was
 * left standing, and the players who resigned in that final run are tied.
 */
export type PartyEnding = "out" | "standing" | "tied";
