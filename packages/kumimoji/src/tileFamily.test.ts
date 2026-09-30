import { beforeAll, describe, expect, it } from "vitest";

import { familyKeyOf } from "./tileFamily.ts";
import { loadTileWords, tileWords } from "./tileWords.ts";
import { KANA_TILE_START, KANA_WILD_START } from "./tileFace.ts";

/** The dictionary-free family key answers every tile exactly as the loaded list's does. */
describe("a tile's family, without the word lists", () => {
  beforeAll(async () => {
    await loadTileWords("english");
    await loadTileWords("japanese");
  });

  it("is the list's own answer for every English tile, wild and letter, and nothing for anything else", () => {
    const family = familyKeyOf("english");
    const listed = tileWords("english").familyKey;
    for (const tile of ["*", ..."abcdefghijklmnopqrstuvwxyz", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "?", "1", "", "ab"]) expect(family(tile), tile).toBe(listed(tile));
  });

  it("is the list's own answer for every Japanese tile, wild and kana", () => {
    const family = familyKeyOf("japanese");
    const listed = tileWords("japanese").familyKey;
    const codes = Array.from({ length: 50 }, (_, at) => [String.fromCodePoint(KANA_TILE_START + at), String.fromCodePoint(KANA_WILD_START + at)]).flat();
    for (const tile of ["*", "a", ...codes]) expect(family(tile), tile.codePointAt(0)?.toString(16)).toBe(listed(tile));
  });
});
