import { describe, expect, it } from "vitest";

import { NO_HANDICAP, NO_HEAD_START } from "@/lib/gomoku/gomoku.constants";
import type { GameMove } from "@/lib/history/gameHistory.types";
import { hexColumn, sgfFileName, sgfLetter, sgfRefusal, writeSgf } from "./sgf";
import type { SgfSource } from "./sgf.types";

/**
 * The writer, against files checked by hand.
 *
 * Every expected string below was written out point by point from the board —
 * column letter first, then row letter, counted from the top-left — and not
 * pasted from the writer's own output, which would test nothing but that it
 * agrees with itself.
 */

function move(number: number, row: number, col: number, stone: "black" | "white", kind = "place"): GameMove {
  return { number, row, col, stone, kind, createdAt: "2026-09-10T12:00:00.000Z" };
}

function pass(number: number, stone: "black" | "white"): GameMove {
  return move(number, -1, -1, stone, "pass");
}

function game(overrides: Partial<SgfSource>): SgfSource {
  return {
    variant: "renju",
    size: 15,
    winLength: 5,
    obstacles: "none",
    opener: "black",
    opening: "free",
    handicap: NO_HANDICAP,
    headStart: NO_HEAD_START,
    seed: 0,
    drawLimit: "none",
    status: "finished",
    result: "black",
    blackName: "Hanako",
    whiteName: "Taro",
    moveTimeMs: null,
    moves: [],
    ...overrides,
  };
}

function text(source: SgfSource, playedOn: string | null = "2026-09-10"): string {
  const written = writeSgf(source, playedOn);
  if (written.kind !== "written") throw new Error(`refused: ${written.reason}`);
  return written.text;
}

/**
 * A reader small enough to trust by eye: nodes in order, each a map of
 * property to values, with SGF's backslash escape undone. One game tree, no
 * variations — which is all the writer ever makes.
 */
function readSgf(source: string): Record<string, string[]>[] {
  const nodes: Record<string, string[]>[] = [];
  let at = 0;
  let node: Record<string, string[]> | null = null;
  while (at < source.length) {
    const here = source[at] as string;
    if (here === ";") {
      node = {};
      nodes.push(node);
      at += 1;
    } else if (/[A-Z]/.test(here) && node !== null) {
      let id = "";
      while (/[A-Z]/.test(source[at] ?? "")) id += source[at++];
      const values: string[] = [];
      while (source[at] === "[") {
        at += 1;
        let value = "";
        while (source[at] !== "]") {
          if (source[at] === "\\") at += 1;
          value += source[at++];
        }
        at += 1;
        values.push(value);
      }
      node[id] = values;
    } else {
      at += 1;
    }
  }
  return nodes;
}

describe("a Renju game", () => {
  const renju = game({
    opening: "rif",
    moves: [
      move(1, 7, 7, "black"),
      move(2, 6, 8, "white"),
      move(3, 8, 8, "black"),
      move(4, 6, 6, "white"),
      move(5, 8, 6, "black"),
      move(6, 8, 7, "white"),
      move(7, 6, 7, "black"),
    ],
  });

  it("is the file checked by hand", () => {
    expect(text(renju)).toBe(
      "(;FF[4]GM[4]CA[UTF-8]SZ[15]PB[Hanako]PW[Taro]DT[2026-09-10]RE[B+]RU[Renju]" +
        "GC[Opening: RIF. The classic renju opening: centre, 3×3, 5×5, then white may swap.]\n" +
        ";B[hh];W[ig];B[ii];W[gg];B[gi];W[hi];B[hg])\n",
    );
  });

  it("reads back as the same game", () => {
    const [root, ...moves] = readSgf(text(renju));
    expect(root?.GM).toEqual(["4"]);
    expect(root?.SZ).toEqual(["15"]);
    expect(root?.RE).toEqual(["B+"]);
    expect(moves.map((one) => one.B?.[0] ?? `W:${one.W?.[0]}`)).toEqual(["hh", "W:ig", "ii", "W:gg", "gi", "W:hi", "hg"]);
  });

  it("calls a freestyle, standard, Omok or Caro game by its own rule set, and a draw Draw", () => {
    expect(readSgf(text(game({ variant: "freestyle" })))[0]?.RU).toEqual(["Freestyle"]);
    expect(readSgf(text(game({ variant: "standard" })))[0]?.RU).toEqual(["Standard"]);
    expect(readSgf(text(game({ variant: "omok" })))[0]?.RU).toEqual(["Omok"]);
    expect(readSgf(text(game({ variant: "caro" })))[0]?.RU).toEqual(["Caro"]);
    expect(readSgf(text(game({ result: "draw" })))[0]?.RE).toEqual(["Draw"]);
    expect(readSgf(text(game({ result: "abandoned" })))[0]?.RE).toEqual(["Void"]);
  });

  it("says in the game comment what it was played under that SGF has no property for", () => {
    const root = readSgf(
      text(
        game({
          variant: "freestyle",
          obstacles: "hoshi",
          drawLimit: "half",
          handicap: { ...NO_HANDICAP, stone: "black", doubleThree: true, overline: true, secondStoneExclusion: 2 },
        }),
      ),
    )[0];
    const comment = root?.GC?.[0] ?? "";
    expect(comment).toContain("Handicap on Black: No double three, No overline, second stone outside the central 5×5.");
    expect(comment).toContain("Star blocks: The star points are sealed off.");
    expect(comment).toContain("Length: Half the board.");
  });

  it("names White as first to play when White opened", () => {
    expect(readSgf(text(game({ variant: "freestyle", opener: "white" })))[0]?.PL).toEqual(["W"]);
    expect(readSgf(text(game({})))[0]?.PL).toBeUndefined();
  });
});

describe("an Othello game", () => {
  const othello = game({
    variant: "reversi",
    size: 8,
    result: "white",
    blackName: "Ann",
    whiteName: "Ben",
    moves: [move(1, 2, 3, "black"), move(2, 2, 2, "white"), pass(3, "black"), move(4, 4, 2, "white")],
  });

  it("is the file checked by hand, with Othello's four discs set up and the pass said rather than written", () => {
    expect(text(othello, "2026-09-11")).toBe(
      "(;FF[4]GM[2]CA[UTF-8]SZ[8]PB[Ann]PW[Ben]DT[2026-09-11]RE[W+]" +
        "GC[1 turn went by without a stone. SGF has no pass for this game, so none is written, and the colour that did not pass moves twice running.]" +
        "AB[ed][de]AW[dd][ee]\n" +
        ";B[dc];W[cc];W[ce])\n",
    );
  });

  it("starts from d4 and e5 white, d5 and e4 black, as Othello does", () => {
    const [root] = readSgf(text(othello));
    // d4 is column d, row 4 from the top: dd. e4 is ed.
    expect(root?.AW).toEqual(["dd", "ee"]);
    expect(root?.AB).toEqual(["ed", "de"]);
  });

  it("writes the small and big boards as Othello on their own size, centred", () => {
    const [six] = readSgf(text(game({ variant: "miniReversi", size: 6, moves: [] })));
    expect(six?.SZ).toEqual(["6"]);
    expect(six?.AW).toEqual(["cc", "dd"]);
    const [ten] = readSgf(text(game({ variant: "grandReversi", size: 10, moves: [] })));
    expect(ten?.AB).toEqual(["fe", "ef"]);
  });
});

describe("a Go game", () => {
  const passes = [move(1, 4, 4, "black"), move(2, 2, 2, "white"), pass(3, "black"), pass(4, "white")];

  it("writes a pass as Go's empty move and scores a counted game with komi", () => {
    const file = text(game({ variant: "go", size: 9, result: "white", blackName: "Ann", whiteName: "Ben", moves: passes }), "2026-09-12");
    // One stone each, the rest dame: 1 against 1 + 6.5.
    expect(file).toBe(
      "(;FF[4]GM[1]CA[UTF-8]SZ[9]PB[Ann]PW[Ben]DT[2026-09-12]RE[W+6.5]KM[6.5]" +
        "GC[Scored by area: every stone on the board and every empty point only one colour surrounds. " +
        "Simple ko; suicide is not allowed; stones left on the board at the end count as alive.]\n" +
        ";B[ee];W[cc];B[];W[])\n",
    );
  });

  it("gives no score for a game the count did not decide", () => {
    const resigned = game({ variant: "go", size: 9, result: "black", moves: passes.slice(0, 2) });
    expect(readSgf(text(resigned))[0]?.RE).toEqual(["B+"]);
  });
});

describe("a Hex game", () => {
  it("writes Hex's own points, column letter and row number from the top, and its pass as a word", () => {
    const hex = game({
      variant: "hex",
      size: 11,
      opening: "swap",
      moves: [move(1, 0, 0, "black"), move(2, 10, 10, "white"), move(3, 5, 1, "black"), pass(4, "white")],
    });
    const [root, ...moves] = readSgf(text(hex));
    expect(root?.GM).toEqual(["11"]);
    expect(root?.GC?.[0]).toContain("Opening: Swap.");
    expect(moves).toEqual([{ B: ["a1"] }, { W: ["k11"] }, { B: ["b6"] }, { W: ["pass"] }]);
  });

  it("counts columns past z the way Hex's definition does", () => {
    expect([0, 25, 26, 27, 51, 52].map(hexColumn)).toEqual(["a", "z", "aa", "ab", "az", "ba"]);
  });
});

describe("a turn lost on time", () => {
  const forfeit = (number: number, stone: "black" | "white") => move(number, -1, -1, stone, "forfeit");
  const timedOut = game({
    moveTimeMs: 86_400_000,
    moves: [move(1, 7, 7, "black"), forfeit(2, "white"), move(3, 7, 8, "black"), move(4, 8, 8, "white")],
  });

  it("is never written as a pass, and is said in the game comment instead", () => {
    const [root, ...moves] = readSgf(text(timedOut));
    // Black twice running is what happened to the board; B[] or W[] would be a pass nobody made.
    expect(moves).toEqual([{ B: ["hh"] }, { B: ["ih"] }, { W: ["ii"] }]);
    expect(root?.GC?.[0]).toContain(
      "1 turn was lost on time. SGF has no move for a turn lost on time, so none is written, and the other colour moves twice running.",
    );
  });

  it("counts every one of them, and still says nothing about passes", () => {
    const twice = game({ moveTimeMs: 86_400_000, moves: [move(1, 7, 7, "black"), forfeit(2, "white"), move(3, 7, 8, "black"), forfeit(4, "white")] });
    const [root] = readSgf(text(twice));
    expect(root?.GC?.[0]).toContain("2 turns were lost on time.");
    expect(root?.GC?.[0]).not.toContain("without a stone");
  });
});

describe("SGF's point letters", () => {
  it("run a–z, then A–Z, and stop at 52", () => {
    expect([0, 25, 26, 51].map(sgfLetter)).toEqual(["a", "z", "A", "Z"]);
    expect(sgfLetter(52)).toBeNull();
    expect(sgfLetter(-1)).toBeNull();
  });
});

describe("a game that gets no file", () => {
  it("refuses a game SGF has no number for, rather than calling it something it is not", () => {
    for (const variant of ["connect6", "ninuki", "checkers", "dropFour", "classicReversi", "antiReversi", "chess"]) {
      expect(sgfRefusal(game({ variant })), variant).toBe("no-sgf-type");
    }
    expect(writeSgf(game({ variant: "connect6" }), "2026-09-10")).toEqual({ kind: "refused", reason: "no-sgf-type" });
  });

  it("refuses a game still being played", () => {
    expect(sgfRefusal(game({ status: "active" }))).toBe("not-finished");
  });

  it("refuses a freestyle game played to four or six, which is not Gomoku", () => {
    expect(sgfRefusal(game({ variant: "freestyle", winLength: 6 }))).toBe("win-length");
    expect(sgfRefusal(game({ variant: "freestyle", winLength: 5 }))).toBeNull();
  });

  it("refuses a board the game is not played on, and one past SGF's 52", () => {
    expect(sgfRefusal(game({ size: 21 }))).toBe("board-size");
    expect(sgfRefusal(game({ size: 53 }))).toBe("board-size");
    expect(sgfRefusal(game({ variant: "reversi", size: 19 }))).toBe("board-size");
  });

  it("refuses a Go or Othello game carrying a rule the reader would work out wrongly", () => {
    expect(sgfRefusal(game({ variant: "go", size: 9, obstacles: "hoshi" }))).toBe("rules-outside-type");
    expect(sgfRefusal(game({ variant: "reversi", size: 8, handicap: { ...NO_HANDICAP, stone: "white" } }))).toBe("rules-outside-type");
    expect(sgfRefusal(game({ opening: "someday" }))).toBe("rules-outside-type");
  });

  it("refuses a record holding a move no SGF type here can hold", () => {
    expect(sgfRefusal(game({ moves: [{ ...move(1, 7, 7, "black"), from: { row: 7, col: 6 } }] }))).toBe("unreadable-move");
    expect(sgfRefusal(game({ moves: [move(1, 15, 0, "black")] }))).toBe("unreadable-move");
    expect(sgfRefusal(game({ moves: [{ ...move(1, 7, 7, "black"), stone: "grey" }] }))).toBe("unreadable-move");
  });
});

describe("what the file says about the people and the day", () => {
  it("escapes what SGF needs escaped and keeps a name on one line", () => {
    const [root] = readSgf(text(game({ blackName: "Rin ]\\ the\nsecond", whiteName: "" })));
    expect(root?.PB).toEqual(["Rin ]\\ the second"]);
    expect(root?.PW).toBeUndefined();
  });

  it("leaves DT out rather than writing something that is not a whole date", () => {
    expect(readSgf(text(game({}), null))[0]?.DT).toBeUndefined();
    expect(readSgf(text(game({}), "Sept 10"))[0]?.DT).toBeUndefined();
  });

  it("names the file after the game, the players and the day", () => {
    expect(sgfFileName(game({}), "2026-09-10")).toBe("renju-Hanako-vs-Taro-2026-09-10.sgf");
    expect(sgfFileName(game({ variant: "freestyle", blackName: "Mei Ling", whiteName: "a/b:c" }), "2026-09-10")).toBe(
      "gomoku-Mei-Ling-vs-abc-2026-09-10.sgf",
    );
    expect(sgfFileName(game({ variant: "go", whiteName: "" }), null)).toBe("go-Hanako.sgf");
  });
});
