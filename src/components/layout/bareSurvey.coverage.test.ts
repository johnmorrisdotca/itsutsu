import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { isSettingKind } from "@/lib/catalogue/gameSettings";
import { PARTY_PLAY_GAMES } from "@/lib/gomoku/party/partyGames";
import { CASUAL_SLUGS, GAME_SLUGS, PARTY_SLUGS, PUZZLE_SLUGS } from "@/lib/gomoku/slugs.data";

/**
 * EVERY PLAY IS IN THE SURVEY THAT HOLDS JUST THE BOARD TO A DESK'S WINDOW.
 *
 * John, 2026-09-29: "is so big we see scrollbars in desktop. It should
 * probably be slightly less." `e2e/bare-board.spec.ts` opens every play as
 * just the board at 1280×800 and 1920×1080 and fails when the modal scrolls or
 * leaves an empty column. A survey is only as good as its list, and a new
 * puzzle or table added without joining it would ship a modal nobody measured,
 * so the list is held here to the catalogue: every puzzle with an address of
 * its own, every party and card table, and every game played round a table.
 */
const SPEC = readFileSync("e2e/bare-board.spec.ts", "utf8");
const SURVEY = SPEC.slice(SPEC.indexOf("const SURVEYED_PUZZLES"));

describe("the just-the-board survey covers every play", () => {
  it("names every puzzle with an address of its own", () => {
    const puzzles = Object.entries(PUZZLE_SLUGS)
      .filter(([kind]) => !isSettingKind(kind))
      .map(([, slug]) => slug);
    expect(puzzles.length).toBeGreaterThan(10);
    const missing = puzzles.filter((slug) => !SURVEY.includes(`"${slug}"`) && !SURVEY.includes(`/games/${slug}/play`));
    expect(missing, "a puzzle whose just-the-board modal nothing measures: add it to SURVEYED_PUZZLES in e2e/bare-board.spec.ts").toEqual([]);
  });

  it("names every party and card table, and every game played round a table", () => {
    const tables = [...Object.values(PARTY_SLUGS), ...PARTY_PLAY_GAMES.map((variant) => GAME_SLUGS[variant])];
    const missing = tables.filter((slug) => !SURVEY.includes(`table("${slug}"`));
    expect(missing, "a table whose just-the-board modal nothing measures: add a table(...) line to SURVEY in e2e/bare-board.spec.ts").toEqual([]);
  });

  it("names every casual game", () => {
    const missing = Object.values(CASUAL_SLUGS).filter((slug) => !SURVEY.includes("CASUAL_SLUGS") && !SURVEY.includes(`casual("${slug}"`));
    expect(missing, "a casual game whose just-the-board modal nothing measures: add it to SURVEY in e2e/bare-board.spec.ts").toEqual([]);
  });

  it("names the practice board and a live game", () => {
    expect(SURVEY).toContain('name: "the practice board"');
    expect(SURVEY).toContain('name: "a live game"');
  });
});
