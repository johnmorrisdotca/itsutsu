import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { ABOUT_TABS } from "./about.chapters";
import { ABOUT_SECTIONS } from "./about.constants";
import { SITE_PAGES } from "./about.pages";
import { SHOTS } from "./about.shots";
import { wouldBeOpen } from "@/proxy";

/**
 * THE ABOUT PAGE MAY NOT COUNT THE GAMES BY HAND.
 *
 * It said "about 35 games" while there were 45, and had been wrong for ten of
 * them. Nothing failed, because nothing could: a number typed into a sentence
 * has no way of noticing that the thing it describes has grown. This is the
 * page a stranger reads to decide whether the site is worth an account, and
 * the one number on it they can check in thirty seconds was the one that was
 * wrong.
 *
 * So the rule is that the size of the site is READ from the site: the
 * catalogue's own list, the families' own list. A count in prose fails here,
 * and the fix is to interpolate the length rather than to update the digits —
 * updating the digits is what put the page a year behind in the first place.
 *
 * It is deliberately narrow. A number that is not about the size of this site
 * — a date, a board, a rating, another site's catalogue, a count of renju
 * openings — is none of this test's business, and the exceptions below name
 * the ones that look like a count and are not.
 */

const ABOUT = join(process.cwd(), "src", "app", "about");

/** "40 games", "forty games", "about 35 games" — a size of this site, set in prose. */
const COUNTED = [
  /\b(?:about\s+|over\s+|some\s+)?\d+\s+games\b/i,
  /\b(?:thirty|forty|fifty|sixty)(?:[-\s](?:one|two|three|four|five|six|seven|eight|nine))?\s+games\b/i,
  /\b(?:three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+families\b/i,
];

/**
 * Lines that name a count of games and are NOT about this site. Each is quoted
 * far enough to be unambiguous, with the reason beside it.
 */
const NOT_OURS = [
  // The elder sites' own catalogues, in the table that compares them. Theirs
  // to change, not ours to read, and the caption says the sites are the authority.
  "about 40, with variants",
  "over 60, with variants",
  "over 30 abstracts, many variants",
  "over 30 live games",
  "Its catalogue is about forty games with variants",
  "over sixty games and their variants",
  // The measurement, which is a number of GAMES PLAYED between two programs.
  "twenty games a pairing",
  "What twenty games shows",
  "a round robin at",
];

function aboutSources(): { path: string; text: string }[] {
  return readdirSync(ABOUT)
    .filter((name) => /\.tsx?$/.test(name) && !name.includes(".test."))
    .map((name) => ({ path: `about/${name}`, text: readFileSync(join(ABOUT, name), "utf8") }));
}

describe("the About page's figures", () => {
  it("never types a count of this site's games or families into its prose", () => {
    const typed: string[] = [];
    for (const { path, text } of aboutSources()) {
      for (const line of text.split("\n")) {
        if (NOT_OURS.some((allowed) => line.includes(allowed))) continue;
        if (COUNTED.some((pattern) => pattern.test(line))) typed.push(`${path}: ${line.trim()}`);
      }
    }
    expect(
      typed,
      "the About page counts games or families in prose; interpolate RULE_VARIANT_LIST.length or GAME_FAMILIES.length instead",
    ).toEqual([]);
  });

  it("reads the counts it does print from the catalogue itself", () => {
    const text = aboutSources()
      .map(({ text: source }) => source)
      .join("\n");
    expect(text, "the About page no longer reads the catalogue's own length").toContain("RULE_VARIANT_LIST.length");
    expect(text, "the About page no longer reads the families' own length").toContain("GAME_FAMILIES.length");
  });

  it("has something to say about every family, so a new family is not left off it", () => {
    // The catalogue section draws one row per family from GAME_FAMILIES, so
    // this is really a check that it still draws from the list rather than a
    // copy of it — a copy is how a twelfth family would go unmentioned.
    const games = readFileSync(join(ABOUT, "about.games.tsx"), "utf8");
    expect(games).toContain("GAME_FAMILIES.map");
    expect(GAME_FAMILIES.length).toBeGreaterThan(0);
    expect(RULE_VARIANT_LIST.length).toBeGreaterThan(GAME_FAMILIES.length);
  });
});

/**
 * EVERY SECTION IS IN A CHAPTER, and every chapter has something in it.
 *
 * The page shows one chapter at a time now — it was 28,589 pixels tall on a
 * phone, thirty-four screens, so the last sections were written for readers
 * who would never reach them. A section with no chapter would be on the page
 * and shown by nothing, which is the same silence with more code behind it,
 * and a chapter with no sections would be a tab that opens nothing.
 */
describe("the page reads a chapter at a time", () => {
  it("gives every section a chapter that is one of the tabs", () => {
    const keys = new Set(ABOUT_TABS.map((tab) => tab.key));
    const lost = ABOUT_SECTIONS.filter((section) => !keys.has(section.chapter)).map((s) => s.title);
    expect(lost, "a section whose chapter is not a tab is on the page and shown by nothing").toEqual([]);
  });

  it("leaves no tab empty", () => {
    const empty = ABOUT_TABS.filter(
      (tab) => !ABOUT_SECTIONS.some((section) => section.chapter === tab.key),
    ).map((tab) => tab.key);
    expect(empty, "a tab with no sections opens an empty page").toEqual([]);
  });

  it("keeps every section somewhere, so tabbing the page lost nothing", () => {
    const shown = ABOUT_TABS.flatMap((tab) => ABOUT_SECTIONS.filter((section) => section.chapter === tab.key));
    expect(shown).toHaveLength(ABOUT_SECTIONS.length);
  });
});

/**
 * THE MAP OF THE SITE TELLS A STRANGER THE TRUTH ABOUT WHICH DOORS ARE OPEN.
 *
 * Getting started prints a table of pages with "open to read" or "members"
 * beside each. The gate in `src/proxy.ts` decides that, not this page, so the
 * table is checked against the gate: a page moved behind the invite, or opened
 * to everyone, fails here until the table says so too.
 */
describe("the site map on the About page", () => {
  it("says a page is open exactly when the gate lets a stranger in", () => {
    const wrong = SITE_PAGES.filter((page) => page.open !== wouldBeOpen(page.path)).map(
      (page) => `${page.path}: the table says ${page.open ? "open" : "members"}, the gate says ${wouldBeOpen(page.path) ? "open" : "members"}`,
    );
    expect(wrong).toEqual([]);
  });

  it("lists every address once", () => {
    const paths = SITE_PAGES.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

/**
 * A JPEG's size, read from its frame header, so the width and height the page
 * reserves for a screenshot are the file's own and not a guess.
 */
function jpegSize(file: Buffer): { width: number; height: number } | null {
  let at = 2;
  while (at < file.length) {
    if (file[at] !== 0xff) return null;
    const marker = file[at + 1];
    const length = file.readUInt16BE(at + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { height: file.readUInt16BE(at + 5), width: file.readUInt16BE(at + 7) };
    at += 2 + length;
  }
  return null;
}

/**
 * EVERY SCREENSHOT NAMED IS A FILE, AT THE SIZE THE PAGE SAYS IT IS.
 *
 * A missing file is a broken picture on the page a stranger reads first, and
 * a wrong size makes the page jump as it loads. Retaking a screenshot at a new
 * size means changing its row in `about.shots.ts` too.
 */
describe("the screenshots on the About page", () => {
  it("are all in public/, at the size the page reserves for them", () => {
    const wrong = Object.values(SHOTS).flatMap((shot) => {
      let file: Buffer;
      try {
        file = readFileSync(join(process.cwd(), "public/art/about", shot.src.replace("/art/about/", "")));
      } catch {
        return [`${shot.src}: no such file`];
      }
      const size = jpegSize(file);
      if (size === null) return [`${shot.src}: not a JPEG`];
      return size.width === shot.width && size.height === shot.height
        ? []
        : [`${shot.src}: the file is ${size.width}×${size.height}, the page says ${shot.width}×${shot.height}`];
    });
    expect(wrong).toEqual([]);
  });
});
