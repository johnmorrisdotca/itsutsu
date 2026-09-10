import type { PieceCell, Point, Stone, Twist } from "./gomoku.types";
import type { ExpertKind } from "./expert/expert.types";

/**
 * The computer opponent: what a turn looks like when a program takes one, and
 * how strongly it is meant to be taken.
 *
 * Kept beside the engine and above it, the same way `analysis.ts` is: nothing
 * here decides what is legal or who has won. Every candidate is offered to the
 * engine and every outcome is read back from it, so a tier is a way of
 * choosing between legal turns and never a way of playing an illegal one.
 */

/**
 * The graded players, each named the way the country it comes from grades its
 * own players. The order here is the order of strength.
 *
 * The middle three are the Japanese ladder these games are usually graded on:
 * 級 for the learner, 段 for the graded player, 名人 for the master. The two
 * at the ends come from the other countries this game is played seriously in,
 * and are real ranks there rather than decoration.
 *
 * разряд is the Russian sporting classification an amateur holds — renju is
 * an official sport in Russia and is graded by разряды — so it sits below the
 * learner's grade. 国手, "the nation's hand", is the historic Chinese title
 * for the finest player in the country, so it sits above the master's.
 *
 * The last two are not grades at all, and are not named like grades. They are
 * the specialists — one who plays Reversi and one who plays five in a row —
 * and a specialist is a person rather than a rung, so each is named after the
 * player who defined their game: an homage, close enough to say who is meant
 * and altered enough not to be them. Neither sits on the ladder; both stand
 * beside the top of it, at one game each.
 */
export type BotTier =
  | "razryad"
  | "kyu"
  | "dan"
  | "meijin"
  | "guoshou"
  | "tamenoki"
  | "meritalu";

/**
 * One whole turn, in the shapes a turn can take across these games.
 *
 * A twist rides on the placement that owes it rather than being a turn of its
 * own: the quarter turn changes whether the stone just played wins, so the two
 * are one decision and have to be made together.
 */
export type BotTurn =
  | {
      kind: "place";
      row: number;
      col: number;
      /** The colour to lay, in the games where the mover chooses it. */
      stone?: Stone;
      twist?: Twist;
    }
  | { kind: "move"; from: Point; row: number; col: number }
  | { kind: "piece"; cells: PieceCell[] }
  | { kind: "pass" };

/** How hard a tier tries, in the knobs the chooser actually reads. */
export type TierSpec = {
  /**
   * How far it looks. 1 is its own move only; 2 asks what the opponent could
   * do in reply. Nothing here searches deeper than that — a turn-based site
   * has to answer a request, and two plies of a checked, spec-driven reading
   * is a stronger opponent than four plies of a guess.
   */
  depth: 1 | 2;
  /**
   * The chance it notices, this turn, that the opponent is about to win. Rolled
   * once per turn rather than per candidate, so a tier that misses a threat
   * misses it consistently instead of half-blocking it.
   */
  guard: number;
  /** The chance it throws the turn away on a legal move picked at random. */
  blunder: number;
  /** How much of the heuristic's spread is drowned in noise, as a share of it. */
  noise: number;
  /** Whether it reads the threat ladder where the game's shape allows one. */
  reads: boolean;
  /** How many candidates it will weigh, so the work a request does is bounded. */
  width: number;
  /**
   * How many of the best it looks a reply ahead for. The reply itself is
   * always read in full — a half-read reply is a wrong answer, not a weaker
   * one, and how *often* a tier looks is already what `guard` says.
   */
  guardTop: number;
  /**
   * How many plies it looks ahead in the games where looking ahead means
   * something, or 0 for a grade that does not search at all. This is the whole
   * difference between a player who does not blunder and a player who is
   * strong: seeing the four that forces a reply, and the three waiting behind
   * it.
   */
  searchDepth: number;
  /**
   * Which families of board this player has actually studied, if any.
   *
   * Empty for the five graded players, which is what makes them graded: they
   * play every game on the site with one reading, and are separated only by
   * how hard they try. A specialist carries one entry here, and where the game
   * in front of it matches that entry it plays by its own reading of that game
   * instead — see `expert/experts.ts`. Data rather than a name, so nothing in
   * the chooser has to know who it is looking at.
   */
  expertise: readonly ExpertKind[];
};

/** How a graded player is named and introduced. */
export type BotProfile = {
  tier: BotTier;
  /** The name it plays under: its member name, and what the record shows. */
  name: string;
  /**
   * The same name in its own script — 級, 名人, 国手, разряд — or null where
   * there is no other script to put it in.
   *
   * Called `native` rather than `kanji` because several of these are not kanji
   * and a field that says otherwise would be a small lie told on every page
   * that reads it. Null rather than a repeat of `name` for the same reason:
   * an Estonian name written in Estonian is the name, and a field holding the
   * identical string would mean both "here is the other script" and "there
   * isn't one", which is exactly the ambiguity that has bitten this codebase
   * before. Nothing answers what it cannot answer.
   */
  native: string | null;
  /** The tier in the words a player choosing an opponent needs. */
  strength: string;
  blurb: string;
};

/**
 * What a look-ahead may spend.
 *
 * Two limits, and either alone is enough to stop it. In a running game the
 * clock is the one that binds: a move has to come back inside a request, and
 * how many positions that buys depends on the board, the variant and what else
 * the machine is doing. In a test it is the node count that binds, with the
 * clock set far out of reach — because a search bounded by a clock reaches a
 * different depth on a loaded machine than on an idle one, and a test whose
 * answer depends on how busy the laptop is will pass all week and fail in the
 * one run that mattered. It did exactly that, once, before this existed.
 */
export type SearchBudget = {
  /** Wall clock, in milliseconds. */
  millis?: number;
  /** Positions visited. */
  nodes?: number;
};
