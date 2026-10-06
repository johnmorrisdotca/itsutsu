import { describe, expect, it } from "vitest";

import { createGame, passTurn, playMove } from "../engine";
import { GAME_STATUS, MOVE_KINDS, STONES, WIN_REASONS } from "../gomoku.constants";
import type { Point } from "../gomoku.types";
import { indexOf } from "../rules/board";
import { KOMI } from "../rules/go";
import {
  PAIR_GO_DEFAULT_SIZE,
  PAIR_GO_SIZES,
  PAIR_NAME_MOST,
  againPairGo,
  decodePairGo,
  encodePairGo,
  pairCount,
  pairPass,
  pairPlay,
  pairPlayerOfMove,
  pairPlayerToMove,
  pairPlayers,
  pairResign,
  startPairGo,
} from "./pairGo";
import type { PairGoGame, PairTeams } from "./pairGo.types";
import { speaker } from "@/lib/i18n/i18n";

/** The English speaker: these tests read the rules' English words. */
const EN = speaker("en");

const p = (row: number, col: number): Point => ({ row, col });
const TEAMS: PairTeams = { black: ["Aiko", "Ben"], white: ["Chloe", "Dev"] };

/** A game with these moves made in turn, each a point or "pass"; fails the test if any is refused. */
function played(moves: (Point | "pass")[], teams: PairTeams = TEAMS, size = 9): PairGoGame {
  let game = startPairGo(size, teams);
  for (const move of moves) {
    const next = move === "pass" ? pairPass(game) : pairPlay(game, move);
    if (next === null) throw new Error(`refused ${JSON.stringify(move)}`);
    game = next;
  }
  return game;
}

/** Whose move it is, as the turn line reads it. */
const toMove = (game: PairGoGame) => {
  const player = pairPlayerToMove(game, EN);
  return player === null ? null : `${player.name} (${player.stone})`;
};

describe("Pair Go's order round the table", () => {
  it("goes Black's first, White's first, Black's second, White's second, and round again", () => {
    const seen: (string | null)[] = [];
    let game = startPairGo(9, TEAMS);
    const points = [p(2, 2), p(6, 6), p(2, 6), p(6, 2), p(4, 4), p(4, 6), p(4, 2), p(6, 4)];
    for (const point of points) {
      seen.push(toMove(game));
      game = pairPlay(game, point) as PairGoGame;
    }
    seen.push(toMove(game));
    expect(seen).toEqual([
      "Aiko (black)",
      "Chloe (white)",
      "Ben (black)",
      "Dev (white)",
      "Aiko (black)",
      "Chloe (white)",
      "Ben (black)",
      "Dev (white)",
      "Aiko (black)",
    ]);
  });

  it("counts a pass as the passing player's turn, so the order moves on past it", () => {
    // Aiko plays, Chloe passes, Ben plays: next is Dev, not Chloe again.
    const game = played([p(2, 2), "pass", p(2, 6)]);
    expect(toMove(game)).toBe("Dev (white)");
    expect(pairPlayerOfMove(game, 1, EN)).toMatchObject({ name: "Chloe", stone: STONES.white, place: 0 });
    expect(pairPlayerOfMove(game, 2, EN)).toMatchObject({ name: "Ben", stone: STONES.black, place: 1 });
    expect(pairPlayerOfMove(game, 3, EN)).toBeNull();
  });

  it("names a player who gave no name by their place in the order", () => {
    const game = startPairGo(9, { black: ["Aiko", "  "], white: ["", "Dev"] });
    expect(pairPlayers(game, EN).map((player) => player.name)).toEqual(["Aiko", "Player 2", "Player 3", "Dev"]);
    expect(pairPlayers(game, EN).map((player) => player.stone)).toEqual([STONES.black, STONES.white, STONES.black, STONES.white]);
  });

  it("keeps a name tidy: spaces made one, trimmed, and no longer than the table keeps", () => {
    const long = "x".repeat(PAIR_NAME_MOST + 5);
    const game = startPairGo(9, { black: ["  Aiko   Tanaka ", long], white: ["Chloe", "Dev"] });
    expect(game.teams.black).toEqual(["Aiko Tanaka", "x".repeat(PAIR_NAME_MOST)]);
  });
});

describe("Pair Go is the engine's own Go", () => {
  it("plays the same position the engine plays for two, move for move", () => {
    const points = [p(2, 2), p(2, 3), p(3, 3), p(1, 2)];
    let alone = createGame({ variant: "go", size: 9 });
    for (const point of points) alone = playMove(alone, point);
    alone = passTurn(alone);
    const game = played([...points, "pass"]);
    expect(game.state.board).toEqual(alone.board);
    expect(game.state.toPlay).toBe(alone.toPlay);
    expect(game.state.moves.map((move) => move.kind)).toEqual(alone.moves.map((move) => move.kind));
  });

  it("refuses what the engine refuses: a taken point, and any move once the game is over", () => {
    const game = played([p(4, 4)]);
    expect(pairPlay(game, p(4, 4))).toBeNull();
    const over = played(["pass", "pass"]);
    expect(pairPlay(over, p(0, 0))).toBeNull();
    expect(pairPass(over)).toBeNull();
    expect(pairResign(over)).toBeNull();
  });

  it("ends on two passes in a row, by the engine's count, with nobody left to move", () => {
    // Black walls a corner: Aiko, Chloe and Ben play, then Dev passes — one pass is not the end.
    const game = played([p(0, 1), p(8, 8), p(1, 0), "pass"]);
    expect(game.state.status).toBe(GAME_STATUS.playing);
    expect(toMove(game)).toBe("Aiko (black)");
    // Aiko passes too: two in a row, and the board is counted.
    const ended = pairPass(game) as PairGoGame;
    expect(ended.state.status).toBe(GAME_STATUS.won);
    expect(ended.state.winBy).toBe(WIN_REASONS.territory);
    expect(pairPlayerToMove(ended, EN)).toBeNull();
    const count = pairCount(ended);
    expect(count.komi).toBe(KOMI);
    // Two black stones and the corner point they wall in; one white stone, and nothing else is anybody's.
    expect(count.black).toBe(3);
    expect(count.white).toBe(1);
    expect(ended.state.winner).toBe(STONES.white);
  });

  it("lets the team to move resign, and the other team wins", () => {
    const game = played([p(4, 4)]);
    const over = pairResign(game) as PairGoGame;
    expect(over.resigned).toBe(STONES.white);
    expect(over.state.winner).toBe(STONES.black);
    expect(over.state.winBy).toBe(WIN_REASONS.resign);
  });

  it("starts on the nine unless asked for another of Go's boards, and plays again on the same board with the same four", () => {
    expect(startPairGo(PAIR_GO_DEFAULT_SIZE, TEAMS).state.settings.size).toBe(9);
    expect(PAIR_GO_SIZES).toEqual([9, 13, 19]);
    expect(startPairGo(19, TEAMS).state.settings.size).toBe(19);
    // Not a Go board: the nine, rather than a board Go is not played on.
    expect(startPairGo(15, TEAMS).state.settings.size).toBe(9);
    const again = againPairGo(played([p(4, 4), "pass"], TEAMS, 13));
    expect(again.state.settings.size).toBe(13);
    expect(again.state.moves).toHaveLength(0);
    expect(again.teams).toEqual(TEAMS);
  });
});

describe("the kept game", () => {
  it("reads back as the same game: the board, the order, the names, and whose move it is", () => {
    const game = played([p(2, 2), "pass", p(2, 6), p(6, 6)], TEAMS, 13);
    const back = decodePairGo(encodePairGo(game)) as PairGoGame;
    expect(back.teams).toEqual(game.teams);
    expect(back.state.settings.size).toBe(13);
    expect(back.state.board).toEqual(game.state.board);
    expect(back.state.moves.map((move) => move.kind)).toEqual([MOVE_KINDS.place, MOVE_KINDS.pass, MOVE_KINDS.place, MOVE_KINDS.place]);
    expect(toMove(back)).toBe(toMove(game));
    expect(toMove(back)).toBe("Aiko (black)");
  });

  it("keeps a resignation, which leaves no move for the record to replay", () => {
    const over = pairResign(played([p(4, 4)])) as PairGoGame;
    const back = decodePairGo(encodePairGo(over)) as PairGoGame;
    expect(back.resigned).toBe(STONES.white);
    expect(back.state.winner).toBe(STONES.black);
  });

  it("keeps the moves, never the board", () => {
    const kept = JSON.parse(encodePairGo(played([p(2, 2), "pass"])));
    expect(kept).toEqual({ v: 1, size: 9, teams: TEAMS, moves: [indexOf(9, p(2, 2)), -1], resigned: null });
  });

  it("refuses anything that is not a Pair Go game, rather than opening part of one", () => {
    const good = JSON.parse(encodePairGo(played([p(2, 2), p(3, 3)])));
    expect(decodePairGo(null)).toBeNull();
    expect(decodePairGo("not json")).toBeNull();
    expect(decodePairGo(JSON.stringify({ ...good, v: 2 }))).toBeNull();
    expect(decodePairGo(JSON.stringify({ ...good, size: 15 }))).toBeNull();
    expect(decodePairGo(JSON.stringify({ ...good, teams: { black: ["A"], white: ["C", "D"] } }))).toBeNull();
    // A stone on a point already taken: the engine refuses it, so the whole game is refused.
    expect(decodePairGo(JSON.stringify({ ...good, moves: [...good.moves, good.moves[0]] }))).toBeNull();
    expect(decodePairGo(JSON.stringify({ ...good, moves: [81] }))).toBeNull();
    // A resignation by the side that was not to move.
    expect(decodePairGo(JSON.stringify({ ...good, resigned: STONES.white }))).toBeNull();
  });

  it("never reads the practice board's kept game as one of its own", () => {
    const hotSeat = { version: 1, settings: { variant: "go", size: 9 }, opener: "black", moves: [{ row: 2, col: 2, stone: "black", kind: "place" }] };
    expect(decodePairGo(JSON.stringify(hotSeat))).toBeNull();
  });
});
