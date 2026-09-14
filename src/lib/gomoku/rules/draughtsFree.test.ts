import { describe, expect, it } from "vitest";

import { createGame, movePiece, pieceMoves } from "../engine";
import { ENDGAME_COUNT_KINDS, GAME_STATUS, RULE_VARIANTS, STONES, WIN_REASONS } from "../gomoku.constants";
import type { GameState, Move, Point, RuleVariant, Stone } from "../gomoku.types";
import { rulesPageFor } from "@/lib/learn/rulesPage";
import { isDarkSquare, isKingAt } from "./checkers";
import { endingRanOut, repeatedTooOften, turnsInEnding } from "./checkersDraws";
import { fixedOpener } from "./creation";
import { NO_PROGRESS_RULES } from "./noProgress";

/**
 * The free-choice games of the checkers family: Russian draughts, by the
 * Russian federation's rules, and pool checkers, by the American Pool Checker
 * Association's. Kings fly and men take backward in both, as in international
 * draughts; what these cases pin down is where they part from it and from each
 * other — any capture may be chosen, Russian crowns a man mid-capture and lets
 * it take on as a king, pool does not, and each has its own draws.
 */

const p = (row: number, col: number): Point => ({ row, col });

type Piece = { at: Point; stone: Stone; king?: boolean };

function position(variant: RuleVariant, pieces: Piece[], toPlay: Stone = STONES.white): GameState {
  const game = createGame({ variant, allowUndo: true });
  const { size } = game.settings;
  const board = new Array(size * size).fill(null);
  for (const piece of pieces) {
    expect(isDarkSquare(piece.at), `${piece.at.row},${piece.at.col} is a light square`).toBe(true);
    board[piece.at.row * size + piece.at.col] = piece.stone;
  }
  const kings = pieces.filter((piece) => piece.king === true).map((piece) => piece.at);
  return { ...game, board, kings, toPlay };
}

const named = (points: Point[]) => points.map((point) => `${point.row},${point.col}`).sort();

function play(state: GameState, from: Point, to: Point): GameState {
  const next = movePiece(state, from, to);
  expect(next, `${from.row},${from.col} to ${to.row},${to.col} was refused`).not.toBe(state);
  return next;
}

describe("the free-choice games set out their boards", () => {
  it("starts russianDraughts with twelve men a side and White to move (FSR)", () => {
    const game = createGame({ variant: RULE_VARIANTS.russianDraughts, firstPlayer: STONES.black });
    expect(game.settings.size).toBe(8);
    expect(game.board.filter((cell) => cell === STONES.black)).toHaveLength(12);
    expect(game.board.filter((cell) => cell === STONES.white)).toHaveLength(12);
    expect(game.toPlay).toBe(STONES.white);
    expect(fixedOpener(RULE_VARIANTS.russianDraughts, "free")).toBe(STONES.white);
  });

  it("starts poolCheckers with twelve men a side and Black to move, whatever was asked (APCA rule 7)", () => {
    const game = createGame({ variant: RULE_VARIANTS.poolCheckers, firstPlayer: STONES.white });
    expect(game.board.filter((cell) => cell === STONES.black)).toHaveLength(12);
    expect(game.toPlay).toBe(STONES.black);
    expect(game.opener).toBe(STONES.black);
    expect(fixedOpener(RULE_VARIANTS.poolCheckers, "free")).toBe(STONES.black);
  });
});

describe("how the free-choice games take", () => {
  // One white man can take one piece; another can take two in a row.
  const choice: Piece[] = [
    { at: p(5, 0), stone: STONES.white },
    { at: p(4, 1), stone: STONES.black },
    { at: p(7, 2), stone: STONES.white },
    { at: p(6, 3), stone: STONES.black },
    { at: p(4, 5), stone: STONES.black },
  ];

  it.each([RULE_VARIANTS.russianDraughts, RULE_VARIANTS.poolCheckers])(
    "lets %s take the shorter capture where a longer one is on the board",
    (variant) => {
      const game = position(variant, choice);
      // FMJD-64 4.13, APCA rule 20: not compelled to take the greater number.
      expect(pieceMoves(game, p(5, 0))).toEqual([p(3, 2)]);
      expect(pieceMoves(game, p(7, 2))).toEqual([p(5, 4)]);
      const after = play(game, p(5, 0), p(3, 2));
      expect(after.chainAt).toBeNull();
      expect(after.captures.white).toBe(1);
      expect(after.toPlay).toBe(STONES.black);
    },
  );

  it("still makes Brazilian draughts take the longer one, in the same position", () => {
    const game = position(RULE_VARIANTS.brazilianDraughts, choice);
    expect(pieceMoves(game, p(5, 0))).toEqual([]);
    expect(pieceMoves(game, p(7, 2))).toEqual([p(5, 4)]);
  });

  it("crowns a man of russianDraughts mid-capture and lets it take on as a king, where poolCheckers stops it crowned", () => {
    const pieces: Piece[] = [
      { at: p(2, 1), stone: STONES.white },
      { at: p(1, 2), stone: STONES.black },
      // Only a king could reach this one from the crowning square: three squares along a diagonal.
      { at: p(2, 5), stone: STONES.black },
      { at: p(5, 0), stone: STONES.black },
    ];
    // FMJD-64 4.14: crowned on arrival, and the capture goes on "as a king".
    const russian = play(position(RULE_VARIANTS.russianDraughts, pieces), p(2, 1), p(0, 3));
    expect(isKingAt(russian.kings, p(0, 3))).toBe(true);
    expect(russian.chainAt).toEqual(p(0, 3));
    expect(russian.moves[russian.moves.length - 1].crowned).toBe(true);
    expect(named(pieceMoves(russian, p(0, 3)))).toEqual(["3,6", "4,7"]);
    const done = play(russian, p(0, 3), p(4, 7));
    expect(isKingAt(done.kings, p(4, 7))).toBe(true);
    expect(done.captures.white).toBe(2);
    expect(done.toPlay).toBe(STONES.black);

    // APCA rules 22–23: nothing more to take as a man, so the capture ends there, crowned.
    const pool = play(position(RULE_VARIANTS.poolCheckers, pieces), p(2, 1), p(0, 3));
    expect(pool.chainAt).toBeNull();
    expect(isKingAt(pool.kings, p(0, 3))).toBe(true);
    expect(pool.toPlay).toBe(STONES.black);
  });

  it("carries a man of poolCheckers through the far row uncrowned, where russianDraughts crowns it on the way", () => {
    const pieces: Piece[] = [
      { at: p(2, 3), stone: STONES.white },
      { at: p(1, 4), stone: STONES.black },
      { at: p(1, 6), stone: STONES.black },
      { at: p(5, 0), stone: STONES.black },
    ];
    // APCA rule 22: "providing it is not compelled to continue its jumping pattern outside of the king row".
    const through = play(position(RULE_VARIANTS.poolCheckers, pieces), p(2, 3), p(0, 5));
    expect(through.chainAt).toEqual(p(0, 5));
    expect(isKingAt(through.kings, p(0, 5))).toBe(false);
    const pool = play(through, p(0, 5), p(2, 7));
    expect(isKingAt(pool.kings, p(2, 7))).toBe(false);
    expect(pool.moves.some((move) => move.crowned === true)).toBe(false);

    const russian = play(play(position(RULE_VARIANTS.russianDraughts, pieces), p(2, 3), p(0, 5)), p(0, 5), p(2, 7));
    expect(isKingAt(russian.kings, p(2, 7))).toBe(true);
  });

  it.each([RULE_VARIANTS.russianDraughts, RULE_VARIANTS.poolCheckers])(
    "makes a flying king of %s land where it can take again, though any capture may be chosen",
    (variant) => {
      const game = position(variant, [
        { at: p(7, 0), stone: STONES.white, king: true },
        { at: p(4, 3), stone: STONES.black },
        { at: p(3, 6), stone: STONES.black },
      ]);
      // Four empty squares lie beyond the first man, and only one of them leads on to the second.
      expect(pieceMoves(game, p(7, 0))).toEqual([p(2, 5)]);
      const first = play(game, p(7, 0), p(2, 5));
      expect(pieceMoves(first, p(2, 5))).toEqual([p(4, 7)]);
      const done = play(first, p(2, 5), p(4, 7));
      expect(done.status).toBe(GAME_STATUS.won);
      expect(done.winBy).toBe(WIN_REASONS.blocked);
    },
  );
});

describe("the draws each writes down", () => {
  const walk = (variant: RuleVariant, pieces: Piece[], moves: [Point, Point][]) => {
    let state = position(variant, pieces);
    const statuses: string[] = [];
    for (const [from, to] of moves) {
      state = play(state, from, to);
      statuses.push(state.status);
    }
    return { state, statuses };
  };

  // Two white kings stepping up the board, a lone black king rocking in its corner.
  const twoAgainstOne: Piece[] = [
    { at: p(7, 2), stone: STONES.white, king: true },
    { at: p(7, 4), stone: STONES.white, king: true },
    { at: p(0, 7), stone: STONES.black, king: true },
  ];
  const twoAgainstOneMoves: [Point, Point][] = [
    [p(7, 2), p(6, 3)], [p(0, 7), p(1, 6)],
    [p(7, 4), p(6, 5)], [p(1, 6), p(0, 7)],
    [p(6, 3), p(5, 4)], [p(0, 7), p(1, 6)],
    [p(6, 5), p(5, 6)], [p(1, 6), p(0, 7)],
    [p(5, 6), p(4, 7)], [p(0, 7), p(1, 6)],
  ];

  it("draws russianDraughts when three pieces with a king each side go five moves unchanged, and poolCheckers not", () => {
    const russian = walk(RULE_VARIANTS.russianDraughts, twoAgainstOne, twoAgainstOneMoves);
    expect(russian.statuses.slice(0, 9).every((status) => status === GAME_STATUS.playing)).toBe(true);
    expect(russian.state.status).toBe(GAME_STATUS.draw);
    expect(endingRanOut(russian.state)).toBe(true);
    expect(repeatedTooOften(russian.state)).toBe(false);

    const pool = walk(RULE_VARIANTS.poolCheckers, twoAgainstOne, twoAgainstOneMoves);
    expect(pool.state.status).toBe(GAME_STATUS.playing);
  });

  it("gives poolCheckers' lone king thirteen moves against three kings, with no repetition rule to cut it short", () => {
    const pieces: Piece[] = [
      { at: p(7, 2), stone: STONES.white, king: true },
      { at: p(7, 4), stone: STONES.white, king: true },
      { at: p(7, 6), stone: STONES.white, king: true },
      { at: p(0, 7), stone: STONES.black, king: true },
    ];
    const rocking: [Point, Point][] = Array.from({ length: 26 }, (_, ply): [Point, Point] => {
      const turn = Math.floor(ply / 2);
      return ply % 2 === 0
        ? turn % 2 === 0 ? [p(7, 2), p(6, 3)] : [p(6, 3), p(7, 2)]
        : turn % 2 === 0 ? [p(0, 7), p(1, 6)] : [p(1, 6), p(0, 7)];
    });
    // APCA rule 27: the thirteen count. The same position comes round again and again, and that is no draw in pool.
    const pool = walk(RULE_VARIANTS.poolCheckers, pieces, rocking);
    expect(pool.statuses.slice(0, 25).every((status) => status === GAME_STATUS.playing)).toBe(true);
    expect(pool.state.status).toBe(GAME_STATUS.draw);
    expect(endingRanOut(pool.state)).toBe(true);

    // Russian draughts calls the same rocking a draw at the third repetition, eight plies in.
    const russian = walk(RULE_VARIANTS.russianDraughts, pieces, rocking.slice(0, 8));
    expect(russian.statuses.slice(0, 7).every((status) => status === GAME_STATUS.playing)).toBe(true);
    expect(russian.state.status).toBe(GAME_STATUS.draw);
    expect(repeatedTooOften(russian.state)).toBe(true);
  });

  it("starts russianDraughts' balance count again when a man is crowned", () => {
    const step = (stone: Stone, extra: Partial<Move> = {}): Move =>
      ({ row: 4, col: 5, from: { row: 5, col: 4 }, stone, kind: "move", wasKing: true, ...extra }) as Move;
    const state: GameState = {
      ...position(RULE_VARIANTS.russianDraughts, [
        { at: p(7, 0), stone: STONES.white, king: true },
        { at: p(0, 1), stone: STONES.white, king: true },
        { at: p(0, 7), stone: STONES.black, king: true },
        { at: p(2, 1), stone: STONES.black },
      ]),
      moves: [
        step(STONES.black),
        // White's second king was a man until this move.
        step(STONES.white, { wasKing: false, crowned: true }),
        step(STONES.black),
        step(STONES.white),
        step(STONES.black),
      ],
    };
    const balance = { kind: ENDGAME_COUNT_KINDS.balance, pieces: [4, 5], movesEach: 30 } as const;
    expect(turnsInEnding(state, balance)).toBe(3);
  });

  it("names Russian's fifteen-move kings-only count and Pool's site backstop", () => {
    expect(NO_PROGRESS_RULES[RULE_VARIANTS.russianDraughts]?.plies).toBe(30);
    expect(NO_PROGRESS_RULES[RULE_VARIANTS.poolCheckers]?.plies).toBe(80);
  });
});

describe("the pages say it from the rules", () => {
  it("describes russianDraughts' choice, its crowning and its counts", () => {
    const page = rulesPageFor(RULE_VARIANTS.russianDraughts);
    const text = [...page.play, ...page.house].join(" ");
    expect(text).toContain("the longer or the shorter");
    expect(text).toContain("crowned at once, and carries on capturing as a king");
    expect(text).toContain("White always opens.");
    expect(text).toContain("three or more kings against a king");
    expect(text).toContain("two or three pieces with a king on each side");
    expect(text).toContain("third time");
  });

  it("describes poolCheckers' opener and its thirteen count, and no repetition rule", () => {
    const page = rulesPageFor(RULE_VARIANTS.poolCheckers);
    const text = [...page.play, ...page.house].join(" ");
    expect(text).toContain("Black always opens.");
    expect(text).toContain("three kings against a king is not won within thirteen more moves each");
    expect(text).toContain("is crowned only if the capture ends there");
    expect(text).not.toContain("third time");
  });
});
