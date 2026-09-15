import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ALSO_LISTED_IN, GAME_FAMILIES, familyOf, gamesShownIn, siblingsOf } from "./families";
import { RULE_VARIANTS } from "./gomoku.constants";
import type { RuleVariant } from "./gomoku.types";
import { RULE_VARIANT_DISPLAY } from "./variants.constants";
import { hasGameImage, hasGameThumb } from "@/lib/learn/images";
import { rulesPageFor } from "@/lib/learn/rulesPage";

/**
 * The New Game Gate.
 *
 * A rule variant is cheap to add — a row in VARIANT_SPECS and the engine plays
 * it. Everything that makes it a *game someone can find and trust* is separate
 * work, and it is the part that gets left behind: the games that shipped
 * without a picture, or that no test ever names, or that sit in no family and
 * so appear on no index page.
 *
 * TypeScript already forces a spec and a copy entry for every variant, because
 * both are `Record<RuleVariant, …>`. This file covers what the type system
 * cannot see. See AGENTS.md, "Adding A Game".
 */

const VARIANTS = Object.values(RULE_VARIANTS) as RuleVariant[];

/** Every unit test under the engine, except this one — which names them all. */
function engineTestSources(): string {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith(".test.ts") && !entry.startsWith("variants.coverage")) {
        found.push(readFileSync(path, "utf8"));
      }
    }
  };
  walk(join(process.cwd(), "src", "lib", "gomoku"));
  return found.join("\n");
}

describe("every game is finished, not just playable", () => {
  const tests = engineTestSources();

  it.each(VARIANTS)("%s is named by at least one unit test", (variant) => {
    expect(tests).toContain(variant);
  });

  it.each(VARIANTS)("%s has a screenshot in public/art/games", (variant) => {
    expect(hasGameImage(variant)).toBe(true);
  });

  it.each(VARIANTS)("%s has a thumbnail in public/art/games/thumbs", (variant) => {
    /*
     * The small board every list draws beside the game's name — /play, the
     * lobby's open seats, the record — cut from the screenshot by
     * `pnpm art:thumbs`, which `pnpm screenshots:games` runs last. A game
     * without one shows a broken picture in every row that names it, which
     * is exactly the kind of thing a gate exists to refuse.
     */
    expect(hasGameThumb(variant)).toBe(true);
  });

  it.each(VARIANTS)("%s belongs to a family, so an index page can show it", (variant) => {
    expect(siblingsOf(variant)).not.toBeNull();
  });

  it.each(VARIANTS)("%s tells a player what it is", (variant) => {
    const copy = RULE_VARIANT_DISPLAY[variant];
    expect(copy.label.length).toBeGreaterThan(0);
    expect(copy.kanji.length).toBeGreaterThan(0);
    expect(copy.tagline.length).toBeGreaterThan(0);
    expect(copy.origin.length).toBeGreaterThan(0);
    expect(copy.board.length).toBeGreaterThan(0);
    // Three bullets is the floor for explaining a game: object, turn, ending.
    expect(copy.rules.length).toBeGreaterThanOrEqual(3);
  });

  it.each(VARIANTS)("%s builds a rules page with every section filled", (variant) => {
    const page = rulesPageFor(variant);
    expect(page.object.length).toBeGreaterThan(0);
    expect(page.board.length).toBeGreaterThan(0);
    expect(page.play.length).toBeGreaterThan(0);
    expect(page.house.length).toBeGreaterThan(0);
  });

  it("gives each game exactly one home family", () => {
    const listed = GAME_FAMILIES.flatMap((family) => family.games);
    expect(new Set(listed).size).toBe(listed.length);
  });

  /*
   * A game may also be shown on another family's shelf, for discovery
   * (`ALSO_LISTED_IN`): the same game, never a copy, with a reason, and never
   * twice on one shelf. John, 2026-09-15: a family is a way of finding a game,
   * not a filing cabinet — and a shelf, not a complete list.
   */
  it("lists a game on another shelf only with a reason, on a real family that is not its home", () => {
    const keys = new Set(GAME_FAMILIES.map((family) => family.key));
    for (const [variant, listings] of Object.entries(ALSO_LISTED_IN)) {
      const home = familyOf(variant as RuleVariant);
      expect(home, `${variant} is listed on another shelf but has no home family`).not.toBeNull();
      const seen = new Set<string>();
      for (const listing of listings ?? []) {
        expect(keys.has(listing.family), `${variant} is listed on "${listing.family}", which is no family`).toBe(true);
        expect(listing.family, `${variant} is listed on its own home`).not.toBe(home?.key);
        expect(seen.has(listing.family), `${variant} is listed on "${listing.family}" twice`).toBe(false);
        seen.add(listing.family);
        expect(listing.why.length, `${variant} on "${listing.family}" gives no reason`).toBeGreaterThan(20);
      }
    }
  });

  it("shows no game twice on one shelf", () => {
    for (const family of GAME_FAMILIES) {
      const shown = gamesShownIn(family).map((game) => game.variant);
      expect(new Set(shown).size, `${family.title} shows a game twice`).toBe(shown.length);
    }
  });
});
