import { existsSync } from "node:fs";
import { join } from "node:path";

import { allFacts, facts } from "@johnmorrisdotca/kuni/facts";
import { countries, country } from "@johnmorrisdotca/kuni";
import { flag } from "@johnmorrisdotca/hata/load";
import { describe, expect, it } from "vitest";

import { checkOutOfGuesses, checkSolution } from "../puzzleCheck";
import { generatePuzzle } from "../generate";
import { KUNIATE_CAPITAL, KUNIATE_FLAG, KUNIATE_OUTLINE, readGuesses, readQuestion } from "./code";
import { checkKuniate } from "./check";
import { compassPoint } from "./compass";
import { generateKuniate, kuniatePool } from "./generate";
import { KUNIATE_SPEC } from "./kuniate.constants";
import { KUNIATE_EASY, KUNIATE_GUESSES, KUNIATE_HARD, KUNIATE_MEDIUM, KUNIATE_NO_FLAG } from "./pool.constants";

describe("kuniate: what makes it different", () => {
  it("asks a seed's country at this way and level, the same in every browser, with a different country for each way on one day", () => {
    const day = 20261030;
    const puzzle = generatePuzzle("kuniate", KUNIATE_OUTLINE, "medium", day);
    expect(generatePuzzle("kuniate", KUNIATE_OUTLINE, "medium", day)).toEqual(puzzle);
    expect(KUNIATE_MEDIUM).toContain(puzzle.solution);
    expect(readQuestion(puzzle.givens, KUNIATE_OUTLINE)).toBe(puzzle.solution);
    const countriesOfTheDay = KUNIATE_SPEC.sizes.map((way) => generateKuniate(way, "hard", day).solution);
    expect(new Set(countriesOfTheDay).size).toBe(3);
  });

  it("wins on the last guess only, and refuses a list that goes on, repeats, or names anywhere not on the list", () => {
    const givens = "FR1";
    expect(checkKuniate(KUNIATE_OUTLINE, givens, "FR", "found")).toEqual({ ok: true });
    expect(checkKuniate(KUNIATE_OUTLINE, givens, "DEBEFR", "found")).toEqual({ ok: true });
    expect(checkKuniate(KUNIATE_OUTLINE, givens, "FRDE", "found").ok).toBe(false);
    expect(checkKuniate(KUNIATE_OUTLINE, givens, "DEBE", "found").ok).toBe(false);
    expect(checkKuniate(KUNIATE_OUTLINE, givens, "DEDEFR", "found").ok).toBe(false);
    expect(checkKuniate(KUNIATE_OUTLINE, givens, "ZZFR", "found").ok).toBe(false);
    expect(checkKuniate(KUNIATE_OUTLINE, givens, "", "found").ok).toBe(false);
    // Seven guesses are one more than a game gives.
    expect(checkKuniate(KUNIATE_OUTLINE, givens, "DEBEESITATCHFR", "found").ok).toBe(false);
  });

  it("holds the way of asking to the size it was made at", () => {
    expect(readQuestion("FR1", KUNIATE_OUTLINE)).toBe("FR");
    expect(readQuestion("FR1", KUNIATE_FLAG)).toBeNull();
    expect(readQuestion("ZZ1", KUNIATE_OUTLINE)).toBeNull();
    expect(checkSolution("kuniate", KUNIATE_FLAG, "FR1", "FR").ok).toBe(false);
    expect(checkSolution("kuniate", 4, "FR1", "FR").ok).toBe(false);
  });

  it("ends lost only when all six are spent and none was the country", () => {
    expect(checkOutOfGuesses("kuniate", KUNIATE_OUTLINE, "FR1", "DEBEESITATCH").ok).toBe(true);
    expect(checkOutOfGuesses("kuniate", KUNIATE_OUTLINE, "FR1", "DEBEESITAT").ok).toBe(false);
    expect(checkOutOfGuesses("kuniate", KUNIATE_OUTLINE, "FR1", "DEBEESITATFR").ok).toBe(false);
  });

  it("reads a list of guesses only where each is a place on the list, once", () => {
    expect(readGuesses("")).toEqual([]);
    expect(readGuesses("JPFR")).toEqual(["JP", "FR"]);
    expect(readGuesses("JPJP")).toBeNull();
    expect(readGuesses("J")).toBeNull();
    expect(readGuesses("ZZ")).toBeNull();
  });

  it("points the way: from Paris to Tokyo the first step of the shortest route is north-east", () => {
    expect(compassPoint({ lat: 48.85, lon: 2.35 }, { lat: 35.69, lon: 139.69 })).toBe("ne");
    expect(compassPoint({ lat: 0, lon: 0 }, { lat: 10, lon: 0 })).toBe("n");
    expect(compassPoint({ lat: 0, lon: 0 }, { lat: 0, lon: -10 })).toBe("w");
    // Not knowing where a place is gives no direction at all, not a wrong one.
    expect(compassPoint(null, { lat: 0, lon: 0 })).toBeNull();
  });

  it("makes easy a part of medium, and medium a part of hard", () => {
    for (const code of KUNIATE_EASY) expect(KUNIATE_MEDIUM).toContain(code);
    for (const code of KUNIATE_MEDIUM) expect(KUNIATE_HARD).toContain(code);
    expect(KUNIATE_HARD.length).toBe(195);
  });
});

describe("kuniate: the list is held to the packages", () => {
  const moduleOf = (name: string, file: string) => join(process.cwd(), "node_modules", "@johnmorrisdotca", name, "dist", file);

  it("can guess every place on Kuni's list that has a point on the map, and nothing else", () => {
    const places = countries().map((place) => place.alpha2);
    expect([...KUNIATE_GUESSES].sort()).toEqual(places.filter((code) => facts(code)?.point != null || facts(code)?.capitalPoint != null).sort());
    expect(allFacts).toBeDefined();
  });

  it.each(KUNIATE_HARD)("%s, as an answer, has a name in both languages, a capital in both, a point on the map and an outline", (code) => {
    const place = country(code)!;
    expect(place.name.en.length).toBeGreaterThan(0);
    expect(place.name.ja.length).toBeGreaterThan(0);
    expect(place.capital?.en?.length).toBeGreaterThan(0);
    expect(place.capital?.ja?.length).toBeGreaterThan(0);
    expect(facts(code)?.point ?? facts(code)?.capitalPoint).toBeTruthy();
    expect(existsSync(moduleOf("chizu", `data/countries/${code.toLowerCase()}.js`)), `${code} has no outline`).toBe(true);
  });

  it.each(KUNIATE_HARD)("%s has a flag, or is listed as having none and never asked by one", async (code) => {
    const drawn = await flag(code);
    expect(drawn === null).toBe(KUNIATE_NO_FLAG.has(code));
    for (const level of ["easy", "medium", "hard"] as const) if (drawn === null) expect(kuniatePool(KUNIATE_FLAG, level)).not.toContain(code);
    if (drawn !== null) expect(existsSync(moduleOf("hata", `flags/${code.toLowerCase()}.js`))).toBe(true);
  });

  it("never names the published games in its copy", async () => {
    const { KUNIATE_DISPLAY } = await import("./kuniate.constants");
    expect(JSON.stringify(KUNIATE_DISPLAY)).not.toMatch(/worldle|globle|flagle/i);
    expect(KUNIATE_CAPITAL).toBe(3);
  });
});
