import { beforeAll, describe, expect, it } from "vitest";

import { cheatLine } from "./cheat";
import { decodeLayout } from "./code";
import { explosionsAsChosen } from "./explosions";
import { challengesOf } from "./ladder";
import { loadEveryTsunagiLevel, TSUNAGI_SIZES, tsunagiLevelsOf } from "./levels";
import { allJoined, answerOf, joined, linesOfAnswer, noLines, type Lines } from "./lines";

/**
 * CHEAT, and explosions as the player chose them: the two ways a Tsunagi
 * level can be helped (`solveHelp.ts`).
 */
beforeAll(loadEveryTsunagiLevel);

/** One level of each kind of board there is: plain, bridges, walls, waypoints, wrap, hexagon. */
function sampleLevels() {
  const wanted = ["plain", "bridges", "walls", "waypoints", "wrap", "hexagon"];
  const found = new Map<string, { size: number; code: string; answer: string }>();
  for (const size of TSUNAGI_SIZES) {
    for (const [code, answer] of tsunagiLevelsOf(size)) {
      const on = challengesOf(code);
      const kind = on.length === 0 ? "plain" : on.find((each) => wanted.includes(each));
      if (kind !== undefined && !found.has(kind)) found.set(kind, { size, code, answer });
    }
  }
  return [...found.entries()];
}

describe("Cheat", () => {
  it("finds a board of every kind to cheat on", () => {
    expect(sampleLevels().map(([kind]) => kind).sort()).toEqual(["bridges", "hexagon", "plain", "walls", "waypoints", "wrap"]);
  });

  it("draws one line at a time, each the answer's, until the board is solved — on every kind of board", () => {
    for (const [kind, { size, code, answer }] of sampleLevels()) {
      const layout = decodeLayout(code, size)!;
      const lines = linesOfAnswer(layout, answer)!;
      let now: Lines = noLines(layout);
      for (let each = 0; each < layout.ends.length; each += 1) {
        const cheated = cheatLine(layout, now, lines)!;
        expect(cheated, kind).not.toBeNull();
        expect(joined(layout, cheated.lines, cheated.pair), kind).toBe(true);
        now = cheated.lines;
      }
      expect(allJoined(layout, now), kind).toBe(true);
      expect(answerOf(layout, now), kind).toBe(answer);
      // Nothing left to draw.
      expect(cheatLine(layout, now, lines), kind).toBeNull();
    }
  });

  it("cuts back another line in its way, and leaves the rest alone", () => {
    const [, { size, code, answer }] = sampleLevels().find(([kind]) => kind === "plain")!;
    const layout = decodeLayout(code, size)!;
    const lines = linesOfAnswer(layout, answer)!;
    // Pair 1 drawn whole; pair 0 is the first unfinished. A made-up line for pair 2 running into pair 0's cells.
    const into = lines[0]!.find((cell) => layout.cells[cell]! < 0)!;
    const before: Lines = lines.map((line, pair) => (pair === 1 ? line : pair === 2 ? [layout.ends[2]![0], into] : []));
    const cheated = cheatLine(layout, before, lines)!;
    expect(cheated.pair).toBe(0);
    expect(cheated.lines[0]).toEqual(lines[0]);
    expect(cheated.lines[1]).toEqual(lines[1]);
    expect(cheated.lines[2]).toEqual([]);
    // Its input untouched.
    expect(before[2]).toEqual([layout.ends[2]![0], into]);
  });
});

describe("explosions as chosen", () => {
  it("keeps them as made, softens a blast to a boom half as often, or takes them away", () => {
    expect(explosionsAsChosen({ every: 4, blast: true }, "on")).toEqual({ every: 4, blast: true });
    expect(explosionsAsChosen({ every: 4, blast: true }, "soft")).toEqual({ every: 8, blast: false });
    expect(explosionsAsChosen({ every: 3, blast: false }, "soft")).toEqual({ every: 6, blast: false });
    expect(explosionsAsChosen({ every: 4, blast: true }, "off")).toBeNull();
    expect(explosionsAsChosen(null, "on")).toBeNull();
  });
});
