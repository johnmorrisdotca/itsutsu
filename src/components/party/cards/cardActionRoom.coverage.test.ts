import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A PRESS THAT NAMES A CARD KEEPS ROOM FOR THE LONGEST NAME.
 *
 * "Take the queen of diamonds" is a longer press than "Take the ten of clubs", and in Japanese the same card is shorter
 * again. A table's presses sit in a row that wraps, so a name that is long enough in English to push the row on to a second line, and
 * short enough in Japanese to keep it on one, moves everything under the row when the language changes (it
 * failed `e2e/language-steady.spec.ts` once on a random deal, 2026-11-02). A press whose label says a card's name
 * therefore gives itself `room`, a width that holds the longest label in either language, so the row wraps the same
 * whichever name is dealt and whichever language is read. This reads the adapters and fails for a press that names a card without it.
 */
const DIR = join(process.cwd(), "src/components/party/cards");
const adapters = readdirSync(DIR).filter((name) => /Adapter\.tsx$/.test(name));

describe("the presses of a card table", () => {
  it("found the adapters to read", () => {
    expect(adapters).toContain("ginRummyAdapter.tsx");
  });

  for (const name of adapters) {
    it(`${name}: a press that names a card keeps room for it`, () => {
      const lines = readFileSync(join(DIR, name), "utf8").split("\n");
      const bare = lines.flatMap((line, at) => (/\blabel:\s*say\.say\([^)]*cardNamed\(/.test(line) && !/\broom:/.test(line) ? [`${name}:${at + 1}: ${line.trim()}`] : []));
      expect(bare).toEqual([]);
    });
  }
});
