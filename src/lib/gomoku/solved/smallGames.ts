import { GAME_STATUS, RULE_VARIANTS } from "../gomoku.constants";
import { applyTurn, legalTurns } from "../opponentTurns";
import type { BotTurn } from "../opponent.types";
import type { GameState, RuleVariant } from "../gomoku.types";

/**
 * THE GAMES SMALL ENOUGH TO BE PLAYED PERFECTLY, PLAYED PERFECTLY.
 *
 * On a 3×3 board strength is not an opinion. The whole game tree fits in a few
 * thousand entries, so there is a RIGHT move in every position, and a grade
 * whose own spec says it never blunders has no excuse for playing anything
 * else. Measured before this existed (`pnpm bots:perfect`): the top two grades
 * were already perfect at tic-tac-toe and threw away 1% of held wins at Wild
 * tic-tac-toe — a game with 2,510 positions, where being perfect is free.
 *
 * **Only the grades that PROMISE never to blunder consult this.** That is the
 * whole scope, and the restraint is deliberate. The measured ladder below them
 * is honest and hard-won — razryad 6%, kyu 4%, dan 1% at tic-tac-toe, which is
 * a real difficulty curve — and handing them a perfect table would either
 * flatten it or turn their weakness into a deliberate lie told against a known
 * right answer. A weak player who has not seen the win is a weak player. One
 * who has seen it and looked away is a different thing, and not one to build
 * without being asked for it.
 *
 * **Declared, never inferred.** A game is on this list because somebody worked
 * out that its tree is small, not because its board is. Trap Three is 5×5 and
 * Maker-Breaker is 6×6 and neither is here; tic-tac-toe and Notakto are 3×3
 * and both are. Adding one is a measurement, not a guess.
 */
const SOLVED_SMALL: readonly RuleVariant[] = [
  RULE_VARIANTS.tictactoe,
  RULE_VARIANTS.wildTicTacToe,
  RULE_VARIANTS.notakto,
];

/**
 * The most positions a solve may visit before it gives up.
 *
 * A ceiling rather than a trust: the games above are thousands of positions, so
 * this is never reached, and it is here because the cost of being wrong about
 * that is a request that never returns. Reaching it answers "I do not know",
 * which the caller treats as "not solved" — never as "no good move exists".
 */
const SOLVE_CAP = 400_000;

/** The value of a position TO THE SIDE ABOUT TO MOVE. */
type Value = 1 | 0 | -1;

/** One table per game and size, filled as positions are met. Tiny, and the same for everybody. */
const tables = new Map<string, Map<string, Value>>();

/** Games whose solve hit the cap. Asked once, then left alone. */
const gaveUp = new Set<string>();

function keyOf(state: GameState): string {
  return `${state.board.map((cell) => cell ?? ".").join("")}|${state.toPlay}`;
}

/** The result as it stands, for the side about to move — or null while the game is alive. */
function finished(state: GameState, mover: string): Value | null {
  if (state.status === GAME_STATUS.playing) return null;
  if (state.status === GAME_STATUS.draw || state.winner === null) return 0;
  return state.winner === mover ? 1 : -1;
}

/** Solves outward from one position, filling `seen`. Returns null if it hit the cap. */
function solve(state: GameState, seen: Map<string, Value>, visited: { count: number }): Value | null {
  const mover = state.toPlay;
  const done = finished(state, mover);
  if (done !== null) return done;

  const key = keyOf(state);
  const known = seen.get(key);
  if (known !== undefined) return known;

  visited.count += 1;
  if (visited.count > SOLVE_CAP) return null;

  const turns = legalTurns(state, 200);
  if (turns.length === 0) {
    seen.set(key, 0);
    return 0;
  }

  let best: Value = -1;
  for (const turn of turns) {
    const next = applyTurn(state, turn);
    if (next === state) continue;
    const theirs = solve(next, seen, visited);
    if (theirs === null) return null;
    // Negated unless the same side moves again, which some of these allow.
    const mine: Value = next.toPlay === mover ? theirs : (-theirs as Value);
    if (mine > best) best = mine;
    if (best === 1) break;
  }
  seen.set(key, best);
  return best;
}

/** Whether this game is one of the solved few. */
export function isSolvedSmall(variant: RuleVariant): boolean {
  return SOLVED_SMALL.includes(variant);
}

/**
 * The shared table for this game and size, and whether it has given up.
 *
 * Solving from the position in FRONT of us rather than from the game's start
 * is what makes this correct and cheap at once. The first version built the
 * table from whichever position happened to ask first, then answered "I do not
 * know" for every position that one could not reach — which was most of them,
 * so the branch did nothing at all and the measurement was unchanged. Memoising
 * into one map per game means each position is solved once, wherever it is met.
 */
function tableFor(state: GameState): Map<string, Value> | null {
  const { variant, size } = state.settings;
  if (!isSolvedSmall(variant)) return null;
  const id = `${variant}:${size}`;
  if (gaveUp.has(id)) return null;
  let table = tables.get(id);
  if (table === undefined) {
    table = new Map<string, Value>();
    tables.set(id, table);
  }
  return table;
}

/**
 * The best turns in this position, by the game's true value — or null when the
 * game is not one of the solved few, or the solve gave up.
 *
 * Null is "I do not know", and is the only honest answer when the work was not
 * finished. Returning a turn anyway would be a guess wearing the authority of a
 * solved game, which is worse than having no table at all: the caller is about
 * to trust this over its own reading.
 */
export function perfectTurns(state: GameState): BotTurn[] | null {
  const table = tableFor(state);
  if (table === null) return null;
  if (state.status !== GAME_STATUS.playing) return null;

  const mover = state.toPlay;
  const turns = legalTurns(state, 200);
  if (turns.length === 0) return null;

  const visited = { count: 0 };
  let best: Value | null = null;
  const byValue: { turn: BotTurn; value: Value }[] = [];
  for (const turn of turns) {
    const next = applyTurn(state, turn);
    if (next === state) continue;
    const theirs = solve(next, table, visited);
    if (theirs === null) {
      // Too big after all. Remember it, so this is not retried on every move
      // for the rest of the process's life.
      gaveUp.add(`${state.settings.variant}:${state.settings.size}`);
      return null;
    }
    const mine: Value = next.toPlay === mover ? theirs : (-theirs as Value);
    byValue.push({ turn, value: mine });
    if (best === null || mine > best) best = mine;
  }

  if (best === null) return null;
  const top = byValue.filter((one) => one.value === best).map((one) => one.turn);
  return top.length === 0 ? null : top;
}
