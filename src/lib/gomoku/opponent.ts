import { openingTurn } from "./opponentOpening";
import { racesForCamp } from "./rules/farCamp";
import { otherStone } from "./engine";
import { GAME_STATUS, MOVE_KINDS, VARIANT_SPECS } from "./gomoku.constants";
import { DECIDED_SCORE, EVAL_WEIGHTS, FORCED, REPLY_CAP, SEARCH, TIER_SPECS } from "./opponent.constants";
import { defenceNow, pieceScore, positionScore, pointScore, readsThreats, shapeIsRead, threatScore } from "./opponentEval";
import { masteredTurn } from "./expert/experts";
import { applyTurn, legalTurns, sameTurn } from "./opponentTurns";
import { forcedBudget, type Budget as ForcedBudget } from "./forcedWin";
import { threatWinTurn } from "./threatWin";
import { searchTurn } from "./opponentSearch";
import { lookAheadTurn, lookDepth } from "./opponentLook";
import type { GameState, Point, Stone } from "./gomoku.types";
import type { BotTier, BotTurn, SearchBudget, TierSpec } from "./opponent.types";
import { perfectTurns } from "./solved/smallGames";

/**
 * The computer opponent's choice of turn.
 *
 * Three graded players out of one chooser. They differ in four things, and
 * only these four: how far each looks, how reliably it notices that the other
 * side is about to win, how often it simply plays something else, and how much
 * noise sits over its judgement. That is what actually separates a beginner
 * from a strong player at a board — not a different algorithm, and certainly
 * not a strong algorithm handicapped by throwing away every other move.
 *
 * Every candidate is played through the engine and the result read back from
 * it, so the chooser cannot play an illegal turn, cannot miss a variant's
 * losing condition, and needs to know nothing about which game it is playing.
 */

/**
 * What the guard has said about a turn. Three states, not a boolean: a turn
 * the guard never reached, or ran out of clock on, is UNREAD, which is neither
 * "safe" nor "loses" — see `handsOverTheGame` for why the difference matters.
 */
const GUARD = {
  unread: "unread",
  cleared: "cleared",
  condemned: "condemned",
} as const;
type GuardVerdict = (typeof GUARD)[keyof typeof GUARD];

type Scored = {
  turn: BotTurn;
  after: GameState;
  score: number;
  /** What the guard found, or that it has not looked. */
  guard: GuardVerdict;
};

/** Whether a score is a settled game rather than a reading of a live one. */
function isDecided(score: number): boolean {
  return Math.abs(score) >= DECIDED_SCORE / 2;
}

/** What one turn is worth before any lookahead or noise. */
function baseScore(state: GameState, turn: BotTurn, after: GameState, me: Stone, spec: TierSpec): number {
  if (after.status !== GAME_STATUS.playing) return positionScore(after, me);

  const variant = VARIANT_SPECS[state.settings.variant];
  let score = positionScore(after, me);
  /*
   * Where a game reads lines, the stone's own point is where most of the
   * information is: the shape it makes, and the shape it takes away. A slide,
   * a laid piece or a pass has no single point to read, so those are scored by
   * the position alone.
   */
  /*
   * Go is not a line game either. Scoring its points by shape rewarded the
   * computer for building rows of five on a Go board, which is why it played
   * such a long, aimless game there: the thing it was measuring had nothing
   * to do with the thing it was playing. Its position score is the area, and
   * the area already says what a stone was worth.
   */
  const readsPoints = shapeIsRead(variant);
  if (turn.kind === MOVE_KINDS.place && readsPoints) {
    const point = { row: turn.row, col: turn.col };
    const stone = turn.stone ?? me;
    score += pointScore(state, point, stone, variant, defenceNow(spec, state.moves.length));
    if (spec.reads && readsThreats(variant)) score += threatScore(state, point, stone);
  }
  // A laid piece is several cells at once, and each of them is shape.
  if (turn.kind === MOVE_KINDS.piece && readsPoints) {
    score += pieceScore(state, turn.cells, me, variant, defenceNow(spec, state.moves.length));
  }
  /*
   * In Go, pass when playing on gains nothing.
   *
   * Under area scoring a stone inside your own territory is worth exactly
   * what the empty point it fills was worth, so filling your own ground
   * scores the same as passing — and with nothing to separate them the
   * computer went on playing until the board was full, which is how a game
   * of Go on 19x19 took over a minute and never looked like Go. Taking a
   * point of anybody's ground still beats this many times over, so it never
   * buys a pass out of a live game; it decides only the case where every
   * remaining move is worth nothing, and there the right move is to pass.
   */
  if (variant.go && turn.kind === MOVE_KINDS.pass) score += EVAL_WEIGHTS.goPass;
  return score;
}

/**
 * Whether the other side could win outright in reply to this position — or
 * null, when the clock ran out before every reply had been read.
 *
 * The whole of the lookahead, and deliberately so. On a turn-based site a move
 * has to be chosen inside a request, and one ply of "does this hand them the
 * game" — checked through the engine, so it is right in every variant — beats
 * three plies of a heuristic that does not know what the game is about.
 *
 * `until` is the move's deadline, the same one the search spends the rest of.
 * This used to run with no clock at all: up to `REPLY_CAP` replies for each of
 * `guardTop` candidates, every one a full rule application, all of it before
 * the search's clock had started — so the move's real cost was the budget plus
 * whatever this took, and on a board where a rule application is dear that
 * was the larger half. It is bounded in COUNT by construction (`REPLY_CAP` a
 * read, `guardTop` reads a move), which is why it takes no node budget of its
 * own; what it lacked was a bound in time.
 *
 * NULL, NEVER FALSE, WHEN IT CANNOT FINISH. A read that stops half way has not
 * found a winning reply, and "I found none" and "I did not look at them all"
 * are different facts — the first clears a move and the second says nothing.
 * Returning false here would report "no danger" for a move nobody had checked,
 * which is exactly the plausible-looking wrong answer this codebase has been
 * bitten by before. The clock is read before each reply rather than after, so
 * a read that gets through every reply answers, whatever the time says then.
 */
export function handsOverTheGame(after: GameState, me: Stone, until: number): boolean | null {
  if (after.status !== GAME_STATUS.playing) return false;
  // Where a turn is more than one stone, the other side is not to move yet.
  if (after.toPlay === me) return false;
  if (Date.now() >= until) return null;
  const foe = otherStone(me);
  for (const reply of legalTurns(after, REPLY_CAP)) {
    if (Date.now() >= until) return null;
    const next = applyTurn(after, reply);
    if (next === after) continue;
    if (next.status !== GAME_STATUS.playing && next.winner === foe) return true;
  }
  return false;
}

/**
 * The best turn that neither hands over the game nor leaves the other side a
 * forced win: the search's own ranking first, and only then the best by shape.
 *
 * The order matters more than it looks. When the move the search liked is
 * refused, what replaces it used to be picked by SHAPE alone — and shape is
 * what the search exists to improve on. Measured, that fallback is why every
 * change that let the defence run more often made the grade weaker: more of the
 * search's moves refused meant more shallow ones played. The search's ranking is
 * consulted first now, and the shape list is the last resort it always was.
 */
function firstDefended(
  scored: Scored[],
  me: Stone,
  guarding: boolean,
  forcing: ForcedBudget,
  /** The root moves the search ranked, best first. */
  ranked: readonly Point[],
  /** The move's deadline, which the guard reads against. */
  until: number,
): Scored | null {
  for (const point of ranked) {
    const entry = scored.find(
      (option) => option.turn.kind === MOVE_KINDS.place && option.turn.row === point.row && option.turn.col === point.col,
    );
    if (entry === undefined || entry.guard === GUARD.condemned) continue;
    // UNREAD is not cleared: a move nobody checked is not played on the
    // strength of the check nobody made. See `handsOverTheGame`.
    if (guarding && readGuard(entry, me, until) !== GUARD.cleared) continue;
    if (threatWinTurn(entry.after, forcing) === null) return entry;
  }
  return bestByShape(scored, me, guarding, forcing, until);
}

/**
 * The best turn by shape that neither hands over the game nor leaves the other
 * side a forced win, among the first few; null when none of them manages it.
 */
function bestByShape(
  scored: Scored[],
  me: Stone,
  guarding: boolean,
  forcing: ForcedBudget,
  until: number,
): Scored | null {
  const byShape = scored.filter((entry) => entry.guard !== GUARD.condemned).sort((a, b) => b.score - a.score);
  for (const entry of byShape.slice(0, FORCED.defended)) {
    if (guarding && readGuard(entry, me, until) !== GUARD.cleared) continue;
    if (threatWinTurn(entry.after, forcing) === null) return entry;
  }
  return null;
}

/**
 * Reads a turn the guard has not reached yet, and records what it found. A
 * turn already read is not read twice: the answer is a fact about the position
 * and the position has not changed.
 */
function readGuard(entry: Scored, me: Stone, until: number): GuardVerdict {
  if (entry.guard !== GUARD.unread) return entry.guard;
  const verdict = handsOverTheGame(entry.after, me, until);
  if (verdict !== null) entry.guard = verdict ? GUARD.condemned : GUARD.cleared;
  return entry.guard;
}

/** One of `items`, drawn evenly. Ties are broken by chance, never by board order. */
function pick<T>(items: T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

/** The best-scoring entries, with ties kept so chance can settle them. */
function bestOf(scored: Scored[]): Scored[] {
  let best = -Infinity;
  for (const entry of scored) if (entry.score > best) best = entry.score;
  return scored.filter((entry) => entry.score === best);
}

/**
 * The turn a tier takes in this position, or null when there is none to take —
 * the game is over, or the colour to move owes a quarter turn rather than a
 * move.
 *
 * `random` is passed in rather than reached for, so a test can replay a
 * player's whole game from a seed exactly as the board's own dice are replayed.
 *
 * `budget` caps what the strongest grade may spend looking ahead. It is a
 * parameter because one computer player can be sat in a great many games at
 * once: a request answering several of its seats has a budget for the request,
 * not for each move in it. See `SearchBudget` for why it has two limits.
 */
export function chooseTurn(
  state: GameState,
  tier: BotTier,
  random: () => number = Math.random,
  budget: SearchBudget = {},
): BotTurn | null {
  const spec = TIER_SPECS[tier];
  const me = state.toPlay;
  const turns = legalTurns(state, spec.width);
  if (turns.length === 0) return null;
  if (turns.length === 1) return turns[0];

  /*
   * A player who has actually studied this game plays it by what it knows,
   * and everything below is what the rest of them do.
   *
   * One conditional, on a piece of data: the tier's `expertise` against the
   * game's spec. Nothing here asks which player this is or which game it is,
   * so a specialist meeting a flipping board added next year is covered by
   * what that board is rather than by anybody remembering to come back here.
   * Where it has no specialty — which is the case for all five graded
   * players, and for a specialist at any game but its own — this answers null
   * and the shared reading below decides, exactly as it always has.
   */
  const mastered = masteredTurn(state, spec, random, budget);
  if (mastered !== null) return mastered;

  /*
   * The few games whose whole tree fits in memory are played from it, by the
   * grades that promise never to blunder.
   *
   * `blunder === 0 && guard === 1` is not a description of how Meijin and 国手
   * usually play, it is their spec — and at tic-tac-toe or Notakto, keeping
   * that promise is free. Measured before this branch existed, they threw away
   * 1% of held wins at Wild tic-tac-toe, a game with 2,510 positions.
   *
   * The weaker grades deliberately do NOT come here. Their measured ladder —
   * 6%, 4%, 1% at tic-tac-toe — is honest weakness, a player who did not see
   * the win. Giving them the answer and having them look away would be a
   * different thing entirely, and not one to build unasked.
   *
   * `perfectTurns` answers null for anything it cannot settle, and null falls
   * through to the ordinary reading below rather than standing in for it.
   */
  if (spec.blunder === 0 && spec.guard === 1) {
    const perfect = perfectTurns(state);
    if (perfect !== null && perfect.length > 0) return pick(perfect.map((turn) => ({ turn })), random).turn;
  }

  const scored: Scored[] = [];
  for (const turn of turns) {
    const after = applyTurn(state, turn);
    // A turn the engine refuses is not a turn. It should not happen; if the
    // enumeration ever drifts from the rules, the rules win.
    if (after === state) continue;
    scored.push({ turn, after, score: baseScore(state, turn, after, me, spec), guard: GUARD.unread });
  }
  if (scored.length === 0) return null;

  /*
   * A win in hand is taken by every tier. A beginner misses a great deal, but
   * not the stone that finishes the game in front of them, and a computer that
   * did would read as broken rather than as weak.
   */
  const winning = scored.filter((entry) => entry.score >= DECIDED_SCORE);
  if (winning.length > 0) return pick(winning, random).turn;

  // Otherwise a weak player throws the occasional turn away, which is the truth about weak players.
  if (random() < spec.blunder) return pick(scored, random).turn;

  // The second and third stones of a line game come from a book, so no two games start alike.
  const opened = openingTurn(state, scored, random);
  if (opened !== null) return opened;

  /*
   * A forced win, where the grade reads ahead at all — by fours, or by the open
   * threes that threaten fours (`threatWin.ts`). It follows only the moves that
   * force a reply, so it sees a chain far past the depth the search reaches,
   * and a win it reports is real: every step, and every reply that could stop
   * it, went through the engine. Before the guard, because a threat hands
   * nothing over: the other side has no five to make, or it would not look.
   */
  /*
   * ONE BUDGET FOR BOTH HALVES, and it has been tried the other way twice.
   * Splitting the finders' quarter of the clock between attack and defence, and
   * giving the search only the time left, lost 7–13 at equal time while a
   * refused move fell back on the best by SHAPE, and 9–11 after that fallback
   * was mended to follow the search's own ranking. Better, still not better than
   * this. The defence reads what is left when the attack is done.
   */
  const forcing = spec.searchDepth > 0 ? forcedBudget(budget) : null;
  if (forcing !== null) {
    const forced = threatWinTurn(state, forcing);
    if (forced !== null) return forced;
  }

  /*
   * Noticing that the other side is about to win. Rolled once for the whole
   * turn rather than once per candidate: a player who half-notices a threat
   * and blocks it in the wrong place is not a weaker player, it is a stranger
   * one, and it makes the tier's strength impossible to reason about.
   */
  const guarding = spec.depth > 1 && random() < spec.guard;
  /*
   * THE MOVE'S CLOCK STARTS HERE, and the guard and the search both spend it.
   *
   * One deadline rather than one each: a move on this site is a request
   * somebody pays for, and its cost is whatever runs, not whatever the search
   * was told. The guard used to run before the clock existed and the search
   * then took the whole budget after it, so a move cost the budget plus the
   * guard — measured at 250ms plus 68ms on a fifteen by fifteen board with
   * twenty-four stones down, and more wherever a rule application is dearer.
   * Now the guard reads what it can before the deadline and the search gets
   * what is left, so the two together cost the budget. The node count is not
   * shared: the searches count different things under that name (positions in
   * one, candidates weighed in another) and a test pins a search by it, so a
   * guard charging its six thousand applications there would starve every one
   * of them. The guard's count is bounded by `REPLY_CAP` and `guardTop`
   * already; the clock was the bound it lacked.
   *
   * When the clock runs out part way down the list, the rest stay UNREAD and
   * are not pretended safe — see `handsOverTheGame`. A grade out of time then
   * plays what it has read, which is the same as a grade with a smaller
   * `guardTop`, rather than a move with a fabricated all-clear on it.
   */
  const until = Date.now() + (budget.millis ?? SEARCH.millis);
  if (guarding) {
    const ranked = [...scored].sort((a, b) => b.score - a.score);
    for (const entry of ranked.slice(0, spec.guardTop)) {
      const verdict = readGuard(entry, me, until);
      // Out of clock: nothing further down the list can be read either.
      if (verdict === GUARD.unread) break;
      if (verdict === GUARD.condemned) entry.score -= DECIDED_SCORE;
    }
  }

  /*
   * Looking ahead, for the grade that does — and *after* the guard, never
   * instead of it.
   *
   * This is the whole shape of the thing, and it was got wrong first time
   * round in a way worth writing down: the search reads a narrow, ordered ten
   * candidates a node, while the guard above reads the other side's replies
   * almost in full. A narrow search is a better plan and a worse safety net,
   * so a grade that searched *instead of* guarding played deeper, prettier
   * games and walked into wins the grade below it would have seen. Measured
   * over twelve games on a fifteen by fifteen board, it lost five and won
   * none against the grade beneath it.
   *
   * So the search chooses among the moves the guard has not condemned, and
   * nothing else. The strongest grade is then stronger than the one below it
   * by construction: it has everything that one has, and a plan as well.
   */
  if (spec.searchDepth > 0) {
    /*
     * Two searches, and which one answers is decided by the game rather than by
     * the grade. `searchTurn` is the line games' — whole-board shape, ordered by
     * the threat ladder — and it answers null in the twenty-three games that are
     * not about lines. `lookAheadTurn` is those games', and answers null in
     * turn for the line games and for anything the shared reading cannot read
     * at all.
     *
     * Before this, the second half did not exist, and that was the ordering bug
     * rather than a gap in it: `searchDepth` is the ONLY knob separating 名人
     * from 国手, so in the games where nothing searched the two were one program
     * under two names — and the noisier, blunder-prone 段 beat both of them,
     * because at one ply a flipping game is not being read at all. The cost is
     * bounded by the same wall clock every grade already spends in the other
     * sixteen games; see LOOK for why its node budget counts what it counts.
     */
    const ranked: Point[] = [];
    // What the guard left of the clock; the node count passes through whole.
    const left: SearchBudget = { ...budget, millis: Math.max(0, until - Date.now()) };
    const searched =
      searchTurn(state, spec.searchDepth, random, left, defenceNow(spec, state.moves.length), "auto", ranked) ??
      lookAheadTurn(
        state,
        lookDepth(VARIANT_SPECS[state.settings.variant], spec.searchDepth),
        random,
        left,
        // Its own width, so what it hands back is among what was weighed above.
        spec.width,
      );
    const entry =
      searched === null ? undefined : scored.find((option) => sameTurn(option.turn, searched));
    /*
     * The guard only condemns the best few by shape, so a move the search
     * liked may simply never have been examined. It is checked here on its own
     * account: one reply reading, on one position, and the safety net has no
     * hole in it. A move the guard already read is not read again, and a move
     * it could not finish reading is UNREAD, which is not cleared — the grade
     * falls back to the moves it did read rather than play a plan nobody has
     * checked for the one-move loss the whole guard exists to catch.
     */
    const safe =
      entry !== undefined &&
      entry.guard !== GUARD.condemned &&
      (!guarding || readGuard(entry, me, until) === GUARD.cleared);
    if (safe && (forcing === null || threatWinTurn(entry.after, forcing) === null)) return entry.turn;

    /*
     * The move the search liked leaves the other side a forced win — or the
     * guard condemned it, or the clock ran out before the guard could read it.
     * Either way the next best that does neither is played instead. This is the
     * finder's larger half: a chain of threats against us is as far past the
     * search's horizon as one of ours, and until now the top grades walked into
     * them. Only the best few by shape are tried, on the finder's own shared
     * budget; when none survives, the choice falls through to the ordinary one,
     * because every move then loses and none is worse.
     */
    if (forcing !== null) {
      const defended = firstDefended(scored, me, guarding, forcing, ranked, until);
      if (defended !== null) return defended.turn;
    }
  }

  if (spec.noise > 0) {
    const live = scored.filter((entry) => !isDecided(entry.score)).map((entry) => entry.score);
    const spread = live.length === 0 ? 0 : Math.max(...live) - Math.min(...live);
    if (spread > 0) {
      for (const entry of scored) {
        if (isDecided(entry.score)) continue;
        entry.score += (random() - 0.5) * spread * spec.noise;
      }
    }
  }

  return pick(bestOf(scored), random).turn;
}

/**
 * Whether this tier could take a turn here at all. A game that is over, or one
 * waiting on the quarter turn that finishes a stone, has no turn to take.
 */
export function hasTurn(state: GameState): boolean {
  return state.status === GAME_STATUS.playing && !state.pendingTwist;
}
