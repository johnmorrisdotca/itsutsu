import { describe, expect, it } from "vitest";

import { createGame, movePiece, pieceMoves } from "../engine";
import {
  BRAZILIAN_DRAUGHTS_RULES,
  GAME_STATUS,
  INTERNATIONAL_DRAUGHTS_RULES,
  RULE_VARIANTS,
  STONES,
  VARIANT_SPECS,
  WIN_REASONS,
} from "../gomoku.constants";
import type { GameState, Move, Point, RuleVariant, Stone } from "../gomoku.types";
import { rulesPageFor } from "@/lib/learn/rulesPage";
import { isDarkSquare, isKingAt } from "./checkers";
import { endingRanOut, repeatedTooOften, turnsInEnding } from "./checkersDraws";
import { fixedOpener } from "./creation";
import { NO_PROGRESS_RULES } from "./noProgress";

/**
 * The international family of draughts: International Draughts on 10×10,
 * Brazilian Draughts on 8×8 and Canadian Checkers on 12×12 — one set of rules
 * on three boards, and every case here is a rule the English game beside them
 * does not have. The articles cited are the FMJD's official rules; Brazil's
 * draws are the CBJD's.
 */

const p = (row: number, col: number): Point => ({ row, col });

type Piece = { at: Point; stone: Stone; king?: boolean };

/** A position of `variant` holding only these pieces, with `toPlay` to move and nothing on the record. */
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

/** Plays `from` → `to`, failing loudly if the engine refuses it. */
function play(state: GameState, from: Point, to: Point): GameState {
  const next = movePiece(state, from, to);
  expect(next, `${from.row},${from.col} to ${to.row},${to.col} was refused`).not.toBe(state);
  return next;
}

describe("the international family sets out its own board", () => {
  it.each([
    [RULE_VARIANTS.internationalDraughts, 10, 20, 4],
    [RULE_VARIANTS.brazilianDraughts, 8, 12, 3],
    [RULE_VARIANTS.canadianCheckers, 12, 30, 5],
  ] as const)("%s: %i×%i, %i men a side in %i rows, and White moves first", (variant, size, men, rows) => {
    // Asked for Black to open, as the site's default would: the rules give it to White.
    const game = createGame({ variant, firstPlayer: STONES.black });
    expect(game.settings.size).toBe(size);
    expect(game.board.filter((cell) => cell === STONES.black)).toHaveLength(men);
    expect(game.board.filter((cell) => cell === STONES.white)).toHaveLength(men);
    game.board.forEach((cell, index) => {
      if (cell === null) return;
      const point = p(Math.floor(index / size), index % size);
      expect(isDarkSquare(point)).toBe(true);
      expect(point.row < rows || point.row >= size - rows, `${point.row},${point.col} is outside the starting rows`).toBe(true);
    });
    // FMJD 2.4: each player's near left-hand corner is a dark square.
    expect(isDarkSquare(p(size - 1, 0))).toBe(true);
    expect(isDarkSquare(p(0, size - 1))).toBe(true);
    expect(game.toPlay).toBe(STONES.white);
    expect(game.opener).toBe(STONES.white);
    expect(fixedOpener(variant, game.settings.opening)).toBe(STONES.white);
  });

  it("leaves Checkers' first move to the players, as it always has", () => {
    expect(fixedOpener(RULE_VARIANTS.checkers, "free")).toBeNull();
    expect(createGame({ variant: RULE_VARIANTS.checkers, firstPlayer: STONES.black }).toPlay).toBe(STONES.black);
    expect(fixedOpener("aGameThatWasRenamed", "free")).toBeNull();
  });
});

describe("how the international family's pieces take", () => {
  it("lets a man of internationalDraughts capture backward, where a Checkers man only steps forward", () => {
    const pieces: Piece[] = [
      { at: p(5, 4), stone: STONES.white },
      { at: p(6, 5), stone: STONES.black },
      { at: p(0, 1), stone: STONES.black },
    ];
    // FMJD 4.1: backward, over the piece behind it, and forced.
    const international = position(RULE_VARIANTS.internationalDraughts, pieces);
    expect(pieceMoves(international, p(5, 4))).toEqual([p(7, 6)]);
    const taken = play(international, p(5, 4), p(7, 6));
    expect(taken.board[6 * 10 + 5]).toBeNull();
    expect(taken.captures.white).toBe(1);

    // The same men on an English board: no capture, so the man steps forward.
    const english = position(RULE_VARIANTS.checkers, pieces);
    expect(named(pieceMoves(english, p(5, 4)))).toEqual(["4,3", "4,5"]);
  });

  it("flies a king of internationalDraughts the length of a diagonal, and takes at a distance", () => {
    const far = { at: p(0, 1), stone: STONES.black };
    // Alone on the long diagonal: every empty square along it (3.9).
    const open = position(RULE_VARIANTS.internationalDraughts, [{ at: p(9, 0), stone: STONES.white, king: true }, far]);
    expect(pieceMoves(open, p(9, 0))).toHaveLength(9);

    // A piece five squares off, with four empty squares beyond it: any of the four is a landing (4.3).
    const game = position(RULE_VARIANTS.internationalDraughts, [
      { at: p(9, 0), stone: STONES.white, king: true },
      { at: p(4, 5), stone: STONES.black },
      far,
    ]);
    expect(named(pieceMoves(game, p(9, 0)))).toEqual(["0,9", "1,8", "2,7", "3,6"]);
    const after = play(game, p(9, 0), p(1, 8));
    expect(after.board[4 * 10 + 5]).toBeNull();
    expect(isKingAt(after.kings, p(1, 8))).toBe(true);
    expect(after.chainAt).toBeNull();
    expect(after.toPlay).toBe(STONES.black);
  });

  it("makes internationalDraughts take the longer capture, and counts a king as one piece", () => {
    const game = position(RULE_VARIANTS.internationalDraughts, [
      // One white man can take a king; the other can take two men in a row.
      { at: p(6, 9), stone: STONES.white },
      { at: p(5, 8), stone: STONES.black, king: true },
      { at: p(8, 1), stone: STONES.white },
      { at: p(7, 2), stone: STONES.black },
      { at: p(5, 4), stone: STONES.black },
    ]);
    // FMJD 4.13: the most pieces, and a king has no priority — so the king-taker is offered nothing.
    expect(pieceMoves(game, p(6, 9))).toEqual([]);
    expect(pieceMoves(game, p(8, 1))).toEqual([p(6, 3)]);

    const first = play(game, p(8, 1), p(6, 3));
    expect(first.chainAt).toEqual(p(6, 3));
    expect(first.toPlay).toBe(STONES.white);
    expect(pieceMoves(first, p(6, 9))).toEqual([]);
    const second = play(first, p(6, 3), p(4, 5));
    expect(second.chainAt).toBeNull();
    expect(second.captures.white).toBe(2);
    expect(second.toPlay).toBe(STONES.black);
  });

  it("does not crown a man of internationalDraughts that only passes the far row mid-capture", () => {
    const game = position(RULE_VARIANTS.internationalDraughts, [
      { at: p(2, 3), stone: STONES.white },
      { at: p(1, 4), stone: STONES.black },
      { at: p(1, 6), stone: STONES.black },
      { at: p(9, 0), stone: STONES.black },
    ]);
    // Onto row 0, White's crowning row, with a backward capture still to make (4.15).
    const through = play(game, p(2, 3), p(0, 5));
    expect(through.chainAt).toEqual(p(0, 5));
    expect(isKingAt(through.kings, p(0, 5))).toBe(false);
    const done = play(through, p(0, 5), p(2, 7));
    expect(done.chainAt).toBeNull();
    expect(isKingAt(done.kings, p(2, 7))).toBe(false);
    expect(done.moves.some((move) => move.crowned === true)).toBe(false);

    // Ending there is another matter: crowned (3.5).
    const ends = position(RULE_VARIANTS.internationalDraughts, [
      { at: p(2, 3), stone: STONES.white },
      { at: p(1, 4), stone: STONES.black },
      { at: p(9, 0), stone: STONES.black },
    ]);
    const crowned = play(ends, p(2, 3), p(0, 5));
    expect(isKingAt(crowned.kings, p(0, 5))).toBe(true);
    expect(crowned.moves[crowned.moves.length - 1].crowned).toBe(true);
  });

  it("stops a man of brazilianDraughts on the far row, crowned, when only a king could go on", () => {
    // CBJD, and FMJD's 8×8 rule 5.3: it takes nothing further as a man, so the capture ends and it is crowned.
    const game = position(RULE_VARIANTS.brazilianDraughts, [
      { at: p(2, 1), stone: STONES.white },
      { at: p(1, 2), stone: STONES.black },
      { at: p(2, 5), stone: STONES.black },
    ]);
    const after = play(game, p(2, 1), p(0, 3));
    expect(after.chainAt).toBeNull();
    expect(isKingAt(after.kings, p(0, 3))).toBe(true);
    expect(after.toPlay).toBe(STONES.black);
  });

  it("keeps a taken piece of internationalDraughts in the way until the capture is over", () => {
    /*
     * A white king at 9,4 and four black men round a loop of diagonals, with a
     * fifth man at 6,1. Round the loop the king takes four and comes home to
     * its own starting square. Lifting each man as it is taken would let the
     * king fly on through the first man's square to take the fifth as well;
     * the first man still stands there until the capture ends (4.8, 4.11), so
     * the capture is four, and it ends.
     */
    const game = position(RULE_VARIANTS.internationalDraughts, [
      { at: p(9, 4), stone: STONES.white, king: true },
      { at: p(8, 3), stone: STONES.black },
      { at: p(5, 4), stone: STONES.black },
      { at: p(4, 7), stone: STONES.black },
      { at: p(7, 6), stone: STONES.black },
      { at: p(6, 1), stone: STONES.black },
    ]);
    let state = game;
    for (const [from, to] of [
      [p(9, 4), p(7, 2)],
      [p(7, 2), p(3, 6)],
      [p(3, 6), p(5, 8)],
      [p(5, 8), p(9, 4)],
    ] as const) {
      expect(named(pieceMoves(state, from))).toContain(`${to.row},${to.col}`);
      state = play(state, from, to);
    }
    expect(state.captures.white).toBe(4);
    expect(state.chainAt).toBeNull();
    expect(state.board[6 * 10 + 1]).toBe(STONES.black);
    expect(state.toPlay).toBe(STONES.black);
  });

  it("wins internationalDraughts by leaving the other side nothing to move", () => {
    const game = position(RULE_VARIANTS.internationalDraughts, [
      { at: p(5, 4), stone: STONES.white },
      { at: p(4, 5), stone: STONES.black },
    ]);
    const after = play(game, p(5, 4), p(3, 6));
    expect(after.status).toBe(GAME_STATUS.won);
    expect(after.winner).toBe(STONES.white);
    expect(after.winBy).toBe(WIN_REASONS.blocked);
  });
});

describe("the draws the international family writes down", () => {
  it("draws internationalDraughts at the third repetition, and Checkers not at all", () => {
    const shuffle = (variant: RuleVariant, pieces: Piece[], there: [Point, Point][]) => {
      let state = position(variant, pieces);
      const statuses: string[] = [];
      for (let ply = 0; ply < 8; ply += 1) {
        const [from, to] = there[ply % 4];
        state = play(state, from, to);
        statuses.push(state.status);
      }
      return { state, statuses };
    };

    const international = shuffle(
      RULE_VARIANTS.internationalDraughts,
      [
        { at: p(9, 4), stone: STONES.white, king: true },
        { at: p(9, 6), stone: STONES.white },
        { at: p(9, 8), stone: STONES.white },
        { at: p(0, 1), stone: STONES.black, king: true },
        { at: p(0, 5), stone: STONES.black },
        { at: p(0, 7), stone: STONES.black },
      ],
      [
        [p(9, 4), p(8, 5)],
        [p(0, 1), p(1, 0)],
        [p(8, 5), p(9, 4)],
        [p(1, 0), p(0, 1)],
      ],
    );
    // The position stands a second time after four plies and a third after eight (FMJD 6.1).
    expect(international.statuses.slice(0, 7).every((status) => status === GAME_STATUS.playing)).toBe(true);
    expect(international.state.status).toBe(GAME_STATUS.draw);
    expect(repeatedTooOften(international.state)).toBe(true);

    const english = shuffle(
      RULE_VARIANTS.checkers,
      [
        { at: p(7, 2), stone: STONES.white, king: true },
        { at: p(7, 6), stone: STONES.white },
        { at: p(0, 1), stone: STONES.black, king: true },
        { at: p(0, 5), stone: STONES.black },
      ],
      [
        [p(7, 2), p(6, 3)],
        [p(0, 1), p(1, 0)],
        [p(6, 3), p(7, 2)],
        [p(1, 0), p(0, 1)],
      ],
    );
    expect(english.state.status).toBe(GAME_STATUS.playing);
    expect(repeatedTooOften(english.state)).toBe(false);
  });

  it("draws two kings against a lone king in internationalDraughts after five moves each", () => {
    let state = position(RULE_VARIANTS.internationalDraughts, [
      { at: p(9, 2), stone: STONES.white, king: true },
      { at: p(9, 6), stone: STONES.white, king: true },
      { at: p(0, 9), stone: STONES.black, king: true },
    ]);
    const walk = [p(9, 2), p(8, 3), p(7, 4), p(6, 5), p(5, 6), p(4, 7)];
    const lone = [p(0, 9), p(1, 8)];
    for (let turn = 0; turn < 5; turn += 1) {
      state = play(state, walk[turn], walk[turn + 1]);
      expect(state.status).toBe(GAME_STATUS.playing);
      state = play(state, lone[turn % 2], lone[(turn + 1) % 2]);
      // FMJD 6.4: five more moves each, and the tenth ply is the last.
      expect(state.status, `after ${turn + 1} moves each`).toBe(turn === 4 ? GAME_STATUS.draw : GAME_STATUS.playing);
    }
    expect(endingRanOut(state)).toBe(true);
    expect(repeatedTooOften(state)).toBe(false);
  });

  it("counts an ending from the capture that entered it — and brazilianDraughts from before, since its count spans the capture", () => {
    const step = (stone: Stone, extra: Partial<Move> = {}): Move =>
      ({ row: 4, col: 5, from: { row: 5, col: 4 }, stone, kind: "move", wasKing: true, ...extra }) as Move;
    const record: Move[] = [
      step(STONES.black),
      // White takes one of Black's two kings: two kings against two becomes two against one.
      step(STONES.white, { captured: [{ row: 3, col: 6 }], capturedWasKing: true }),
      step(STONES.black),
      step(STONES.white),
      step(STONES.black),
      step(STONES.white),
    ];
    const at = (variant: RuleVariant): GameState => {
      const base = position(variant, [
        { at: p(7, 0), stone: STONES.white, king: true },
        { at: p(7, 2), stone: STONES.white, king: true },
        { at: p(0, 7), stone: STONES.black, king: true },
      ]);
      return { ...base, moves: record };
    };
    // FMJD: two kings against two is no ending of 6.4's, so the count starts at the capture.
    expect(turnsInEnding(at(RULE_VARIANTS.internationalDraughts), INTERNATIONAL_DRAUGHTS_RULES.endgameCounts[1])).toBe(4);
    // CBJD art. 99 names two kings against two as well, and a capture inside it does not restart the count.
    expect(turnsInEnding(at(RULE_VARIANTS.brazilianDraughts), BRAZILIAN_DRAUGHTS_RULES.endgameCounts[0])).toBe(6);
  });

  it("names each game's kings-only count as its federation does", () => {
    expect(NO_PROGRESS_RULES[RULE_VARIANTS.internationalDraughts]?.plies).toBe(50);
    expect(NO_PROGRESS_RULES[RULE_VARIANTS.brazilianDraughts]?.plies).toBe(40);
    expect(NO_PROGRESS_RULES[RULE_VARIANTS.canadianCheckers]?.plies).toBe(50);
    expect(NO_PROGRESS_RULES[RULE_VARIANTS.checkers]?.plies).toBe(80);
  });
});

describe("the family is data, and the pages read it", () => {
  it("declares a checkers-family game's rules exactly where it is one", () => {
    for (const [variant, spec] of Object.entries(VARIANT_SPECS)) {
      expect(spec.checkersRules !== null, `${variant}: checkers and its rules disagree`).toBe(spec.checkers);
    }
  });

  it("tells a reader of internationalDraughts what differs, from the rules and not the name", () => {
    const page = rulesPageFor(RULE_VARIANTS.internationalDraughts);
    const text = [...page.board, ...page.play, ...page.house].join(" ");
    expect(text).toContain("fifty of the hundred");
    expect(text).toContain("twenty men");
    expect(text).toContain("forward or backward");
    expect(text).toContain("A king flies");
    expect(text).toContain("White always opens.");
    expect(text).toContain("third time");
    expect(text).toContain("twenty-five moves each");
    expect(text).toContain("sixteen more moves each");
    // Canadian checkers is the same rules on a bigger board, and its page says the same things.
    const canadian = rulesPageFor(RULE_VARIANTS.canadianCheckers);
    expect(canadian.play).toEqual(page.play);
    expect(canadian.board.join(" ")).toContain("seventy-two of the hundred and forty-four");
  });

  it("keeps Checkers' own page in its own words", () => {
    const page = rulesPageFor(RULE_VARIANTS.checkers);
    expect(page.board).toContain(
      "Played on the dark squares only, thirty-two of the sixty-four. Each side starts with twelve men filling its own three rows.",
    );
    expect(page.play).toContain(
      "A piece that captures and can capture again from where it lands keeps jumping in the same move. A man crowned partway through always stops there — only a king may carry a chain on, and only on a later move.",
    );
    expect(page.house).toContain("Either colour may open, or the first stone may be drawn by lot.");
  });
});
