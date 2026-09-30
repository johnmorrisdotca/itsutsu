import { describe, expect, it } from "vitest";

import { PARTY_CHECKERS_RULES } from "../../gomoku/party/partyCheckers";
import { PARTY_HALMA_RULES } from "../../gomoku/party/partyHalma";
import { blocksPreviewAt, blocksStartSquares } from "../../gomoku/party/partyBlocks";
import type { PartyBlocksState } from "../../gomoku/party/partyBlocks.types";
import type { PartyRaceState } from "../../gomoku/party/partyRace.types";
import { DOTS_RULES } from "../dotsAndBoxes/dotsAndBoxes";
import type { DotsGame } from "../dotsAndBoxes/dotsAndBoxes.types";
import type { TenkaMove } from "../tenka/tenka.types";
import { writeTenkaMove } from "../tenka/tenkaKeep";
import { tenkaMoves } from "../tenka/tenkaMoves";
import { sensibleTenkaMove } from "../tenka/tenkaPolicy";

import { ONLINE_GAMES, ONLINE_GAME_LIST, hasComputer, isOnlineGame, onlineRulesOf, readPoint } from "./onlineGames";
import { standingOf } from "./onlineSeats";
import { computerPlayOf } from "./onlineComputerMoves";
import type { PairGoMove } from "./onlinePairGo";

/**
 * THE GAMES ON SEVERAL DEVICES ARE PLAYED BY THE SAME RULES AS ON ONE. Each
 * row of `ONLINE_GAMES` is asked what the server asks it — start, keep and
 * read back, read a move a browser sent, play it, and say how the game
 * stands — and its answers are held to the local table's own rules.
 */

/** A random number in [0, 1) that is the same every run. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

describe("every game on several devices", () => {
  it("is listed, and nothing else is", () => {
    expect(ONLINE_GAME_LIST).toEqual(["dotsAndBoxes", "chineseCheckers", "halma", "blockFive", "go", "kumimoji", "superghost", "mancala", "tenka", "mexicanTrain", "hitotsu"]);
    expect(isOnlineGame("dotsAndBoxes")).toBe(true);
    expect(isOnlineGame("freestyle")).toBe(false);
    expect(isOnlineGame("toString")).toBe(false);
  });

  // Kumimoji starts from the bag its set-up dealt, and Tenka, Mexican Train and Hitotsu from the seed their set-ups drew; each has its own cases.
  it.each(ONLINE_GAME_LIST.filter((key) => key !== "kumimoji" && key !== "tenka" && key !== "mexicanTrain" && key !== "hitotsu"))("%s starts at every table it offers, and keeps a game it can read back", (key) => {
    const rules = onlineRulesOf(key);
    for (const size of rules.sizes.length === 0 ? [0] : rules.sizes) {
      for (const count of rules.counts) {
        const game = rules.start(size, count);
        expect(game, `${key} at ${size} for ${count}`).not.toBeNull();
        const kept = rules.encode(game);
        expect(rules.encode(rules.decode(kept))).toBe(kept);
        expect(rules.toPlay(game)).toBe(0);
        expect(rules.moveCount(game)).toBe(0);
        expect(standingOf(rules, game)).toEqual({ status: "playing", toPlay: 0, winners: [], moveCount: 0 });
      }
    }
  });

  it.each(ONLINE_GAME_LIST)("%s refuses a table it does not offer, and text it cannot play out", (key) => {
    const rules = onlineRulesOf(key);
    expect(rules.start(rules.sizes[0] ?? 0, 1)).toBeNull();
    expect(rules.start(rules.sizes[0] ?? 0, 9)).toBeNull();
    expect(rules.decode("not a game")).toBeNull();
    expect(rules.decode("{}")).toBeNull();
  });

  it.each(ONLINE_GAME_LIST)("%s reads no move from something that is not one", (key) => {
    const rules = onlineRulesOf(key);
    for (const sent of [null, undefined, "3", 1.5, {}, [], { from: { row: -1, col: 0 }, to: { row: 0, col: 0 } }, { piece: "nope", cells: [] }]) {
      expect(rules.readMove(sent), JSON.stringify(sent)).toBeNull();
    }
  });

  it("offers a computer seat only at Pair Go, Kumimoji, Mexican Train and Hitotsu, the games with a computer player, and the worker can move for each", () => {
    for (const key of ONLINE_GAME_LIST) {
      expect(hasComputer(key), key).toBe(key === "go" || key === "kumimoji" || key === "mexicanTrain" || key === "hitotsu");
      expect(computerPlayOf(key) !== undefined, key).toBe(hasComputer(key));
    }
  });

  it("writes the seats' names into a game for a page, and never into what is kept", () => {
    const rules = onlineRulesOf("dotsAndBoxes");
    const game = rules.start(3, 3);
    const named = rules.named(game, ["Aiko", "Ben", "Chloe"]) as DotsGame;
    expect(named.players).toEqual(["Aiko", "Ben", "Chloe"]);
    expect(rules.encode(game)).not.toContain("Aiko");
    const halma = onlineRulesOf("halma");
    const race = halma.named(halma.start(0, 4), ["A", "B"]) as PartyRaceState;
    expect(race.players.map((player) => player.name)).toEqual(["A", "B", "", ""]);
  });
});

describe("Dots and Boxes on several devices", () => {
  const rules = ONLINE_GAMES.dotsAndBoxes;

  it("reads a line's number, and plays it as the local table does", () => {
    const game = rules.start(3, 2)!;
    expect(rules.readMove(0)).toBe(0);
    expect(rules.readMove(-1)).toBe(-1);
    // A number off the board is read, and refused by the rules — whether it may be drawn is theirs to say.
    expect(rules.play(game, 99)).toBeNull();
    expect(rules.play(game, 0)).toEqual(DOTS_RULES.play(game, 0));
    expect(rules.play(rules.play(game, 0)!, 0)).toBeNull();
  });

  it("plays a whole game out by the moves the rules offer, and names the winners", () => {
    const random = seeded(7);
    let game = rules.start(4, 3)!;
    while (rules.toPlay(game) !== null) {
      const offered = DOTS_RULES.moves(game);
      const next = rules.play(game, offered[Math.floor(random() * offered.length)]);
      expect(next).not.toBeNull();
      game = next!;
      expect(rules.encode(rules.decode(rules.encode(game))!)).toBe(rules.encode(game));
    }
    const standing = standingOf(rules, game);
    expect(standing.status).toBe("finished");
    expect(standing.toPlay).toBeNull();
    expect(standing.winners.length).toBeGreaterThan(0);
    expect(standing.moveCount).toBe(40);
  });
});

describe("the races on several devices", () => {
  it.each([
    ["chineseCheckers", PARTY_CHECKERS_RULES],
    ["halma", PARTY_HALMA_RULES],
  ] as const)("%s reads a move from point to point, and plays only what its rules allow", (key, local) => {
    const rules = onlineRulesOf(key);
    const game = rules.start(0, 2) as PartyRaceState;
    const from = game.board.findIndex((owner) => owner === 0);
    const start = { row: Math.floor(from / local.size), col: from % local.size };
    // Somewhere a piece of the first player's may go, if this one has anywhere; otherwise the first that has.
    const movable = game.board.flatMap((owner, index) => {
      if (owner !== 0) return [];
      const point = { row: Math.floor(index / local.size), col: index % local.size };
      const to = local.destinations(game as never, point);
      return to.length > 0 ? [{ from: point, to: to[0] }] : [];
    })[0];
    expect(movable).toBeDefined();
    const read = rules.readMove(JSON.parse(JSON.stringify(movable)));
    expect(read).toEqual(movable);
    const moved = rules.play(game, read) as PartyRaceState;
    expect(moved.toPlay).toBe(1);
    expect(rules.moveCount(moved)).toBe(1);
    // A piece may not jump to where it stands, nor anyone else's.
    expect(rules.play(game, { from: start, to: start })).toBeNull();
    expect(rules.readMove({ from: start, to: { row: local.size, col: 0 } })).toBeNull();
  });
});

describe("Block Five on several devices", () => {
  const rules = ONLINE_GAMES.blockFive;

  it("reads a piece and its squares, and lays only what its rules allow", () => {
    const game = rules.start(0, 4)!;
    const corner = blocksStartSquares(game, 0)[0];
    const preview = blocksPreviewAt(game, { piece: "one", turns: 0, flipped: false }, corner);
    expect(preview.refusal).toBeNull();
    const sent = JSON.parse(JSON.stringify({ piece: "one", cells: preview.cells }));
    const read = rules.readMove(sent);
    expect(read).toEqual({ piece: "one", cells: preview.cells });
    const laid = rules.play(game, read!) as PartyBlocksState;
    expect(rules.toPlay(laid)).toBe(1);
    // The same piece again, anywhere, is refused: each piece is laid once.
    expect(rules.play(laid, read!)).toBeNull();
    expect(rules.readMove({ piece: "one", cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 }] })).toBeNull();
    expect(rules.readMove({ piece: "__proto__", cells: [] })).toBeNull();
  });
});

describe("a point as a browser sent it", () => {
  it("is two whole numbers inside the board, or nothing", () => {
    expect(readPoint({ row: 2, col: 3 }, 5)).toEqual({ row: 2, col: 3 });
    expect(readPoint({ row: 5, col: 0 }, 5)).toBeNull();
    expect(readPoint({ row: 1.5, col: 0 }, 5)).toBeNull();
    expect(readPoint({ row: "1", col: 0 }, 5)).toBeNull();
    expect(readPoint(null, 5)).toBeNull();
  });
});

describe("Pair Go on several devices", () => {
  const rules = ONLINE_GAMES.go;

  it("seats four in the order round the table: Black 1, White 1, Black 2, White 2", () => {
    const game = rules.start(9, 4)!;
    expect(rules.start(9, 2)).toBeNull();
    expect(rules.start(8, 4)).toBeNull();
    expect(rules.toPlay(game)).toBe(0);
    const one = rules.play(game, { kind: "stone", row: 4, col: 4 })!;
    expect(rules.toPlay(one)).toBe(1);
    const two = rules.play(one, { kind: "stone", row: 2, col: 2 })!;
    expect(rules.toPlay(two)).toBe(2);
    const three = rules.play(two, { kind: "pass" })!;
    expect(rules.toPlay(three)).toBe(3);
    // A point taken already is refused by the engine.
    expect(rules.play(three, { kind: "stone", row: 4, col: 4 })).toBeNull();
    const named = rules.named(game, ["Aiko", "Ben", "Chloe", "Dan"]);
    expect(named.teams).toEqual({ black: ["Aiko", "Chloe"], white: ["Ben", "Dan"] });
  });

  it("reads a stone, a pass or a resignation, and nothing else", () => {
    expect(rules.readMove({ kind: "stone", row: 3, col: 5 })).toEqual({ kind: "stone", row: 3, col: 5 });
    expect(rules.readMove({ kind: "pass" })).toEqual({ kind: "pass" });
    expect(rules.readMove({ kind: "resign" })).toEqual({ kind: "resign" });
    expect(rules.readMove({ kind: "stone", row: 30, col: 5 })).toBeNull();
    expect(rules.readMove({ kind: "undo" })).toBeNull();
    // A point past a small board is read, and refused when played.
    expect(rules.play(rules.start(9, 4)!, { kind: "stone", row: 12, col: 0 })).toBeNull();
  });

  it("a resignation ends it, and the other team's two seats win", () => {
    const game = rules.play(rules.start(9, 4)!, { kind: "stone", row: 4, col: 4 })!;
    const resigned = rules.play(game, { kind: "resign" })!;
    expect(rules.toPlay(resigned)).toBeNull();
    expect(standingOf(rules, resigned)).toMatchObject({ status: "finished", winners: [0, 2] });
    expect(rules.moveCount(resigned)).toBe(2);
    expect(rules.decode(rules.encode(resigned))).not.toBeNull();
  });

  it("seats the site's Go programs, each as itself, and a program's move is one the engine takes", () => {
    const computers = rules.computers!;
    expect(computers.levels.length).toBeGreaterThan(0);
    const level = computers.levels[0];
    const seat = computers.seat(level);
    expect(seat.memberId).not.toBeNull();
    expect(computers.levelOf(seat)).toBe(level);
    expect(computers.levelOf({ memberId: "somebody", name: "Somebody" })).toBeNull();
    const game = rules.play(rules.start(9, 4)!, { kind: "stone", row: 4, col: 4 })!;
    const move = computerPlayOf("go")!.move(game, 1, level) as PairGoMove | null;
    expect(move).not.toBeNull();
    expect(rules.play(game, move!)).not.toBeNull();
  });
});

describe("Superghost on several devices", () => {
  const rules = ONLINE_GAMES.superghost;

  it("starts in the language the set-up asked for, and in no language it does not offer", () => {
    expect(rules.start(4, 3, { setup: { language: "japanese" } })!.language).toBe("japanese");
    expect(rules.start(4, 3)!.language).toBe("english");
    expect(rules.start(4, 3, { setup: { language: "klingon" } })).toBeNull();
    expect(rules.start(4, 1)).toBeNull();
  });

  it("plays a move on the browser's word for the word, and checks everything else itself", () => {
    const game = rules.start(4, 2)!;
    const a = rules.play(game, { move: { kind: "letter", letter: "c", end: "after" }, word: false })!;
    expect(rules.toPlay(a)).toBe(1);
    expect(rules.moveCount(a)).toBeGreaterThan(0);
    // A letter of no alphabet, and a challenge before any letter, are the rules' to refuse.
    expect(rules.play(game, { move: { kind: "letter", letter: "9", end: "after" }, word: false })).toBeNull();
    expect(rules.play(game, { move: { kind: "challenge" }, word: false })).toBeNull();
    // An answer that does not hold the fragment is refused whatever the browser says of it.
    const challenged = rules.play(a, { move: { kind: "challenge" }, word: false })!;
    expect(rules.toPlay(challenged)).toBe(0);
    expect(rules.play(challenged, { move: { kind: "answer", word: "dogs" }, word: true })).toBeNull();
    const named = rules.play(challenged, { move: { kind: "answer", word: "cats" }, word: true })!;
    expect(rules.decode(rules.encode(named))).not.toBeNull();
  });

  it("reads a move's shape and nothing else", () => {
    expect(rules.readMove({ move: { kind: "letter", letter: "a", end: "before" }, word: false })).not.toBeNull();
    expect(rules.readMove({ move: { kind: "letter", letter: "ab", end: "before" }, word: false })).toBeNull();
    expect(rules.readMove({ move: { kind: "concede" } })).toBeNull();
  });
});

describe("Mancala on several devices", () => {
  const rules = ONLINE_GAMES.mancala;

  it("is its party rules, a move a pit", () => {
    const game = rules.start(14, 2)!;
    expect(rules.start(14, 3)).toBeNull();
    expect(rules.toPlay(game)).toBe(0);
    const pit = [0, 1, 2, 3, 4, 5].find((one) => rules.play(game, one) !== null)!;
    const next = rules.play(game, pit)!;
    expect(rules.moveCount(next)).toBe(1);
    expect(rules.readMove(3)).toBe(3);
    expect(rules.readMove("3")).toBeNull();
  });
});

describe("Tenka on several devices", () => {
  const rules = ONLINE_GAMES.tenka;
  const setup = { seed: 20260930, placing: "auto" };
  const sent = (moves: readonly TenkaMove[]) => JSON.parse(JSON.stringify(moves.map(writeTenkaMove))) as unknown;

  it("is dealt from the seed its set-up drew, at every length and table it offers, and from nothing else", () => {
    for (const size of rules.sizes) {
      for (const count of rules.counts) {
        const game = rules.start(size, count, { setup })!;
        expect(game, `${size} for ${count}`).not.toBeNull();
        expect(rules.encode(rules.decode(rules.encode(game))!)).toBe(rules.encode(game));
        expect(rules.moveCount(game)).toBe(0);
        expect(rules.toPlay(game)).toBe(game.toPlay);
        expect(rules.encode(rules.start(size, count, { setup })!)).toBe(rules.encode(game));
      }
    }
    expect(rules.start(10, 3)).toBeNull();
    expect(rules.start(10, 3, { setup: { seed: -1, placing: "auto" } })).toBeNull();
    expect(rules.start(10, 3, { setup: { seed: 1.5, placing: "auto" } })).toBeNull();
    expect(rules.start(10, 3, { setup: { seed: 7, placing: "somehow" } })).toBeNull();
    expect(rules.start(11, 3, { setup })).toBeNull();
    expect(rules.start(10, 7, { setup })).toBeNull();
    expect(rules.start(10, 3, { setup: { seed: 7, placing: "hand" } })!.phase).toBe("setUp");
  });

  it("reads a press of one or two moves as the game keeps them, and nothing else", () => {
    expect(rules.readMove([["t"]])).toEqual([{ kind: "endTurn" }]);
    expect(rules.readMove([["f", 1, 2], ["s", 3]])).toEqual([
      { kind: "fortify", from: 1, to: 2 },
      { kind: "shift", armies: 3 },
    ]);
    for (const bad of [[], [["t"], ["t"], ["t"]], [["p", 1.5, 1]], [["q"]], [["p", "1", 1]], ["t"], [{ kind: "endTurn" }]]) {
      expect(rules.readMove(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it("plays a whole game out by sensible presses sent as a browser sends them, the dice the server's own", () => {
    const random = seeded(4);
    let game = rules.start(10, 3, { setup })!;
    let presses = 0;
    while (rules.toPlay(game) !== null && presses < 20000) {
      const move = sensibleTenkaMove(game, random);
      const read = rules.readMove(sent([move]));
      expect(read).toEqual([move]);
      game = rules.play(game, read!)!;
      expect(game).not.toBeNull();
      presses += 1;
    }
    expect(rules.toPlay(game)).toBeNull();
    expect(rules.winners(game).length).toBeGreaterThan(0);
    expect(rules.moveCount(game)).toBe(presses);
    expect(rules.encode(rules.decode(rules.encode(game))!)).toBe(rules.encode(game));
  });

  it("refuses a press that would run on into the next player's turn, and a move the rules refuse", () => {
    const random = seeded(9);
    let game = rules.start(10, 2, { setup })!;
    // On to the first fortifying step: the only point a turn can end.
    while (game.phase !== "fortify") game = rules.play(game, [sensibleTenkaMove(game, random)])!;
    const seat = game.toPlay;
    const ended = rules.play(game, [{ kind: "endTurn" }])!;
    expect(ended.toPlay).not.toBe(seat);
    const theirs = ended.phase === "reinforce" ? tenkaMoves(ended).find((move) => move.kind === "place") : undefined;
    expect(theirs).toBeDefined();
    expect(rules.play(game, [{ kind: "endTurn" }, theirs!])).toBeNull();
    expect(rules.play(game, [{ kind: "attack", from: 0, to: 1, dice: 3 }])).toBeNull();
  });
});

describe("Mexican Train on several devices", () => {
  const rules = ONLINE_GAMES.mexicanTrain;
  const setup = { seed: 20260930, options: { length: "short", doubles: "one", mexican: "any" } };

  it("is dealt from the seed and house rules its set-up sent, at every set and table it offers, and from nothing else", () => {
    for (const size of rules.sizes) {
      for (const count of rules.counts) {
        const game = rules.start(size, count, { setup })!;
        expect(game, `${size} for ${count}`).not.toBeNull();
        expect(rules.encode(rules.decode(rules.encode(game))!)).toBe(rules.encode(game));
        expect(rules.moveCount(game)).toBe(0);
        expect(rules.toPlay(game)).toBe(0);
      }
    }
    expect(rules.start(12, 3)).toBeNull();
    expect(rules.start(12, 3, { setup: { ...setup, seed: 0 } })).toBeNull();
    expect(rules.start(12, 3, { setup: { ...setup, seed: 2.5 } })).toBeNull();
    expect(rules.start(12, 3, { setup: { ...setup, options: { ...setup.options, doubles: "many" } } })).toBeNull();
    expect(rules.start(11, 3, { setup })).toBeNull();
    expect(rules.start(12, 9, { setup })).toBeNull();
    const withComputer = rules.start(12, 3, { setup, computers: [2] })!;
    expect(withComputer.computers).toEqual([false, false, true]);
    expect(withComputer.options.length).toBe("short");
  });

  it("reads a tile laid, a draw, a pass or the next round, and nothing else", () => {
    expect(rules.readMove({ kind: "play", tile: 17, train: 2 })).toEqual({ kind: "play", tile: 17, train: 2 });
    expect(rules.readMove({ kind: "draw" })).toEqual({ kind: "draw" });
    expect(rules.readMove({ kind: "next", tile: 3 })).toEqual({ kind: "next" });
    for (const bad of [{ kind: "play", tile: -1, train: 0 }, { kind: "play", tile: 1.5, train: 0 }, { kind: "play", tile: 3 }, { kind: "play", tile: 300, train: 0 }, { kind: "deal" }]) {
      expect(rules.readMove(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it("plays a whole short game out by the computer's moves sent as a browser sends them, and names the winners", () => {
    let game = rules.start(9, 3, { setup, computers: [0, 1, 2] })!;
    const play = computerPlayOf("mexicanTrain")!;
    let moves = 0;
    while (rules.toPlay(game) !== null && moves < 20000) {
      const move = play.move(game, game.toPlay, "computer");
      const read = rules.readMove(JSON.parse(JSON.stringify(move)));
      expect(read).toEqual(move);
      game = rules.play(game, read!)!;
      expect(game).not.toBeNull();
      moves += 1;
    }
    expect(rules.toPlay(game)).toBeNull();
    expect(rules.winners(game).length).toBeGreaterThan(0);
    expect(rules.moveCount(game)).toBe(moves);
    expect(rules.encode(rules.decode(rules.encode(game))!)).toBe(rules.encode(game));
  });

  it("refuses a tile not in the hand of the seat to play, and a draw while a tile can be laid", () => {
    const game = rules.start(12, 2, { setup })!;
    const theirs = game.hands[1][0]!;
    expect(rules.play(game, { kind: "play", tile: theirs, train: 0 })).toBeNull();
    expect(rules.play(game, { kind: "next" })).toBeNull();
    const offered = rules.computers!.seat("computer");
    expect(offered).toEqual({ memberId: null, name: "Computer" });
    expect(rules.computers!.levelOf(offered)).toBe("computer");
  });
});

describe("Hitotsu on several devices", () => {
  const rules = ONLINE_GAMES.hitotsu;
  const options = { stacking: "any", jumpIn: true, sevenZero: true, drawToMatch: false, wildFour: "challenge", deal: 5 };
  const setup = { seed: 20260930, options };

  it("is dealt from the seed and house rules its set-up sent, at every length and table it offers, with jumping in taken off", () => {
    for (const size of rules.sizes) {
      for (const count of rules.counts) {
        const game = rules.start(size, count, { setup })!;
        expect(game, `${size} for ${count}`).not.toBeNull();
        expect(game.options.jumpIn).toBe(false);
        expect(rules.encode(rules.decode(rules.encode(game))!)).toBe(rules.encode(game));
        expect(rules.moveCount(game)).toBe(0);
        expect(rules.toPlay(game)).not.toBeNull();
      }
    }
    expect(rules.start(500, 3)).toBeNull();
    expect(rules.start(500, 3, { setup: { ...setup, seed: 0 } })).toBeNull();
    expect(rules.start(500, 3, { setup: { ...setup, options: { ...options, stacking: "always" } } })).toBeNull();
    expect(rules.start(300, 3, { setup })).toBeNull();
    expect(rules.start(500, 9, { setup })).toBeNull();
    expect(rules.start(500, 3, { setup, computers: [2] })!.computers).toEqual([false, false, true]);
  });

  it("reads a card played, a draw, a pass, a take and a challenge, and never a jump", () => {
    expect(rules.readMove({ play: "WW1", colour: "R", call: true })).toEqual({ play: "WW1", colour: "R", call: true });
    expect(rules.readMove({ draw: true })).toEqual({ draw: true });
    expect(rules.readMove({ challenge: true })).toEqual({ challenge: true });
    for (const bad of [{ jump: "R50", seat: 1 }, { play: "X99" }, { play: "R50", colour: "P" }, { draw: 1 }]) {
      expect(rules.readMove(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it("plays a whole game out by the computer's moves sent as a browser sends them, and names the winners", () => {
    let game = rules.start(1, 4, { setup, computers: [0, 1, 2, 3] })!;
    const play = computerPlayOf("hitotsu")!;
    let moves = 0;
    while (rules.toPlay(game) !== null && moves < 5000) {
      const seat = rules.toPlay(game)!;
      expect(play.move(game, (seat + 1) % 4, "computer")).toBeNull();
      const move = play.move(game, seat, "computer");
      const read = rules.readMove(JSON.parse(JSON.stringify(move)));
      expect(read).toEqual(move);
      game = rules.play(game, read!)!;
      expect(game).not.toBeNull();
      moves += 1;
    }
    expect(rules.toPlay(game)).toBeNull();
    expect(rules.winners(game).length).toBeGreaterThan(0);
    expect(rules.moveCount(game)).toBe(moves);
    expect(rules.computers!.levelOf(rules.computers!.seat("computer"))).toBe("computer");
  });
});
