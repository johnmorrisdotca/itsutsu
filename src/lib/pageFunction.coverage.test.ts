import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { chainTo, pageRoots, reachOf, sourceGraph } from "./pageFunctionGraph";

/*
 * THE PAGES' SERVER FUNCTION CARRIES ONLY WHAT A SERVER READS.
 *
 * Every page is one function on Vercel, and on 2026-09-30 it stood at 38.2 MB
 * of a 40 MB ceiling (`functionSizeGate.mjs`), having held a deploy at 40.3
 * the day before. 18.4 MB of it is Prisma's engine and cannot be cut here.
 * Of the rest, 4.2 MB was there for no reader: word lists a browser fetches,
 * compiled into the server's copy of the components that fetch them; every
 * list a race's checks read, carried by the two pages that only read a race;
 * and a validation library the set-up screen named three constants through.
 *
 * `pnpm functions:size` measures the result, but only in the deploy job. These
 * read the same reach from the imports (`pageFunctionGraph.ts`), so what put
 * the megabytes there fails here, by name, before a push.
 */

const files = sourceGraph();
const reach = reachOf(pageRoots());
const reached = [...reach.keys()];

/*
 * A LIST'S SERVER READER: a module that imports a `.data` file where there is
 * no browser. A page that reaches one carries what it reads. These are the
 * readers a page has a use for, each with the use.
 */
const READERS_A_PAGE_USES: ReadonlyMap<string, string> = new Map([
  [
    "src/lib/puzzles/gomojiKana/kanaWordsModule.ts",
    "A kana dodger's word is replayed from its list on the page of one solve and on a member's own page (PuzzleSolvePage, PuzzleMePage).",
  ],
  [
    "src/lib/puzzles/tsunagi/levelsModule.ts",
    "Which Tsunagi levels a member has solved, and a level's fastest times, are read from the levels on the set-up and play pages (tsunagiRecords.ts).",
  ],
  [
    "src/lib/puzzles/dailyWords/dailyPoolsModule.ts",
    "Today's words, a day's page and the archive are printed by the server from the kana pools.",
  ],
]);

/*
 * A BIG FILE IN EVERY PAGE'S FUNCTION IS A DECISION. Each of these is over
 * `BIG_FILE_BYTES` of source (64 KB: past any file of copy but one, and under
 * every word list but the shortest) and is reached by a page's server build;
 * each says what the server prints from it. A new table, word list or level file
 * that lands in page code fails here until it is either loaded in the browser
 * only or written down with its reason.
 */
const BIG_FILE_BYTES = 64 * 1024;
const BIG_FILES_A_PAGE_PRINTS: ReadonlyMap<string, string> = new Map([
  ["src/lib/puzzles/puzzles.constants.ts", "Every puzzle's name, rules and sizes, printed by its page, its rules page and every list of games."],
]);

/*
 * THE GAME PACKAGES (`@johnmorrisdotca/…`): a game's rules, deck, dice or
 * board arriving as a dependency. A package a page's server build reaches is
 * compiled into the function whole. A play screen is loaded in the browser
 * only (`dynamic`, `ssr: false`), which keeps its package out; a page that
 * prints from a package on the server names the import here, with what it
 * prints.
 */
const GAME_PACKAGE = /^@johnmorrisdotca\//;
const GAME_PACKAGES_A_PAGE_PRINTS: ReadonlyMap<string, string> = new Map<string, string>([
  /*
   * Hitotsu, 168 KB whole (1.0.1). The rules page prints its sizes and its
   * house rules; a table played on several devices is read and drawn on the
   * server like the older tables; and the Colour cards family mark is one of
   * its cards. Its play screen at one device is loaded in the browser only.
   */
  ["@johnmorrisdotca/hitotsu", "Sizes and rules for the rules page, and the several-devices table read on the server."],
  ["@johnmorrisdotca/hitotsu/react", "The Colour cards family mark, and the several-devices table drawn on the server."],
  /*
   * Kyuubu, 124 KB whole (1.0.1). The server checks a finished cube by
   * replaying its turns, as it checks every puzzle (`puzzles.constants.ts`);
   * the Learn guide draws each stage's cube; and a finished solve's page
   * replays it.
   */
  ["@johnmorrisdotca/kyuubu", "The server's check of a finished cube, the Learn guide's stages, and a finished solve's replay."],
  ["@johnmorrisdotca/kyuubu/react", "The cube drawn in the Learn guide."],
  /*
   * Tenka (260 KB) and Kumimoji (0.4 MB without its two word lists) were the
   * site's own modules, read and drawn on the server like the other older
   * tables, and the paths they had forward to the packages now. Kumimoji's
   * lists (1.3 MB) load behind `typeof window`, which holds only because
   * `next.config.ts` compiles both packages as the site's own code
   * (`transpilePackages`); the function's measured size is what says it still
   * does.
   */
  ["@johnmorrisdotca/tenka", "Tenka's rules and map for its rules page, a kept game and a table read on the server."],
  ["@johnmorrisdotca/tenka/shapes", "The map's outlines, drawn on the server for the table's first paint."],
  ["@johnmorrisdotca/kumimoji", "Kumimoji's tiles, judging and tables for its pages, as before it was a package; never its word lists."],
  /* Tane, 48 KB whole (1.0.1): the seeded random and the day's seed, which the server needs to name a daily puzzle and to check a game's dice. */
  ["@johnmorrisdotca/tane", "The seeded random and the daily seed, used by the server as by the browser."],
  /*
   * Toranpu, 620 KB whole (1.1.0): the deck and ten card games. A kept card
   * game's page and a rules page print from a game's rules, and the Cards
   * family mark is drawn from the deck; the tables themselves are loaded in
   * the browser only. The measured function says what this costs.
   */
  ["@johnmorrisdotca/toranpu", "A card game's rules for its rules page and for a kept game read on the server."],
  ["@johnmorrisdotca/toranpu/deck", "The cards drawn in the Cards and Tricks family marks."],
  ["@johnmorrisdotca/toranpu/klondike", "Solitaire's rules: a kept or finished game replayed and checked on the server, and a day's deal named."],
  ["@johnmorrisdotca/toranpu/freecell", "FreeCell's rules: a kept or finished game replayed and checked on the server, and a day's deal named."],
  ["@johnmorrisdotca/domino", "Mexican Train's rules: its rules page prints the sets, and a table played on several devices is read and drawn on the server."],
  ["@johnmorrisdotca/kotoba", "Marking a guess, scoring and the kana marks, for a finished word puzzle replayed and checked on the server; no word list (each is an entry of its own)."],
  ["@johnmorrisdotca/kotoba/kana-3", "Read by kanaWordsModule.ts, which the readers above give the reason for."],
  ["@johnmorrisdotca/kotoba/kana-4", "Read by kanaWordsModule.ts."],
  ["@johnmorrisdotca/kotoba/kana-5", "Read by kanaWordsModule.ts."],
  ["@johnmorrisdotca/kotoba/pop-answers", "Pop Gomoji's answers and their categories (18 KB), whose category is the clue printed with a day's pop word."],
  ["@johnmorrisdotca/toranpu/spider", "Spider's rules: a kept or finished game replayed and checked on the server, and a day's deal named."],
  ["@johnmorrisdotca/jarajara", "Mahjong's tiles and layouts: a layout's size and tile count in the puzzle's specs and its rules page, and a finished game's board drawn on its page (MahjongBoard.tsx)."],
  ["@johnmorrisdotca/jarajara/awase", "Mahjong's deal and check: a kept or finished game dealt again from its seed (generate.ts), and a solve checked on the server before it pays (puzzleCheck.ts)."],
  ["@johnmorrisdotca/jarajara/table", "Mahjong at a table: how many players a kept table's address asks for (puzzleAddress.ts)."],
  ["@johnmorrisdotca/tsunagi", "Tsunagi's rules: a kept or finished level replayed and checked on the server, and a level's board drawn in its set-up preview and on its finished page."],
  ["@johnmorrisdotca/tsunagi/renumbered", "Where each old level went (2 KB), for a browser's own record of its solves moved to the new numbers (`tsunagiKept.ts`), reached through the set-up screen."],
  ["@johnmorrisdotca/tsunagi/levels-4", "Read by levelsModule.ts: the server checks a solve against the level it names, and lists who solved which level."],
  ["@johnmorrisdotca/tsunagi/levels-5", "Read by levelsModule.ts."],
  ["@johnmorrisdotca/tsunagi/levels-6", "Read by levelsModule.ts."],
  ["@johnmorrisdotca/tsunagi/levels-7", "Read by levelsModule.ts."],
  ["@johnmorrisdotca/tsunagi/levels-8", "Read by levelsModule.ts."],
  ["@johnmorrisdotca/tsunagi/levels-9", "Read by levelsModule.ts."],
  ["@johnmorrisdotca/tsunagi/levels-10", "Read by levelsModule.ts."],
  ["@johnmorrisdotca/tsunagi/levels-11", "Read by levelsModule.ts."],
  ["@johnmorrisdotca/tsunagi/levels-12", "Read by levelsModule.ts."],
  ["@johnmorrisdotca/toranpu/card-backs", "The backs a reader may choose, reached by every face-down card a finished patience game's replay draws; about 11 KB, and the server draws only the Itsutsu back."],
]);

/*
 * A PACKAGE THE SERVER RUNS WHOLE, every module of it, named once rather than
 * a line a module. Narabe (740 KB built, 1.0.0) is the rules engine: the
 * server replays every move of every board game through it, to refuse an
 * illegal one and to settle a result, as it did when the engine was
 * `src/lib/gomoku`. Nothing about it is a play screen to load in the browser
 * only. One entry here, and the measured function says what it costs.
 */
const GAME_PACKAGES_THE_SERVER_RUNS: ReadonlyMap<string, string> = new Map<string, string>([
  ["@johnmorrisdotca/narabe", "The rules engine: the server replays and settles every board game through it."],
]);

/** Whether a package import is written down: by its own name, or as a module of a package the server runs whole. */
function writtenDown(spec: string): boolean {
  if (GAME_PACKAGES_A_PAGE_PRINTS.has(spec)) return true;
  return [...GAME_PACKAGES_THE_SERVER_RUNS.keys()].some((name) => spec === name || spec.startsWith(`${name}/`));
}

/*
 * THE TABLES DRAWN ON THE SERVER. A party game's table reads a game kept in
 * the browser, so the server has nothing to draw, and loading it in the
 * browser only keeps its rules and its computer player out of the function:
 * Mexican Train, Yacht, Pachisi and every card game are loaded so
 * (`trainClient.tsx`, `yachtClient.tsx`, `pachisiClient.tsx`,
 * `cardTableClient.tsx`). These eight came before that and still are drawn
 * on the server: 0.3 MB between them, measured 2026-09-30 by loading all
 * eight in the browser only, which was not worth changing what eight play
 * screens first paint. A new table is not added to this list.
 */
const TABLES_DRAWN_ON_THE_SERVER: ReadonlySet<string> = new Set([
  "DotsGame",
  "GhostGame",
  "MancalaGame",
  "TenkaTable",
  "PartyCheckersGame",
  "PairGoGame",
  "PartyHalmaGame",
  "PartyBlocksGame",
]);
const TABLE_FILES = ["src/components/party/partyKindTables.ts", "src/components/party/partyTables.ts"];

// A word list is a `.data` file of ours, or one of Kotoba's lists, each an entry point of its own (`@johnmorrisdotca/kotoba/kana-5`), and so is each size of Tsunagi's levels (`@johnmorrisdotca/tsunagi/levels-7`).
const isData = (spec: string) => /\.data$/.test(spec) || /^@johnmorrisdotca\/kotoba\/(words|kana|pop)-/.test(spec) || /^@johnmorrisdotca\/tsunagi\/levels-/.test(spec);

describe("the pages' server function", () => {
  it("fetches a list in the browser only, or reads it in a module of its own", () => {
    const offenders = [...files.values()]
      .filter((file) => file.serverDynamic.some(isData) && file.browserDynamic.length > 0)
      .map((file) => `${file.path} imports ${file.serverDynamic.filter(isData).join(", ")} outside its typeof window branch`);
    expect(offenders).toEqual([]);
  });

  it("reaches a list's server reader only where a page reads the list", () => {
    const readers = reached.filter((path) => files.get(path)?.serverDynamic.some(isData));
    const unexpected = readers.filter((path) => !READERS_A_PAGE_USES.has(path)).map((path) => chainTo(reach, path));
    expect(unexpected, "a page reaches a module that reads a list on the server, so every page's function carries the list").toEqual([]);
    for (const path of READERS_A_PAGE_USES.keys()) expect(readers, `${path} is no longer reached by a page; take it off the list`).toContain(path);
  });

  it("carries no big file nobody wrote down", () => {
    const big = reached.filter((path) => (files.get(path)?.bytes ?? 0) > BIG_FILE_BYTES);
    const unexpected = big.filter((path) => !BIG_FILES_A_PAGE_PRINTS.has(path)).map((path) => `${Math.round(files.get(path)!.bytes / 1024)} KB  ${chainTo(reach, path)}`);
    expect(unexpected).toEqual([]);
    for (const path of BIG_FILES_A_PAGE_PRINTS.keys()) expect(big, `${path} is no longer a big file a page reaches; take it off the list`).toContain(path);
  });

  it("carries no game package nobody wrote down", () => {
    const imports = reached.flatMap((path) => (files.get(path)?.packages ?? []).filter((spec) => GAME_PACKAGE.test(spec)).map((spec) => ({ path, spec })));
    const unexpected = imports.filter(({ spec }) => !writtenDown(spec)).map(({ path, spec }) => `${spec}  ${chainTo(reach, path)}`);
    expect(unexpected, "load the play screen with dynamic(…, { ssr: false }), or name the import with what a page prints from it").toEqual([]);
    const seen = new Set(imports.map(({ spec }) => spec));
    for (const spec of GAME_PACKAGES_A_PAGE_PRINTS.keys()) expect(seen, `${spec} is no longer reached by a page; take it off the list`).toContain(spec);
    for (const name of GAME_PACKAGES_THE_SERVER_RUNS.keys()) expect([...seen].some((spec) => spec === name || spec.startsWith(`${name}/`)), `${name} is no longer reached by a page; take it off the list`).toBe(true);
  });

  it("keeps zod out of everything a browser is sent", () => {
    const client = reachOf([...files.values()].filter((file) => file.client).map((file) => file.path));
    const offenders = [...client.keys()].filter((path) => files.get(path)?.packages.includes("zod")).map((path) => chainTo(client, path));
    expect(offenders, "a client component reaches a request schema; name the plain value from its constants module instead").toEqual([]);
  });

  it("loads a new party table in the browser only", () => {
    for (const path of TABLE_FILES) {
      const source = readFileSync(resolve(__dirname, "../..", path), "utf8");
      const drawn = [...source.matchAll(/\bGame:\s*([A-Z][A-Za-z]+)\s*[,}]/g)].map((match) => match[1]!);
      const passed = [...source.matchAll(/cardTable\(\s*"[a-zA-Z]+",\s*([A-Z][A-Za-z]+)/g)].map((match) => match[1]!);
      const tables = [...new Set([...drawn, ...passed])];
      expect(tables.length, `${path} names no table; this check has stopped reading it`).toBeGreaterThan(0);
      for (const name of tables) {
        if (TABLES_DRAWN_ON_THE_SERVER.has(name)) continue;
        const from = new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "(\\.[^"]+)"`).exec(source)?.[1];
        expect(from, `${name} in ${path} is not imported by name from a file beside it`).toBeDefined();
        const home = `${join(dirname(path), from!)}.tsx`;
        const loader = files.get(home);
        expect(loader, `${name} comes from ${home}, which is not a file`).toBeDefined();
        const text = readFileSync(resolve(__dirname, "../..", home), "utf8");
        expect(loader!.client && /\bssr:\s*false\b/.test(text), `${name} (${home}) is drawn on the server; load it with dynamic(…, { ssr: false }) as yachtClient.tsx does`).toBe(true);
        // And the loader itself brings no table into the server's build: what it reaches is copy and types.
        const beside = loader!.reaches.filter((file) => file.startsWith(dirname(home)) && /\.tsx$/.test(file));
        expect(beside, `${home} imports a component outright; only a dynamic(…, { ssr: false }) load keeps it out of the server`).toEqual([]);
      }
    }
  });

  it("names only tables that are still drawn on the server", () => {
    const sources = TABLE_FILES.map((path) => readFileSync(resolve(__dirname, "../..", path), "utf8")).join("\n");
    for (const name of TABLES_DRAWN_ON_THE_SERVER) expect(sources, `${name} is no longer a table; take it off the list`).toMatch(new RegExp(`\\bGame:\\s*${name}\\b`));
  });

  /*
   * THE HEADER'S READS, NAMED BY THE ROOT LAYOUT. The build keeps one copy of
   * what the root layout reaches and shares it with every page; what only the
   * pages reach it copies once for each group of pages it splits them into,
   * eleven of them on 2026-09-30. Every page draws the header, so the layout
   * names what the header reads (`headerCounts.ts`: My games, the record, the
   * points, and the validation they parse with), and that is one copy and not
   * eleven: 1.4 MB of the function. Nothing is drawn or run by the import.
   */
  it("has the root layout name what the header reads", () => {
    const layout = files.get("src/app/layout.tsx");
    expect(layout?.reaches).toContain("src/lib/history/headerCounts.ts");
  });
});
