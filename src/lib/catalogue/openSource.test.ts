import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { EVERY_GAME_KEY } from "./gameKeys";
import { OPEN_SOURCE_PACKAGES, openSourceOf, openSourceVersion, type OpenSourcePackage } from "./openSource";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };

describe("the open-source credit under a game", () => {
  it("names only packages this site depends on, each at the exact version it pins", () => {
    for (const which of Object.keys(OPEN_SOURCE_PACKAGES) as OpenSourcePackage[]) {
      const version = openSourceVersion(which);
      expect(version, which).toMatch(/^\d+\.\d+\.\d+$/);
      expect(pkg.dependencies[`@johnmorrisdotca/${which}`], which).toBe(version);
    }
  });

  it("credits every game a package plays, and every package a game here runs on", () => {
    // Each game package the site depends on (bar Tane, seeded randomness under several games, and Korokoro, on the dice page) is credited under some game.
    const credited = new Set(EVERY_GAME_KEY.map(openSourceOf).filter((one) => one !== null));
    const games = Object.keys(pkg.dependencies)
      .filter((name) => name.startsWith("@johnmorrisdotca/"))
      .map((name) => name.slice("@johnmorrisdotca/".length))
      .filter((name) => !["tane", "korokoro"].includes(name));
    for (const name of games) expect(credited.has(name as OpenSourcePackage), `${name} is credited under no game`).toBe(true);
    expect(openSourceOf("cube")).toBe("kyuubu");
    expect(openSourceOf("mexicanTrain")).toBe("domino");
    expect(openSourceOf("gomojiKana")).toBe("kotoba");
    expect(openSourceOf("hearts" as never)).toBe("toranpu");
  });
});
