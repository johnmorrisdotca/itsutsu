import { describe, expect, it } from "vitest";

import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

import { COUNTRY_NAMES, flagFor, wikipediaUrl } from "./origins";
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

  it("names the game in Chinese as well, where most of its players are", () => {
    // The entry gave the Japanese and British names and not the Chinese one,
    // which is the odd gap: 五子棋 is what the game is called where it is
    // played most. Both forms, the way Connect6 already carries Liuziqi.
    const names = rulesPageFor(RULE_VARIANTS.freestyle).alsoKnownAs;
    expect(names).toContain("Wuziqi");
    expect(names).toContain("五子棋");
    // Chad Valley sold it in Britain in the 1920s under a name of their own.
    expect(names).toContain("Spoil Five");
  });

  it("gives the Vietnamese game the other name it is played under", () => {
    expect(rulesPageFor(RULE_VARIANTS.caro).alsoKnownAs).toContain("Gomoku+");
  });

  /*
   * Two absences that are answers rather than gaps, recorded so nobody
   * "fixes" them later.
   *
   * Halma has no other name. Chinese Checkers is Stern-Halma, a derivative
   * somebody else published, not this game under another title, and listing
   * it would tell a reader something untrue.
   *
   * Othello is not listed against Reversi either, though it is what the
   * modern game is sold as. The name belongs to its owner, so it is carried
   * in `inspiredBy` and RULES_ATTRIBUTION instead — which is the same
   * decision the file makes for Pente, Pentago and Teeko.
   */
  it("leaves a game alone when its name is simply its name", () => {
    expect(rulesPageFor(RULE_VARIANTS.halma).alsoKnownAs).toEqual([]);
    expect(rulesPageFor(RULE_VARIANTS.reversi).alsoKnownAs).not.toContain("Othello");
    expect(rulesPageFor(RULE_VARIANTS.reversi).inspiredBy).toBe("Othello");
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

/**
 * Where a game is from, and where to check us.
 *
 * The facts here were verified against the Wikipedia API before they were
 * written down, which a test cannot repeat — a unit test that reached the
 * network would fail on a train. What it can hold is the shape: that a flag
 * is derived from the code rather than kept beside it, that every article
 * title turns into an address that could be followed, and that a game we
 * invented claims no country.
 */
describe("where a game comes from", () => {
  it("derives the flag from the country code, so the two cannot disagree", () => {
    expect(flagFor("JP")).toBe("🇯🇵");
    expect(flagFor("DK")).toBe("🇩🇰");
    expect(flagFor("VN")).toBe("🇻🇳");
  });

  it("names the country in words as well, for the title on the flag", () => {
    expect(rulesPageFor(RULE_VARIANTS.halma).from).toEqual({
      code: "US",
      country: "the United States",
      flag: "🇺🇸",
    });
  });

  it("sends Hex to Denmark, where Piet Hein found it first", () => {
    expect(rulesPageFor(RULE_VARIANTS.hex).from?.code).toBe("DK");
  });

  it("claims no country for a game we invented", () => {
    expect(rulesPageFor(RULE_VARIANTS.dominoFive).from).toBeNull();
    expect(rulesPageFor(RULE_VARIANTS.ringDrop).from).toBeNull();
  });

  it("builds a Wikipedia address from the title, underscores and all", () => {
    expect(wikipediaUrl("Hex (board game)")).toBe(
      "https://en.wikipedia.org/wiki/Hex_(board_game)",
    );
    expect(wikipediaUrl("Gomoku")).toBe("https://en.wikipedia.org/wiki/Gomoku");
  });

  it("sends the capture games to the article that explains the family", () => {
    // Ninuki-renju and Keryo-Pente are both redirects to Pente on Wikipedia,
    // and Pente is the page that actually explains how capturing works.
    expect(rulesPageFor(RULE_VARIANTS.ninuki).wikipedia).toContain("/Pente");
    expect(rulesPageFor(RULE_VARIANTS.sannuki).wikipedia).toContain("/Pente");
  });

  it("links nowhere rather than somewhere wrong", () => {
    // Caro has no English article of its own; the flag stands without a link.
    expect(rulesPageFor(RULE_VARIANTS.caro).wikipedia).toBeNull();
    expect(rulesPageFor(RULE_VARIANTS.caro).from?.code).toBe("VN");
    expect(rulesPageFor(RULE_VARIANTS.twistFour).wikipedia).toBeNull();
  });

  it.each(VARIANTS)("%s links to en.wikipedia.org or nowhere", (variant) => {
    const url = rulesPageFor(variant).wikipedia;
    if (url === null) return;
    expect(url.startsWith("https://en.wikipedia.org/wiki/")).toBe(true);
    // A title left with a space would still resolve, but every link should be
    // built the same way, so nothing here should carry one.
    expect(url).not.toContain(" ");
  });

  it.each(VARIANTS)("%s names a country only from the list, with a real flag", (variant) => {
    const from = rulesPageFor(variant).from;
    if (from === null) return;
    expect(COUNTRY_NAMES[from.code]).toBe(from.country);
    expect([...from.flag]).toHaveLength(2);
  });
});
