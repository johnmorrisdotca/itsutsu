import type { BotProfile, BotTier, TierSpec } from "./opponent.types";
/*
 * The specialists' rows live in a module of their own, which the ladder's
 * fingerprint does not hash: a specialist never decides a graded move, so
 * adding or tuning one must not silence the graded players' measured tables.
 * See `opponentSpecialists.constants.ts`.
 */
import {
  BOT_SPECIALIST_LIST,
  SPECIALIST_PROFILES,
  SPECIALIST_SPECS,
  SPECIALIST_TIERS,
} from "./opponentSpecialists.constants";

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
  rafaDuarte: "rafaDuarte",
  ingridSolheim: "ingridSolheim",
  amaraOkafor: "amaraOkafor",
  minaPark: "minaPark",
  kenjiArakawa: "kenjiArakawa",
  liWenjing: "liWenjing",
  ...SPECIALIST_TIERS,
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
 * THE DIAGNOSIS IN THAT PARAGRAPH WAS HALF RIGHT, and the half that was wrong
 * is worth leaving on the record beside it. "The two grades that search
 * deepest" did not search at all in Reversi: the line games' search declines a
 * flipping board, so `searchDepth` was inert there and 名人 was 段 with the
 * handicaps taken off. It lost BECAUSE it had no lookahead, not because it had
 * too much — at one ply a flipping game is not being read, and 段's noise was
 * saving it from advice that pointed the wrong way. `opponentLook.ts` gave the
 * grades a lookahead in those games and the same series is now 段 0-30 名人.
 *
 * None of which costs the specialists their reason to exist: 為乃木 still takes
 * all fifty games off the ladder, including off a 名人 that now searches, and
 * that is the claim this list rests on rather than the ladder's own disorder.
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
export { BOT_SPECIALIST_LIST };

/**
 * THE CHARACTERS: a grade's knobs, a style of its own, and a face.
 *
 * The ladder is five rungs of difficulty and the specialists are one game
 * each. These are neither: they play at a grade that already exists and differ from
 * it only in STYLE — how much they value taking your point against making
 * their own — which costs nothing, because both halves were already computed.
 *
 * That is why a roster of them is affordable here when a roster of deeper
 * searches is not, and why they sit at the middle grades: style breaks ties,
 * and the top grade's search leaves few ties to break. A master plays the best
 * move; a club player plays like themselves.
 */
export const BOT_CHARACTER_LIST: readonly BotTier[] = [BOT_TIERS.rafaDuarte, BOT_TIERS.ingridSolheim, BOT_TIERS.amaraOkafor,
  BOT_TIERS.minaPark,
  BOT_TIERS.kenjiArakawa,
  BOT_TIERS.liWenjing,
];

/** Everybody the site plays as a computer: the ladder, the specialists, the characters. */
export const BOT_ALL_TIERS: readonly BotTier[] = [
  ...BOT_TIER_LIST,
  ...BOT_SPECIALIST_LIST,
  ...BOT_CHARACTER_LIST,
];

export const BOT_PROFILES: Record<BotTier, BotProfile> = {
  minaPark: {
    tier: "minaPark",
    name: "Mina Park",
    native: "박미나",
    strength: "Gentlest, defensive",
    blurb:
      "Answers what is in front of her and does not look further. Mina blocks " +
      "what she sees coming and misses a great deal, because she is reacting " +
      "rather than planning — which is what a beginner's defence actually is.",
  },
  kenjiArakawa: {
    tier: "kenjiArakawa",
    name: "Kenji Arakawa",
    native: "荒川健二",
    strength: "Hard, attacking",
    blurb:
      "Meijin's strength aimed forward. Kenji would rather hand you a problem " +
      "than solve one, and at this strength the problems are real — but he " +
      "never gives a game away to do it.",
  },
  liWenjing: {
    tier: "liWenjing",
    name: "Li Wenjing",
    native: "李文静",
    strength: "Strongest, defensive",
    blurb:
      "国手's strength aimed at whatever you are building. Wenjing takes the " +
      "point you wanted before she takes the one she wanted, and waits for the " +
      "game to come to her.",
  },
  amaraOkafor: {
    tier: "amaraOkafor",
    name: "Amara Okafor",
    native: null,
    strength: "Medium, changeable",
    blurb:
      "Plays at Dan's strength and changes her mind about how. Amara hounds " +
      "you for a while, then goes quiet and answers everything, then comes " +
      "back — and the hard part is not knowing which one you are playing.",
  },
  ingridSolheim: {
    tier: "ingridSolheim",
    name: "Ingrid Solheim",
    // Norwegian is the script her name is already in.
    native: null,
    strength: "Easy, defensive",
    blurb:
      "Plays at Kyu's strength and answers before she builds. Ingrid misses " +
      "things and knows it, but she is very hard to hurry — the players who " +
      "lose to her mostly lose to their own impatience.",
  },
  rafaDuarte: {
    tier: "rafaDuarte",
    name: "Rafa Duarte",
    // Portuguese is the script his name is already in. Null rather than a
    // repeat of it — see BotProfile.native.
    native: null,
    strength: "Medium, attacking",
    blurb:
      "Plays at Dan's strength and would always rather be the one asking the " +
      "question. Rafa builds threats faster than he answers them, which works " +
      "more often than it should — and when it does not, everyone watching saw " +
      "it coming a move before he did.",
  },
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
    /*
     * What this used to say was that Guoshou "reads further than Meijin", full
     * stop, and that is a claim about a knob rather than about a game. Both
     * grades read to whatever depth the thinking time a request allows them
     * gets to, two plies at a time, keeping the last depth they FINISHED — so
     * asking one for eight and the other for six changes nothing at all unless
     * an eight-deep pass can finish. On an eight by eight board of Reversi it
     * cannot: measured over fifteen positions, six plies and eight chose the
     * same move every single time. Where the branching is small enough — a
     * board of checkers, a race — it can, and there the two do differ.
     *
     * So the blurb says where the difference shows and stops promising it
     * everywhere. A player who picks the top of the ladder for a harder game
     * should get one or be told why not.
     */
    blurb:
      "The nation's hand. Guoshou weighs more of the board than Meijin before " +
      "it moves and is asked to read two moves further, which tells on the big " +
      "boards and in an endgame: a threat you were saving is answered before " +
      "you play it. On the small boards the two of them run out of thinking " +
      "time at the same depth and play much alike. Beating either is worth " +
      "telling somebody about.",
  },
  ...SPECIALIST_PROFILES,
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
    searchDepth: 8,
    expertise: [],
  },
  /*
   * Stronger than Meijin by seeing further and weighing more, which are the
   * only two knobs left once a grade already never blunders and never misses
   * a threat. Four more plies and a wider net; nothing else can be turned up,
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
    /*
     * Twelve since the line games' search moved onto a board edited in place
     * (`lineBoard.ts`): it reached eight in about half a second of a browser's
     * two and then stopped, idle for the rest. Allowed twelve, against the eight
     * it had, it won 13–3 over sixteen games at two seconds a move, and went
     * from 6–14 to 11–9 against Rapfi held to 3,000 positions. Meijin moves up
     * to the eight this used to be, which now costs what six did.
     */
    searchDepth: 12,
    expertise: [],
  },
  /*
   * Rafa Duarte: Dan's strength, an attacker's style.
   *
   * Every number here but one is Dan's, and the one is `defence`. He is not a
   * stronger or weaker player than Dan — he is the same player who would
   * rather make you answer a threat than answer yours, and at 0.3 against the
   * even-handed 0.85 he means it.
   *
   * At Dan and not at the top, because that is where a style is visible: the
   * top grade's search runs after the base score and finds the same move
   * whatever the base score preferred, so an aggressive 国手 is very nearly
   * 国手. A master plays the best move; a club player plays like themselves.
   */
  rafaDuarte: {
    depth: 2,
    guard: 0.95,
    blunder: 0.03,
    noise: 0.25,
    reads: false,
    width: 90,
    guardTop: 20,
    searchDepth: 0,
    expertise: [],
    defence: 0.3,
  },

  /*
   * Ingrid Solheim: Kyu's strength, a defender's style.
   *
   * Every number here but one is Kyu's, and the one is `defence`. At 2.4
   * against the even-handed 0.85 she answers your threat before she builds her
   * own — and because she is only Kyu, she misses things while doing it. That
   * is the point rather than a compromise: she is not hard to BEAT, she is
   * hard to HURRY, and the players who lose to her mostly lose to their own
   * impatience.
   *
   * The far end of the same knob Rafa sits at, so the two of them are the
   * cheapest possible proof that a style is a style and not a strength: one
   * plays above the other on the ladder and they are told apart by how they
   * play, not by how often they are right.
   */
  ingridSolheim: {
    depth: 1,
    guard: 0.6,
    blunder: 0.16,
    noise: 0.9,
    reads: false,
    width: 60,
    guardTop: 0,
    searchDepth: 0,
    expertise: [],
    defence: 2.4,
  },

  /*
   * Amara Okafor: Dan's strength, and a mood that changes mid-game.
   *
   * She swings between exactly the two weights the other characters sit at —
   * Rafa's 0.3 and Ingrid's 2.4 — holding each for six turns. So a game against
   * her has a shape: she hounds you for a while, then goes quiet and answers
   * everything, then comes back. John: "each move we don't know if they will do
   * a string of attacks or defense".
   *
   * Runs and not a coin flip, and taken from the MOVE NUMBER rather than a die.
   * A player who flipped every turn would be noisy rather than unpredictable,
   * and noise is already what the weak grades have; and a mood read from the
   * position is one the server can reproduce, which keeps her the same as
   * everyone else to check. See `defenceNow`.
   */
  amaraOkafor: {
    depth: 2,
    guard: 0.95,
    blunder: 0.03,
    noise: 0.25,
    reads: false,
    width: 90,
    guardTop: 20,
    searchDepth: 0,
    expertise: [],
    moods: [0.3, 2.4],
    moodMoves: 6,
  },

  /*
   * Mina Park: Razryad's strength, and defensive because she cannot yet plan.
   *
   * John, on why a defensive player is often a beginner rather than a
   * strategist: "sometimes kids are like that... very defensive because they
   * are reacting and not planning". So her style is not a preference she chose
   * — it is what is left when there is no plan. Razryad's knobs answer what is
   * already on the board and nothing further ahead, and `defence: 2.0` points
   * what little she sees at your threat rather than her own chance.
   */
  minaPark: {
    depth: 1,
    guard: 0.3,
    blunder: 0.3,
    noise: 1,
    reads: false,
    width: 50,
    guardTop: 0,
    searchDepth: 0,
    expertise: [],
    defence: 2,
  },

  /*
   * Kenji Arakawa and Li Wenjing: the best attack and the best defence.
   *
   * John asked for "bots that are super good at defending the best defense...
   * and ones that are the most offensive best attack", and these are those —
   * Meijin's knobs and 国手's, pointed.
   *
   * ONE HONEST LIMIT, measured rather than assumed. A style shows least at the
   * top, because the search runs after the base score and reaches the same move
   * whatever the base score preferred. So these two differ from the rungs they
   * are built on mainly in QUIET positions, where the search finds nothing to
   * force and the preference is what is left to decide. In a sharp position
   * they play like the grade, which is the correct thing for a strong player to
   * do — a master plays the best move. Making the style bite at depth means
   * threading it into the search's own evaluation, which is a change to
   * `opponentSearch` and not to a number here.
   */
  kenjiArakawa: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 140,
    guardTop: 28,
    searchDepth: 8,
    expertise: [],
    defence: 0.35,
  },
  liWenjing: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 12,
    expertise: [],
    defence: 2.2,
  },
  ...SPECIALIST_SPECS,
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
  /**
   * Per piece already home, in the race games: four steps of the march, and
   * no more.
   *
   * It was 400, eighty steps, and that single number made the two gentlest
   * grades play a race at random. Their noise is scaled to the spread of what
   * they are choosing between — see `chooseTurn` — and once any piece is home,
   * the worst thing on offer is to walk it back out of the camp, at minus four
   * hundred. So the spread was always about four hundred and twenty, the noise
   * over it about two hundred either way, and the best move on the board was
   * worth five or ten. Measured late in a real game: Kyu's best gain +5, its
   * noise ±191, thirty of its sixty candidates below −300. Everything short of
   * leaving the camp was a coin, including stepping backwards.
   *
   * A cliff that big was never needed to keep a piece home. Stepping out costs
   * the home weight AND the step, so any positive weight already makes it the
   * worse move; what the size bought was only the noise. Measured in process on
   * 16×16, ten games a pairing, colours alternating:
   *
   *                          at 400                     at 20
   *     級 v разряд    median 1,186 plies, 3 drawn    median 421, none drawn
   *     разряд v разряд  median 1,589, 9 of 10 drawn  median 587, none drawn
   *     段 v 級         median 364                   median 263
   *     名人 v 段 (12)   11-1                          11-1
   *
   * Every drawn game there was the no-progress rule calling off a game nobody
   * could finish, which is what a thousand plies of coin tosses looks like.
   * 10 and 40 measure the same as 20 to within the dice, so this is not a
   * knife edge. It reaches Chinese Checkers too, the other race, where 級 v
   * разряд fell from a median of 596 plies to 196 — and where 段 got better
   * at the game as well, taking four of sixteen off 名人 where it had taken
   * none. Still an order; a narrower one.
   *
   * No work was added: this is a constant, and the reading is the same reading.
   */
  home: 20,
  /** Per step of the whole army's remaining distance, in the race games. */
  advance: 5,
  /** Per stone captured, where a game captures. */
  capture: 90,
  /**
   * A man, a king, and a step towards being crowned, in checkers.
   *
   * Checkers had no reading at all. It does not flip, race for a camp, connect
   * or capture in the sense the spec means — a jump is a slide, not a capture
   * pair — so it fell through to the capture count, which the engine never
   * writes there. Every position scored zero, every move scored the same, and
   * all five grades played it by the tie-break: 級 came out level with 名人 and
   * разряд beat both of the top two. A player that cannot tell one move from
   * another is not a weak player, it is a blind one, and no amount of looking
   * further ahead helps a blind player at all.
   *
   * A king is worth well over a man but not two of them, and a man a row from
   * being crowned is worth more than one that has not moved. That is the whole
   * of it: material and advancement, which is what the first half of a game of
   * checkers is about.
   */
  man: 100,
  king: 180,
  /**
   * A king that flies, in the international family: three men, as draughts
   * players have long reckoned it. One that crosses the board in a move and
   * takes at any distance is not the short-stepping English king, and scoring
   * it as one would have a computer trade it for a man and a half.
   */
  flyingKing: 300,
  crowning: 6,
  /** How much the line reading counts against everything else. */
  shape: 1,
  /**
   * What DENYING the other side's shape at a point is worth, against making
   * your own there. Even-handed at 0.85, which is what every grade played
   * before a bot could have a style.
   *
   * This is the seam a personality turns on. Below 0.85 is a player who builds
   * and lets yours grow; above it is one who takes your point before its own.
   * It costs nothing either way — both halves are already computed, and this
   * only decides how they are weighed — which is why a roster of styles is
   * affordable where a roster of deeper searches is not.
   */
  defence: 0.85,
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
 * WHAT AN OPEN LINE OF FIVE IS WORTH, by how many of a colour's stones it holds
 * — and separately for the colour about to move and the colour waiting.
 *
 * The same shape is not worth the same to both. A three the mover can turn into
 * an open four this turn is a threat; the same three, with the other side to
 * answer it, is a thing already being answered. The scoring had one list for
 * both and these numbers by hand — 1, 4, 16, 64, a power of four a stone.
 *
 * Tuned by `pnpm bots:eval-tune` over quiet positions from real games, by the
 * measure Texel's method uses: the weights under which the score best predicts
 * the result each game reached, checked on a fifth of the positions held back
 * from the tuning. Lines of other lengths keep the powers of four; the tuning
 * was done at five.
 */
export const LINE_WINDOW_VALUES = {
  toMove: [0, 1, 4, 16, 64, 256],
  waiting: [0, 1, 4, 16, 64, 256],
} as const;

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
  /**
   * A backstop under the clock, so a pathological position cannot spin. Two
   * million since the search moved onto a board edited in place: sixty thousand
   * was reached in about 1.3 seconds of a browser's two and stopped the top grade
   * early, and the clock is what bounds a move anyway.
   */
  nodes: 2_000_000,
} as const;

/**
 * How far the finder of forced wins may go — see `forcedWin.ts`.
 *
 * `fours` is the length of chain it follows, and fifteen is more than any
 * real game offers: a chain is found in a handful of steps or not at all.
 * `nodes` counts engine calls, the thing that costs. It takes a quarter of the
 * move's clock (`share`), and never more than `millis`, so a position full of
 * fours that lead nowhere cannot starve the ordinary search behind it.
 */
export const FORCED = {
  fours: 15,
  /**
   * Engine calls, counted as well as timed. Raised to a hundred thousand when
   * the finders moved onto the line board, and put back: with the larger cap the
   * finder spent its whole share of the clock, refused more of the search's own
   * moves, and the grade measured 9–11 against the one it replaced over twenty
   * games at two seconds. What the finder is for is the win it can prove
   * quickly, not the longest reading it can afford.
   */
  nodes: 6_000,
  share: 0.25,
  millis: 400,
  /** How many of the best moves by shape are tried when the search's own choice leaves the other side a forced win. */
  defended: 8,
  /**
   * How many threes a win by threats may pass through (`threatWin.ts`). Each
   * one multiplies the replies to read by the handful that could stop it, so
   * this is the knob that decides what the reading costs.
   */
  threes: 2,
  /** How many fours a win by threats may play between its threes, on any one line of reading. */
  mixedFours: 6,
} as const;

/**
 * How the general look-ahead spends itself — the one for the games that are not
 * about lines. See `opponentLook.ts` for why it is a second search rather than
 * a flag on the first.
 *
 * Narrower than `SEARCH` at every turn, and the reason is the price of a node
 * rather than a judgement about breadth. The line search orders its candidates
 * by the shape a stone makes at the point it lands on, which is arithmetic over
 * four lines; this one has no such shortcut — the thing a move does in a
 * flipping game or a race is to the whole board — so it orders by playing each
 * candidate and reading the position it produces. That is one engine call and
 * one whole-board reading per candidate, perhaps fifty times the cost, so the
 * same wall clock buys a good deal less of it.
 *
 * `nodes` counts CANDIDATES WEIGHED rather than nodes visited, which is where
 * the work actually is: a node choosing between twenty slides costs twenty
 * times one choosing between one, and a budget that called both a single node
 * would bound nothing.
 */
export const LOOK = {
  /** Turns enumerated at a node before the list is trimmed. */
  width: 40,
  /** Candidates weighed at each node below the root. */
  branch: 8,
  /** Candidates weighed at the root, where being wrong is most expensive. */
  rootBranch: 12,
  /**
   * What the look-ahead may weigh in one move, and here it is the limit that
   * BINDS rather than a backstop under the clock.
   *
   * That is the opposite of `SEARCH.nodes` and the difference is deliberate, so
   * it is worth the paragraph. There the argument is that a node count cannot
   * bound a request, because what a node costs depends on the board — and it is
   * right. Here the point is not to bound the request, which the clock already
   * does; it is that spending the whole clock buys almost nothing.
   *
   * Measured on a 2026 laptop: with the clock alone, one move of Reversi took
   * 176ms for 名人 and 200ms for 国手, Go on nine points 258ms — against half a
   * millisecond for the grade below them, which does not search. And the
   * ordering those numbers buy is already bought many times over at NINE
   * HUNDRED: `ladder.order.test.ts` has 名人 taking three quarters of a series
   * off 段 at Reversi on that budget, and the full round robin at two thousand
   * has it winning nine of ten — where before the look-ahead existed it lost
   * sixteen games in thirty.
   *
   * So the returns flatten long before the clock does, and the whole of what
   * the rest of it buys is a bill. Four thousand is twice where the ordering is
   * already complete and a fraction of where the clock stops, which is the
   * honest place for it: a computer player can be sat in a great many games at
   * once, every one of its moves is a request somebody pays for, and a ladder
   * that is already in the right order does not get righter.
   *
   * Raising it costs money and buys a little play; lowering it saves money and
   * the ordering holds a long way down. It is one number either way.
   */
  nodes: 4_000,
} as const;
