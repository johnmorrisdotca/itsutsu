import { describe, expect, it } from "vitest";

import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

import { rulesPageFor } from "./rulesPage";

const VARIANTS = Object.values(RULE_VARIANTS) as RuleVariant[];

/**
 * The other names a game goes by.
 *
 * Most of these games are sold under several names, and a player arrives
 * knowing one of them. The names come from two lists kept for two different
 * reasons — the published names in the game's own copy, and the names the
 * play-by-mail sites used, which are kept to match imported records — and the
 * rules page shows them as one. What is tested here is the joining: that
 * neither list is lost, that our own name never appears in the list of other
 * names, and that nothing is said twice.
 */
describe("also known as", () => {
  it("gives the names the old sites used, so an imported record leads somewhere", () => {
    // gameAliases.ts maps ItsYourTurn's "Flipversi 10x10" onto Grand Reversi.
    expect(rulesPageFor(RULE_VARIANTS.grandReversi).alsoKnownAs).toContain("Flipversi 10x10");
    // And Pente onto the capture game it is a version of.
    expect(rulesPageFor(RULE_VARIANTS.ninuki).alsoKnownAs).toContain("Pente");
  });

  it("gives the names a game is published under in the world", () => {
    // Hex was found twice and sold under four names; Parker Brothers' is one.
    expect(rulesPageFor(RULE_VARIANTS.hex).alsoKnownAs).toContain("Con-tac-tix");
    expect(rulesPageFor(RULE_VARIANTS.tictactoe).alsoKnownAs).toContain("Noughts and Crosses");
  });

  it("joins both lists rather than choosing one", () => {
    const names = rulesPageFor(RULE_VARIANTS.freestyle).alsoKnownAs;
    // From the copy…
    expect(names).toContain("Five in a Row");
    // …and from the legacy table, in the same list.
    expect(names).toContain("Pro Go-Moku");
  });

  it.each(VARIANTS)("%s never lists its own name among its other names", (variant) => {
    const page = rulesPageFor(variant);
    const own = page.title.toLowerCase();
    expect(page.alsoKnownAs.map((name) => name.toLowerCase())).not.toContain(own);
  });

  it.each(VARIANTS)("%s says no name twice, however it is written", (variant) => {
    // Capitals, hyphens and spaces do not make a second name: the old sites'
    // table holds "Go-Moku" and "Go Moku" as separate keys, and only one of
    // them belongs in a sentence.
    const names = rulesPageFor(variant).alsoKnownAs.map((name) =>
      name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );
    expect(names.filter((name) => name !== "")).toHaveLength(
      new Set(names.filter((name) => name !== "")).size,
    );
  });

  it("keeps a name written in another script beside its romanisation", () => {
    // Folding punctuation away must not fold a CJK name to nothing and take
    // it for a duplicate of the next one.
    const names = rulesPageFor(RULE_VARIANTS.connect6).alsoKnownAs;
    expect(names).toContain("Liuziqi");
    expect(names).toContain("六子棋");
  });

  it("says nothing at all for a game that goes by one name", () => {
    // Our own inventions are sold nowhere and were never on the old sites.
    expect(rulesPageFor(RULE_VARIANTS.dominoFive).alsoKnownAs).toEqual([]);
  });

  it.each(VARIANTS)("%s lists only names somebody wrote down", (variant) => {
    for (const name of rulesPageFor(variant).alsoKnownAs) {
      expect(name.trim()).toBe(name);
      expect(name.length).toBeGreaterThan(1);
    }
  });

  it("keeps the published names in the copy, where a game's other words live", () => {
    // The field is optional on purpose — most of these games go by one name —
    // but where it is set it must be a list of names, not a sentence about them.
    for (const variant of VARIANTS) {
      const names = RULE_VARIANT_DISPLAY[variant].alsoKnownAs;
      if (names === undefined) continue;
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(name).not.toContain(".");
    }
  });
});
