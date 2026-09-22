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
 * The last three are not grades at all, and are not named like grades. They are
 * the specialists — one who plays Reversi, one five in a row, and one the
 * race games —
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
  | "meritalu"
  | "monkton"
  | "rafaDuarte"
  | "ingridSolheim"
  | "amaraOkafor"
  | "minaPark"
  | "kenjiArakawa"
  | "liWenjing";

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
   * do in reply. This is the GUARD's reach and not the search's: two plies of a
   * reading checked through the engine stop a player blundering, which is what
   * separates a graded player from a learner. Seeing a plan is `searchDepth`,
   * and it is a different question and a different number.
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
  /**
   * STYLE, not strength: how much this player values taking your point against
   * building its own. `EVAL_WEIGHTS.defence` (0.85) is even-handed and is what
   * every grade plays when this is left off. Lower is an attacker, higher a
   * defender.
   *
   * It must never make a player weaker than its grade promises. Style decides
   * between moves that are ALL acceptable — the win in hand, the guard and the
   * solved-game table all run before this is consulted and none of them reads
   * it — so an aggressive 国手 still never hands the game over, it only
   * prefers the attacking move among the ones that do not.
   */
  defence?: number;
  /**
   * A player whose style CHANGES during the game — John: "one that is totally
   * randomly strong... each move we don't know if they will do a string of
   * attacks or defense".
   *
   * A list of `defence` weights it moves between, and `moodMoves` is how many
   * turns it holds one before taking the next. Runs rather than a coin flip at
   * every move, because a person has a mood for a while: a player who flips
   * every turn is not unpredictable, it is noisy, and noise is already what
   * the weak grades have.
   *
   * **Read from the MOVE NUMBER, never from a die.** The mood is therefore a
   * fact about the position, so the same position always gets the same mood —
   * which is what lets a browser-chosen move be replayed and checked on the
   * server (see `botSeed.ts`). A style that rolled for itself would make the
   * one bot nobody could ever verify.
   */
  moods?: readonly number[];
  /** How many turns one mood lasts. Ignored without `moods`. */
  moodMoves?: number;
  /**
   * A specialist who sees less far than the best one.
   *
   * The share of the ordinary search budget this player's SPECIALIST reading
   * gets — 1 is the full reading and is what a specialist gets when this is
   * left off. Below that is a player who has genuinely studied the game and
   * simply does not read as deep, which is how human strength at one game
   * actually differs.
   *
   * It exists because a specialty had exactly one strength until now: any tier
   * carrying the same expertise played the identical move, so a second Othello
   * player would have been the first one under another name. Note this weakens
   * DEPTH and not WIDTH — the player still looks at the whole board, because
   * "considers less of the board" is a bad program rather than a gentler
   * opponent, which is the rule Razryad's own comment sets out.
   */
  masteryBudget?: number;
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
   *
   * "Where looking ahead means something" is TWO searches, and for a long time
   * it was one. `opponentSearch.ts` reads a line game by the shape of its
   * stones and declines everything else — twenty-three of the site's
   * thirty-nine games — so in all of those this number did nothing whatever,
   * and since it is the only knob that separates the top two grades, the top
   * two grades were one player wearing two names. `opponentLook.ts` is the
   * other half: the same idea over the family-aware reading of a whole
   * position, for the flipping games, the races, Go and checkers.
   *
   * It is a TARGET rather than a depth reached. Both searches deepen two plies
   * at a time under a wall clock and keep the last pass they FINISHED, so
   * asking for eight instead of six changes nothing unless an eight-deep pass
   * finishes inside the request. On an 8×8 board of Reversi it does not —
   * measured over fifteen positions, six and eight chose the same move every
   * time — and on a board of checkers it does. That is why the difference
   * between 名人 and 国手 is a per-game fact rather than a promise, and why
   * 国手's blurb says so.
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

/**
 * WHERE ONE DEPTH OF THE SEARCH KEEPS ITS CANDIDATE LIST.
 *
 * The line search visits tens of thousands of positions for one move, and at
 * every one of them it used to build a list of the points worth trying: an
 * array of candidates, an array of the legal ones, a wrapper object for each
 * to carry its score, a sorted copy and a trimmed copy of that. All of it was
 * dead the moment the node returned, and ten of the sixty-odd points were ever
 * looked at.
 *
 * None of that memory has to be new. The search is one thread going depth
 * first, so at any instant exactly one call is live at each remaining-ply
 * count, and the list that call is walking is nobody else's business. A shelf
 * per remaining ply is therefore enough, and it is reused for every node at
 * that depth for the whole move.
 *
 * THE INVARIANT THIS RESTS ON, because getting it wrong would corrupt a search
 * silently rather than fail: **a shelf is written only by the call whose
 * remaining depth indexes it, and a call only ever recurses to depth − 1.** So
 * while a node at depth 5 is walking its own list, everything it sets in
 * motion writes to 4, 3, 2 and 1 and cannot reach 5. `searchCandidates.test.ts`
 * pins both halves of that: a shelf is the same array twice at one depth, a
 * different array at a different depth, and untouched by any amount of work at
 * every other depth.
 *
 * The root's list is deliberately NOT one of these. It is read once and reused
 * by every deepening pass, so it outlives the calls below it — which is why
 * `rootCandidates` takes no shelves at all rather than being trusted to pick a
 * slot nobody else wants.
 */
export type SearchShelf = {
  /** The best points found at this depth, best first, at most `branch` of them. */
  points: Point[];
  /** Their scores, in the same order, so the insertion can find where one belongs. */
  scores: number[];
};

/** One shelf per remaining ply, filled as the search first reaches each depth. */
export type SearchShelves = SearchShelf[];
