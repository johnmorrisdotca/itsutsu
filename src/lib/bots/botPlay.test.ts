import { beforeEach, describe, expect, it, vi } from "vitest";

import { playMove } from "@/lib/gomoku/engine";
import { RULE_VARIANTS, STONES, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { GameState } from "@/lib/gomoku/gomoku.types";
import type { MoveRequest } from "@/lib/history/liveGame.types";

/**
 * A COMPUTER'S TURN REPLAYS THE GAME ONCE A REQUEST, NOT ONCE A STONE.
 *
 * `playBotTurns` replays the row to choose on, then carries the position each
 * move settles into forward to the next pass — and to `appendMove`, as
 * `known` — instead of rebuilding it from move one. Connect6 is the case that
 * shows it: one turn is two stones, so one request is two passes round the
 * loop, and each used to replay the whole game before choosing.
 *
 * The store here is the game row and nothing else; `appendMove` is stood in
 * for by a stand-in that plays the request through the engine on the position
 * it was handed and writes the stone onto the row, so the second pass reads a
 * row one stone longer — exactly what the real one leaves behind.
 */

type StoredMove = {
  number: number;
  row: number;
  col: number;
  stone: string;
  kind: string;
  fromRow: number | null;
  fromCol: number | null;
  twistQuadrant: number | null;
  twistClockwise: boolean | null;
  cells: unknown;
  createdAt: Date;
};
type Row = Record<string, unknown> & { id: string; moves: StoredMove[] };

const seen = vi.hoisted(() => ({
  replays: 0,
  /** How many moves the row held when each `appendMove` was handed its position, and how many that position held. */
  handed: [] as { row: number; known: number }[],
}));

let row: Row | null = null;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findUnique: async () => (row === null ? null : { ...row, moves: row.moves.map((move) => ({ ...move })) }),
    },
  },
}));

vi.mock("@/lib/history/liveGame", async () => {
  const real = await import("@/lib/history/liveGameRow");
  return {
    GAME_ROW: real.GAME_ROW,
    sameRecord: real.sameRecord,
    replay: (stored: Parameters<typeof real.replay>[0]) => {
      seen.replays += 1;
      return real.replay(stored);
    },
    appendMove: async (_id: string, _token: string, request: MoveRequest, { known }: { known?: GameState } = {}) => {
      if (known === undefined) throw new Error("the bot loop must hand appendMove the position it chose on");
      if (request.kind !== "place") throw new Error(`unexpected ${request.kind}`);
      const current = row as Row;
      seen.handed.push({ row: current.moves.length, known: known.moves.length });
      const next = playMove(known, { row: request.row, col: request.col });
      if (next === known) return { ok: false, reason: "illegal" };
      const placed = next.moves[next.moves.length - 1];
      current.moves.push({
        number: next.moves.length,
        row: request.row,
        col: request.col,
        stone: placed.stone,
        kind: "place",
        fromRow: null,
        fromCol: null,
        twistQuadrant: null,
        twistClockwise: null,
        cells: null,
        createdAt: new Date(),
      });
      return { ok: true, game: { id: current.id }, state: next };
    },
  };
});
// White is a program; Black is a person. Nothing is said to either here.
vi.mock("./bots", () => ({
  botInSeat: (_row: unknown, stone: string) => (stone === "white" ? "kyu" : null),
}));
vi.mock("./botTalk", () => ({ greetFromBot: async () => {}, farewellFromBots: async () => {} }));
vi.mock("@/lib/history/liveGameEndings", () => ({ settleEnded: async () => false }));

const { playBotTurns } = await import("./botPlay");

function connect6Row(): Row {
  const size = boardSizesFor(RULE_VARIANTS.connect6)[0];
  const centre = Math.floor(size / 2);
  return {
    id: "g1",
    status: "active",
    size,
    winLength: 6,
    variant: RULE_VARIANTS.connect6,
    obstacles: "none",
    opener: STONES.black,
    opening: "free",
    handicap: null,
    seed: 1,
    blackName: "Kuro",
    whiteName: "Kyu",
    moveTimeMs: null,
    timeoutPenalty: "turn",
    drawLimit: "none",
    lastMoveAt: new Date(),
    blackForfeits: 0,
    whiteForfeits: 0,
    allowResign: true,
    clockMode: "move",
    blackTimeMs: null,
    whiteTimeMs: null,
    deadlineAt: null,
    extraMs: 0,
    rated: false,
    openSeat: null,
    openedAt: null,
    blackClaimedAt: new Date(),
    whiteClaimedAt: new Date(),
    blackToken: "black-token",
    whiteToken: "white-token",
    blackMemberId: "member-black",
    whiteMemberId: "bot-kyu",
    offeredToMemberId: null,
    offeredAt: null,
    declinedAt: null,
    withdrawnAt: null,
    // Black's opening stone; White now owes two.
    moves: [
      {
        number: 1,
        row: centre,
        col: centre,
        stone: STONES.black,
        kind: "place",
        fromRow: null,
        fromCol: null,
        twistQuadrant: null,
        twistClockwise: null,
        cells: null,
        createdAt: new Date(),
      },
    ],
  };
}

beforeEach(() => {
  row = connect6Row();
  seen.replays = 0;
  seen.handed = [];
});

describe("playBotTurns carries the position forward", () => {
  it("plays both stones of a Connect6 turn from one replay", async () => {
    await playBotTurns("g1", 20);

    // Two stones went down, and it is Black's move again.
    expect((row as Row).moves.length).toBe(3);
    expect((row as Row).moves.slice(1).map((move) => move.stone)).toEqual([STONES.white, STONES.white]);
    // The game was replayed once — for the first stone — and carried to the second.
    expect(seen.replays).toBe(1);
    // And each move was handed the position the row was at when it was played.
    expect(seen.handed).toEqual([
      { row: 1, known: 1 },
      { row: 2, known: 2 },
    ]);
  });
});
