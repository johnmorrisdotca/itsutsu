import { describe, expect, it } from "vitest";

import { GUNJIN_BOARDS, GUNJIN_DEFAULT_SIZE, GUNJIN_LAKES, GUNJIN_SIZES } from "./gunjin.constants";
import { arrangementIsValid, gunjinMoves, matchSeenBy, gunjinOver, gunjinToPlay, gunjinWinners, homeSquares, playGunjin, randomArrangement, replayGunjin, resignGunjin, seededRandom, startGunjin } from "./gunjin";
import { decodeGunjin, decodeGunjinSeen, encodeGunjin, encodeGunjinSeen } from "./gunjinCodec";
import { gunjinNews, gunjinNewsLines, squareName } from "./gunjinNews";
import { gunjinFinalView, gunjinSeatView } from "./gunjinView";
import type { GunjinGame, GunjinMove } from "./gunjin.types";
import { GUNJIN_RULES } from "./gunjinRules";
import { PARTY_SPECS } from "../party.constants";
import { resignedBy } from "../resign";

/** A game of this board played to its end (or `most` moves) by a seeded random player, from the arrangements `gunjinMoves` offers. */
function played(size: number, seed: number, most = 10_000): GunjinGame {
  const random = seededRandom(seed);
  let game = startGunjin(size, ["Ann", "Ben"])!;
  for (let moves = 0; moves < most && !gunjinOver(game); moves += 1) {
    const offered = gunjinMoves(game);
    game = playGunjin(game, offered[Math.floor(random() * offered.length)]!)!;
  }
  return game;
}

/** A game of this board with both sides arranged and the device handed to red: ready for the first move. */
function begun(size: number): GunjinGame {
  let game = startGunjin(size, ["Ann", "Ben"])!;
  // Arrange, pass, arrange, pass: the first offered of each.
  for (let step = 0; step < 4; step += 1) game = playGunjin(game, gunjinMoves(game)[0]!)!;
  return game;
}

describe("Gunjin offers four boards, each its own hidden-rank game", () => {
  it("names a board by its squares and starts a game on each", () => {
    expect(GUNJIN_SIZES).toEqual([56, 72, 81, 100]);
    expect(PARTY_SPECS.gunjin.sizes).toEqual(GUNJIN_SIZES);
    expect(PARTY_SPECS.gunjin.defaultSize).toBe(GUNJIN_DEFAULT_SIZE);
    for (const size of GUNJIN_SIZES) {
      const board = GUNJIN_BOARDS[size]!;
      expect(board.width * board.height, `${board.name}'s size is its squares`).toBe(size);
      const game = startGunjin(size, ["Ann", "Ben"])!;
      expect(game.match.mode).toBe(board.mode);
      expect([game.match.width, game.match.height]).toEqual([board.width, board.height]);
      expect(game.match.phase).toBe("setup");
      expect(gunjinToPlay(game)).toBe(0);
    }
  });

  it("refuses a board there is not and a table that is not two", () => {
    expect(startGunjin(64, ["Ann", "Ben"])).toBeNull();
    expect(startGunjin(GUNJIN_DEFAULT_SIZE, ["Ann"])).toBeNull();
    expect(startGunjin(GUNJIN_DEFAULT_SIZE, ["Ann", "Ben", "Cy"])).toBeNull();
  });

  it("gives each side as many pieces as its board says, on its own rows", () => {
    for (const size of GUNJIN_SIZES) {
      const board = GUNJIN_BOARDS[size]!;
      const game = startGunjin(size, ["", ""])!;
      const placements = randomArrangement(game, seededRandom(size));
      expect(placements).toHaveLength(board.pieces);
      const home = homeSquares(size, 0);
      for (const piece of placements) expect(home.some((square) => square.x === piece.x && square.y === piece.y)).toBe(true);
      expect(new Set(placements.map((piece) => `${piece.x},${piece.y}`)).size).toBe(board.pieces);
    }
  });
});

describe("a side's arrangement is the first move, and the engine's rules hold it", () => {
  it("refuses a piece missing, one off its own rows, two on a square, and another side's rows", () => {
    const game = startGunjin(GUNJIN_DEFAULT_SIZE, ["", ""])!;
    const good = randomArrangement(game, seededRandom(1));
    expect(arrangementIsValid(game, good)).toBe(true);
    expect(arrangementIsValid(game, good.slice(1))).toBe(false);
    expect(arrangementIsValid(game, good.map((piece, at) => (at === 0 ? { ...piece, y: 0 } : piece)))).toBe(false);
    expect(arrangementIsValid(game, good.map((piece, at) => (at === 0 ? { ...good[1]!, kind: piece.kind } : piece)))).toBe(false);
    expect(playGunjin(game, { kind: "setup", placements: good.slice(1) })).toBeNull();
  });

  it("holds Gunjin Shogi's mines off D and F of the front row, and Luzhanqi's flag to a headquarters", () => {
    const shogi = startGunjin(81, ["", ""])!;
    const mine = randomArrangement(shogi, seededRandom(3));
    // Move one mine onto a forbidden square by swapping places with whatever stands there.
    const forbidden = mine.map((piece) => ({ ...piece }));
    const first = forbidden.find((piece) => piece.kind === "mine")!;
    const other = forbidden.find((piece) => piece.x === 3 && piece.y === 5)!;
    [other.x, other.y, first.x, first.y] = [first.x, first.y, other.x, other.y];
    expect(arrangementIsValid(shogi, forbidden)).toBe(false);
    const land = startGunjin(56, ["", ""])!;
    const ok = randomArrangement(land, seededRandom(5));
    const flag = ok.find((piece) => piece.kind === "flag")!;
    expect([1, 5]).toContain(flag.x);
    expect(flag.y).toBe(7);
  });

  it("passes the device between the sides before anything is shown, and it takes a pass to go on", () => {
    let game = startGunjin(GUNJIN_DEFAULT_SIZE, ["Ann", "Ben"])!;
    game = playGunjin(game, gunjinMoves(game)[0]!)!;
    expect(game.match.phase).toBe("pass");
    expect(gunjinToPlay(game)).toBe(1);
    expect(gunjinMoves(game)).toEqual([{ kind: "hand" }]);
    // Nothing may be played from the cover but the pass.
    expect(playGunjin(game, { kind: "move", from: { x: 0, y: 0 }, to: { x: 0, y: 1 } })).toBeNull();
    game = playGunjin(game, { kind: "hand" })!;
    expect(game.match.phase).toBe("setup");
    game = playGunjin(game, gunjinMoves(game)[0]!)!;
    expect(game.match.phase).toBe("pass");
    expect(gunjinToPlay(game)).toBe(0);
    game = playGunjin(game, { kind: "hand" })!;
    expect(game.match.phase).toBe("play");
    expect(gunjinMoves(game).every((move) => move.kind === "move")).toBe(true);
  });
});

describe("a player is shown only what they may know", () => {
  it("shows a side its own ranks and the other as backs, and nothing during a hand-over", () => {
    for (const size of GUNJIN_SIZES) {
      const game = begun(size);
      expect(game.match.phase).toBe("play");
      for (const seat of [0, 1] as const) {
        const { view } = gunjinSeatView(game, seat);
        const seen = view.pieces ?? [];
        expect(seen.length).toBeGreaterThan(0);
        for (const piece of seen) {
          if (piece.owner === seat) expect(piece.kind, "own rank shown").not.toBeNull();
          else {
            expect(piece.kind, "the other side's rank is hidden").toBeNull();
            expect(piece.hidden).toBe(true);
            expect(piece.id, "no id of the other side's piece").toBeUndefined();
          }
        }
        // And in the text a table could print: not one rank of the other side's pieces appears at their squares.
        const text = JSON.stringify(view);
        const theirs = game.match.pieces.filter((piece) => piece.owner !== seat);
        for (const piece of theirs) expect(text, `${piece.id} must not appear`).not.toContain(piece.id);
      }
      // Pass the device: the board is suppressed for both.
      const moved = playGunjin(game, gunjinMoves(game)[0]!)!;
      expect(moved.match.phase).toBe("pass");
      for (const seat of [0, 1] as const) expect(gunjinSeatView(moved, seat).view.pieces).toBeNull();
    }
  });

  it("shows during arrangement only the arranger's own pieces, and none of the other side's", () => {
    const game = startGunjin(GUNJIN_DEFAULT_SIZE, ["", ""])!;
    const first = playGunjin(game, gunjinMoves(game)[0]!)!;
    const next = playGunjin(first, { kind: "hand" })!;
    // Blue arranging: the view carries blue's own (none yet) and nothing of red's arrangement.
    const view = gunjinSeatView(next, 1).view;
    expect(view.phase).toBe("setup");
    expect(view.pieces).toBeNull();
    expect(JSON.stringify(view)).not.toContain("gunjin-shogi:0:");
  });

  it("says in public only where a piece went and what a fight took off, and ranks only on Capture Flag", () => {
    for (const size of GUNJIN_SIZES) {
      const game = played(size, 11, 400);
      const log = gunjinSeatView(game, 0).view.publicLog;
      const fights = log.filter((event) => event.capturedCount > 0);
      for (const event of fights) {
        if (GUNJIN_BOARDS[size]!.reveals) expect(event.revealed, "Capture Flag shows both ranks of a fight").toHaveLength(2);
        else expect(event.revealed, "no other board shows a rank").toBeUndefined();
      }
    }
  });

  it("shows every piece once the game is over, and never before", () => {
    const going = begun(GUNJIN_DEFAULT_SIZE);
    expect(gunjinFinalView(going)).toBeNull();
    const ended = resignGunjin(going, 0);
    const view = gunjinFinalView(ended)!;
    expect((view.pieces ?? []).every((piece) => piece.kind !== null && !piece.hidden)).toBe(true);
  });
});

describe("Gunjin keeps a game as its moves", () => {
  it("reads back exactly what was kept, on every board", () => {
    for (const size of GUNJIN_SIZES) {
      const game = played(size, 7, 60);
      const again = decodeGunjin(encodeGunjin(game));
      expect(again).toEqual(game);
      expect(encodeGunjin(again!)).toBe(encodeGunjin(game));
    }
  });

  it("refuses what it cannot play out again", () => {
    const text = encodeGunjin(played(GUNJIN_DEFAULT_SIZE, 2, 30));
    const kept = JSON.parse(text) as { v: number; size: number; players: string[]; moves: string };
    expect(decodeGunjin(null)).toBeNull();
    expect(decodeGunjin("not a game")).toBeNull();
    expect(decodeGunjin(JSON.stringify({ ...kept, v: 2 }))).toBeNull();
    expect(decodeGunjin(JSON.stringify({ ...kept, size: 64 }))).toBeNull();
    expect(decodeGunjin(JSON.stringify({ ...kept, moves: `${kept.moves} M0000` }))).toBeNull();
    expect(decodeGunjin(JSON.stringify({ ...kept, moves: `${kept.moves} Z` }))).toBeNull();
    expect(decodeGunjin(JSON.stringify({ ...kept, moves: "M0000" }))).toBeNull();
    expect(decodeGunjin(JSON.stringify({ ...kept, players: [1, 2] }))).toBeNull();
    expect(replayGunjin(81, ["a", "b"], [{ kind: "hand" }])).toBeNull();
  });

  it("is rules the gate can play: a kept resignation ends it with the other side the winner", () => {
    const game = begun(GUNJIN_DEFAULT_SIZE);
    const ended = resignGunjin(game, 0);
    expect(gunjinOver(ended)).toBe(true);
    expect(resignedBy(ended)).toBe(0);
    expect(gunjinWinners(ended)).toEqual([1]);
    expect(gunjinMoves(ended)).toEqual([]);
    expect(playGunjin(ended, { kind: "hand" })).toBeNull();
    // Resigning while arranging or while the device is passed ends it the same.
    const early = resignGunjin(startGunjin(GUNJIN_DEFAULT_SIZE, ["", ""])!, 1);
    expect(gunjinWinners(early)).toEqual([0]);
    expect(GUNJIN_RULES.over(early)).toBe(true);
  });

  it("leaves the game it was given alone", () => {
    const game = begun(GUNJIN_DEFAULT_SIZE);
    const before = encodeGunjin(game);
    const move: GunjinMove = gunjinMoves(game)[0]!;
    playGunjin(game, move);
    resignGunjin(game, 0);
    expect(encodeGunjin(game)).toBe(before);
  });
});

describe("a move is described from the public record alone", () => {
  it("names the squares as a player says them", () => {
    expect(squareName(9, 0, 8)).toBe("A1");
    expect(squareName(9, 4, 4)).toBe("E5");
    expect(squareName(10, 9, 0)).toBe("J10");
  });

  it("says nothing before the first move and a sentence after", () => {
    const game = begun(GUNJIN_DEFAULT_SIZE);
    expect(gunjinNews(game, ["Ann", "Ben"])).toBeNull();
    const moved = playGunjin(game, gunjinMoves(game)[0]!)!;
    expect(gunjinNews(moved, ["Ann", "Ben"])).toMatch(/Ann.*(moved|took|attacked|both)/);
    expect(gunjinNewsLines(played(GUNJIN_DEFAULT_SIZE, 4, 40), ["Ann", "Ben"], 5).length).toBe(5);
  });

  it("names the ranks that fought on Capture Flag, and only there", () => {
    const flag = played(100, 5, 300);
    const lines = gunjinNewsLines(flag, ["Ann", "Ben"], 300).filter((line) => /took|taken/.test(line));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((line) => /Marshal|General|Colonel|Major|Captain|Lieutenant|Sergeant|Miner|Scout|Spy|Bomb|Flag/.test(line))).toBe(true);
    const shogi = played(81, 5, 300);
    expect(gunjinNewsLines(shogi, ["Ann", "Ben"], 300).some((line) => /General|Colonel|Aircraft|Tank|Spy|Mine/.test(line))).toBe(false);
  });
});

describe("Gunjin played at random", () => {
  it("ends on every board, and either side can win", () => {
    for (const size of GUNJIN_SIZES) {
      const won = new Set<number>();
      for (let seed = 0; seed < 12; seed += 1) {
        const game = played(size, seed + size);
        expect(gunjinOver(game), `${size} seed ${seed}`).toBe(true);
        for (const winner of gunjinWinners(game)) won.add(winner);
      }
      expect(won.size, `${size}: both sides win`).toBe(2);
    }
  });
});

describe("Capture Flag's lakes", () => {
  it("are the squares the engine never lets a piece enter or cross, so the board may shade them", () => {
    const lakes = new Set((GUNJIN_LAKES["stratego-lite"] ?? []).map(([x, y]) => `${x},${y}`));
    expect(lakes.size).toBe(8);
    let game = begun(100);
    const seen = new Set<string>();
    const random = seededRandom(9);
    for (let at = 0; at < 600 && !gunjinOver(game); at += 1) {
      const offered = gunjinMoves(game);
      for (const move of offered) if (move.kind === "move") expect(lakes.has(`${move.to.x},${move.to.y}`), `a move onto the lake at ${move.to.x},${move.to.y}`).toBe(false);
      for (const move of offered) if (move.kind === "move") seen.add(`${move.from.x},${move.from.y}`);
      game = playGunjin(game, offered[Math.floor(random() * offered.length)]!)!;
    }
    // And a piece standing beside a lake has been offered moves, so the check above had squares next to the water to look at.
    expect([...lakes].some((lake) => {
      const [x, y] = lake.split(",").map(Number);
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x! + dx!},${y! + dy!}`));
    })).toBe(true);
    // No other board has any.
    expect(Object.keys(GUNJIN_LAKES)).toEqual(["stratego-lite"]);
  });
});

describe("a game as one seat may see it, for a table on two devices", () => {
  it("takes the other side's ranks, ids and arrangement out, and keeps everything the viewer is shown", () => {
    for (const size of GUNJIN_SIZES) {
      for (const seed of [1, 2, 3]) {
        const game = played(size, seed + size, 40 + seed * 60);
        for (const seat of [0, 1] as const) {
          const seen = matchSeenBy(game.match, seat);
          if (gunjinOver(game)) {
            expect(seen).toEqual(game.match);
            continue;
          }
          for (const piece of seen.pieces) {
            if (piece.owner === seat) expect(piece.kind).not.toBe("hidden");
            else expect([piece.kind, piece.id]).toEqual(["hidden", `hidden:${piece.x}:${piece.y}`]);
          }
          expect(seen.privateSetups[seat === 0 ? 1 : 0]).toEqual([]);
          // The invariant the whole table rests on: what the seat is shown, and which moves it may make, are the same from the redacted match as from the whole one.
          const whole = gunjinSeatView(game, seat);
          const redacted = gunjinSeatView({ ...game, match: seen }, seat);
          expect(redacted, `${size} seed ${seed} seat ${seat}`).toEqual(whole);
        }
      }
    }
  });

  it("is text that holds none of the other side's pieces, and reads back as a game with no moves of its own", () => {
    const game = played(GUNJIN_DEFAULT_SIZE, 5, 120);
    for (const seat of [0, 1] as const) {
      const text = encodeGunjinSeen(game, seat);
      for (const piece of game.match.pieces.filter((one) => one.owner !== seat)) expect(text).not.toContain(piece.id);
      expect(text).not.toContain(`gunjin-shogi:${seat === 0 ? 1 : 0}:`);
      const read = decodeGunjinSeen(text)!;
      expect(read.moves).toEqual([]);
      expect(read.players).toEqual(game.players);
      expect(gunjinSeatView(read, seat)).toEqual(gunjinSeatView(game, seat));
      // It is not a stored game, and a stored game is not it.
      expect(decodeGunjin(text)).toBeNull();
      expect(decodeGunjinSeen(encodeGunjin(game))).toBeNull();
    }
    expect(decodeGunjinSeen(null)).toBeNull();
    expect(decodeGunjinSeen("not a game")).toBeNull();
    expect(decodeGunjinSeen(JSON.stringify({ v: 1, seen: 0, size: 81, players: ["a", "b"], match: { mode: "salpakan" } }))).toBeNull();
  });

  it("shows everything once the game is over: the finished match goes whole, and the final view has every rank", () => {
    const ended = resignGunjin(begun(GUNJIN_DEFAULT_SIZE), 1);
    const text = encodeGunjinSeen(ended, 0);
    const read = decodeGunjinSeen(text)!;
    expect(gunjinFinalView(read)).toEqual(gunjinFinalView(ended));
    expect((gunjinFinalView(read)!.pieces ?? []).every((piece) => piece.kind !== null && piece.kind !== "hidden")).toBe(true);
  });
});
