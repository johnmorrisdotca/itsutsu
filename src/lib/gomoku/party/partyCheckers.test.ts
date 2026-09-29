import { describe, expect, it } from "vitest";

import { createGame, pieceMoves } from "../engine";
import { STONES } from "../gomoku.constants";
import type { Point } from "../gomoku.types";
import { indexOf } from "../rules/board";
import { STAR_TIPS, oppositeTip, starTipCells, starTipOf } from "../rules/chineseCheckers";
import {
  PARTY_PLAYER_COUNTS,
  PARTY_RADIUS,
  PARTY_SEATS,
  PARTY_SIZE,
  PARTY_STATUS,
  decodePartyGame,
  encodePartyGame,
  partyDestinations,
  partyHasWon,
  partyMove,
  partyPiecesHome,
  partyPlayerName,
  startPartyGame,
} from "./partyCheckers";
import type { PartyCheckersState } from "./partyCheckers.types";

const p = (row: number, col: number): Point => ({ row, col });
const key = (point: Point) => `${point.row},${point.col}`;
const at = (point: Point) => indexOf(PARTY_SIZE, point);

/** A game of `count` with nothing on the board but what `pieces` puts there. */
function laidOut(count: 2 | 3 | 4 | 6, pieces: { point: Point; player: number }[], toPlay = 0): PartyCheckersState {
  const board: (number | null)[] = new Array(PARTY_SIZE * PARTY_SIZE).fill(null);
  for (const piece of pieces) board[at(piece.point)] = piece.player;
  return { ...startPartyGame(count), board, toPlay };
}

describe("the star's six points", () => {
  it("are six points of ten, each opposite the one three round from it, and together the star less its centre", () => {
    const seen = new Set<string>();
    for (const tip of STAR_TIPS) {
      const cells = starTipCells(PARTY_RADIUS, tip);
      expect(cells, tip).toHaveLength(10);
      for (const cell of cells) {
        expect(starTipOf(PARTY_RADIUS, cell)).toBe(tip);
        seen.add(key(cell));
      }
      expect(oppositeTip(oppositeTip(tip))).toBe(tip);
      expect(oppositeTip(tip)).not.toBe(tip);
    }
    // 121 holes: 60 in the points, 61 in the hexagon at the middle.
    expect(seen.size).toBe(60);
    expect(oppositeTip("top")).toBe("bottom");
    expect(oppositeTip("upperRight")).toBe("lowerLeft");
    expect(oppositeTip("lowerRight")).toBe("upperLeft");
  });
});

describe("setting out the table", () => {
  it.each(PARTY_PLAYER_COUNTS)("gives each of %i players ten pieces in their own point, and the first player the move", (count) => {
    const game = startPartyGame(count);
    expect(game.players.map((player) => player.tip)).toEqual(PARTY_SEATS[count]);
    for (const [index, player] of game.players.entries()) {
      const mine = game.board.filter((owner) => owner === index).length;
      expect(mine, `player ${index + 1}`).toBe(10);
      for (const cell of starTipCells(PARTY_RADIUS, player.tip)) expect(game.board[at(cell)]).toBe(index);
    }
    expect(game.toPlay).toBe(0);
    expect(game.status).toBe(PARTY_STATUS.playing);
    expect(game.winner).toBeNull();
  });

  it("sits two face to face, three on every other point racing into empty ones, and four as two facing pairs", () => {
    expect(oppositeTip(PARTY_SEATS[2][0])).toBe(PARTY_SEATS[2][1]);
    // Three: nobody's far point is anybody's home.
    for (const tip of PARTY_SEATS[3]) expect(PARTY_SEATS[3]).not.toContain(oppositeTip(tip));
    // Four: every far point is somebody's home, and the two points left empty face each other.
    for (const tip of PARTY_SEATS[4]) expect(PARTY_SEATS[4]).toContain(oppositeTip(tip));
    const empty = STAR_TIPS.filter((tip) => !PARTY_SEATS[4].includes(tip));
    expect(empty).toHaveLength(2);
    expect(oppositeTip(empty[0])).toBe(empty[1]);
  });

  it("with two players, lays out exactly the two-player game's board", () => {
    const party = startPartyGame(2);
    const rated = createGame({ variant: "chineseCheckers" });
    rated.board.forEach((cell, index) => {
      const expected = cell === STONES.black ? 0 : cell === STONES.white ? 1 : null;
      expect(party.board[index], `hole ${index}`).toBe(expected);
    });
  });

  it("names a player who gave no name by their place at the table, and keeps a given one tidy", () => {
    const game = startPartyGame(3, ["  Aiko  ", "", "A name far too long for a turn line to hold"]);
    expect(partyPlayerName(game.players, 0)).toBe("Aiko");
    expect(partyPlayerName(game.players, 1)).toBe("Player 2");
    expect(partyPlayerName(game.players, 2).length).toBeLessThanOrEqual(20);
  });
});

describe("a move", () => {
  it("offers a piece exactly the moves the two-player game offers the same piece", () => {
    const party = startPartyGame(2);
    const rated = createGame({ variant: "chineseCheckers" });
    for (const piece of starTipCells(PARTY_RADIUS, "top")) {
      const mine = partyDestinations(party, piece).map(key).sort();
      const theirs = pieceMoves(rated, piece).map(key).sort();
      expect(mine, key(piece)).toEqual(theirs);
    }
  });

  it("offers nothing for somebody else's piece, an empty hole, or a hole off the star", () => {
    const game = startPartyGame(6);
    const theirs = starTipCells(PARTY_RADIUS, PARTY_SEATS[6][1])[0];
    expect(partyDestinations(game, theirs)).toEqual([]);
    expect(partyDestinations(game, p(8, 8))).toEqual([]);
    expect(partyDestinations(game, p(0, 0))).toEqual([]);
    expect(partyMove(game, theirs, p(8, 8))).toBeNull();
  });

  it("steps to any of the six neighbouring holes", () => {
    const game = laidOut(3, [{ point: p(8, 8), player: 0 }]);
    const steps = partyDestinations(game, p(8, 8)).map(key).sort();
    expect(steps).toEqual(["7,8", "7,9", "8,7", "8,9", "9,7", "9,8"].sort());
  });

  it("jumps a chain over anybody's pieces in one move, turning between jumps, and takes nothing", () => {
    const game = laidOut(3, [
      { point: p(8, 8), player: 0 },
      // Over player 2's piece to (6,8), then over player 3's to (6,6).
      { point: p(7, 8), player: 1 },
      { point: p(6, 7), player: 2 },
    ]);
    const options = partyDestinations(game, p(8, 8)).map(key);
    expect(options).toContain("6,8");
    expect(options).toContain("6,6");
    const after = partyMove(game, p(8, 8), p(6, 6))!;
    expect(after.board[at(p(6, 6))]).toBe(0);
    expect(after.board[at(p(8, 8))]).toBeNull();
    expect(after.board[at(p(7, 8))]).toBe(1);
    expect(after.board[at(p(6, 7))]).toBe(2);
    // And the game it came from is untouched.
    expect(game.board[at(p(8, 8))]).toBe(0);
    expect(after.moves).toEqual([{ player: 0, from: p(8, 8), to: p(6, 6) }]);
  });

  it("refuses a move to anywhere the piece cannot reach", () => {
    const game = laidOut(3, [{ point: p(8, 8), player: 0 }]);
    expect(partyMove(game, p(8, 8), p(5, 8))).toBeNull();
  });
});

describe("the turn", () => {
  it("goes round the table in seat order and back to the first", () => {
    let game = laidOut(3, [
      { point: p(8, 8), player: 0 },
      { point: p(8, 4), player: 1 },
      { point: p(8, 12), player: 2 },
    ]);
    const order: number[] = [game.toPlay];
    const plays: [Point, Point][] = [
      [p(8, 8), p(7, 8)],
      [p(8, 4), p(7, 4)],
      [p(8, 12), p(7, 12)],
    ];
    for (const [from, to] of plays) {
      game = partyMove(game, from, to)!;
      order.push(game.toPlay);
    }
    expect(order).toEqual([0, 1, 2, 0]);
  });

  it("passes over a player with no move at all rather than leave them a turn nobody can take", () => {
    /*
     * Player 2's one piece is at the tip of the top point, walled in: its
     * two neighbours taken and nothing beyond either to jump into.
     */
    const tip = p(0, 12);
    expect(starTipOf(PARTY_RADIUS, tip)).toBe("top");
    const walls = [p(1, 11), p(1, 12), p(2, 10), p(2, 12)];
    const game = laidOut(3, [
      { point: p(8, 8), player: 0 },
      { point: tip, player: 1 },
      ...walls.map((point) => ({ point, player: 2 })),
    ]);
    expect(partyDestinations({ ...game, toPlay: 1 }, tip)).toEqual([]);
    const after = partyMove(game, p(8, 8), p(8, 9))!;
    expect(after.toPlay).toBe(2);
  });
});

describe("the win", () => {
  /** Player `player`'s far point, all but its first hole filled by whoever `fill` says. */
  function nearlyHome(count: 2 | 3 | 6, player: number, fill: (index: number) => number) {
    const far = starTipCells(PARTY_RADIUS, oppositeTip(PARTY_SEATS[count][player]));
    const pieces = far.slice(1).map((point, index) => ({ point, player: fill(index) }));
    return { far, pieces };
  }

  it("goes to the first player to fill the point opposite, and ends the game there", () => {
    const { far, pieces } = nearlyHome(3, 0, () => 0);
    const last = far[0];
    const from = [...partyDestinationsInto(last)].find((point) => !pieces.some((piece) => key(piece.point) === key(point)))!;
    const game = laidOut(3, [...pieces, { point: from, player: 0 }, { point: p(8, 8), player: 1 }]);
    expect(partyHasWon(game, 0)).toBe(false);
    const after = partyMove(game, from, last)!;
    expect(after.status).toBe(PARTY_STATUS.won);
    expect(after.winner).toBe(0);
    expect(partyPiecesHome(after, 0)).toBe(10);
    // Nothing moves once it is won.
    expect(partyDestinations({ ...after, toPlay: 1 }, p(8, 8))).toEqual([]);
  });

  it("counts the owner's own pieces, left at home, towards filling it — as the two-player game does", () => {
    // Six players: player 1's far point is player 4's home. Player 4 never left two of theirs.
    const { far } = nearlyHome(6, 0, () => 0);
    const pieces = far.map((point, index) => ({ point, player: index < 2 ? 3 : 0 }));
    expect(partyHasWon(laidOut(6, pieces), 0)).toBe(true);
  });

  it("does not count a third player's piece passing through", () => {
    const { far } = nearlyHome(6, 0, () => 0);
    const pieces = far.map((point, index) => ({ point, player: index < 1 ? 2 : 0 }));
    expect(partyHasWon(laidOut(6, pieces), 0)).toBe(false);
  });

  it("is never won by a point full of nobody's but its owner's pieces", () => {
    // At the start of a two-player game each far point is full of the other side's pieces.
    const game = startPartyGame(2);
    expect(partyHasWon(game, 0)).toBe(false);
    expect(partyHasWon(game, 1)).toBe(false);
  });
});

/** The holes one step from `point`, the way a piece might arrive in it. */
function partyDestinationsInto(point: Point): Point[] {
  return partyDestinations(laidOut(3, [{ point, player: 0 }]), point);
}

describe("keeping a game in the browser", () => {
  it("writes a game as its seating, its names and its moves, and reads it back to the same game", () => {
    let game = startPartyGame(6, ["Aiko", "", "Ben"]);
    for (let turn = 0; turn < 12; turn += 1) {
      const piece = game.board.findIndex((owner, index) => owner === game.toPlay && partyDestinations(game, pointAt(index)).length > 0);
      game = partyMove(game, pointAt(piece), partyDestinations(game, pointAt(piece))[0])!;
    }
    const kept = encodePartyGame(game);
    const back = decodePartyGame(kept);
    expect(back).toEqual(game);
    expect(back?.players[0].name).toBe("Aiko");
    expect(kept.length).toBeLessThan(600);
  });

  it("refuses anything that is not a game it can play out again", () => {
    const good = JSON.parse(encodePartyGame(partyMove(startPartyGame(3), p(3, 12), p(4, 12)) ?? startPartyGame(3))) as {
      players: { tip: string; name: string }[];
      moves: number[][];
    };
    expect(decodePartyGame(null)).toBeNull();
    expect(decodePartyGame("not json")).toBeNull();
    expect(decodePartyGame(JSON.stringify({ ...good, v: 2 }))).toBeNull();
    // Five at the table is not a game this offers.
    expect(decodePartyGame(JSON.stringify({ ...good, players: [...good.players, ...good.players.slice(0, 2)] }))).toBeNull();
    // Seated anywhere but the layout for their number.
    expect(decodePartyGame(JSON.stringify({ ...good, players: [...good.players].reverse() }))).toBeNull();
    // A move the rules refuse.
    expect(decodePartyGame(JSON.stringify({ ...good, moves: [[at(p(3, 12)), at(p(9, 9))]] }))).toBeNull();
    expect(decodePartyGame(JSON.stringify({ ...good, moves: [[-1, 4]] }))).toBeNull();
  });
});

function pointAt(index: number): Point {
  return p(Math.floor(index / PARTY_SIZE), index % PARTY_SIZE);
}
