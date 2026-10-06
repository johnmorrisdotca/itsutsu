import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PHRASE_AREAS, PHRASE_KEYS, PHRASES } from "./i18n.constants";

/**
 * The catalogue is one file per area, joined back into one `PHRASES`.
 *
 * Two things can go wrong in a join that TypeScript does not report: a key
 * said in two areas, where the later spread silently wins, and an area file
 * nobody joined, whose keys then exist nowhere. Both are held here.
 */
describe("the phrase catalogue, split by area", () => {
  it("says every key in exactly one area", () => {
    const seen = new Map<string, string>();
    const twice: string[] = [];
    for (const [area, phrases] of Object.entries(PHRASE_AREAS)) {
      for (const key of Object.keys(phrases)) {
        const was = seen.get(key);
        if (was) twice.push(`${key} (${was} and ${area})`);
        seen.set(key, area);
      }
    }
    expect(twice).toEqual([]);
    expect(PHRASE_KEYS.length).toBe(seen.size);
  });

  it("keeps each key under the area named by its first word", () => {
    const AREA_OF_WORD: Record<string, string> = { site: "site", nav: "site", account: "site" };
    for (const [area, phrases] of Object.entries(PHRASE_AREAS)) {
      for (const key of Object.keys(phrases)) {
        const word = key.split(".")[0];
        expect(AREA_OF_WORD[word] ?? word, `${key} is in the ${area} file`).toBe(area);
      }
    }
  });

  it("joins every phrases.<area>.constants.ts file", () => {
    const files = readdirSync(join("src", "lib", "i18n"))
      .map((name) => /^phrases\.([A-Za-z]+)\.constants\.ts$/.exec(name)?.[1])
      .filter((area): area is string => Boolean(area))
      .sort();
    expect(files).toEqual(Object.keys(PHRASE_AREAS).sort());
  });

  it("answers every key with a sentence", () => {
    for (const key of PHRASE_KEYS) expect(PHRASES[key].length, key).toBeGreaterThan(0);
  });
});
