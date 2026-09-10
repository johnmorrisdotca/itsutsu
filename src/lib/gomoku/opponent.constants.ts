import { EXPERT_KINDS } from "./expert/expert.constants";
import type { BotProfile, BotTier, TierSpec } from "./opponent.types";

/**
 * The graded players, and how hard each one tries.
 *
 * They are named as players rather than as settings. A site whose opponents
 * are called "Easy", "Medium" and "Hard" has a widget with three positions;
 * a site whose opponents are called Kyu, Dan and Meijin has members you
 * can look up, whose ratings move when you beat them. The strength is still
 * said plainly beside the name — see `strength` — because somebody choosing
 * an opponent for the first time is owed that.
 *
 * 級 / 段 / 名人 is the grading ladder the games on this site come from: the
 * kyu grades are what a learner holds, the dan grades are what a graded player
 * holds, and 名人 is the title of the strongest of all.
 *
 * The ladder runs past both ends of it, because this game is played seriously
 * in more than one country and each grades its own players. разряд is what a
 * Russian amateur holds in a sport, and renju is one there; 国手 is the title
 * China gave the finest player in the country. Real ranks where they come
 * from, each with its own flag beside it, rather than foreign words picked
 * for flavour.
 */

export const BOT_TIERS = {
  razryad: "razryad",
  kyu: "kyu",
  dan: "dan",
  meijin: "meijin",
  guoshou: "guoshou",
  tamenoki: "tamenoki",
  meritalu: "meritalu",
} as const satisfies Record<BotTier, BotTier>;

/**
 * The graded ladder, weakest first — the order a player is offered it in.
 *
 * The five that play every game on the site. A specialist is not on it, and
 * putting one there would be a category error twice over: it is not stronger
 * than 国手 at the other thirty-odd games, and the two specialists are not
 * stronger or weaker than each other at anything, because they do not play
 * the same game.
 */
export const BOT_TIER_LIST: readonly BotTier[] = [
  BOT_TIERS.razryad,
  BOT_TIERS.kyu,
  BOT_TIERS.dan,
  BOT_TIERS.meijin,
  BOT_TIERS.guoshou,
];

/**
 * The specialists: one game each, and the boss of it.
 *
 * They exist because the ladder could not be made stronger by turning its
 * knobs any further. Measured over thirty games of Reversi, the two grades
 * that search deepest lost eighteen to eleven against the two that hardly
 * search at all — because a deeper search over a reading that misunderstands
 * the game finds the moves that exploit the misunderstanding best. The answer
 * to that is not a rebalanced ladder, which would only make 名人 worse at
 * everything else; it is a player who knows the game.
 *
 * As measured — ten games an opponent, colours swapped every game, both sides
 * on the same wall clock a request gives a computer player, in
 * `expert/specialists.match.test.ts`. The Reversi half of that series runs on
 * every build; the five-in-a-row half is `BOT_SERIES=1`, for a reason the test
 * file sets out — counting positions rather than seconds hands the shared
 * reading nine times the thinking, and counting seconds is a test of the
 * laptop.
 *
 *   為乃木 at Reversi, 8×8      10-0 разряд · 10-0 級 · 10-0 段 · 10-0 名人 · 10-0 国手
 *   Meritalu at five, 15×15     10-0 разряд · 10-0 級 ·  7-3 段 ·  8-2 名人 ·  9-1 国手
 *
 * The second row's shape is the diagnosis over again: the specialist beats 国手
 * more comfortably than it beats 段. A deeper search over a reading that
 * misunderstands the game is not a smaller error than a shallow one, it is a
 * better-executed one.
 */
export const BOT_SPECIALIST_LIST: readonly BotTier[] = [
  BOT_TIERS.tamenoki,
  BOT_TIERS.meritalu,
];

/** Everybody the site plays as a computer: the ladder, then the specialists. */
export const BOT_ALL_TIERS: readonly BotTier[] = [...BOT_TIER_LIST, ...BOT_SPECIALIST_LIST];

export const BOT_PROFILES: Record<BotTier, BotProfile> = {
  razryad: {
    tier: BOT_TIERS.razryad,
    name: "Razryad",
    native: "разряд",
    strength: "Gentlest",
    blurb:
      "Just starting. Razryad plays a reasonable-looking move and will take a " +
      "win it happens to see, but it misses most of them and gives away more " +
      "than it takes. The one to play first, and the one to beat first.",
  },
  kyu: {
    tier: BOT_TIERS.kyu,
    name: "Kyu",
    native: "級",
    strength: "Easy",
    blurb:
      "Learning the shapes. Kyu takes a win when one is under its nose and " +
      "misses plenty of what you are building. A good first opponent, and " +
      "beatable by anyone who has played a few games.",
  },
  dan: {
    tier: BOT_TIERS.dan,
    name: "Dan",
    native: "段",
    strength: "Medium",
    blurb:
      "Graded. Dan answers what is actually on the board — it will not let " +
      "you finish a line in front of it — and builds when nothing is forced. " +
      "It does not see far, so it can still be out-planned.",
  },
  meijin: {
    tier: BOT_TIERS.meijin,
    name: "Meijin",
    native: "名人",
    strength: "Hard",
    blurb:
      "The master. Meijin reads the threats before they land, answers a four " +
      "and a three, and never hands you a win in reply. Expect to lose the " +
      "first few.",
  },
  guoshou: {
    tier: BOT_TIERS.guoshou,
    name: "Guoshou",
    native: "国手",
    strength: "Strongest all-round",
    blurb:
      "The nation's hand. Guoshou reads further than Meijin and weighs more " +
      "of the board before it moves, so a threat you were saving is usually " +
      "answered before you play it. Beating it is worth telling somebody " +
      "about — and it is the strongest player here at every game but two.",
  },
  /*
   * The specialists, named after the players who defined their games rather
   * than after a rank — because a specialist is a person and not a rung.
   *
   * Each name is an homage: near enough to say plainly who is meant, and
   * altered so that it is not them. Hidemasa Tamenoki is for Hideshi Tamenori,
   * seven times champion of the world at Othello and generally reckoned the
   * finest ever to play it. Andrus Meritalu is for Ando Meritee, four times
   * world champion at renju and the first European to hold the title. The
   * flags follow the names, as they do for the grades.
   */
  tamenoki: {
    tier: BOT_TIERS.tamenoki,
    name: "Hidemasa Tamenoki",
    native: "為乃木秀正",
    strength: "Strongest at Reversi",
    blurb:
      "Reversi, and almost nothing else. Tamenoki counts what a Reversi " +
      "player counts — corners, the squares that give a corner away, how many " +
      "replies you have left — and plays the last dozen squares out exactly " +
      "rather than guessing at them. The disc lead you build in the middle of " +
      "the game is the thing he is playing to take off you.",
  },
  meritalu: {
    tier: BOT_TIERS.meritalu,
    name: "Andrus Meritalu",
    /*
     * No other script. An Estonian name written in Estonian is the name, and
     * a field repeating it would mean both "here is the other script" and
     * "there isn't one". See `BotProfile.native`.
     */
    native: null,
    strength: "Strongest at five in a row",
    blurb:
      "Five in a row, and almost nothing else. Meritalu counts threats rather " +
      "than shape: the four you have to answer, the open four nobody can, and " +
      "the two threats made by one stone that end the game. He will not be " +
      "drawn with, which is the difference between him and the grades.",
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
  /*
   * Gentler than Kyu in the two ways a beginner is actually gentle: it misses
   * the win you are about to have more often than it sees it, and it throws a
   * turn away now and then. Not weakened by looking at fewer moves — a player
   * who considers less of the board is not a beginner, it is a bad program.
   */
  razryad: {
    depth: 1,
    guard: 0.3,
    blunder: 0.3,
    noise: 1,
    reads: false,
    width: 50,
    guardTop: 0,
    searchDepth: 0,
    expertise: [],
  },
  kyu: {
    depth: 1,
    guard: 0.6,
    blunder: 0.16,
    noise: 0.9,
    reads: false,
    width: 60,
    guardTop: 0,
    searchDepth: 0,
    expertise: [],
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
    expertise: [],
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
    expertise: [],
  },
  /*
   * Stronger than Meijin by seeing further and weighing more, which are the
   * only two knobs left once a grade already never blunders and never misses
   * a threat. Two more plies and a wider net; nothing else can be turned up,
   * because everything else is already at its limit.
   *
   * The budget is the same for every grade — see BOT_MOVE_MILLIS — so this is
   * a deeper search only where there is time for one, and it falls back to
   * what it had reached rather than to nothing.
   */
  guoshou: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 8,
    expertise: [],
  },
  /*
   * The specialists carry 国手's knobs and one thing more: a game they have
   * actually studied. At that game the knobs hardly matter — the specialist
   * reading decides the move, and everything here is what happens when the
   * reading declines, which is what it does at the other thirty-odd games on
   * the site. A specialist away from its own board is 国手 and no better,
   * which is the honest thing for it to be.
   */
  tamenoki: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 8,
    expertise: [EXPERT_KINDS.flip],
  },
  meritalu: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 8,
    expertise: [EXPERT_KINDS.line],
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
