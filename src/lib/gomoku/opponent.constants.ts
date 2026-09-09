import type { BotProfile, BotTier, TierSpec } from "./opponent.types";

/**
 * The three graded players, and how hard each one tries.
 *
 * They are named as players rather than as settings. A site whose opponents
 * are called "Easy", "Medium" and "Hard" has a widget with three positions;
 * a site whose opponents are called Kyu, Dan and Meijin has three members you
 * can look up, whose ratings move when you beat them. The strength is still
 * said plainly beside the name — see `strength` — because somebody choosing
 * an opponent for the first time is owed that.
 *
 * 級 / 段 / 名人 is the grading ladder the games on this site come from: the
 * kyu grades are what a learner holds, the dan grades are what a graded player
 * holds, and 名人 is the title of the strongest of all.
 */

export const BOT_TIERS = {
  kyu: "kyu",
  dan: "dan",
  meijin: "meijin",
} as const satisfies Record<BotTier, BotTier>;

/** The tiers weakest first, which is the order a player is offered them in. */
export const BOT_TIER_LIST: readonly BotTier[] = [
  BOT_TIERS.kyu,
  BOT_TIERS.dan,
  BOT_TIERS.meijin,
];

export const BOT_PROFILES: Record<BotTier, BotProfile> = {
  kyu: {
    tier: BOT_TIERS.kyu,
    name: "Kyu",
    kanji: "級",
    strength: "Easy",
    blurb:
      "Learning the shapes. Kyu takes a win when one is under its nose and " +
      "misses plenty of what you are building. A good first opponent, and " +
      "beatable by anyone who has played a few games.",
  },
  dan: {
    tier: BOT_TIERS.dan,
    name: "Dan",
    kanji: "段",
    strength: "Medium",
    blurb:
      "Graded. Dan answers what is actually on the board — it will not let " +
      "you finish a line in front of it — and builds when nothing is forced. " +
      "It does not see far, so it can still be out-planned.",
  },
  meijin: {
    tier: BOT_TIERS.meijin,
    name: "Meijin",
    kanji: "名人",
    strength: "Hard",
    blurb:
      "The master. Meijin reads the threats before they land, answers a four " +
      "and a three, and never hands you a win in reply. Expect to lose the " +
      "first few.",
  },
};

/**
 * What separates the three, in the only four things that make a board player
 * weak: how far it looks, whether it notices the threat against it, how often
 * it simply plays something else, and how much noise sits over its judgement.
 *
 * Kyu is deliberately built to lose to a competent beginner. It looks one move
 * ahead, misses the opponent's five-in-hand two turns in five, and throws one
 * turn in six away on a random legal point — which is what a beginner's game
 * actually looks like from the other side of the board. It is not a strong
 * player with a dice roll bolted on.
 */
export const TIER_SPECS: Record<BotTier, TierSpec> = {
  kyu: {
    depth: 1,
    guard: 0.6,
    blunder: 0.16,
    noise: 0.9,
    reads: false,
    width: 60,
    guardTop: 0,
    searchDepth: 0,
  },
  dan: {
    depth: 2,
    guard: 0.95,
    blunder: 0.03,
    noise: 0.25,
    reads: false,
    width: 90,
    guardTop: 20,
    searchDepth: 0,
  },
  meijin: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 140,
    guardTop: 28,
    searchDepth: 6,
  },
};

/**
 * The score a decided game is worth, in the same units as the heuristic below
 * it. Large enough that no amount of shape outweighs a win or a loss, small
 * enough to stay a finite number so two wins can still be compared by what
 * else the position holds.
 */
export const DECIDED_SCORE = 1_000_000;

/** What a draw is worth: better than losing, worse than winning, and not zero. */
export const DRAW_SCORE = 0;

/**
 * How the generic reading weighs what it can count in any game: the discs on
 * the board where stones turn, the pieces home where they race, the stones
 * taken where they are taken, and the shape of the lines where lines are read.
 */
export const EVAL_WEIGHTS = {
  /** Per disc of the lead, in the flipping games. */
  disc: 8,
  /** Per corner held, in the flipping games. Corners never turn, so they are the game. */
  corner: 240,
  /** Per square of mobility — how many replies the position leaves each side. */
  mobility: 6,
  /** Per piece already home, in the race games. */
  home: 400,
  /** Per step of the whole army's remaining distance, in the race games. */
  advance: 5,
  /** Per stone captured, where a game captures. */
  capture: 90,
  /** How much the line reading counts against everything else. */
  shape: 1,
  /** How much a point being near the middle is worth, to break ties inwards. */
  centre: 2,
  /** Per point of the area lead in Go, which is the whole of that game's result. */
  area: 100,
  /**
   * What passing is worth in Go when playing on gains nothing.
   *
   * Small on purpose: any move that actually takes a point of area beats it
   * many times over, so this never buys a pass out of a live game. It decides
   * one case only, and it is the case that matters — once every remaining
   * legal move is inside the bot's own territory, filling those points is
   * worth exactly nothing under area scoring, and without this the bot went
   * on playing them until the board was full. Two passes end a game of Go;
   * something has to prefer the pass.
   */
  goPass: 1,
} as const;

/**
 * The most turns the chooser will ever enumerate before it starts trimming.
 *
 * A cap rather than a promise of quality: the piece games can offer several
 * hundred placements for one tetromino, and a request that has to answer a
 * player must not be allowed to weigh all of them.
 */
export const TURN_CAP = 400;

/**
 * Boards at or below this many points are never trimmed.
 *
 * Trimming is for the big line boards, where three hundred empty
 * intersections are mostly nowhere. On a small board every point is somewhere:
 * a rhombus of Hex is a hundred and twenty-one points and any of them can be
 * the move, and dropping one to save arithmetic is how a computer comes to
 * walk past a win. Eleven by eleven covers every small board here.
 */
export const UNTRIMMED_POINTS = 121;

/**
 * How many replies are read when a tier looks a move ahead.
 *
 * Generous, because the question being asked — "does this hand them the game"
 * — has a right answer, and a trimmed search answers it wrongly rather than
 * weakly. How often a tier bothers to ask is what makes it weak, and that is
 * `guard`.
 */
export const REPLY_CAP = 200;

/**
 * How the look-ahead spends itself.
 *
 * `branch` is narrow on purpose. Alpha-beta pays for itself only when the
 * moves are tried in roughly the right order, and a line game's ordering — the
 * threat ladder — is good enough that the tenth-best candidate at a node is
 * almost never the move. Widening it buys very little and costs the depth,
 * which is where the strength is.
 *
 * `nodes` is the whole safety net. A move has to come back inside a request,
 * so the search counts positions and stops; iterative deepening means stopping
 * costs a ply rather than an answer.
 */
export const SEARCH = {
  /** Candidates weighed at each node below the root. */
  branch: 10,
  /** Candidates weighed at the root, where being wrong is most expensive. */
  rootBranch: 16,
  /**
   * Candidates the threat reading is spent on at the root: the best of them by
   * shape, re-sorted by what they actually threaten.
   *
   * The reading costs about a millisecond a point — it lays a stone and looks
   * for every five it could become, several hundred times — so it is affordable
   * once, over a shortlist, at the top of the tree. Spending it at every
   * interior node is not a slower search, it is not a search: measured at a
   * hundred and ninety-five seconds for one move on a fifteen by fifteen board
   * before this shortlist existed.
   */
  rootReading: 20,
  /**
   * The wall clock, in milliseconds, and the thing that actually keeps a move
   * answerable.
   *
   * A node count cannot do this job: what a node costs depends on the board,
   * the variant and how many stones are down, and a budget of twenty-four
   * thousand nodes is a tenth of a second on one board and three minutes on
   * another. Iterative deepening turns a clock into a depth, so running out of
   * time costs a ply rather than an answer.
   */
  millis: 400,
  /** A backstop under the clock, so a pathological position cannot spin. */
  nodes: 60_000,
} as const;
