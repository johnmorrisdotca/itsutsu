import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EVERY_GAME_KEY } from "../catalogue/gameKeys";
import { gamePath } from "../gomoku/slugs";

import { filesNamedIn } from "./keepAll";
import { offlineGameAddresses } from "./offlineGames";
import { KEEPER_SCRIPT, KEPT_FILES_CACHE, KEPT_PAGES_CACHE, KEPT_PICTURES_CACHE, OFFLINE_PAGE, keptGamesFrom } from "./offlineKeeper";

describe("keptGamesFrom", () => {
  it("names each game held by the address it is played at, the latest kept, with no seed", () => {
    const kept = keptGamesFrom([
      "https://itsutsu.com/games/renju/play",
      "https://itsutsu.com/games/sudoku/play?size=9&level=easy&seed=123",
      "https://itsutsu.com/games/sudoku/play?size=6&level=hard",
      "https://itsutsu.com/games/hearts/pass-and-play",
    ]);
    expect(Object.fromEntries(kept)).toEqual({
      "/games/renju": "/games/renju/play",
      "/games/sudoku": "/games/sudoku/play?size=6&level=hard",
      "/games/hearts": "/games/hearts/pass-and-play",
    });
  });

  it("holds no race, and no page that is not where a game is played", () => {
    const kept = keptGamesFrom([
      "https://itsutsu.com/games/sudoku/play?race=abc",
      "https://itsutsu.com/games/renju",
      "https://itsutsu.com/games",
      "https://itsutsu.com/offline.html",
      "https://itsutsu.com/games/renju/match/x",
    ]);
    expect(kept.size).toBe(0);
  });
});

/*
 * The keeper is served as it is, from public/, so it cannot import the names
 * the pages read its keeping by. This holds the two spellings together: a
 * cache renamed on one side and not the other is a games list that never
 * marks anything, with nothing failing.
 */
describe("the keeper and the pages agree", () => {
  const keeper = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");
  const offline = readFileSync(join(process.cwd(), "public", "offline.html"), "utf8");

  it("keeps its pages where the pages read them", () => {
    const version = /const VERSION = "(v\d+)";/.exec(keeper)?.[1];
    expect(`itsutsu-pages-${version}`).toBe(KEPT_PAGES_CACHE);
    expect(`itsutsu-files-${version}`).toBe(KEPT_FILES_CACHE);
    expect(`itsutsu-pictures-${version}`).toBe(KEPT_PICTURES_CACHE);
    expect(offline).toContain(`caches.open("${KEPT_PAGES_CACHE}")`);
  });

  it("answers with the offline page this module names, at the address this module registers", () => {
    expect(keeper).toContain(`const OFFLINE_PAGE = "${OFFLINE_PAGE}";`);
    expect(KEEPER_SCRIPT).toBe("/sw.js");
  });

  it("never answers the site's API from what it kept", () => {
    expect(keeper).toContain('if (url.pathname.startsWith("/api/")) return;');
  });
});

describe("keeping every game at once", () => {
  const keeper = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");
  const keptPage = new RegExp(/const KEPT_PAGE = \/(.*)\/;/.exec(keeper)![1]);
  const most = Number(/\[PAGES\]: (\d+)/.exec(keeper)![1]);

  it("asks for only pages the keeper keeps, and no more than it keeps at once", () => {
    const addresses = offlineGameAddresses();
    expect(addresses.filter((address) => !keptPage.test(new URL(address, "https://x.invalid").pathname))).toEqual([]);
    expect(new Set(addresses).size).toBe(addresses.length);
    expect(addresses.length).toBeLessThan(most);
  });

  it("marks every game in the catalogue Ready offline once they are all kept", () => {
    const kept = keptGamesFrom(offlineGameAddresses().map((address) => `https://itsutsu.com${address}`));
    expect(EVERY_GAME_KEY.filter((key) => !kept.has(gamePath(key)))).toEqual([]);
  });

  it("reads the files a page names, in its tags and in the router's data", () => {
    const html = `<script src="/_next/static/chunks/a1.js"></script><link href="/_next/static/css/b2.css">"static/chunks/c3.js",\\"static/media/d4.woff2\\"`;
    expect(filesNamedIn(html).sort()).toEqual(["/_next/static/chunks/a1.js", "/_next/static/chunks/c3.js", "/_next/static/css/b2.css", "/_next/static/media/d4.woff2"]);
  });
});
