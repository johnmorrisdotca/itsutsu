import { describe, expect, it } from "vitest";

import { createGame, pieceMoves } from "../engine";
import { STONES, VARIANT_SPECS } from "../gomoku.constants";
import type { Point } from "../gomoku.types";
import { indexOf } from "../rules/board";
import { campSize } from "../rules/camps";
import {
  HALMA_CORNERS,
  HALMA_PARTY_COUNTS,
  HALMA_PARTY_SEATS,
  HALMA_PARTY_SIZE,
  PARTY_HALMA_RULES,
  decodeHalmaParty,
  encodeHalmaParty,
  halmaCampSquares,
  halmaPartyDestinations,
  halmaPartyHasWon,
  halmaPartyMove,
  halmaPartyPiecesHome,
  oppositeCorner,
  startHalmaParty,
} from "./partyHalma";
import type { PartyHalmaCount, PartyHalmaState } from "./partyHalma.types";
import { PARTY_STATUS, partyPlayerName } from "./partyRace";

const p = (row: number, col: number): Point => ({ row, col });
const key = (point: Point) => `${point.row},${point.col}`;
const at = (point: Point) => indexOf(HALMA_PARTY_SIZE, point);
const pointAt = (index: number) => p(Math.floor(index / HALMA_PARTY_SIZE), index % HALMA_PARTY_SIZE);

/** A game of `count` with nothing on the board but what `pieces` puts there. */
function laidOut(count: PartyHalmaCount, pieces: { point: Point; player: number }[], toPlay = 0): PartyHalmaState {
  const board: (number | null)[] = new Array(HALMA_PARTY_SIZE * HALMA_PARTY_SIZE).fill(null);
  for (const piece of pieces) board[at(piece.point)] = piece.player;
  return { ...startHalmaParty(count), board, toPlay };
}

describe("the board and its corners", () => {
  it("is Halma's own sixteen, the board the rated game opens on", () => {
    expect(VARIANT_SPECS.halma.defaultBoard).toBe(HALMA_PARTY_SIZE);
    expect(VARIANT_SPECS.halma.boardSizes).toContain(HALMA_PARTY_SIZE);
  });

  it("gives four players the published thirteen-piece camp, the shape the ten-board already uses", () => {
    expect(campSize(10)).toBe(13);
    const seen = new Set<string>();
    for (const corner of HALMA_CORNERS) {
      const camp = halmaCampSquares(4, corner);
      expect(camp, corner).toHaveLength(13);
      for (const point of camp) seen.add(key(point));
      expect(oppositeCorner(oppositeCorner(corner))).toBe(corner);
      expect(oppositeCorner(corner)).not.toBe(corner);
    }
    // Four camps, none touching another.
    expect(seen.size).toBe(52);
    expect(halmaCampSquares(4, "topLeft").map(key)).toContain("3,1");
    expect(halmaCampSquares(4, "bottomRight").map(key)).toContain("15,15");
    expect(halmaCampSquares(4, "topRight").map(key)).toContain("0,12");
    expect(halmaCampSquares(4, "bottomLeft").map(key)).toContain("12,0");
  });

  it("gives two players the rated game's nineteen", () => {
    expect(halmaCampSquares(2, "topLeft")).toHaveLength(campSize(16));
    expect(campSize(16)).toBe(19);
  });
});

describe("setting out the table", () => {
  it.each(HALMA_PARTY_COUNTS)("gives each of %i players a full camp in their own corner, and the first player the move", (count) => {
    const game = startHalmaParty(count);
    expect(game.players.map((player) => player.corner)).toEqual(HALMA_PARTY_SEATS[count]);
    for (const [index, player] of game.players.entries()) {
      const camp = halmaCampSquares(count, player.corner);
      expect(game.board.filter((owner) => owner === index).length, `player ${index + 1}`).toBe(camp.length);
      for (const point of camp) expect(game.board[at(point)]).toBe(index);
    }
    expect(game.toPlay).toBe(0);
    expect(game.status).toBe(PARTY_STATUS.playing);
    expect(PARTY_HALMA_RULES.piecesEach(game)).toBe(count === 4 ? 13 : 19);
  });

  it("seats four round the board, each racing into the corner of the player opposite", () => {
    expect(HALMA_PARTY_SEATS[4]).toEqual(["topLeft", "topRight", "bottomRight", "bottomLeft"]);
    for (const [index, corner] of HALMA_PARTY_SEATS[4].entries()) {
      expect(HALMA_PARTY_SEATS[4].indexOf(oppositeCorner(corner))).toBe((index + 2) % 4);
    }
  });

  it("with two players, lays out exactly the two-player game's board", () => {
    const party = startHalmaParty(2);
    const rated = createGame({ variant: "halma", size: HALMA_PARTY_SIZE });
    rated.board.forEach((cell, index) => {
      const expected = cell === STONES.black ? 0 : cell === STONES.white ? 1 : null;
      expect(party.board[index], `square ${index}`).toBe(expected);
    });
  });

  it("names a player who gave no name by their place at the table", () => {
    const game = startHalmaParty(4, ["  Aiko ", "", "Ben"]);
    expect(partyPlayerName(game.players, 0)).toBe("Aiko");
    expect(partyPlayerName(game.players, 1)).toBe("Player 2");
    expect(partyPlayerName(game.players, 3)).toBe("Player 4");
  });
});

describe("a move", () => {
  it("offers a piece exactly the moves the two-player game offers the same piece", () => {
    const party = startHalmaParty(2);
    const rated = createGame({ variant: "halma", size: HALMA_PARTY_SIZE });
    for (const piece of halmaCampSquares(2, "topLeft")) {
      const mine = halmaPartyDestinations(party, piece).map(key).sort();
      const theirs = pieceMoves(rated, piece).map(key).sort();
      expect(mine, key(piece)).toEqual(theirs);
    }
  });

  it("steps to any of the eight neighbouring squares", () => {
    const game = laidOut(4, [{ point: p(8, 8), player: 0 }]);
    const steps = halmaPartyDestinations(game, p(8, 8)).map(key).sort();
    expect(steps).toEqual(["7,7", "7,8", "7,9", "8,7", "8,9", "9,7", "9,8", "9,9"].sort());
  });

  it("jumps a chain over anybody's pieces in one move, turning between jumps, and takes nothing", () => {
    const game = laidOut(4, [
      { point: p(8, 8), player: 0 },
      // Over player 2's piece diagonally to (10,10), then over player 4's straight down to (12,10).
      { point: p(9, 9), player: 1 },
      { point: p(11, 10), player: 3 },
    ]);
    const options = halmaPartyDestinations(game, p(8, 8)).map(key);
    expect(options).toContain("10,10");
    expect(options).toContain("12,10");
    const after = halmaPartyMove(game, p(8, 8), p(12, 10))!;
    expect(after.board[at(p(12, 10))]).toBe(0);
    expect(after.board[at(p(8, 8))]).toBeNull();
    expect(after.board[at(p(9, 9))]).toBe(1);
    expect(after.board[at(p(11, 10))]).toBe(3);
    expect(game.board[at(p(8, 8))]).toBe(0);
    expect(after.moves).toEqual([{ player: 0, from: p(8, 8), to: p(12, 10) }]);
  });

  it("offers nothing for somebody else's piece, an empty square, or off the board, and refuses what it does not offer", () => {
    const game = startHalmaParty(4);
    const theirs = halmaCampSquares(4, "topRight")[0];
    expect(halmaPartyDestinations(game, theirs)).toEqual([]);
    expect(halmaPartyDestinations(game, p(8, 8))).toEqual([]);
    expect(halmaPartyDestinations(game, p(-1, 3))).toEqual([]);
    expect(halmaPartyMove(game, theirs, p(8, 8))).toBeNull();
    expect(halmaPartyMove(game, p(3, 1), p(9, 9))).toBeNull();
  });
});

describe("the turn", () => {
  it("goes round the four corners in seat order and back to the first", () => {
    let game = startHalmaParty(4);
    const order: number[] = [game.toPlay];
    // One step out of each camp, clockwise from the top left.
    const plays: [Point, Point][] = [
      [p(3, 1), p(4, 1)],
      [p(3, 14), p(4, 14)],
      [p(12, 14), p(11, 14)],
      [p(12, 1), p(11, 1)],
    ];
    for (const [from, to] of plays) {
      game = halmaPartyMove(game, from, to)!;
      order.push(game.toPlay);
    }
    expect(order).toEqual([0, 1, 2, 3, 0]);
  });

  it("passes over a player with no move at all rather than leave them a turn nobody can take", () => {
    // Player 2's one piece is in the top-left square, walled in two deep so that nothing can be jumped either.
    const walls = [p(0, 1), p(1, 0), p(1, 1), p(0, 2), p(2, 0), p(2, 2)];
    const game = laidOut(4, [{ point: p(8, 8), player: 0 }, { point: p(0, 0), player: 1 }, ...walls.map((point) => ({ point, player: 2 }))]);
    expect(halmaPartyDestinations({ ...game, toPlay: 1 }, p(0, 0))).toEqual([]);
    expect(halmaPartyMove(game, p(8, 8), p(8, 9))!.toPlay).toBe(2);
  });
});

describe("the win", () => {
  it("goes to the first player to fill the corner opposite, and ends the game there", () => {
    const far = halmaCampSquares(4, "bottomRight");
    // All but the camp's outermost square, (12,14), filled by player 1; the last piece steps in from (11,14).
    const last = p(12, 14);
    const pieces = far.filter((point) => key(point) !== key(last)).map((point) => ({ point, player: 0 }));
    const game = laidOut(4, [...pieces, { point: p(11, 14), player: 0 }, { point: p(8, 8), player: 1 }]);
    expect(halmaPartyHasWon(game, 0)).toBe(false);
    const after = halmaPartyMove(game, p(11, 14), last)!;
    expect(after.status).toBe(PARTY_STATUS.won);
    expect(after.winner).toBe(0);
    expect(halmaPartyPiecesHome(after, 0)).toBe(13);
    expect(halmaPartyDestinations({ ...after, toPlay: 1 }, p(8, 8))).toEqual([]);
  });

  it("counts the owner's own pieces, left at home, towards filling it", () => {
    const far = halmaCampSquares(4, "bottomRight");
    const pieces = far.map((point, index) => ({ point, player: index < 3 ? 2 : 0 }));
    expect(halmaPartyHasWon(laidOut(4, pieces), 0)).toBe(true);
  });

  it("does not count a third player's piece passing through", () => {
    const far = halmaCampSquares(4, "bottomRight");
    const pieces = far.map((point, index) => ({ point, player: index < 1 ? 1 : 0 }));
    expect(halmaPartyHasWon(laidOut(4, pieces), 0)).toBe(false);
  });

  it("is never won by a corner full of nobody's but its owner's pieces", () => {
    for (const count of HALMA_PARTY_COUNTS) {
      const game = startHalmaParty(count);
      for (let player = 0; player < count; player += 1) expect(halmaPartyHasWon(game, player)).toBe(false);
    }
  });
});

describe("keeping a game in the browser", () => {
  it("writes a game as its seating, its names and its moves, and reads it back to the same game", () => {
    let game = startHalmaParty(4, ["Aiko", "", "Ben", "Chloe"]);
    for (let turn = 0; turn < 16; turn += 1) {
      const piece = game.board.findIndex((owner, index) => owner === game.toPlay && halmaPartyDestinations(game, pointAt(index)).length > 0);
      game = halmaPartyMove(game, pointAt(piece), halmaPartyDestinations(game, pointAt(piece))[0])!;
    }
    const kept = encodeHalmaParty(game);
    expect(decodeHalmaParty(kept)).toEqual(game);
    expect(kept).toContain('"corner":"topRight"');
    expect(kept.length).toBeLessThan(600);
  });

  it("refuses anything that is not a game it can play out again", () => {
    const good = JSON.parse(encodeHalmaParty(halmaPartyMove(startHalmaParty(4), p(3, 1), p(4, 1))!)) as {
      players: { corner: string; name: string }[];
      moves: number[][];
    };
    expect(decodeHalmaParty(null)).toBeNull();
    expect(decodeHalmaParty("[]")).toBeNull();
    expect(decodeHalmaParty(JSON.stringify({ ...good, v: 2 }))).toBeNull();
    // Three at the table is not a game this offers.
    expect(decodeHalmaParty(JSON.stringify({ ...good, players: good.players.slice(0, 3) }))).toBeNull();
    expect(decodeHalmaParty(JSON.stringify({ ...good, players: [...good.players].reverse() }))).toBeNull();
    // A Chinese Checkers game, whose seats are points of a star, is not a Halma game.
    expect(decodeHalmaParty(JSON.stringify({ ...good, players: good.players.map((one) => ({ tip: one.corner, name: one.name })) }))).toBeNull();
    expect(decodeHalmaParty(JSON.stringify({ ...good, moves: [[at(p(3, 1)), at(p(9, 9))]] }))).toBeNull();
    expect(decodeHalmaParty(JSON.stringify({ ...good, moves: [[0, 256]] }))).toBeNull();
  });

  it("starts the same table again with the same seats and names", () => {
    const game = halmaPartyMove(startHalmaParty(4, ["Aiko"]), p(3, 1), p(4, 1))!;
    expect(PARTY_HALMA_RULES.again(game)).toEqual(startHalmaParty(4, ["Aiko"]));
  });
});
