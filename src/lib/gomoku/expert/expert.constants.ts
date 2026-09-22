/**
 * What the specialists know, as numbers.
 *
 * Two tables, one per family of board, and they have nothing to do with each
 * other — which is the whole point of a specialist. The shared reading in
 * `opponent.constants.ts` has one set of weights covering forty games; these
 * cover one family each, and say things that are only true there.
 *
 * Every number here was measured rather than argued about: the series in
 * `specialists.match.test.ts` plays the specialist against all five graded
 * players and reports the score, and a weight that does not earn its place in
 * that score does not stay.
 */

/** Which family of board a specialist has studied. See `ExpertKind`. */
export const EXPERT_KINDS = {
  flip: "flip",
  line: "line",
  race: "race",
} as const;

/**
 * Reversi, by the things a Reversi player actually counts.
 *
 * None of this is the disc count, and that is not a stylistic choice — it is
 * the game. Discs turn over, so a disc you hold in the middlegame is a thing
 * the other side can take back; holding many of them early means holding many
 * things that can be taken, and it is famously the losing plan. What cannot be
 * taken back is a corner, and what wins the game is leaving the other side
 * with nowhere good to go.
 *
 * So: corners, then what a corner is worth to give away, then how many replies
 * each side has, then how much of the front line each side is exposing. The
 * disc count arrives last, weighted by how close the game is to being over,
 * because at the end it stops being a liability and becomes the result.
 */
export const FLIP_WEIGHTS = {
  /** A corner. It can never be turned, so it is the one permanent thing. */
  corner: 320,
  /**
   * The square diagonally inside an empty corner — the X-square. Playing one
   * is how a corner is handed over, and it is the single most expensive
   * mistake in the game short of giving the corner itself.
   */
  xSquare: 110,
  /** The two squares along the edge beside an empty corner — the C-squares. */
  cSquare: 38,
  /** A disc that can never be turned again, corner-anchored or on a full edge. */
  stable: 44,
  /**
   * Mobility, normalised: the share of the available replies that are yours.
   * A player with no move must pass, and a player who must pass is losing.
   */
  mobility: 120,
  /**
   * A disc touching an empty square — a frontier disc — is a disc the other
   * side can reach. Fewer is better, so this counts *their* frontier less
   * yours. It is what "potential mobility" means in one number.
   */
  frontier: 9,
  /**
   * Having the last move. With an even number of empty squares left the side
   * *not* to move takes the last one, and the last move in Reversi turns
   * discs nobody can answer.
   */
  parity: 24,
  /** The disc lead early on, when it is nearly worthless. */
  discEarly: 1,
  /** The disc lead once the board is nearly full, when it is the whole result. */
  discLate: 64,
  /** Below this many empty squares the disc lead is read at its late weight. */
  lateEmpties: 14,
} as const;

/**
 * The static value of a square, as every Reversi engine since the eighties has
 * tabulated it: corners are the game, the squares beside an empty corner are
 * poison, and the edges are worth more than the middle. Used for ordering
 * moves rather than for judging positions — the reading above does that.
 */
export const FLIP_SQUARE = {
  corner: 100,
  xSquare: -50,
  cSquare: -20,
  edge: 12,
  nextToEdge: -4,
  middle: 2,
} as const;

/**
 * Five in a row, by the shapes that force a reply.
 *
 * A line game is decided by threats, not by territory: a four has to be
 * answered, an open four cannot be answered at all, and two threats at once
 * is the whole of how a game is won. So the reading counts windows the way
 * the shared one does — a run of the board's win length with none of the
 * other colour in it — but it also collects the *points* that would complete
 * a five, because how many of those a side has is the difference between a
 * position that looks nice and a position that is over.
 */
export const LINE_WEIGHTS = {
  /**
   * What a window is worth by how many of the colour's stones it holds, by
   * index. Steep on purpose: four in a window is a move from five, and no
   * quantity of twos adds up to one of those.
   */
  window: [0, 1, 12, 90, 520] as readonly number[],
  /**
   * How much the other colour's shape counts against your own. Above one,
   * because a threat you have not answered ends the game and a threat you
   * have not built merely might.
   */
  defence: 1.12,
  /**
   * A side that can complete five and has the move. Far below `DECIDED_SCORE`
   * — this is a reading of a live position, not a settled one, and the two
   * must never be confused by the code that asks "is this game over".
   */
  won: 60_000,
  /** A side that can complete five but does not have the move: one to answer. */
  threat: 9_000,
  /**
   * An open three with the move.
   *
   * Worth more than a four the other side is about to block, and that ordering
   * is the whole point of having both numbers: a four that can be answered is
   * an inconvenience, while an open three with the move becomes an open four,
   * and an open four has two ways to five and cannot be answered at all.
   *
   * Without this the reading saw only fours, so it would let the other side
   * build a position that wins by force next move and count it as level. It
   * did: measured over ten games against 段, a search deep enough to trust
   * that reading went from ten wins to five wins and four losses. A deeper
   * search over a reading that cannot see the threat finds the line that walks
   * furthest into it.
   */
  openThreeMade: 12_000,
  /** An open three the other side is to move against, which they must answer. */
  openThreeHeld: 3_200,
  /** Two open threes at once: two ways to a four, and only one of them stoppable. */
  doubleThree: 22_000,
  /** A four and an open three at once, which is the same win in two shapes. */
  fourAndThree: 18_000,
  /** How many stones of a run a point's ordering heat counts, by run length. */
  heat: [0, 3, 18, 110, 700, 2_400] as readonly number[],
} as const;

/**
 * How deep each specialist looks, and how wide.
 *
 * Both are bounded by the same wall clock every other grade gets — see
 * `BOT_MOVE_MILLIS` — so these are ambitions rather than promises. The search
 * deepens two plies at a time and keeps the best answer it has reached, so
 * running short of time costs a ply rather than an answer.
 */
export const EXPERT_SEARCH = {
  /** Reversi: the middlegame depth, in plies. */
  flipDepth: 8,
  /**
   * Reversi: below this many empty squares the search plays the game out to
   * the very end rather than stopping at a depth, because the disc count at
   * the end is not a heuristic — it is the result, exactly.
   */
  flipExactEmpties: 12,
  /** Five in a row: the depth, in plies. */
  lineDepth: 10,
  /**
   * How far from a stone a point is still worth a node in a line game.
   *
   * Two, which is the same reach `threats.ts` uses for its suggestions, and
   * for the same reason: a stone three points from anything makes no shape
   * with anything, and a search that weighs it has spent a node on a move no
   * player would consider.
   */
  lineRadius: 2,
  /** Candidates weighed below the root, and at it, in each family. */
  flipBranch: 12,
  flipRootBranch: 20,
  lineBranch: 10,
  lineRootBranch: 16,
  /**
   * How many extra plies a forced line may be followed for.
   *
   * When only one move is worth a node — the other side has a four, or this
   * one does — there is nothing to compare and nothing to prune, so following
   * it costs a node and no branching at all. Not charging those plies against
   * the depth is what lets a four-ply budget see the end of an eight-move
   * sequence of fours, which in five in a row is most of what winning is.
   *
   * Capped rather than unlimited: a forced line always lays a stone, so it
   * cannot run for ever, but it can run a very long way, and a search that
   * spends its whole budget down one corridor has stopped being a search.
   */
  forcedExtension: 8,
  /** A backstop under the clock, so a pathological position cannot spin. */
  nodes: 120_000,
} as const;

/**
 * THE RACE GAMES, by the two things that decide one.
 *
 * Halma and Chinese Checkers are scored by distance and nothing else — no
 * piece is ever taken, no line means anything, and the board's whole state is
 * how far each army still has to walk. That makes the weights here a question
 * of BALANCE between two readings of the same distance rather than a list of
 * features, and there are only two.
 *
 * `step` is the army's total: the sum of what every piece has left to travel,
 * each to a camp square of its own. It is what makes the player advance.
 *
 * `strand` is the piece with furthest to go, charged again on top. It is what
 * stops the player advancing NICELY and losing anyway — the game is not over
 * until the LAST piece is in, so nine pieces home and one still at the start
 * is not nearly a win, it is a long way from one, and a sum cannot tell the
 * difference between that and ten pieces a short way out.
 *
 * Five to one, because a step saved by the straggler is worth about five taken
 * off the army: it is on the critical path and they are not. Higher, and the
 * player walks its rearmost piece up the board on its own while the rest sit
 * still, which is slower — a piece left behind is also a stepping stone for
 * everyone else, and hurrying it wastes the ladder.
 */
export const RACE_WEIGHTS = {
  /** Per step of the whole army's remaining distance. */
  step: 10,
  /** Per step of the distance left by the piece with furthest to go. */
  strand: 50,
} as const;

/**
 * How wide and how deep the race player reads.
 *
 * WIDER THAN THE OTHER TWO SPECIALISTS, at the root and under it, and the
 * width was the most expensive number here to get right.
 *
 * A race offers far more moves than a placing game: every piece can step six
 * or eight ways and land at the end of any chain of jumps, so a middlegame
 * star offers over a hundred and Halma's own board nearer a hundred and
 * twenty. The first guess was that almost all of them are obviously worse than
 * the best few — the measure is one number that each move plainly raises or
 * lowers — so eight below the root would be plenty.
 *
 * Measured, eight is not plenty, and the way it failed is worth keeping. On
 * the star it still won every game and took THREE HUNDRED PLIES to do it,
 * against a hundred at twenty: a narrow search over a shortlist that is nearly
 * all ties does not lose, it wanders, and a game that takes three times as
 * long to win is three times the CPU for the same result. On Halma's small
 * board, where the whole race is six steps and nearly every move gains
 * exactly one, it did lose — four games in eight against 名人 and 国手, which
 * twenty turned into six wins and two losses.
 *
 * Six plies, which is three moves each. Enough to see a jump chain answered,
 * the answer answered, and whether the ladder built on the way was worth
 * building — which is what these games turn on. Deeper buys little, because
 * past three moves the other side's army has usually moved out of whatever
 * the plan assumed.
 *
 * WHAT IT COSTS, since a move here is a serverless invocation somebody pays
 * for. Measured on the 250ms clock a live seat gives every player: this one
 * SPENDS ALL OF IT, on both games, where 国手 finishes a Chinese Checkers move
 * in 81ms and a Halma move in 148ms. That is within the clock rather than
 * beyond it — a specialist is a better player inside a request, never a player
 * given a longer one — and it is still three times 国手's compute a move, so
 * it is written here rather than left to be discovered.
 *
 * Six plies is nonetheless the CHEAPER of the two depths tried, per GAME. At
 * four the player still won every game and took 133 plies to do it against
 * 116; a game is billed by the move, so the depth that ends it sooner is the
 * one that costs less, and twelve seconds a game at four plies against
 * fourteen at six is not where the money is. This is the same finding as the
 * width above, in the other units.
 */
export const RACE = {
  branch: 20,
  rootBranch: 32,
  depth: 6,
} as const;
