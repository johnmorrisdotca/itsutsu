import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { RulesDraft } from "./rulesDraft";

/**
 * WHAT THE SETUP SCREEN ARRIVED KNOWING.
 *
 * Every way of starting a game leads to that screen, and each of them knows a
 * different amount — so these are the shapes of "already decided". They are
 * read off the address by `setUpFrom` and handed to `SetUpGame` as props; the
 * screen itself never parses a query, and nothing about what is known is held
 * in a cookie or a store.
 */

/** The person or program this game is against, once the address has been read. */
export type SetUpOpponent = {
  /**
   * Their member id, which is also how the creation is addressed. An address
   * would not do: a computer player has none, because it never signs in.
   */
  id: string;
  name: string;
  /** A program. It answers at once, is never away, and keeps its own rating. */
  computer: boolean;
};

/** A finished game being played again. */
export type SetUpAgain = {
  id: string;
  /**
   * The colour the asker takes, because a rematch swaps them — black moves
   * first and that is worth something. Named on the screen for the same reason
   * it was named on the button: a swap nobody mentions is found out three
   * moves in.
   */
  colour: Stone;
};

/** A position being carried out of another game into a new one. */
export type SetUpFork = {
  id: string;
  move: number;
  /** True where nobody held the other seat, so the new game is one at this screen. */
  alone: boolean;
  /**
   * The colour whoever is forking keeps — a position belongs to the colours that
   * were in it, and the route hands the forker their own seat back.
   *
   * Null where this reader was not in the game being forked at all, which is a
   * fork into a board at one screen. Nullable rather than defaulted for the usual
   * reason: black is a real colour and would read as one.
   */
  colour: Stone | null;
};

/**
 * Everything the screen needs, settled on the server.
 *
 * `initial` is the draft with whatever is known already written into it, so
 * that arriving from a rematch is a form somebody can press Start on rather
 * than a form somebody has to fill in twice.
 */
export type SetUpFrom = {
  initial: RulesDraft;
  /**
   * The game this was filled in from, AS IT WAS PLAYED. Null where nothing was
   * filled in from a game at all.
   *
   * A second draft beside `initial`, because the two answer different questions
   * and one value cannot answer both. `initial` is what the form opens with,
   * which an address may have changed; this is what the old game actually was.
   * `creationFor` compares them to decide whether it is still asking for a
   * rematch — a rematch takes every rule from the game it repeats, so the moment
   * somebody changes one it has to stop claiming to be one, or the change is
   * thrown away in silence.
   */
  asPlayed: RulesDraft | null;
  opponent: SetUpOpponent | null;
  again: SetUpAgain | null;
  fork: SetUpFork | null;
  /**
   * What a rematch or a fork carries that this form has no row for — the line
   * length, the seed that scatters a variant's obstacles, who opens, the agreed
   * draw limit.
   *
   * Sent with the creation so that changing a field on a rematch does not
   * quietly reset the parts of the game nobody was offered. A freestyle game
   * agreed at three in a row is the case that made this necessary: without it,
   * changing the clock on a rematch of one would have handed back a game
   * needing five.
   */
  carry: Record<string, unknown>;
  /**
   * Why the screen could not start from what the address asked for, when it
   * could not — a rematch of a game still being played, a fork of a game that
   * never had that many moves, somebody who is not there.
   *
   * Said rather than swallowed. A screen that silently ignores half its own
   * address is one that looks like it worked and did something else.
   */
  problem: string | null;
};
