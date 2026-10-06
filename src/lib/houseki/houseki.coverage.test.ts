import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import * as chains from "@johnmorrisdotca/houseki/colour-chains";
import * as triplets from "@johnmorrisdotca/houseki/falling-triplets";
import * as swap from "@johnmorrisdotca/houseki/gem-swap";
import * as blocks from "@johnmorrisdotca/houseki/magnetic-blocks";
import * as stones from "@johnmorrisdotca/houseki/stone-collapse";
import { describe, expect, it } from "vitest";

import { GAME_ADDED } from "@/lib/catalogue/gameAdded.data";
import { EVERY_GAME_KEY, RECORDED_GAME_KEYS, gameCopyFor, isHousekiKind } from "@/lib/catalogue/gameKeys";
import { openSourceOf } from "@/lib/catalogue/openSource";
import { gameArtPath, gameThumbPath } from "@/lib/gomoku/artwork";
import { RECORDED_FAMILIES, familyOf, familyPagePath } from "@/lib/gomoku/families";
import { HOUSEKI_SLUGS, gameKeyFor, housekiPlayPath, slugFor } from "@/lib/gomoku/slugs";
import { offlineGameAddresses } from "@/lib/offline/offlineGames";
import { HOUSEKI_PRICE_LEAST, HOUSEKI_PRICE_MOST, housekiPrice } from "@/lib/points/housekiLadder";

import { HOUSEKI_FAMILY_KEY, HOUSEKI_KANJI, HOUSEKI_KIND_LIST, HOUSEKI_SPECS, campaignsOf, housekiKindOfId, levelsIn, levelsOf } from "./houseki.constants";
import type { HousekiCampaign, HousekiKind, HousekiRequest } from "./houseki.types";
import { HOUSEKI_ART_FILES, readHousekiArtFingerprint } from "./housekiArtFingerprint";
import { HOUSEKI_ART_FINGERPRINT } from "./housekiArt.data";
import { housekiQuery } from "./housekiAddress";
import { housekiCopy } from "./housekiCopy";
import { housekiRulesPage } from "./housekiRulesPage";
import { verifyHousekiWin } from "./housekiVerify";
import { winnerOf } from "./housekiWinner";

/**
 * The New Game Gate, for a Houseki game.
 *
 * A Houseki game (`@johnmorrisdotca/houseki`: played alone a level at a time, kept in the browser, a won level
 * checked by the server and worth points; docs/plans/houseki) is none of a rule variant, a puzzle, a party game or a
 * casual game, so this asks every question of the gate that applies to it, in its own terms:
 *
 *  - it IS the package's game: the levels, lessons and campaigns are the package's own, and every level's recorded
 *    winning plan is a win the server's referee accepts at the price the ladder gives it;
 *  - it has a picture and a thumbnail, taken of the board as it is drawn now;
 *  - it has full copy, in both languages, and a rules page with every section filled;
 *  - it belongs to a family no award counts, and is never one a record, a ladder of players or XP are kept for;
 *  - it has an address, a front door, rules, a set-up and a play page, waits on My games, is kept for offline play;
 *  - it is driven by a browser spec and says the day it arrived.
 *
 * Every question is asked of `HOUSEKI_KIND_LIST`, so a game listed there is held to all of this before it ships.
 */
const read = (path: string) => readFileSync(path, "utf8");

const browserSpecs = readdirSync("e2e")
  .filter((name) => name.endsWith(".ts") && name !== "houseki-screenshots.spec.ts")
  .map((name) => read(join("e2e", name)))
  .join("\n");

/** How many levels, by campaign, and lessons the package itself has for a game. */
function packageHas(kind: HousekiKind): { levels: Partial<Record<HousekiCampaign, number>>; lessons: number } {
  switch (kind) {
    case "fallingTriplets":
      return { levels: { classic: triplets.levelManifest.length }, lessons: triplets.tutorialManifest.length };
    case "colourChains":
      return { levels: { classic: chains.levelManifest.length, shizen: chains.shizenLevelManifest.length, arashi: chains.arashiLevelManifest.length }, lessons: chains.tutorialManifest.length };
    case "stoneCollapse":
      return { levels: { classic: stones.levelManifest.length }, lessons: stones.tutorialManifest.length };
    case "gemSwap":
      return { levels: { classic: swap.GEM_SWAP_CAMPAIGN.length }, lessons: swap.GEM_SWAP_LESSONS.length };
    case "magneticBlocks":
      return { levels: { classic: blocks.levelManifest.length }, lessons: blocks.lessonManifest.length };
  }
}

describe("every Houseki game is finished, not just declared", () => {
  it("lists the package's five, in a list that is the whole of it", () => {
    expect(HOUSEKI_KIND_LIST).toHaveLength(5);
    expect(new Set(HOUSEKI_KIND_LIST.map((kind) => HOUSEKI_SPECS[kind].id))).toEqual(new Set(["falling-triplets", "colour-chains", "stone-collapse", "gem-swap", "magnetic-blocks"]));
  });

  it.each(HOUSEKI_KIND_LIST)("%s has the levels and lessons the package has, and no others", (kind) => {
    const spec = HOUSEKI_SPECS[kind];
    const has = packageHas(kind);
    expect(housekiKindOfId(spec.id)).toBe(kind);
    for (const campaign of campaignsOf(kind)) expect(levelsIn(kind, campaign), `${kind} ${campaign}`).toBe(has.levels[campaign]);
    expect(campaignsOf(kind).length).toBe(Object.keys(has.levels).length);
    expect(spec.lessons).toBe(has.lessons);
    expect(levelsOf(kind)).toBeGreaterThanOrEqual(50);
    expect(spec.sizes.length, "a game offers at most four boards on its set-up").toBeLessThanOrEqual(4);
    expect(spec.colours.length).toBeGreaterThan(0);
  });

  it.each(HOUSEKI_KIND_LIST)("%s: every level's recorded winning plan is a win the server accepts, at the price its marks give", (kind) => {
    for (const campaign of campaignsOf(kind)) {
      for (let number = 1; number <= levelsIn(kind, campaign); number += 1) {
        const verdict = verifyHousekiWin(kind, { kind: "level", campaign, number }, winnerOf(kind, campaign, number), "2026-10-06");
        expect(verdict, `${kind} ${campaign} ${number}`).toMatchObject({ ok: true, campaign, number });
        if (verdict.ok) {
          expect(housekiPrice(campaign, verdict.marks), `${kind} ${campaign} ${number}`).toBeGreaterThanOrEqual(HOUSEKI_PRICE_LEAST);
          expect(housekiPrice(campaign, verdict.marks)).toBeLessThanOrEqual(HOUSEKI_PRICE_MOST);
        }
      }
    }
  }, 120_000);

  it.each(HOUSEKI_KIND_LIST)("%s has a picture and a thumbnail in public/art/games", (kind) => {
    expect(existsSync(join(process.cwd(), "public", gameArtPath(kind))), `${kind}: run pnpm screenshots:houseki`).toBe(true);
    expect(existsSync(join(process.cwd(), "public", gameThumbPath(kind))), `${kind}: run pnpm screenshots:houseki`).toBe(true);
  });

  it("has pictures of the boards as they are drawn now", () => {
    expect(HOUSEKI_ART_FINGERPRINT).toMatch(/^[0-9a-f]{16}$/);
    expect(
      readHousekiArtFingerprint(),
      "A Houseki game's board is drawn differently from when its picture was taken. Re-take them:\n\n" +
        "    pnpm screenshots:houseki\n\n" +
        `(The files watched are ${HOUSEKI_ART_FILES.join(", ")} — see housekiArtFingerprint.ts if one of them should not be.)`,
    ).toBe(HOUSEKI_ART_FINGERPRINT);
  });

  it.each(HOUSEKI_KIND_LIST)("%s tells a reader what it is, in English and in Japanese", (kind) => {
    for (const locale of ["en", "ja"] as const) {
      const copy = housekiCopy(kind, locale);
      for (const text of [copy.label, copy.kanji, copy.tagline, copy.origin, copy.board]) expect(text.length, `${kind} ${locale}`).toBeGreaterThan(0);
      expect(copy.rules.length, `${kind} ${locale}`).toBeGreaterThanOrEqual(5);
    }
    expect(housekiCopy(kind, "ja").tagline).toMatch(/[ぁ-ヿ一-鿿]/);
    expect(housekiCopy(kind, "en").kanji).toBe(HOUSEKI_KANJI[kind]);
    expect(gameCopyFor(kind).label).toBe(housekiCopy(kind, "en").label);
  });

  it.each(HOUSEKI_KIND_LIST)("%s builds a rules page with every section filled, and says what is kept and what counts", (kind) => {
    const page = housekiRulesPage(kind);
    for (const section of [page.object, page.board, page.play, page.house]) expect(section.length).toBeGreaterThan(0);
    expect(page.image).toBe(gameArtPath(kind));
    expect(page.house.join(" ")).toMatch(/kept in this browser/i);
    expect(page.house.join(" ")).toMatch(/points/i);
  });

  it.each(HOUSEKI_KIND_LIST)("%s belongs to a family no award counts, and no record of players is kept for it", (kind) => {
    const family = familyOf(kind);
    expect(family, `${kind} is in no family, so no index page shows it`).not.toBeNull();
    expect(RECORDED_FAMILIES).not.toContain(family);
    expect(familyPagePath(family!)).toBe(`/games/${family!.key}`);
    expect(family!.key).toBe(HOUSEKI_FAMILY_KEY);
    expect(read("src/app/games/[slug]/page.tsx")).toContain("<HousekiFamilyPage />");
    expect(EVERY_GAME_KEY).toContain(kind);
    expect(RECORDED_GAME_KEYS, "a Houseki game is never one a record, a ladder of players or XP are kept for").not.toContain(kind);
    expect(isHousekiKind(kind)).toBe(true);
    expect(openSourceOf(kind)).toBe("houseki");
  });

  it.each(HOUSEKI_KIND_LIST)("%s has an address of its own, with a front door, rules, set-up and play page", (kind) => {
    expect(slugFor(kind)).toBe(HOUSEKI_SLUGS[kind]);
    expect(slugFor(kind)).toBe(HOUSEKI_SPECS[kind].id);
    expect(gameKeyFor(HOUSEKI_SLUGS[kind])).toBe(kind);
    expect(read("src/app/games/[slug]/page.tsx"), "the front door answers a Houseki game").toContain("<HousekiFrontDoor");
    expect(read("src/app/games/[slug]/rules/page.tsx"), "the rules page answers a Houseki game").toContain("housekiRulesPage(");
    expect(read("src/app/games/[slug]/new/page.tsx"), "the set-up answers a Houseki game").toContain("<HousekiSetUpPage");
    expect(read("src/app/games/[slug]/play/page.tsx"), "the play page answers a Houseki game").toContain("<HousekiPlayPage");
    expect(read("src/app/play/page.tsx"), "My games lists a Houseki game's progress").toContain("<HousekiCards");
  });

  it.each(HOUSEKI_KIND_LIST)("%s is kept for offline play: its set-up, a level, a lesson, the Daily and a free game", (kind) => {
    const kept = offlineGameAddresses();
    expect(kept).toContain(`/games/${HOUSEKI_SLUGS[kind]}/new`);
    const asked: HousekiRequest[] = [{ kind: "level", campaign: "classic", number: 1 }, { kind: "lesson", number: 1 }, ...(HOUSEKI_SPECS[kind].daily ? [{ kind: "daily" } as const] : [])];
    for (const request of asked) {
      expect(kept, `${kind} ${request.kind}`).toContain(housekiPlayPath(kind, housekiQuery(request)));
    }
    expect(kept.filter((address) => address.startsWith(`/games/${HOUSEKI_SLUGS[kind]}/play`)).length, "a free game is kept too").toBeGreaterThanOrEqual(3);
  });

  it.each(HOUSEKI_KIND_LIST)("%s is driven by a browser spec, and says the day it arrived", (kind) => {
    const named = new RegExp(`"${kind}"|/${HOUSEKI_SLUGS[kind]}\\b|of HOUSEKI_KIND_LIST|HOUSEKI_SLUGS`).test(browserSpecs);
    expect(named, `no spec under e2e/ names ${kind} (${HOUSEKI_SLUGS[kind]}) — write the case that plays one`).toBe(true);
    expect(GAME_ADDED[kind], "run `pnpm games:added`").toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("asks the server for nothing while a game is played: only a won level is sent, and only by the one route", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : /\.tsx?$/.test(entry.name) ? [join(dir, entry.name)] : []));
    for (const file of walk("src/components/houseki")) {
      const source = read(file);
      expect(source, `${file} reaches for the database`).not.toMatch(/from "@\/lib\/db|prisma/);
      expect(source, `${file} awards XP`).not.toMatch(/awardXp|recordResult/);
      if (/\bfetch\(/.test(source)) expect(source, `${file} calls an address other than the win route`).not.toMatch(/fetch\(\s*["'`](?!\/api\/houseki\/win)/);
    }
  });
});
