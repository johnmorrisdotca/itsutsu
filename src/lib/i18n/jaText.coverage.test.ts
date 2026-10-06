import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { chainTo, pageRoots, reachOf, sourceGraph } from "../pageFunctionGraph";

import { jaBack } from "./copyJa.types";
import { JA_DRAFTED } from "./dictionaries/ja.drafted.constants";
import { FATAL_MOVE_COPY_JA, OUTLOOK_COPY_JA } from "./dictionaries/analysis.ja.constants";
import { ALSO_LISTED_COPY_JA, FAMILY_COPY_JA } from "./dictionaries/families.ja.constants";
import { rulesAttributionJa } from "./dictionaries/attribution.ja.constants";
import { BOT_COPY_JA } from "./dictionaries/bots.ja.constants";
import { HANDICAP_COPY_JA, OPENING_COPY_JA, SECOND_STONE_COPY_JA } from "./dictionaries/openings.ja.constants";
import { VARIANT_COPY_JA } from "./dictionaries/variants.ja.constants";
import { PUZZLE_COPY_JA } from "./dictionaries/puzzles.ja.constants";
import { overlayLines } from "./copyTable";
import { buildCopyText, buildPhraseText, jaTextJson, PUZZLE_TABLES_AUTHORED } from "./jaText.build";
import { loadJaText } from "./jaText.data";
import { packText, unpackText } from "@/lib/packed/pack";
import { LEVEL_NAMES_JA } from "../xp/levelNames.ja.constants";
import { IMPORTED_VOLUME_COPY_JA, XP_AWARD_COPY_JA } from "../xp/xpAwardCopy.ja.constants";

/*
 * THE JAPANESE A BROWSER AND A PAGE ARE GIVEN IS THE TEXT, AND ONLY THE TEXT.
 *
 * Each sentence of Japanese is authored beside what it literally says in
 * English (`back`), who read it (`review`) and what a person still has to
 * decide (`ask`), so John can see what he publishes without reading it. Those
 * strings used to travel with the sentences: `LocaleProvider` imported the whole
 * dictionary and every client component that drew a game's rules reached the
 * sibling tables, so every browser downloaded the Japanese, and the review notes
 * on it, to read English; and every page's function carried the same.
 *
 * Now a reader's words are one generated file of text alone
 * (`jaText.generated.json.br`), read by a server for a reader of Japanese and handed
 * to a browser by `JaLocale`, and not otherwise. This holds both halves of that:
 * the generated file is what the authored files say, and nothing a browser or a
 * page can reach contains a back-translation.
 *
 * `pnpm i18n:text` rewrites the file from the authored files.
 */

const ROOT = resolve(__dirname, "../../..");
const TEXT_FILE = "src/lib/i18n/jaText.generated.json.br";

describe("the Japanese a reader is given", () => {
  if (process.env.JA_TEXT_WRITE === "1") {
    it("is rewritten from the authored files (pnpm i18n:text)", () => {
      // A file that already unpacks to these words stays as it is: Brotli's bytes can differ between Node's builds, and a rewrite would show as a change nobody made.
      const json = jaTextJson(buildPhraseText(), buildCopyText());
      const now = existsSync(resolve(ROOT, TEXT_FILE)) ? unpackText(readFileSync(resolve(ROOT, TEXT_FILE))) : null;
      if (now !== json) writeFileSync(resolve(ROOT, TEXT_FILE), packText(json));
    });
    return;
  }

  it("is the text of the authored phrases and of the authored copy beside the games, the computer players, the families, the levels and the awards, none left out and none left over", () => {
    expect(unpackText(readFileSync(resolve(ROOT, TEXT_FILE))), "run `pnpm i18n:text`: the authored Japanese and what a reader is given have come apart").toBe(jaTextJson(buildPhraseText(), buildCopyText()));
    const text = loadJaText();
    expect(text.phrases).toEqual(buildPhraseText());
    expect({ ...text, phrases: undefined }).toEqual({ ...buildCopyText(), phrases: undefined });
  });

  it("gives a reader every sentence of the puzzles' Japanese, and nothing else: a line for a line, with no back-translation, review or question", () => {
    const puzzles = loadJaText().puzzles;
    const authored = [...Object.values(PUZZLE_COPY_JA), ...Object.values(PUZZLE_TABLES_AUTHORED)].flatMap((ja) => overlayLines(ja).map(({ line }) => line[0]));
    const given: string[] = [];
    const keys = new Set<string>();
    const walk = (value: unknown): void => {
      if (typeof value === "string") given.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (typeof value === "object" && value !== null) {
        for (const [key, inner] of Object.entries(value)) {
          keys.add(key);
          if (key !== "by") walk(inner);
        }
      }
    };
    walk(puzzles.copy);
    walk(puzzles.tables);
    expect(given.length, "a table's lines are all in the text").toBe(authored.length);
    expect(given.slice().sort()).toEqual(authored.slice().sort());
    expect([...keys].filter((key) => key === "review" || key === "ask" || key === "back")).toEqual([]);
  });

  it("names the attribution paragraphs' puzzles by a mark the page fills in, and nothing else is left unfilled", () => {
    const paragraphs = loadJaText().attribution;
    expect(paragraphs.length).toBeGreaterThan(0);
    const marks = paragraphs.flatMap((paragraph) => [...paragraph.matchAll(/\{puzzle\.(\w+)\}/g)].map((match) => match[1]!));
    expect(marks.length, "the last paragraph names puzzles").toBeGreaterThan(0);
    // Filling each mark with the puzzle's kanji gives the paragraphs the authored function gives for the real names.
    const real = rulesAttributionJa((kind) => ({ ja: `«${kind}»`, en: `«${kind}»` })).paragraphs.map((line) => line[0]);
    expect(paragraphs.map((paragraph) => paragraph.replace(/\{puzzle\.(\w+)\}/g, (_, kind: string) => `«${kind}»`))).toEqual(real);
  });
});

/*
 * WHO CAN REACH THE REVIEW DATA. A browser is sent what a client component
 * imports, and a page's function is built from what a page imports, so both are
 * read from the imports (`pageFunctionGraph.ts`), as `pageFunction.coverage.test.ts`
 * reads the function's size.
 *
 * The browser's reach leaves out the one module it does not have:
 * `jaText.server.ts`, which `next.config.ts` swaps for an empty module in a
 * browser build. The words reach a browser as a prop of `JaLocale`, handed down
 * by the root layout, and no module a browser imports holds them: one that did
 * would be named by the layout's entry and sent with every page, English or not.
 * The server's reach keeps the loader; what it must never reach is the authored
 * files.
 */

const files = sourceGraph();

/** The modules the Japanese is authored in, with its back-translations, and what reads them to build or to review. */
const REVIEW_SIDE = (path: string) =>
  path.startsWith("src/lib/i18n/dictionaries/") ||
  /\.ja\.(?:\w+\.)?constants\.ts$/.test(path) ||
  [
    "src/lib/i18n/dictionaries.review.ts",
    "src/lib/i18n/jaText.build.ts",
    "src/lib/i18n/japaneseReview.ts",
    "src/lib/i18n/gameCopyReview.ts",
    "src/lib/i18n/japaneseCopyTables.ts",
  ].includes(path);

/** The module that reads the text a reader of Japanese is shown. */
const TEXT_SIDE = (path: string) => path === "src/lib/i18n/jaText.data.ts";

const SWAPPED_FOR_A_BROWSER = "src/lib/i18n/jaText.server.ts";
const WHERE_A_BROWSER_IS_GIVEN_JAPANESE = "src/components/i18n/JaLocale.tsx";
const LAYOUT = "src/app/layout.tsx";

/** What a browser is sent: everything a client component imports, less what the build leaves out of a browser. */
function browserReach(): Map<string, string | null> {
  const roots = [...files.values()].filter((file) => file.client).map((file) => file.path);
  const from = new Map<string, string | null>(roots.map((root) => [root, null]));
  const queue = [...roots];
  for (let at = 0; at < queue.length; at += 1) {
    for (const next of files.get(queue[at]!)?.reaches ?? []) {
      if (from.has(next) || next === SWAPPED_FOR_A_BROWSER) continue;
      from.set(next, queue[at]!);
      queue.push(next);
    }
  }
  return from;
}

/**
 * Every authored sentence with what it says in English, as the source spells them (no quote, backslash or line
 * break to be escaped). A module LEAKS the review data when it holds a sentence and its back-translation both:
 * an English module that merely says the same words as a back-translation does not.
 */
function sentencesWithBacks(): { ja: string; back: string }[] {
  const pairs: { ja: string; back: string }[] = [];
  for (const phrase of Object.values(JA_DRAFTED)) if (phrase !== undefined) pairs.push({ ja: phrase.text, back: phrase.back });
  const line = (entry: readonly [string, string]) => pairs.push({ ja: entry[0], back: jaBack(entry) });
  for (const ja of Object.values(VARIANT_COPY_JA)) [ja.tagline, ja.origin, ja.board, ...ja.rules].forEach(line);
  for (const ja of Object.values(OPENING_COPY_JA)) [ja.tagline, ...ja.rules].forEach(line);
  for (const ja of Object.values(HANDICAP_COPY_JA)) [ja.description, ja.from].forEach(line);
  for (const ja of Object.values(SECOND_STONE_COPY_JA)) line(ja.label);
  for (const ja of Object.values(BOT_COPY_JA)) [ja.strength, ja.blurb, ja.bio].forEach(line);
  for (const ja of Object.values(FAMILY_COPY_JA)) line(ja.blurb);
  for (const ja of Object.values(ALSO_LISTED_COPY_JA)) line(ja.why);
  for (const ja of Object.values(OUTLOOK_COPY_JA)) [ja.label, ja.detail].forEach(line);
  [FATAL_MOVE_COPY_JA.label, FATAL_MOVE_COPY_JA.detail].forEach(line);
  rulesAttributionJa((kind) => ({ ja: kind, en: kind })).paragraphs.forEach(line);
  for (const ja of [...Object.values(PUZZLE_COPY_JA), ...Object.values(PUZZLE_TABLES_AUTHORED)]) for (const { line: pair } of overlayLines(ja)) line(pair);
  for (const row of LEVEL_NAMES_JA) pairs.push({ ja: row.name, back: row.back });
  for (const row of [...Object.values(XP_AWARD_COPY_JA), ...Object.values(IMPORTED_VOLUME_COPY_JA)]) pairs.push({ ja: row.blurb, back: row.back });
  const plain = (text: string) => !/["\\\n]/.test(text);
  return pairs.filter(({ ja, back }) => back.length >= 20 && plain(back) && plain(ja));
}

describe("where the back-translations can be reached from", () => {
  const pairs = sentencesWithBacks();
  const browser = browserReach();
  const server = reachOf([...pageRoots(), ...[...files.keys()].filter((path) => /^src\/app\/.*\/route\.ts$/.test(path))]);

  const reachedWith = (reach: Map<string, string | null>, wanted: (path: string) => boolean) =>
    [...reach.keys()].filter(wanted).map((path) => chainTo(reach, path));

  it("has authored sentences to look for", () => {
    expect(pairs.length, "this check has stopped reading the authored files").toBeGreaterThan(500);
  });

  it("sends a browser none of the authored Japanese, its review data or the builder", () => {
    expect(reachedWith(browser, REVIEW_SIDE), "a browser module imports a file that carries back-translations; read the words through jaText() instead").toEqual([]);
  });

  it("sends a browser the text of the Japanese by no import at all", () => {
    expect(reachedWith(browser, TEXT_SIDE), "a browser module imports the Japanese itself; every English reader would download it").toEqual([]);
  });

  it("keeps a back-translation out of every module a browser is sent", () => {
    const offenders = [...browser.keys()].filter((path) => {
      const text = readFileSync(resolve(ROOT, path), "utf8");
      return pairs.some(({ ja, back }) => text.includes(back) && text.includes(ja));
    });
    expect(offenders.map((path) => chainTo(browser, path))).toEqual([]);
  });

  it("keeps the authored Japanese out of every page's and route's function", () => {
    expect(reachedWith(server, REVIEW_SIDE), "a page or route imports a file that carries back-translations; it carries them in every function").toEqual([]);
  });

  it("keeps a back-translation out of every module a page's function is built from", () => {
    const offenders = [...server.keys()].filter((path) => {
      const text = readFileSync(resolve(ROOT, path), "utf8");
      return pairs.some(({ ja, back }) => text.includes(back) && text.includes(ja));
    });
    expect(offenders.map((path) => chainTo(server, path))).toEqual([]);
  });

  it("lets a server build read the Japanese by importing its loader, and hands it to a browser as a prop of JaLocale", () => {
    expect(files.get("src/lib/i18n/jaText.ts")?.reaches).toContain(SWAPPED_FOR_A_BROWSER);
    expect(files.get(SWAPPED_FOR_A_BROWSER)?.reaches).toContain("src/lib/i18n/jaText.data.ts");
    const importers = [...files.values()].filter((file) => file.reaches.includes("src/lib/i18n/jaText.data.ts")).map((file) => file.path);
    expect(importers, "only the server's loader imports the Japanese").toEqual([SWAPPED_FOR_A_BROWSER]);
    expect(files.get(LAYOUT)?.reaches).toContain(WHERE_A_BROWSER_IS_GIVEN_JAPANESE);
    const layout = readFileSync(resolve(ROOT, LAYOUT), "utf8");
    expect(layout).toMatch(/<JaLocale locale=\{locale\} text=\{locale === "ja" \? jaText\(\) : undefined\}>/);
    // One component for every language: a different one at the same place is a different thing to React, and
    // choosing a language would rebuild the whole page, shutting the account menu that was used to choose it.
    expect(layout, "the layout must not draw a second provider for another language").not.toMatch(/<LocaleProvider\b/);
    expect(files.get(WHERE_A_BROWSER_IS_GIVEN_JAPANESE)?.client).toBe(true);
  });

  it("tells the browser build to leave the server's loader out, naming the module the code imports", () => {
    const config = readFileSync(resolve(ROOT, "next.config.ts"), "utf8");
    const importing = readFileSync(resolve(ROOT, "src/lib/i18n/jaText.ts"), "utf8");
    const alias = /resolveAlias:\s*\{[\s\S]*?"(@\/lib\/i18n\/jaText\.server)":\s*\{\s*browser:\s*"(\.\/src\/lib\/i18n\/jaText\.browser\.ts)"/.exec(config);
    expect(alias, "next.config.ts has no turbopack.resolveAlias for jaText.server").not.toBeNull();
    expect(importing, "jaText.ts must import the module the alias names").toContain(`import "${alias![1]}"`);
    expect(readFileSync(resolve(ROOT, alias![2]!.slice(2)), "utf8")).not.toMatch(/\bimport\b/);
  });
});
