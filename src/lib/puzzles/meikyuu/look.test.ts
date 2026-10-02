import { describe, expect, it } from "vitest";

import { contrast } from "@/lib/pieces/colourMath";

import { FRAME_LIST, INK_LIST, INKS, LOOK_RULES, PAPER_LIST, PAPERS, THEME_LIST, THEMES } from "./look.constants";
import { choiceFrom, choiceOfTheme, cleanChoice, DEFAULT_CHOICE, isDefaultChoice, isReadable, readingOf, resolveFrame, resolveLook, themeOf, type LookChoice } from "./look";

describe("Meikyuu's colours stay readable", () => {
  it("whatever frame, paper and ink are chosen together: every one of the combinations passes every rule", () => {
    const failures: string[] = [];
    for (const paper of PAPER_LIST) {
      for (const ink of INK_LIST) {
        // The frame does not touch the maze, so it is not part of the product; one stands for all (the frame test below).
        const look = resolveLook({ frame: "wood", paper, ink });
        if (!isReadable(look)) failures.push(`${ink} on ${paper}: ${JSON.stringify(readingOf(look))}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("holds the numbers the brief names: walls 4.5:1 on the paper, the line 3:1 on the paper and the walls", () => {
    expect(LOOK_RULES.wall).toBe(4.5);
    expect(LOOK_RULES.trail).toBe(3);
    for (const paper of PAPER_LIST) {
      for (const ink of INK_LIST) {
        const look = resolveLook({ frame: "wood", paper, ink });
        expect(contrast(look.wall, look.paper), `${ink} walls on ${paper}`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(look.trail, look.paper), `${ink} line on ${paper}`).toBeGreaterThanOrEqual(3);
        expect(contrast(look.trail, look.wall), `${ink} line against its walls on ${paper}`).toBeGreaterThanOrEqual(3);
        expect(contrast(look.start, look.paper), `${ink} start on ${paper}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps the colours it was asked for where they already read, and says nothing was adjusted", () => {
    const look = resolveLook(DEFAULT_CHOICE);
    expect(look).toMatchObject({ paper: "#fbf8f1", wall: "#1f2320", ring: "#a98954", trail: "#2e8b57", start: "#2f7a4f", goal: "#e0b43b", adjusted: false });
    for (const id of THEME_LIST) {
      const choice = choiceOfTheme(id);
      expect(resolveLook(choice).adjusted, `${THEMES[id].label} is made to need no adjusting`).toBe(false);
    }
  });

  it("flips a dark ink on a dark paper and a light ink on a light one, and says so", () => {
    const dark = resolveLook({ frame: "wood", paper: "midnight", ink: "navy" });
    expect(dark.adjusted).toBe(true);
    expect(contrast(dark.wall, PAPERS.midnight.colour)).toBeGreaterThanOrEqual(4.5);
    expect(dark.wall).not.toBe(INKS.navy.wall);
    const light = resolveLook({ frame: "wood", paper: "white", ink: "moon" });
    expect(light.adjusted).toBe(true);
    expect(contrast(light.wall, PAPERS.white.colour)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the goal apart from the line it ends", () => {
    for (const paper of PAPER_LIST) {
      for (const ink of INK_LIST) {
        const look = resolveLook({ frame: "wood", paper, ink });
        expect(contrast(look.goal, look.trail), `${ink} on ${paper}`).toBeGreaterThanOrEqual(LOOK_RULES.goalFromTrail);
      }
    }
  });

  it("offers no paper in the middle of the scale, where neither a dark wall nor a light one can be seen", () => {
    for (const paper of PAPER_LIST) {
      const colour = PAPERS[paper].colour;
      const best = Math.max(contrast(colour, "#1f2320"), contrast(colour, "#f3efe4"));
      expect(best, `${paper} paper`).toBeGreaterThanOrEqual(LOOK_RULES.wall);
    }
  });
});

describe("Meikyuu's looks, as choices", () => {
  it("has a ready-made set for every name, made of choices that exist, and the default is the first", () => {
    expect(THEME_LIST[0]).toBe("wood");
    for (const id of THEME_LIST) {
      const { frame, paper, ink } = choiceOfTheme(id);
      expect(FRAME_LIST).toContain(frame);
      expect(PAPER_LIST).toContain(paper);
      expect(INK_LIST).toContain(ink);
      expect(themeOf(choiceOfTheme(id))).toBe(id);
    }
    expect(isDefaultChoice(choiceOfTheme("wood"))).toBe(true);
  });

  it("calls a mix of the player's own by no set's name", () => {
    expect(themeOf({ frame: "red", paper: "cream", ink: "ink" })).toBeNull();
  });

  it("reads stored text and objects for what this site still has, and leaves the rest", () => {
    expect(cleanChoice(JSON.stringify({ frame: "pink", paper: "mint", ink: "ocean" }))).toEqual({ frame: "pink", paper: "mint", ink: "ocean" });
    expect(cleanChoice({ frame: "gone", paper: "mint", ink: 3 })).toEqual({ paper: "mint" });
    expect(cleanChoice({ frame: "toString", paper: "constructor" })).toEqual({});
    expect(cleanChoice("not json")).toEqual({});
    expect(cleanChoice(null)).toEqual({});
    expect(cleanChoice([])).toEqual({});
    const mixed: LookChoice = choiceFrom({ paper: "sky" });
    expect(mixed).toEqual({ frame: "wood", paper: "sky", ink: "ink" });
  });

  it("lights every frame from a corner and shades its rim darker than its wood", () => {
    for (const id of FRAME_LIST) {
      const frame = resolveFrame(id);
      expect(contrast(frame.rim, frame.base), id).toBeGreaterThan(1.2);
    }
  });
});
