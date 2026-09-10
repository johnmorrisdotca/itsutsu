import { describe, expect, it } from "vitest";

import { NO_PROGRESS_RULES, PROGRESS_MEASURES, canStall, couldNotFinish, distanceHome, pliesWithoutProgress, stalled } from "./noProgress";
import { STAR_RADIUS, starCampSquares } from "./chineseCheckers";
import { RULE_VARIANTS, STONES, VARIANT_SPECS, boardSizesFor } from "../gomoku.constants";
import { GAME_STATUS } from "../gomoku.constants";
import { createGame, movePiece, pieceMoves } from "../engine";
import type { GameState, Move, Point, RuleVariant } from "../gomoku.types";

/**
 * A game nobody is getting anywhere in is a draw.
 *
 * The cases that matter are the two ends of it: a shuffle must end, and a
 * real game must not. The second is the one worth being careful about —
 * ending somebody's honest Halma march as a draw would be a worse fault than
 * the endless game this rule exists to stop.
 */

const shuffle = (variant: string, size: number, plies: number, over: Partial<Move> = {}): GameState =>
  ({
    settings: { ...createGame({ variant: variant as RuleVariant, size }).settings },
    moves: Array.from({ length: plies }, (_, at) => ({
      row: at % 2 === 0 ? 4 : 5,
      col: 4,
      from: { row: at % 2 === 0 ? 5 : 4, col: 4 },
      stone: at % 2 === 0 ? "black" : "white",
      kind: "move",
      wasKing: true,
      ...over,
    })) as Move[],
    pendingTwist: null,
  }) as unknown as GameState;

describe("which games can run away", () => {
  it("watches the games where pieces move and no others", () => {
    expect(canStall(RULE_VARIANTS.checkers)).toBe(true);
    expect(canStall(RULE_VARIANTS.halma)).toBe(true);
    expect(canStall(RULE_VARIANTS.squareFour)).toBe(true);
    /*
     * Chinese Checkers is watched too, but it says something different when
     * it ends — see the case below. It was excluded for a while because the
     * rule was reading an empty camp for its star board and would have drawn
     * every game of it for a reason that looked like a property of the game.
     */
    expect(canStall(RULE_VARIANTS.chineseCheckers)).toBe(true);
    // A placed stone fills a point for good, so the board is the bound.
    expect(canStall(RULE_VARIANTS.freestyle)).toBe(false);
    expect(canStall(RULE_VARIANTS.reversi)).toBe(false);
    expect(pliesWithoutProgress(shuffle(RULE_VARIANTS.freestyle, 15, 400))).toBeNull();
  });

  it("names a real board size for every game it watches", () => {
    /*
     * A threshold on a variant that does not exist, or one whose board this
     * rule cannot measure, is a rule that never fires and nobody notices.
     */
    for (const variant of Object.keys(NO_PROGRESS_RULES) as RuleVariant[]) {
      expect(VARIANT_SPECS[variant], `${variant} is not a game`).toBeDefined();
      expect(boardSizesFor(variant).length, `${variant} has no board`).toBeGreaterThan(0);
    }
  });

  it("can actually take a reading on every board every watched game offers", () => {
    /*
     * THE TEST THE TABLE ABOVE NEEDED AND DID NOT HAVE, and the reason
     * squareFour sat here for a release guarding nothing.
     *
     * Naming a real game on a real board is not the same as being able to
     * MEASURE it. squareFour named both and its 5×5 board has no camp, so the
     * racing measure read an empty camp, correctly refused to answer, and the
     * rule correctly never fired — while `canStall` went on saying true. Every
     * assertion anybody had written passed the whole time.
     *
     * So this asks the harder question: for each game, on each size it is
     * actually offered at, can the measure it NAMES produce a reading at all?
     * A guard that cannot answer must not claim to be a guard.
     */
    for (const [name, rule] of Object.entries(NO_PROGRESS_RULES)) {
      const variant = name as RuleVariant;
      for (const size of boardSizesFor(variant)) {
        const where = `${variant} on ${size}×${size}`;
        if (rule!.measure === PROGRESS_MEASURES.racing) {
          for (const stone of [STONES.black, STONES.white]) {
            expect(distanceHome(size, stone, { row: 0, col: 0 }), `${where}: ${stone} has no camp to measure to`).not.toBeNull();
          }
        } else if (rule!.measure === PROGRESS_MEASURES.placing) {
          // The count is `moves.length - 2 * pieces`; with no `pieces` it
          // would silently count every move ever played instead.
          expect(VARIANT_SPECS[variant].pieces, `${where}: places no pieces, so nothing marks progress`).not.toBeNull();
        } else {
          expect(VARIANT_SPECS[variant].checkers, `${where}: takes nothing, so nothing marks progress`).toBe(true);
        }
      }
    }
  });
});

describe("a game nobody could finish says so", () => {
  it("reads the star board rather than answering zero for it", () => {
    /*
     * The bug that kept Chinese Checkers out: its camps are in another module
     * on a board size the square game has never heard of, so asking the wrong
     * table returned an empty camp and `distanceHome` answered zero — a
     * distance, meaning every piece already home and every game stalled.
     */
    const size = boardSizesFor(RULE_VARIANTS.chineseCheckers)[0];
    const own = starCampSquares(STAR_RADIUS, "black")[0];
    const target = starCampSquares(STAR_RADIUS, "white");
    const atHome = distanceHome(size, "black", target[target.length - 1]);
    expect(atHome).not.toBeNull();
    expect(atHome!).toBeLessThan(distanceHome(size, "black", own)!);
  });

  it("tells a game that got nowhere apart from a game that ran its length", () => {
    /*
     * Not the same thing, and the board says so differently: one is a result
     * the players agreed to, the other is the game admitting it went nowhere.
     * A game nobody can win must stay visible as such rather than be filed as
     * an ordinary draw.
     */
    const drawn = { status: GAME_STATUS.draw, settings: { variant: RULE_VARIANTS.freestyle } } as GameState;
    expect(couldNotFinish(drawn)).toBe(false);
  });
});

describe("draughts, by the draughts rule", () => {
  const size = boardSizesFor(RULE_VARIANTS.checkers)[0];

  it("ends a game of two kings going nowhere", () => {
    const limit = NO_PROGRESS_RULES[RULE_VARIANTS.checkers]!.plies;
    expect(stalled(shuffle(RULE_VARIANTS.checkers, size, limit))).toBe(true);
    expect(stalled(shuffle(RULE_VARIANTS.checkers, size, limit - 1))).toBe(false);
  });

  it("counts from the last capture, not from the first move", () => {
    const state = shuffle(RULE_VARIANTS.checkers, size, 20);
    // A capture in the middle: only what came after it is idle.
    state.moves[9] = { ...state.moves[9], captured: [{ row: 3, col: 3 }] } as Move;
    expect(pliesWithoutProgress(state)).toBe(10);
  });

  it("counts a man's move as getting somewhere, and a king's as not", () => {
    // A man promotes and never un-promotes, so a man moving is irreversible.
    const men = shuffle(RULE_VARIANTS.checkers, size, 10, { wasKing: false });
    expect(pliesWithoutProgress(men)).toBe(0);
    const kings = shuffle(RULE_VARIANTS.checkers, size, 10, { wasKing: true });
    expect(pliesWithoutProgress(kings)).toBe(10);
  });
});

describe("the placing games, where the last piece down closes the game off", () => {
  const size = boardSizesFor(RULE_VARIANTS.squareFour)[0];
  const laid = 2 * VARIANT_SPECS[RULE_VARIANTS.squareFour].pieces!;

  it("counts nothing while pieces are still going down", () => {
    // Placement IS progress: the game is still becoming what it will be.
    expect(pliesWithoutProgress(shuffle(RULE_VARIANTS.squareFour, size, laid))).toBe(0);
    expect(pliesWithoutProgress(shuffle(RULE_VARIANTS.squareFour, size, laid - 3))).toBe(0);
  });

  it("counts every slide after the last piece is down", () => {
    expect(pliesWithoutProgress(shuffle(RULE_VARIANTS.squareFour, size, laid + 30))).toBe(30);
  });

  it("ends a shuffle that has gone on past the limit, and not one that has not", () => {
    const limit = NO_PROGRESS_RULES[RULE_VARIANTS.squareFour]!.plies;
    expect(stalled(shuffle(RULE_VARIANTS.squareFour, size, laid + limit))).toBe(true);
    expect(stalled(shuffle(RULE_VARIANTS.squareFour, size, laid + limit - 1))).toBe(false);
  });

  it("leaves room for the longest game anybody has actually been seen to win", () => {
    /*
     * The measured worst case: 232 slides after the last placement, in a game
     * that was WON. A limit at or under that would have taken the win off
     * whoever was about to make it, which is the fault this rule must never
     * commit — see the Halma case below, where I committed it once already.
     */
    const longestWon = 232;
    expect(stalled(shuffle(RULE_VARIANTS.squareFour, size, laid + longestWon))).toBe(false);
  });
});

describe("the race games, measured by distance rather than a ledger", () => {
  const size = boardSizesFor(RULE_VARIANTS.halma)[0];

  /**
   * Played through the engine rather than hand-built.
   *
   * Every hand-built position I wrote for this rule was wrong — marching the
   * wrong way, marching over its own pieces, marching past the target row —
   * and each time the rule was right and the fixture was not. A real game
   * cannot be wrong about what a legal move is.
   */
  function halmaGame(): GameState {
    return createGame({ variant: RULE_VARIANTS.halma, size }, 0);
  }

  /** One move, chosen for how much nearer it gets the mover to its camp. */
  function step(state: GameState, want: "best" | "worst"): GameState {
    let pick: { from: Point; to: Point; gain: number } | null = null;
    for (let index = 0; index < state.board.length; index += 1) {
      if (state.board[index] !== state.toPlay) continue;
      const from = { row: Math.floor(index / size), col: index % size };
      for (const to of pieceMoves(state, from)) {
        const gain =
          (distanceHome(size, state.toPlay, from) ?? 0) - (distanceHome(size, state.toPlay, to) ?? 0);
        if (pick === null || (want === "best" ? gain > pick.gain : gain < pick.gain)) {
          pick = { from, to, gain };
        }
      }
    }
    expect(pick, "nothing legal to play").not.toBeNull();
    return movePiece(state, pick!.from, pick!.to);
  }

  it("ends a game where nobody is getting anywhere", () => {
    const was = NO_PROGRESS_RULES[RULE_VARIANTS.halma]!.plies;
    // A short window, so the test plays a handful of moves rather than four
    // hundred. The rule is the same one at either size.
    NO_PROGRESS_RULES[RULE_VARIANTS.halma] = { plies: 4, measure: PROGRESS_MEASURES.racing };
    try {
      let state = halmaGame();
      /*
       * The worst move available every ply — the one that gets least nearer,
       * or gets further away. A shuttle between two squares is the picture of
       * the problem, but Halma will not let a piece back into its own camp,
       * so playing badly on purpose is how a real game goes nowhere.
       */
      for (let ply = 0; ply < 12 && state.status === GAME_STATUS.playing; ply += 1) {
        state = step(state, "worst");
      }
      expect(state.status, "a game of nothing but stepping about should be drawn").toBe(GAME_STATUS.draw);
    } finally {
      NO_PROGRESS_RULES[RULE_VARIANTS.halma] = { plies: was, measure: PROGRESS_MEASURES.racing };
    }
  });

  it("does not end a game where somebody is getting somewhere", () => {
    /*
     * THE CASE THIS COULD MOST EASILY GET WRONG, and it already did once: a
     * rule that ends a real game is worse than the endless game it replaces.
     * A real opening, played out, must never be called stalled.
     */
    const was = NO_PROGRESS_RULES[RULE_VARIANTS.halma]!.plies;
    NO_PROGRESS_RULES[RULE_VARIANTS.halma] = { plies: 4, measure: PROGRESS_MEASURES.racing };
    try {
      let state = halmaGame();
      for (let ply = 0; ply < 12 && state.status === GAME_STATUS.playing; ply += 1) {
        state = step(state, "best");
      }
      expect(state.status, "a game somebody is winning should still be going").toBe(GAME_STATUS.playing);
    } finally {
      NO_PROGRESS_RULES[RULE_VARIANTS.halma] = { plies: was, measure: PROGRESS_MEASURES.racing };
    }
  });

  it("reads the distance towards the camp a colour is filling, not its own", () => {
    const near = distanceHome(size, "black", { row: size - 1, col: size - 1 })!;
    const far = distanceHome(size, "black", { row: 0, col: 0 })!;
    expect(near).toBeLessThan(far);
    expect(distanceHome(size, "white", { row: 0, col: 0 })!).toBeLessThan(
      distanceHome(size, "white", { row: size - 1, col: size - 1 })!,
    );

    /*
     * A board with no camps this rule can read answers null, never zero.
     * Zero is a distance — every piece already home, no move ever nearer,
     * every game stalled — which is how this would have drawn every game of
     * Chinese Checkers before its star camps were wired in.
     */
    expect(distanceHome(9, "black", { row: 0, col: 0 })).toBeNull();
  });
});
