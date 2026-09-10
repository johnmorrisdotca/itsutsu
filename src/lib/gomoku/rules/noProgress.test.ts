import { describe, expect, it } from "vitest";

import { NO_PROGRESS_PLIES, canStall, distanceHome, pliesWithoutProgress, stalled } from "./noProgress";
import { RULE_VARIANTS, VARIANT_SPECS, boardSizesFor } from "../gomoku.constants";
import { CAMP_ROWS } from "./camps";
import { GAME_STATUS } from "../gomoku.constants";
import { createGame, movePiece, pieceMoves } from "../engine";
import type { GameState, Move, Point, RuleVariant, Stone } from "../gomoku.types";

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
     * Chinese Checkers is left out on purpose, and this asserts the absence
     * so nobody adds it back without reading why: fifteen bot games across
     * every grade never filled more than three of the ten squares a win
     * needs, so it may not be winnable in real play at all. A cap there would
     * end every game as a tidy draw and make an unwinnable game look
     * finished, destroying the only evidence there is. Pending John's ruling.
     */
    expect(canStall(RULE_VARIANTS.chineseCheckers)).toBe(false);
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
    for (const variant of Object.keys(NO_PROGRESS_PLIES) as RuleVariant[]) {
      expect(VARIANT_SPECS[variant], `${variant} is not a game`).toBeDefined();
      expect(boardSizesFor(variant).length, `${variant} has no board`).toBeGreaterThan(0);
    }
  });
});

describe("draughts, by the draughts rule", () => {
  const size = boardSizesFor(RULE_VARIANTS.checkers)[0];

  it("ends a game of two kings going nowhere", () => {
    const limit = NO_PROGRESS_PLIES[RULE_VARIANTS.checkers]!;
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
    const was = NO_PROGRESS_PLIES[RULE_VARIANTS.halma]!;
    // A short window, so the test plays a handful of moves rather than four
    // hundred. The rule is the same one at either size.
    NO_PROGRESS_PLIES[RULE_VARIANTS.halma] = 4;
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
      NO_PROGRESS_PLIES[RULE_VARIANTS.halma] = was;
    }
  });

  it("does not end a game where somebody is getting somewhere", () => {
    /*
     * THE CASE THIS COULD MOST EASILY GET WRONG, and it already did once: a
     * rule that ends a real game is worse than the endless game it replaces.
     * A real opening, played out, must never be called stalled.
     */
    const was = NO_PROGRESS_PLIES[RULE_VARIANTS.halma]!;
    NO_PROGRESS_PLIES[RULE_VARIANTS.halma] = 4;
    try {
      let state = halmaGame();
      for (let ply = 0; ply < 12 && state.status === GAME_STATUS.playing; ply += 1) {
        state = step(state, "best");
      }
      expect(state.status, "a game somebody is winning should still be going").toBe(GAME_STATUS.playing);
    } finally {
      NO_PROGRESS_PLIES[RULE_VARIANTS.halma] = was;
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
