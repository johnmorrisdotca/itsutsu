import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GAME_FAMILIES, siblingsOf } from "./families";
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

  it("lists each game in exactly one family", () => {
    const listed = GAME_FAMILIES.flatMap((family) => family.games);
    expect(new Set(listed).size).toBe(listed.length);
  });
});
