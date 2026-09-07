import { describe, expect, it } from "vitest";
import {
  canChooseColour,
  canExtendOpening,
  canSwapSeats,
  chooseColour,
  createGame,
  extendOpening,
  isLegalMove,
  playMove,
  replayMoves,
  resolveOpener,
  seatToPlay,
} from "../engine";
import {
  FIRST_PLAYERS,
  OPENING_RULES,
  OPENING_STAGES,
  RULE_VARIANTS,
  SEATS,
  STONES,
} from "../gomoku.constants";
import type { GameState, Point } from "../gomoku.types";

const p = (row: number, col: number): Point => ({ row, col });
const centre = p(7, 7);

function play(state: GameState, points: Point[]): GameState {
  return points.reduce((current, point) => playMove(current, point), state);
}

describe("pro and long pro", () => {
  it("forces the first stone onto tengen", () => {
    const game = createGame({ opening: OPENING_RULES.pro });
    expect(isLegalMove(game, p(0, 0))).toBe(false);
    expect(isLegalMove(game, centre)).toBe(true);
  });

  it("keeps black's second stone out of the central 5×5", () => {
    const game = play(createGame({ opening: OPENING_RULES.pro }), [centre, p(7, 8)]);
    expect(isLegalMove(game, p(9, 9))).toBe(false);
    expect(isLegalMove(game, p(10, 7))).toBe(true);
    // White was never restricted, and neither is black afterwards.
    const later = play(game, [p(10, 7), p(6, 6)]);
    expect(isLegalMove(later, p(8, 8))).toBe(true);
  });

  it("long pro widens the exclusion to 7×7", () => {
    const game = play(createGame({ opening: OPENING_RULES.longPro }), [centre, p(7, 8)]);
    expect(isLegalMove(game, p(10, 7))).toBe(false);
    expect(isLegalMove(game, p(11, 7))).toBe(true);
  });

  it("puts black on move one whatever the first-stone setting says", () => {
    const settings = createGame({
      opening: OPENING_RULES.pro,
      firstPlayer: FIRST_PLAYERS.white,
    }).settings;
    expect(resolveOpener(settings)).toBe(STONES.black);
  });
});

describe("the RIF opening", () => {
  const rif = { variant: RULE_VARIANTS.renju, opening: OPENING_RULES.rif } as const;

  it("confines the first three stones", () => {
    let game = createGame(rif);
    expect(isLegalMove(game, p(7, 8))).toBe(false);
    game = playMove(game, centre);
    // White must touch tengen.
    expect(isLegalMove(game, p(7, 9))).toBe(false);
    expect(isLegalMove(game, p(6, 8))).toBe(true);
    game = playMove(game, p(6, 8));
    // Black stays inside the 5×5.
    expect(isLegalMove(game, p(7, 10))).toBe(false);
    expect(isLegalMove(game, p(7, 9))).toBe(true);
  });

  it("then lets white choose a colour before anyone plays on", () => {
    const game = play(createGame(rif), [centre, p(6, 8), p(7, 9)]);
    expect(game.opening.stage).toBe(OPENING_STAGES.choosing);
    expect(seatToPlay(game)).toBe(SEATS.two);
    expect(isLegalMove(game, p(0, 0))).toBe(false);

    const swapped = chooseColour(game, STONES.black);
    expect(swapped.seats[STONES.black]).toBe(SEATS.two);
    expect(swapped.toPlay).toBe(STONES.white);
    expect(seatToPlay(swapped)).toBe(SEATS.one);
    expect(isLegalMove(swapped, p(0, 0))).toBe(true);
  });

  it("is only offered with renju", () => {
    const game = createGame({ variant: RULE_VARIANTS.freestyle, opening: OPENING_RULES.rif });
    expect(game.settings.opening).toBe(OPENING_RULES.free);
  });
});

describe("swap", () => {
  it("has seat one lay three stones of alternating colour", () => {
    let game = createGame({ opening: OPENING_RULES.swap });
    expect(seatToPlay(game)).toBe(SEATS.one);
    game = playMove(game, centre);
    expect(game.toPlay).toBe(STONES.white);
    // Still seat one, even though white is to move.
    expect(seatToPlay(game)).toBe(SEATS.one);
    game = play(game, [p(7, 8), p(8, 8)]);
    expect(game.opening.stage).toBe(OPENING_STAGES.choosing);
    expect(seatToPlay(game)).toBe(SEATS.two);
  });

  it("lets seat two keep white without changing seats", () => {
    const game = play(createGame({ opening: OPENING_RULES.swap }), [centre, p(7, 8), p(8, 8)]);
    const kept = chooseColour(game, STONES.white);
    expect(kept.seats).toEqual(game.seats);
    expect(kept.opening.stage).toBe(OPENING_STAGES.done);
    expect(kept.opening.choices).toEqual([STONES.white]);
    expect(seatToPlay(kept)).toBe(SEATS.two);
  });

  it("does not offer the swap2 extension", () => {
    const game = play(createGame({ opening: OPENING_RULES.swap }), [centre, p(7, 8), p(8, 8)]);
    expect(canExtendOpening(game)).toBe(false);
    expect(extendOpening(game)).toBe(game);
  });

  it("blocks the informal seat swap while colours are unsettled", () => {
    const game = play(
      createGame({ opening: OPENING_RULES.swap, allowSwap: true }),
      [centre, p(7, 8), p(8, 8)],
    );
    expect(canSwapSeats(game)).toBe(false);
  });
});

describe("swap2", () => {
  const three = [centre, p(7, 8), p(8, 8)];

  it("lets the chooser add two stones and hand the choice back", () => {
    let game = play(createGame({ opening: OPENING_RULES.swap2 }), three);
    expect(canChooseColour(game)).toBe(true);
    expect(canExtendOpening(game)).toBe(true);

    game = extendOpening(game);
    expect(game.opening.stage).toBe(OPENING_STAGES.extending);
    expect(seatToPlay(game)).toBe(SEATS.two);
    expect(game.toPlay).toBe(STONES.white);

    game = play(game, [p(6, 6), p(9, 9)]);
    expect(game.opening.stage).toBe(OPENING_STAGES.choosing);
    expect(seatToPlay(game)).toBe(SEATS.one);
    expect(canExtendOpening(game)).toBe(false);

    const chosen = chooseColour(game, STONES.black);
    expect(chosen.seats[STONES.black]).toBe(SEATS.one);
    expect(chosen.opening.choices).toEqual(["extend", STONES.black]);
    expect(chosen.toPlay).toBe(STONES.white);
    expect(seatToPlay(chosen)).toBe(SEATS.two);
  });

  it("refuses a stone while a choice is pending", () => {
    const game = play(createGame({ opening: OPENING_RULES.swap2 }), three);
    expect(playMove(game, p(0, 0))).toBe(game);
  });

  it("replays a record through its decisions", () => {
    const start = createGame({ opening: OPENING_RULES.swap2 });
    const timeline = replayMoves(
      start,
      [...three, p(6, 6), p(9, 9), p(0, 0)],
      ["extend", STONES.black],
    );
    const last = timeline[timeline.length - 1];
    expect(last.moves).toHaveLength(6);
    expect(last.seats[STONES.black]).toBe(SEATS.one);
    expect(last.opening.stage).toBe(OPENING_STAGES.done);
  });

  it("assumes the chooser kept their colour when a record has no decisions", () => {
    const start = createGame({ opening: OPENING_RULES.swap });
    const timeline = replayMoves(start, [...three, p(0, 0)]);
    const last = timeline[timeline.length - 1];
    expect(last.moves).toHaveLength(4);
    expect(last.seats).toEqual(start.seats);
  });
});
