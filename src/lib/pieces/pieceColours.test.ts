import { describe, expect, it } from "vitest";

import { BOARD_THEMES, FELTS, STONE_SETS } from "@/components/board/Board.constants";

import { contrast, distance } from "./colourMath";
import { PIECE_COLOURS, PIECE_COLOUR_LIST, TOO_ALIKE, edgeOf, nextFreeColour, outlineOf, pieceFace } from "./pieceColours";
import { SIDE_FLAT, refusalWords, seatColourRefusal, seatColoursFrom, sideFlat } from "./seatColours";

/** Every #rrggbb a surface's CSS names: each stop of a board's gradient is somewhere a piece may stand. */
function hexesIn(css: string): string[] {
  return [...css.matchAll(/#[0-9a-f]{6}\b/gi)].map((match) => match[0].toLowerCase());
}

/**
 * EVERY SURFACE ON THE SITE A PIECE MAY STAND ON, read from where each is
 * decided: the wood and paper board themes, the felts, the puzzles' white
 * paper, and the page itself in dark mode, where a piece is drawn beside a
 * name in a turn line.
 */
const SURFACES: Record<string, string[]> = {
  ...Object.fromEntries(Object.entries(BOARD_THEMES).map(([name, theme]) => [`board ${name}`, hexesIn(theme.surface)])),
  ...Object.fromEntries(Object.entries(FELTS).map(([name, felt]) => [`felt ${name}`, hexesIn(felt.surface)])),
  "puzzle paper": ["#ffffff"],
  "page, light": ["#f5f1e8"],
  "page, dark": ["#1c1b19"],
};

describe("the piece palette", () => {
  it("offers eight to ten solid colours, each named, with a kanji and a letter of its own", () => {
    expect(PIECE_COLOUR_LIST.length).toBeGreaterThanOrEqual(8);
    expect(PIECE_COLOUR_LIST.length).toBeLessThanOrEqual(10);
    const letters = PIECE_COLOUR_LIST.map((colour) => PIECE_COLOURS[colour].letter);
    expect(new Set(letters).size, "two colours share a letter").toBe(letters.length);
    for (const colour of PIECE_COLOUR_LIST) {
      const { label, kanji, flat } = PIECE_COLOURS[colour];
      expect(label.length).toBeGreaterThan(2);
      expect(kanji.length).toBeGreaterThan(0);
      expect(flat).toMatch(/^#[0-9a-f]{6}$/);
      expect(pieceFace(colour)).toContain(flat);
    }
  });

  it("writes a number on every colour in an ink that reads (4.5:1, WCAG's text contrast)", () => {
    for (const colour of PIECE_COLOUR_LIST) {
      const { flat, ink } = PIECE_COLOURS[colour];
      expect(contrast(flat, ink), `${colour}: its ink on it`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("stands off every board, felt, paper and page: by its colour, or by its edge or its hairline where its colour sinks in", () => {
    expect(Object.keys(SURFACES).length).toBeGreaterThan(8);
    const sinks: string[] = [];
    for (const colour of PIECE_COLOUR_LIST) {
      const { flat } = PIECE_COLOURS[colour];
      for (const [surface, stops] of Object.entries(SURFACES)) {
        for (const stop of stops) {
          // A colour well away from its ground stands off it (ΔE, as two pieces are judged); failing that, its edge must show at 3:1, WCAG's for a shape's boundary.
          const edged = contrast(edgeOf(colour), stop) >= 3 || contrast(outlineOf(colour), stop) >= 3;
          if (distance(flat, stop) < TOO_ALIKE && !edged) sinks.push(`${colour} on ${surface} (${stop})`);
        }
      }
    }
    expect(sinks, "a piece that would disappear into the board it stands on").toEqual([]);
  });

  it("keeps every two colours further apart than too alike, so only the same colour twice is refused between them", () => {
    const close: string[] = [];
    for (const [at, a] of PIECE_COLOUR_LIST.entries()) {
      for (const b of PIECE_COLOUR_LIST.slice(at + 1)) {
        if (distance(PIECE_COLOURS[a].flat, PIECE_COLOURS[b].flat) < TOO_ALIKE) close.push(`${a}–${b}`);
      }
    }
    expect(close).toEqual([]);
  });

  it("names the ordinary stones' colours near enough to judge a clash", () => {
    // The classic set every account starts with: its darkest and lightest stops are the stones' own.
    expect(distance(SIDE_FLAT.black, "#1a1a1a")).toBeLessThan(2);
    expect(STONE_SETS.classic.white).toContain(SIDE_FLAT.white);
  });
});

describe("the colour each seat chooses", () => {
  it("keeps only colours the palette offers", () => {
    expect(seatColoursFrom("red", "nonsense")).toEqual({ black: "red" });
    expect(seatColoursFrom(null, "shell")).toEqual({ white: "shell" });
    expect(seatColoursFrom(undefined, undefined)).toEqual({});
  });

  it("draws an unchosen seat in its ordinary stone", () => {
    expect(sideFlat("black", {})).toBe(SIDE_FLAT.black);
    expect(sideFlat("white", { white: "blue" })).toBe(PIECE_COLOURS.blue.flat);
  });

  it("refuses the other seat's colour, and a colour too like the other seat's ordinary stones, offering the next free one", () => {
    const same = seatColourRefusal("white", "red", { black: "red" });
    expect(same?.reason).toBe("same");
    expect(same?.offer).not.toBe("red");
    expect(refusalWords(same!)).toContain("already plays in that colour");
    // Ink Black against the ordinary black stones; Shell White against the ordinary white.
    expect(seatColourRefusal("white", "ink", {})?.reason).toBe("alike");
    expect(seatColourRefusal("black", "shell", {})?.reason).toBe("alike");
    // Anything else, and taking the colour back, is fine.
    expect(seatColourRefusal("white", "blue", { black: "red" })).toBeNull();
    expect(seatColourRefusal("white", null, { black: "red" })).toBeNull();
    expect(seatColourRefusal("black", "ink", { white: "shell" })).toBeNull();
  });

  it("offers the next colour round the palette that clashes with nobody", () => {
    expect(nextFreeColour("red", [PIECE_COLOURS.red.flat])).toBe("vermilion");
    expect(nextFreeColour("shell", [PIECE_COLOURS.shell.flat])).toBe("red");
  });
});

describe("a board nobody dressed", () => {
  it("is drawn from exactly the tokens it always was, so no picture changes", async () => {
    const { seatStones } = await import("@/components/board/seatStones");
    const { tableMarbles } = await import("./tableColours");
    const { PARTY_MARBLES } = await import("@/components/party/party.constants");
    // The same objects, not equal copies: the drawing is handed what it was handed before.
    expect(seatStones(STONE_SETS.classic, undefined)).toBe(STONE_SETS.classic);
    expect(seatStones(STONE_SETS.classic, {})).toBe(STONE_SETS.classic);
    const marbles = tableMarbles(PARTY_MARBLES, []);
    marbles.forEach((marble, seat) => expect(marble).toBe(PARTY_MARBLES[seat]));
    // A chosen colour replaces its side only.
    const dressed = seatStones(STONE_SETS.classic, { white: "blue" });
    expect(dressed.black).toBe(STONE_SETS.classic.black);
    expect(dressed.white).toBe(pieceFace("blue"));
    expect(tableMarbles(PARTY_MARBLES, [null, "green"])[1]?.fill).toBe(PIECE_COLOURS.green.flat);
  });
});
