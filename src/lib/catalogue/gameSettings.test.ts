import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GAME_FAMILIES, familyKeyOf, familyOf } from "../gomoku/families";
import { PUZZLE_SLUGS, gamePath, historyPath, joinQuery, mySolvePath, playPath, puzzleFor, rulesPath, setUpPath, standingsPath } from "../gomoku/slugs";
import { puzzleForAddress } from "./settingAddress";
import { PUZZLE_KIND_LIST } from "../puzzles/puzzles.constants";
import { formerSettingAddresses } from "./formerAddresses";
import { EVERY_GAME_KEY, EVERY_KIND_KEY, RECORDED_GAME_KEYS } from "./gameKeys";
import { GAME_SETTINGS, isSettingKind, kindOfAddress, kindOfSetting, listedGameOf, settingQuery, settingsOf } from "./gameSettings";

/**
 * ONE GOMOJI, ITS LANGUAGES AND WORD LISTS SETTINGS OF IT. John, 2026-09-28:
 * "just have 1 and allow language selection", then "this is the correct way
 * we should handle our language variants or corpus variants."
 */
describe("a language or a word list is a setting of a game", () => {
  it("lists one Gomoji in the catalogue and its family, and keeps every stored kind underneath", () => {
    const gomojis = EVERY_GAME_KEY.filter((key) => listedGameOf(key) === "gomoji");
    expect(gomojis).toEqual(["gomoji"]);
    expect(GAME_FAMILIES.flatMap((family) => family.games).filter((key) => key.startsWith("gomoji"))).toEqual(["gomoji"]);
    // Stored identities stay: every kind a run, a solve or a day's word is kept under.
    for (const kind of settingsOf("gomoji")) expect(EVERY_KIND_KEY).toContain(kind);
    expect(settingsOf("gomoji")).toEqual(["gomoji", "gomojiMot", "gomojiWort", "gomojiKana", "gomojiPop"]);
    expect(EVERY_KIND_KEY.length - EVERY_GAME_KEY.length).toBe(4);
  });

  it("puts every setting in its game's family, so a Kana solve still counts for Other", () => {
    for (const kind of settingsOf("gomoji")) {
      expect(familyOf(kind)?.key).toBe("other");
      expect(familyKeyOf(kind)).toBe("other");
    }
  });

  it("counts each language towards every game played, as each is stored (`XP_VARIANTS_TO_PLAY`)", () => {
    for (const kind of settingsOf("gomoji")) expect(RECORDED_GAME_KEYS).toContain(kind);
  });

  it("names a kind by its language and list, and has no French Pop culture", () => {
    expect(kindOfSetting("gomoji", "french", "everyday")).toBe("gomojiMot");
    expect(kindOfSetting("gomoji", "japanese", "everyday")).toBe("gomojiKana");
    expect(kindOfSetting("gomoji", "english", "pop")).toBe("gomojiPop");
    expect(kindOfSetting("gomoji", "french", "pop")).toBeNull();
    expect(isSettingKind("gomoji")).toBe(false);
    expect(isSettingKind("gomojiWort")).toBe(true);
    expect(isSettingKind("numberPlace")).toBe(false);
  });
});

describe("a setting's addresses", () => {
  it("puts it in the query of its game's address, never an address of its own", () => {
    expect(settingQuery("gomoji")).toBe("");
    expect(settingQuery("gomojiMot")).toBe("language=french");
    expect(settingQuery("gomojiPop")).toBe("list=pop");
    expect(gamePath("gomojiMot")).toBe("/games/gomoji");
    expect(rulesPath("gomojiKana")).toBe("/games/gomoji/rules");
    expect(playPath("gomojiMot")).toBe("/games/gomoji/play?language=french");
    expect(setUpPath("gomojiKana")).toBe("/games/gomoji/new?language=japanese");
    expect(standingsPath("gomojiPop")).toBe("/games/gomoji/standings?list=pop");
    expect(historyPath("gomojiWort")).toBe("/games/gomoji/history?language=german");
    expect(mySolvePath("gomojiMot", "abc")).toBe("/games/gomoji/me/abc?language=french");
    expect(playPath("gomoji")).toBe("/games/gomoji/play");
    expect(playPath("numberPlace")).toBe("/games/number-place/play");
  });

  it("joins a further query to an address with or without one", () => {
    expect(joinQuery("/games/gomoji/play", "?size=5")).toBe("/games/gomoji/play?size=5");
    expect(joinQuery("/games/gomoji/play?language=french", "?size=5")).toBe("/games/gomoji/play?language=french&size=5");
    expect(joinQuery("/games/gomoji/play?language=french", "")).toBe("/games/gomoji/play?language=french");
  });

  it("reads the kind back from the game's slug and its query", () => {
    expect(puzzleForAddress("gomoji", { language: "french" })).toBe("gomojiMot");
    expect(puzzleForAddress("gomoji", { list: "pop" })).toBe("gomojiPop");
    expect(puzzleForAddress("gomoji", {})).toBe("gomoji");
    // A list the language has not got plays the language's everyday words; a language nobody offers plays English.
    expect(puzzleForAddress("gomoji", { language: "french", list: "pop" })).toBe("gomojiMot");
    expect(puzzleForAddress("gomoji", { language: "klingon" })).toBe("gomoji");
    // Kumimoji's own language choice is its own, never a Gomoji's.
    expect(kindOfAddress("kumimoji", { language: "japanese" })).toBe("kumimoji");
    // The old slugs name nothing: they are led on by the router (`formerAddresses.ts`).
    for (const kind of settingsOf("gomoji").filter(isSettingKind)) expect(puzzleFor(PUZZLE_SLUGS[kind])).toBeNull();
  });

  it("leads every old address, and everything under it, to the one Gomoji with its setting, for good", () => {
    const former = formerSettingAddresses();
    expect(former).toContainEqual({ source: "/games/gomoji-mot", destination: "/games/gomoji?language=french", permanent: true });
    expect(former).toContainEqual({ source: "/games/gomoji-kana/:rest*", destination: "/games/gomoji/:rest*?language=japanese", permanent: true });
    expect(former).toContainEqual({ source: "/games/pop-gomoji/:rest*", destination: "/games/gomoji/:rest*?list=pop", permanent: true });
    expect(former).toHaveLength(8);
  });
});

/** Every source file under a folder. */
function sourcesUnder(folder: string): string[] {
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name));
}

describe("nothing on the site leads to the old addresses", () => {
  /* The table of slugs keeps them for the router's redirects and download names; this file and the redirects' own say them to test them. */
  const ALLOWED = new Set(["src/lib/gomoku/slugs.ts", "src/lib/catalogue/formerAddresses.ts", "src/lib/catalogue/gameSettings.test.ts"]);
  it("has no page, component or spec that names one", () => {
    const old = settingsOf("gomoji").filter(isSettingKind).map((kind) => PUZZLE_SLUGS[kind]);
    const naming = [...sourcesUnder("src"), ...sourcesUnder("e2e")]
      .filter((file) => !ALLOWED.has(file))
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return old.some((slug) => source.includes(`/${slug}`) || source.includes(`"${slug}"`));
      });
    expect(naming, "an old Gomoji address: build it with playPath, setUpPath and the rest, which carry the setting").toEqual([]);
  });

  it("keeps a setting for every Gomoji kind, and none for any other puzzle", () => {
    for (const kind of PUZZLE_KIND_LIST) expect(GAME_SETTINGS[kind] !== undefined).toBe(kind.startsWith("gomoji"));
  });
});
