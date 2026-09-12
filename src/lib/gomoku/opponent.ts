import { racesForCamp } from "./rules/farCamp";
import { otherStone } from "./engine";
import { GAME_STATUS, MOVE_KINDS, VARIANT_SPECS } from "./gomoku.constants";
import { DECIDED_SCORE, EVAL_WEIGHTS, REPLY_CAP, TIER_SPECS } from "./opponent.constants";
import { pieceScore, positionScore, pointScore, readsThreats, threatScore } from "./opponentEval";
import { masteredTurn } from "./expert/experts";
import { applyTurn, legalTurns, sameTurn } from "./opponentTurns";
import { searchTurn } from "./opponentSearch";
import { lookAheadTurn, lookDepth } from "./opponentLook";
import type { GameState, Stone } from "./gomoku.types";
import type { BotTier, BotTurn, SearchBudget, TierSpec } from "./opponent.types";

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

type Scored = {
  turn: BotTurn;
  after: GameState;
  score: number;
  /** Set when the guard found that this turn hands the other side the game. */
  condemned: boolean;
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
  const readsPoints = !variant.flips && !racesForCamp(variant) && !variant.connects && !variant.go;
  if (turn.kind === MOVE_KINDS.place && readsPoints) {
    const point = { row: turn.row, col: turn.col };
    const stone = turn.stone ?? me;
    score += pointScore(state, point, stone, variant);
    if (spec.reads && readsThreats(variant)) score += threatScore(state, point, stone);
  }
  // A laid piece is several cells at once, and each of them is shape.
  if (turn.kind === MOVE_KINDS.piece && readsPoints) {
    score += pieceScore(state, turn.cells, me, variant);
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
 * Whether the other side could win outright in reply to this position.
 *
 * The whole of the lookahead, and deliberately so. On a turn-based site a move
 * has to be chosen inside a request, and one ply of "does this hand them the
 * game" — checked through the engine, so it is right in every variant — beats
 * three plies of a heuristic that does not know what the game is about.
 */
function handsOverTheGame(after: GameState, me: Stone): boolean {
  if (after.status !== GAME_STATUS.playing) return false;
  // Where a turn is more than one stone, the other side is not to move yet.
  if (after.toPlay === me) return false;
  const foe = otherStone(me);
  for (const reply of legalTurns(after, REPLY_CAP)) {
    const next = applyTurn(after, reply);
    if (next === after) continue;
    if (next.status !== GAME_STATUS.playing && next.winner === foe) return true;
  }
  return false;
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

  const scored: Scored[] = [];
  for (const turn of turns) {
    const after = applyTurn(state, turn);
    // A turn the engine refuses is not a turn. It should not happen; if the
    // enumeration ever drifts from the rules, the rules win.
    if (after === state) continue;
    scored.push({ turn, after, score: baseScore(state, turn, after, me, spec), condemned: false });
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

  /*
   * Noticing that the other side is about to win. Rolled once for the whole
   * turn rather than once per candidate: a player who half-notices a threat
   * and blocks it in the wrong place is not a weaker player, it is a stranger
   * one, and it makes the tier's strength impossible to reason about.
   */
  const guarding = spec.depth > 1 && random() < spec.guard;
  if (guarding) {
    const ranked = [...scored].sort((a, b) => b.score - a.score);
    for (const entry of ranked.slice(0, spec.guardTop)) {
      if (handsOverTheGame(entry.after, me)) {
        entry.condemned = true;
        entry.score -= DECIDED_SCORE;
      }
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
    const searched =
      searchTurn(state, spec.searchDepth, random, budget) ??
      lookAheadTurn(
        state,
        lookDepth(VARIANT_SPECS[state.settings.variant], spec.searchDepth),
        random,
        budget,
        // Its own width, so what it hands back is among what was weighed above.
        spec.width,
      );
    const entry =
      searched === null ? undefined : scored.find((option) => sameTurn(option.turn, searched));
    /*
     * The guard only condemns the best few by shape, so a move the search
     * liked may simply never have been examined. It is checked here on its own
     * account: one reply reading, on one position, and the safety net has no
     * hole in it.
     */
    const safe =
      entry !== undefined &&
      !entry.condemned &&
      (!guarding || !handsOverTheGame(entry.after, me));
    if (safe) return entry.turn;
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
