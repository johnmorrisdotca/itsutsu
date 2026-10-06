import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FAMILY_MOST_GAMES, GAME_FAMILIES, familyOf, gamesShownIn, siblingsOf } from "./families";
import { ALSO_LISTED_IN } from "./familyShelves";
import { RULE_VARIANTS, VARIANT_SPECS } from "./gomoku.constants";
import { GAME_SLUGS } from "./slugs";
import { measureHeadStart } from "@johnmorrisdotca/narabe/simulation/headStartDecides";
import type { RuleVariant } from "./gomoku.types";
import { RULE_VARIANT_DISPLAY } from "./variants.constants";
import { VARIANT_COPY_JA } from "../i18n/dictionaries/variants.ja.constants";
import { OPENING_COPY_JA } from "../i18n/dictionaries/openings.ja.constants";
import { OPENING_DISPLAY } from "./openings.constants";
import { variantCopy } from "./variantCopy";
import { speaker } from "@/lib/i18n/i18n";
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

/** Kana or kanji: the text is Japanese and not an English line left in the row. */
const JAPANESE = /[ぁ-ヿ一-鿿]/;
/** An English back-translation carries no Japanese sentence marks, though it may name a Japanese term it translates. */
const JAPANESE_MARKS = /[。、「」（）]/;
/** A half-width bracket, colon or comma pressed against Japanese: the width a Japanese sentence does not use. */
const HALF_WIDTH_BESIDE_JAPANESE = /[ぁ-ヿ一-鿿][,:;()]|[,:;()][ぁ-ヿ一-鿿]/;

/** Every unit test under the engine and its package, Narabe, except this one — which names them all. */
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
  // The rules themselves, and the tests beside them, are the package's.
  walk(join(process.cwd(), "node_modules", "@johnmorrisdotca", "narabe", "src"));
  return found.join("\n");
}

/** Every browser spec, as text: which games are driven is a fact about their source. */
function browserSpecSources(): string[] {
  return readdirSync("e2e")
    .filter((name) => name.endsWith(".spec.ts") || name.endsWith(".ts"))
    .map((name) => readFileSync(join("e2e", name), "utf8"));
}

describe("every game is finished, not just playable", () => {
  const tests = engineTestSources();
  const browserSpecs = browserSpecSources();

  it.each(VARIANTS)("%s is named by at least one unit test", (variant) => {
    expect(tests).toContain(variant);
  });

  /*
   * AND BY A BROWSER TEST. The New Game Gate above has asked for one since it
   * was written — "one Playwright case that opens the game and plays the move
   * that shows its rule" — and nothing checked, so Ring Drop, Hole Drop, Clear
   * Drop and Wild Tic-tac-toe shipped with none. Found by grepping the specs
   * for each game's name, which is what this does: a game is driven in a
   * browser if some spec names it by its key (`selectOption("ringDrop")`) or
   * by its address (`/games/ring-drop/…`). A file that only lists the game —
   * the catalogue specs, the screenshot scene — counts too, because the
   * screenshot scene DOES play it; the rule is that nothing ships unmet by a
   * browser at all.
   */
  it.each(VARIANTS)("%s is driven by at least one browser spec", (variant) => {
    const named = browserSpecs.some((source) => source.includes(`"${variant}"`) || source.includes(`/${GAME_SLUGS[variant]}/`) || source.includes(`"${GAME_SLUGS[variant]}"`));
    expect(named, `no spec under e2e/ names ${variant} (${GAME_SLUGS[variant]}) — write the case that plays the move that shows its rule`).toBe(true);
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

  /*
   * IN JAPANESE TOO. John, 2026-10-06: every word on the site in English and
   * Japanese. A game's own words (tagline, origin, every rule bullet, the board
   * advice) are `VARIANT_COPY_JA`, a sibling row typed `Record<RuleVariant, …>`,
   * so a game with none does not compile; this holds what the type cannot see:
   * a Japanese line for each English one, a literal English back-translation for
   * each (so a reader who cannot read Japanese can see what ships), a stamp for
   * who read it, and a rules page that reads in Japanese from top to bottom.
   */
  it.each(VARIANTS)("%s has full Japanese copy, read and back-translated", (variant) => {
    const english = RULE_VARIANT_DISPLAY[variant];
    const ja = VARIANT_COPY_JA[variant];
    expect(ja.rules.length, `${variant}: the Japanese has a different number of rule bullets from the English`).toBe(english.rules.length);
    const lines = [ja.tagline, ja.origin, ja.board, ...ja.rules];
    for (const [text, back] of lines) {
      expect(text, `${variant}: "${back}" is not in Japanese`).toMatch(JAPANESE);
      expect(text, `${variant}: a half-width mark beside Japanese in "${text}"`).not.toMatch(HALF_WIDTH_BESIDE_JAPANESE);
      expect(back.trim().length, `${variant}: "${text}" has no back-translation`).toBeGreaterThan(0);
      expect(back, `${variant}: the back-translation of "${text}" is not English`).not.toMatch(JAPANESE_MARKS);
    }
    expect(ja.review, `${variant}: nobody has read its Japanese`).toBeDefined();
    expect(ja.review?.on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each(VARIANTS)("%s reads in Japanese on its rules page, section by section", (variant) => {
    const ja = speaker("ja");
    const page = rulesPageFor(variant, ja);
    for (const section of ["object", "board", "play", "house"] as const) {
      expect(page[section].length, `${variant} ${section}`).toBeGreaterThan(0);
      for (const line of page[section]) {
        expect(line, `${variant} ${section}: "${line}" is not in Japanese`).toMatch(JAPANESE);
        expect(line, `${variant} ${section}: a placeholder was left standing in "${line}"`).not.toMatch(/\{\w+\}/);
      }
    }
    expect(page.tagline).toBe(variantCopy(variant, "ja").tagline);
    expect(page.origin).toMatch(JAPANESE);
    // The English page is the English row, whatever the Japanese says.
    expect(rulesPageFor(variant).tagline).toBe(RULE_VARIANT_DISPLAY[variant].tagline);
  });

  it.each(Object.keys(OPENING_DISPLAY))("opening %s has full Japanese copy, read and back-translated", (opening) => {
    const english = OPENING_DISPLAY[opening as keyof typeof OPENING_DISPLAY];
    const ja = OPENING_COPY_JA[opening as keyof typeof OPENING_COPY_JA];
    expect(ja.label).toMatch(JAPANESE);
    expect(ja.rules.length).toBe(english.rules.length);
    for (const [text, back] of [ja.tagline, ...ja.rules]) {
      expect(text).toMatch(JAPANESE);
      expect(text).not.toMatch(HALF_WIDTH_BESIDE_JAPANESE);
      expect(back.trim().length).toBeGreaterThan(0);
    }
    expect(ja.review).toBeDefined();
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

  it("shows no more than eight games on any shelf", () => {
    // John: "I want to have MAX 8 items per family". Guests count: they are on the shelf.
    for (const family of GAME_FAMILIES) {
      const shown = gamesShownIn(family).map((game) => game.variant);
      expect(shown.length, `${family.title} shows ${shown.length}: ${shown.join(", ")}`).toBeLessThanOrEqual(
        FAMILY_MOST_GAMES,
      );
    }
  });

  it("shows no game twice on one shelf", () => {
    for (const family of GAME_FAMILIES) {
      const shown = gamesShownIn(family).map((game) => game.variant);
      expect(new Set(shown).size, `${family.title} shows a game twice`).toBe(shown.length);
    }
  });
});

/**
 * A HEAD START MAKES A GAME EASIER, NEVER DECIDES IT.
 *
 * Every game declares the most free turns it offers (`headStartTurns`), and the
 * figure is held here to its measurement: with that many free turns, the
 * favoured colour must not be able to force a win — or in draughts a capture it
 * keeps — within a short horizon, on any board the game is played on, for either
 * colour. A search that runs past its budget fails this too: a figure nobody
 * can show safe is not a figure to declare. See Narabe's `simulation/headStartDecides.ts`.
 */
describe("every game's head start leaves the game to be played", () => {
  it.each(VARIANTS)("%s declares how many free turns it offers", (variant) => {
    expect([0, 1, 2, 3]).toContain(VARIANT_SPECS[variant].headStartTurns);
  });

  it.each(VARIANTS)("%s is not decided by the free turns it declares", { timeout: 120_000 }, (variant) => {
    const declared = VARIANT_SPECS[variant].headStartTurns;
    if (declared === 0) return;
    expect(measureHeadStart(variant, declared)).toEqual({ kind: "safe" });
  });
});
