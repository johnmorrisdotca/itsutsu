import { beforeAll, describe, expect, it } from "vitest";

import { challengesOf, isTwist, tsunagiMarks, twistRole } from "./ladder";
import { loadEveryTsunagiLevel, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES, tsunagiLevelsOf } from "./levels";

/**
 * THE LADDER'S TWISTS: a block's 15th teaches a twist and its 16th tests it,
 * bridges first (John: "bridges first"), then walls, and nothing else in a
 * block ever changes for them — levels 1 to 14 stay plain boards.
 */
beforeAll(loadEveryTsunagiLevel);

describe("a board's challenges", () => {
  it("reads waypoints from a lower-case letter and wrap from its segment, and never wrap as a wall", () => {
    expect(challengesOf("A.a.A")).toEqual(["waypoints"]);
    expect(challengesOf("A..A|wrap")).toEqual(["wrap"]);
    expect(challengesOf("A..A|1-2|wrap")).toEqual(["walls", "wrap"]);
  });

  it("reads bridges from a `+`, and walls from a wall list or a blocked cell", () => {
    expect(challengesOf("A..A")).toEqual([]);
    expect(challengesOf("A.+.A")).toEqual(["bridges"]);
    expect(challengesOf("A..A|1-2")).toEqual(["walls"]);
    expect(challengesOf("A.#A")).toEqual(["walls"]);
    expect(challengesOf("A+.#A|0-1")).toEqual(["bridges", "walls"]);
  });

  it("names a 15th that brings something new, a 16th as the test, and nothing for levels 1 to 14", () => {
    const plain = "A..A";
    const layouts = [...Array.from({ length: 14 }, () => plain), "A+.A", "A+.A|0-1"];
    expect(twistRole(layouts, 14)).toBeNull();
    expect(twistRole(layouts, 15)).toEqual({ role: "teaches", challenges: ["bridges"], newOnes: ["bridges"] });
    expect(twistRole(layouts, 16)).toEqual({ role: "tests", challenges: ["bridges", "walls"], newOnes: ["walls"] });
  });
});

describe.each(TSUNAGI_SIZES.map((size) => [size, size]))("the %i×%i ladder", (size) => {
  const layouts = () => tsunagiLevelsOf(size).map(([layout]) => layout);

  it("never has a level use a twist before the 15th that teaches it", () => {
    const all = layouts();
    const taught = new Set<string>();
    all.forEach((layout, at) => {
      const role = twistRole(all, at + 1);
      for (const twist of challengesOf(layout)) {
        if (!taught.has(twist)) expect(role?.role, `level ${at + 1} uses ${twist} before it is taught`).toBe("teaches");
        taught.add(twist);
      }
    });
  });

  it("has twists only at a block's 15th and 16th, always the two together", () => {
    const all = layouts();
    all.forEach((layout, at) => {
      if (!isTwist(layout)) return;
      const slot = (at % 16) + 1;
      expect(slot, `level ${at + 1}`).toBeGreaterThanOrEqual(15);
      const partner = slot === 15 ? all[at + 1]! : all[at - 1]!;
      expect(isTwist(partner), `level ${at + 1}'s partner`).toBe(true);
    });
  });

  it("teaches bridges, walls, waypoints and wrap in that order, each first at a 15th that says it is new", () => {
    const all = layouts();
    // Bridges and walls at every size; waypoints and wrap wherever their generators could make a lesson (not wrap at 10×10).
    const found = (["bridges", "walls", "waypoints", "wrap"] as const).map((twist) => ({ twist, at: all.findIndex((layout) => challengesOf(layout).includes(twist)) }));
    for (const { twist, at } of found.slice(0, 2)) expect(at, `a ${twist} lesson`).toBeGreaterThanOrEqual(0);
    const firsts = found.filter(({ at }) => at >= 0);
    for (const { twist, at } of firsts) {
      expect(twistRole(all, at + 1)!.role, twist).toBe("teaches");
      expect(twistRole(all, at + 1)!.newOnes, twist).toContain(twist);
    }
    for (let each = 1; each < firsts.length; each += 1) expect(firsts[each]!.at, firsts[each]!.twist).toBeGreaterThan(firsts[each - 1]!.at);
  });

  it("marks every level 1 to 5", () => {
    for (let level = 1; level <= TSUNAGI_LEVEL_COUNTS[size]!; level += 1) {
      const marks = tsunagiMarks(size, level);
      expect(marks).toBeGreaterThanOrEqual(1);
      expect(marks).toBeLessThanOrEqual(5);
    }
  });
});
