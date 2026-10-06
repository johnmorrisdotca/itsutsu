import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { KARAKURI_GAMES, KARAKURI_GAME_IDS } from "@johnmorrisdotca/karakuri/play";
import { describe, expect, it } from "vitest";

import { GAME_ADDED } from "@/lib/catalogue/gameAdded.data";
import { EVERY_GAME_KEY, RECORDED_GAME_KEYS, gameCopyFor, isCasualKind } from "@/lib/catalogue/gameKeys";
import { openSourceOf } from "@/lib/catalogue/openSource";
import { gameArtPath, gameThumbPath } from "@/lib/gomoku/artwork";
import { speaker } from "@/lib/i18n/i18n";
import { RECORDED_FAMILIES, familyOf, familyPagePath } from "@/lib/gomoku/families";
import { CASUAL_SLUGS, casualPlayPath, gameKeyFor, slugFor } from "@/lib/gomoku/slugs";
import { offlineGameAddresses } from "@/lib/offline/offlineGames";

import { CASUAL_DISPLAY, CASUAL_FAMILY_KEY, CASUAL_KIND_LIST, CASUAL_SPECS, casualKindOfId } from "./casual.constants";
import { CASUAL_ART_FILES, readCasualArtFingerprint } from "./casualArtFingerprint";
import { CASUAL_ART_FINGERPRINT } from "./casualArt.data";
import { casualRulesPage } from "./casualRulesPage";

/**
 * The New Game Gate, for a casual game.
 *
 * `variants.coverage.test.ts`, `puzzles.coverage.test.ts` and
 * `party.coverage.test.ts` hold a rule variant, a puzzle and a party game to
 * what makes it a game a person can find, understand and trust. A casual game
 * (Karakuri's eight: played alone a level at a time, kept only in the browser,
 * never rated, worth no points and no experience; docs/plans/casual-games)
 * is none of them, so this asks every question of the gate that applies to
 * it, in a casual game's terms:
 *
 *  - it IS the package's game: the levels, the way it is played and whether it
 *    runs physics are the package's own, so the site cannot say "five levels"
 *    of a game that has four;
 *  - it has a picture and a thumbnail, taken of the board as it is drawn now;
 *  - it has full copy and a rules page with every section filled;
 *  - it belongs to a family that no award counts, and is never among the games
 *    a record, a ladder, points or XP are kept for;
 *  - it has an address, a front door, rules, a set-up and a play page, waits
 *    on My games while there is something kept, and is kept for offline play;
 *  - it is driven by a browser spec and says the day it arrived.
 *
 * Every question is asked of `CASUAL_KIND_LIST`, so a game listed there is
 * held to all of this before it ships.
 */
const read = (path: string) => readFileSync(path, "utf8");

const browserSpecs = readdirSync("e2e")
  .filter((name) => name.endsWith(".ts") && name !== "casual-screenshots.spec.ts")
  .map((name) => read(join("e2e", name)))
  .join("\n");

describe("every casual game is finished, not just declared", () => {
  it("lists the package's eight, in a list that is the whole of it", () => {
    expect(CASUAL_KIND_LIST).toHaveLength(8);
    expect(new Set(CASUAL_KIND_LIST.map((kind) => CASUAL_SPECS[kind].id))).toEqual(new Set(KARAKURI_GAME_IDS));
  });

  it.each(CASUAL_KIND_LIST)("%s is the package's game of its id, with its levels and its way of being played", (kind) => {
    const spec = CASUAL_SPECS[kind];
    const game = KARAKURI_GAMES[spec.id as keyof typeof KARAKURI_GAMES];
    expect(game, `the package has no game ${spec.id}`).toBeDefined();
    expect(spec.levels, "the levels the site says").toBe(game.levels);
    expect(spec.gesture, "the way the site says it is played").toBe(game.gesture);
    expect(spec.physics, "whether the site says it runs physics").toBe(game.physics);
    expect(casualKindOfId(spec.id)).toBe(kind);
    expect(spec.levels, "at least three levels, so there is a difficulty to step up").toBeGreaterThanOrEqual(3);
  });

  it.each(CASUAL_KIND_LIST)("%s has a picture and a thumbnail in public/art/games", (kind) => {
    expect(existsSync(join(process.cwd(), "public", gameArtPath(kind))), `${kind}: run pnpm screenshots:casual`).toBe(true);
    expect(existsSync(join(process.cwd(), "public", gameThumbPath(kind))), `${kind}: run pnpm screenshots:casual`).toBe(true);
  });

  it("has pictures of the boards as they are drawn now", () => {
    expect(CASUAL_ART_FINGERPRINT).toMatch(/^[0-9a-f]{16}$/);
    expect(
      readCasualArtFingerprint(),
      "A casual game's board is drawn differently from when its picture was taken. Re-take them:\n\n" +
        "    pnpm screenshots:casual\n\n" +
        `(The files watched are ${CASUAL_ART_FILES.join(", ")} — see casualArtFingerprint.ts if one of them should not be.)`,
    ).toBe(CASUAL_ART_FINGERPRINT);
  });

  it.each(CASUAL_KIND_LIST)("%s tells a reader what it is", (kind) => {
    const copy = CASUAL_DISPLAY[kind];
    for (const text of [copy.label, copy.kanji, copy.tagline, copy.origin, copy.board]) expect(text.length).toBeGreaterThan(0);
    expect(copy.rules.length).toBeGreaterThanOrEqual(3);
    expect(gameCopyFor(kind)).toBe(copy);
    // The name Karakuri's games go by is never a trademarked one (the package holds the same line).
    expect(copy.label).not.toMatch(/cut the rope/i);
  });

  it.each(CASUAL_KIND_LIST)("%s builds a rules page with every section filled", (kind) => {
    const page = casualRulesPage(kind, speaker("en"));
    for (const section of [page.object, page.board, page.play, page.house]) expect(section.length).toBeGreaterThan(0);
    expect(page.image).toBe(gameArtPath(kind));
    // Nothing on it promises a score, a rank or experience: a casual game has none.
    expect(page.house.join(" ")).toMatch(/not rated|Nothing here is rated/i);
  });

  it.each(CASUAL_KIND_LIST)("%s belongs to a family no award counts, and nothing is recorded for it", (kind) => {
    const family = familyOf(kind);
    expect(family, `${kind} is in no family, so no index page shows it`).not.toBeNull();
    expect(RECORDED_FAMILIES).not.toContain(family);
    expect(familyPagePath(family!)).toBe(`/games/${family!.key}`);
    // Karakuri's page is answered by the game page's own route, not a folder of its own (`CasualFamilyPage`).
    expect(family!.key).toBe(CASUAL_FAMILY_KEY);
    expect(read("src/app/games/[slug]/page.tsx")).toContain("<CasualFamilyPage />");
    expect(EVERY_GAME_KEY).toContain(kind);
    expect(RECORDED_GAME_KEYS, "a casual game is never one a record, a ladder, points or XP are kept for").not.toContain(kind);
    expect(isCasualKind(kind)).toBe(true);
    expect(openSourceOf(kind)).toBe("karakuri");
  });

  it.each(CASUAL_KIND_LIST)("%s has an address of its own, with a front door, rules, set-up and play page", (kind) => {
    expect(slugFor(kind)).toBe(CASUAL_SLUGS[kind]);
    expect(slugFor(kind)).toBe(CASUAL_SPECS[kind].id);
    expect(gameKeyFor(CASUAL_SLUGS[kind])).toBe(kind);
    expect(read("src/app/games/[slug]/page.tsx"), "the front door answers a casual game").toContain("<CasualFrontDoor");
    expect(read("src/app/games/[slug]/rules/page.tsx"), "the rules page answers a casual game").toContain("casualRulesPage(");
    expect(read("src/app/games/[slug]/new/page.tsx"), "the set-up answers a casual game").toContain("<CasualSetUpPage");
    expect(read("src/app/games/[slug]/play/page.tsx"), "the play page answers a casual game").toContain("<CasualPlayPage");
    // And what is kept waits on My games' Pass and play tab.
    expect(read("src/app/play/page.tsx"), "My games lists a casual game's progress").toContain("<CasualCards");
  });

  it.each(CASUAL_KIND_LIST)("%s is kept for offline play, its set-up and every level", (kind) => {
    const kept = offlineGameAddresses();
    expect(kept).toContain(`/games/${CASUAL_SLUGS[kind]}/new`);
    for (let level = 1; level <= CASUAL_SPECS[kind].levels; level += 1) expect(kept).toContain(casualPlayPath(kind, level));
  });

  it.each(CASUAL_KIND_LIST)("%s is driven by a browser spec, and says the day it arrived", (kind) => {
    // A spec that plays every game names each by looping `CASUAL_KIND_LIST` (`e2e/casual.spec.ts`), as the survey of Just the board loops `CASUAL_SLUGS`.
    const named = new RegExp(`"${kind}"|/${CASUAL_SLUGS[kind]}\\b|of CASUAL_KIND_LIST`).test(browserSpecs);
    expect(named, `no spec under e2e/ names ${kind} (${CASUAL_SLUGS[kind]}) — write the case that plays one`).toBe(true);
    expect(GAME_ADDED[kind], "run `pnpm games:added`").toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("keeps nothing of a casual game on the server: no database, no route, no points", () => {
    // A casual game's code reads no database and calls no API: what it keeps is the browser's.
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [join(dir, entry.name)] : []));
    for (const file of [...walk("src/components/casual"), ...walk("src/lib/casual")].filter((one) => !one.endsWith(".test.ts"))) {
      const source = read(file);
      expect(source, `${file} reaches for the database`).not.toMatch(/from "@\/lib\/db|prisma|\bfetch\(/);
      expect(source, `${file} awards points or XP`).not.toMatch(/awardXp|recordResult|solveIp|\/api\//);
    }
  });
});
