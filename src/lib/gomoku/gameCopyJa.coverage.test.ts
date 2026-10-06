import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { ALSO_LISTED_COPY_JA, FAMILY_COPY_JA } from "@/lib/i18n/dictionaries/families.ja.constants";
import { BOT_COPY_JA } from "@/lib/i18n/dictionaries/bots.ja.constants";

import { HANDICAP_COPY_JA, SECOND_STONE_COPY_JA } from "@/lib/i18n/dictionaries/openings.ja.constants";
import { rulesAttributionJa } from "@/lib/i18n/dictionaries/attribution.ja.constants";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";

import { rulesAttribution } from "./attributionCopy";
import { botBio, botProfile } from "./botCopy";
import { handicapCopy, secondStoneLabel } from "./openingCopy";
import { HANDICAP_RULE_DISPLAY, RULES_ATTRIBUTION } from "./openings.constants";
import { SECOND_STONE_EXCLUSION_DISPLAY } from "./variants.constants";
import { familyBlurb, listingWhy } from "./familyCopy";
import { GAME_FAMILIES } from "./families";
import { ALSO_LISTED_IN } from "./familyShelves";
import { BOT_PROFILES } from "./opponent.constants";
import type { BotTier } from "./opponent.types";

/**
 * THE REST OF A GAME'S WORDS, IN JAPANESE: the computer players, the families
 * and the shelves a game is also listed on. A game's own rules are held by
 * `variants.coverage.test.ts`; this holds what sits around them, the same way:
 * a Japanese line for every English one, a literal English back-translation for
 * each, who read it, and nothing half-width pressed against Japanese.
 */
const JAPANESE = /[ぁ-ヿ一-鿿]/;
const HALF_WIDTH_BESIDE_JAPANESE = /[ぁ-ヿ一-鿿][,:;()]|[,:;()][ぁ-ヿ一-鿿]/;
const JAPANESE_MARKS = /[。、「」（）]/;

function holds(lines: readonly (readonly [string, string])[], where: string) {
  for (const [text, back] of lines) {
    expect(text, `${where}: "${back}" is not in Japanese`).toMatch(JAPANESE);
    expect(text, `${where}: a half-width mark beside Japanese in "${text}"`).not.toMatch(HALF_WIDTH_BESIDE_JAPANESE);
    expect(back.trim().length, `${where}: "${text}" has no back-translation`).toBeGreaterThan(0);
    expect(back, `${where}: the back-translation of "${text}" is not English`).not.toMatch(JAPANESE_MARKS);
  }
}

describe("the computer players speak Japanese", () => {
  const tiers = Object.keys(BOT_PROFILES) as BotTier[];

  it("has a Japanese row for exactly the tiers there are", () => {
    expect(Object.keys(BOT_COPY_JA).sort()).toEqual([...tiers].sort());
    expect(Object.keys(BOT_MEMBERS).sort()).toEqual([...tiers].sort());
  });

  it.each(tiers)("%s has a strength, a blurb and a bio, read and back-translated", (tier) => {
    const ja = BOT_COPY_JA[tier];
    holds([ja.strength, ja.blurb, ja.bio], tier);
    expect(ja.review, `${tier}: nobody has read its Japanese`).toBeDefined();
  });

  it.each(tiers)("%s keeps its name and calls itself a computer, never a machine or a player", (tier) => {
    const english = BOT_PROFILES[tier];
    const ja = botProfile(tier, "ja");
    expect(ja.name).toBe(english.name);
    expect(ja.native).toBe(english.native);
    expect(botProfile(tier, "en")).toBe(english);
    for (const text of [ja.strength, ja.blurb, botBio(tier, BOT_MEMBERS[tier].bio, "ja")]) {
      // John, 2026-10-06: コンピュータ, never 機械, 棋士 or コンピューター.
      expect(text).not.toMatch(/機械|棋士|コンピューター/);
    }
    expect(botBio(tier, BOT_MEMBERS[tier].bio, "en")).toBe(BOT_MEMBERS[tier].bio);
  });
});

describe("the families speak Japanese", () => {
  it.each(GAME_FAMILIES.map((family) => family.key))("%s has a blurb in Japanese, read and back-translated", (key) => {
    const ja = FAMILY_COPY_JA[key];
    expect(ja, `family ${key} has no Japanese`).toBeDefined();
    holds([ja!.blurb], key);
    expect(ja!.review, `${key}: nobody has read its Japanese`).toBeDefined();
  });

  it("has Japanese for no family that does not exist", () => {
    const keys = new Set(GAME_FAMILIES.map((family) => family.key));
    expect(Object.keys(FAMILY_COPY_JA).filter((key) => !keys.has(key))).toEqual([]);
  });

  it("reads a family's blurb in the reader's language", () => {
    for (const family of GAME_FAMILIES) {
      expect(familyBlurb(family, "en")).toBe(family.blurb);
      expect(familyBlurb(family, "ja")).toMatch(JAPANESE);
    }
  });

  it("says why a game is also on another shelf, in Japanese, for every such listing", () => {
    const wanted: string[] = [];
    for (const [game, listings] of Object.entries(ALSO_LISTED_IN)) {
      for (const listing of listings ?? []) {
        const key = `${game}/${listing.family}`;
        wanted.push(key);
        expect(ALSO_LISTED_COPY_JA[key], `${key} has no Japanese reason`).toBeDefined();
        holds([ALSO_LISTED_COPY_JA[key]!.why], key);
        expect(listingWhy(game, listing.family, listing.why, "en")).toBe(listing.why);
      }
    }
    expect(Object.keys(ALSO_LISTED_COPY_JA).sort()).toEqual(wanted.sort());
  });
});

describe("the handicap switches, the second stone and the attribution speak Japanese", () => {
  it.each(Object.keys(HANDICAP_RULE_DISPLAY))("handicap %s has a sentence and a source, read and back-translated", (rule) => {
    const ja = HANDICAP_COPY_JA[rule as keyof typeof HANDICAP_COPY_JA];
    holds([ja.description, ja.from], rule);
    expect(ja.review).toBeDefined();
    const english = HANDICAP_RULE_DISPLAY[rule as keyof typeof HANDICAP_RULE_DISPLAY];
    expect(handicapCopy(rule as keyof typeof HANDICAP_COPY_JA, "en")).toBe(english);
    // Its name in Japanese is the kanji already beside the English label.
    expect(handicapCopy(rule as keyof typeof HANDICAP_COPY_JA, "ja").label).toBe(english.kanji);
  });

  it.each(Object.keys(SECOND_STONE_EXCLUSION_DISPLAY))("a second stone that must leave %s squares has a label in Japanese", (squares) => {
    const ja = SECOND_STONE_COPY_JA[Number(squares)];
    expect(ja, `${squares} has no Japanese`).toBeDefined();
    holds([ja!.label], squares);
    expect(secondStoneLabel(Number(squares), "en")).toBe(SECOND_STONE_EXCLUSION_DISPLAY[Number(squares)]!.label);
  });

  it("says whose names the games are, in Japanese, paragraph for paragraph, naming every puzzle by its kanji", () => {
    const names = (kind: keyof typeof PUZZLE_DISPLAY) => ({ ja: PUZZLE_DISPLAY[kind].kanji, en: PUZZLE_DISPLAY[kind].label });
    const ja = rulesAttributionJa(names);
    expect(ja.paragraphs.length).toBe(RULES_ATTRIBUTION.length);
    holds(ja.paragraphs, "attribution");
    expect(ja.review).toBeDefined();
    expect(rulesAttribution("en")).toBe(RULES_ATTRIBUTION);
    expect(rulesAttribution("ja")).toEqual(ja.paragraphs.map(([text]) => text));
    // The English names no puzzle the Japanese leaves out.
    for (const kind of ["numberPlace", "jigsaw", "diagonal", "sumCages", "moreOrLess", "towers", "hiddenStones", "blackAndWhite", "gomoji", "bridges", "pictureLogic", "mahjong", "shikaku", "akari", "loop", "hitori", "crossSums", "regions", "jirai"] as const) {
      expect(rulesAttribution("ja").join("\n"), kind).toContain(PUZZLE_DISPLAY[kind].kanji);
    }
  });
});
