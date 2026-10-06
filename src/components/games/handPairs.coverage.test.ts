import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { code } from "./sourceScan";

/**
 * A word and its kanji is ONE line in the reader's language, and it is drawn by
 * the components that know the rule.
 *
 * About two hundred places wrote "English 漢字" by hand: the English, a space,
 * and a `font-mincho` span holding the kanji. It was harmless while the site
 * had one language and became the whole fault the day it had two. A reader of
 * Japanese was shown the Japanese of the sentence AND the kanji beside it, the
 * same word said twice, and a reader of English was shown kanji where a
 * component would have chosen. AGENTS.md already says a label is one language
 * on one line (`OneName`); this is the gate that holds the rest to it
 * (ENJA-03, John, 2026-10-06: "every word on the site in English and Japanese").
 *
 * The rule is read from the source, like `gamePictures.coverage.test.ts`
 * beside it. A `font-mincho` span in a page or a component fails unless:
 *
 *  - a marker that the speaker decided it sits just above (or three lines
 *    below) it: `Paired`, `OneName`, `pairName`, `say.pair`, `pairsWithKanji`,
 *    a `.kanji` tested against null or "" (what `pair` and `pairOf` hand back
 *    for a reader whose own script it is), `inReadersLanguage`; or
 *  - its file is in `EXCEPTIONS` with how many such spans it has and WHY none
 *    of them is a pair. A count that is not exact fails both ways, so a new
 *    hand-written pair in a file already listed is caught too, and an
 *    exception that no longer holds has to come off the list.
 *
 * `Paired`, `OneName` and the speaker's `pairName` are the three ways to write
 * a pair. The components that draw them are in `src/components/i18n/`, which
 * is the one place the span itself is written.
 */

const ROOTS = ["src/app", "src/components"];
const OWNERS = "src/components/i18n/";

/** What says the speaker chose, within the window below. */
const SPEAKER = /pairsWithKanji|\.kanji === null|\.kanji !== null|kanji === ""|kanji !== ""|inReadersLanguage|kanjiClassName|<Paired|<OneName|pairName|\.pair\(/;

/** How far above a span its marker may sit, and how far below: an `if` that opens a few lines before, a ternary's `: null` after. */
const ABOVE = 12;
const BELOW = 3;

/** The span itself: the mincho face, or one of the constants that is only that. */
const SPAN = /font-mincho|PAGE_TITLE_KANJI\}|SECTION_HEADING_KANJI\}/;

const GLYPH = "A glyph drawn as a picture (aria-hidden), not a word beside a word: its kanji comes through `pairOf`, which is empty for a reader of Japanese";
const OPERATOR = "An operator's page: John reads it, and no member does (ALLOWED_FILES in the i18n gate says the same of the admin pages)";
const BRAND_IN_PROSE = "The site's name in kanji, or a word the sentence is about, written inside a sentence: the sentence is the phrase, and it carries this word in both languages";

const EXCEPTIONS: Record<string, { count: number; why: string }> = {
  "src/app/about/about.bots.tsx": { count: 1, why: "A computer player's name beside its own Japanese name (`native`): two names of one player, which a translation does not touch (bots.ja.constants.ts)" },
  "src/app/about/about.constants.tsx": { count: 1, why: BRAND_IN_PROSE },
  "src/app/about/about.links.tsx": { count: 1, why: "The `<jp>` tag of the markup a phrase may carry: sets Japanese words that are the subject of a sentence in the mincho face" },
  "src/app/about/about.words.tsx": { count: 1, why: "The glossary's first column: the Japanese word IS the thing being explained, and its reading and meaning are in the columns beside it" },
  "src/app/dice/page.tsx": { count: 1, why: BRAND_IN_PROSE },
  "src/app/join/page.tsx": { count: 1, why: "The version in three notations (1.2.3 · roman · kanji numerals), a stamp and not a word with its translation" },
  "src/app/layout.tsx": { count: 1, why: "The name of the font's CSS variable, not a span" },
  "src/app/page.tsx": { count: 1, why: BRAND_IN_PROSE },
  "src/components/admin/ControlPanel.tsx": { count: 2, why: OPERATOR },
  "src/components/auth/JoinForm.tsx": { count: 1, why: "A heading that is Japanese alone for every reader (合言葉, 締切, ようこそ, 管理), with the plain sentence under it: there is no English half to switch" },
  "src/components/auth/MemberClaimModal.tsx": { count: 1, why: OPERATOR },
  "src/components/auth/MemberRemoveModal.tsx": { count: 1, why: OPERATOR },
  "src/components/auth/MemberWordsModal.tsx": { count: 1, why: OPERATOR },
  "src/components/backlog/AdminBoardCard.tsx": { count: 1, why: OPERATOR },
  "src/components/cards/CardFace.tsx": { count: 1, why: "A card's face drawn in SVG: the glyph is the picture" },
  "src/components/embed/EmbedStats.tsx": { count: 1, why: "A label for an embedded frame on another site, which is Japanese alone and has never had an English half" },
  "src/components/game/AdvantagePanel.tsx": { count: 1, why: GLYPH },
  "src/components/game/GameStatus.tsx": { count: 2, why: GLYPH },
  "src/components/game/IdleModal.tsx": { count: 1, why: GLYPH },
  "src/components/game/ReviewControls.tsx": { count: 2, why: GLYPH },
  "src/components/game/WinCover.tsx": { count: 1, why: GLYPH },
  "src/components/layout/SiteFooter.tsx": { count: 2, why: "The brand lockup (Itsutsu 五つ) and the version in three notations: names and a stamp, not a word with its translation" },
  "src/components/puzzles/KumimojiTileFace.tsx": { count: 1, why: "A tile's face: the glyph is the picture" },
  "src/components/puzzles/MahjongTableSeats.tsx": { count: 2, why: "A wind or a seat drawn as the tile's own glyph, with its name in the title beside it" },
  "src/components/puzzles/MahjongTileFace.tsx": { count: 1, why: "The font stack for a tile's face, not a span" },
  "src/components/puzzles/SolveCountdown.tsx": { count: 1, why: GLYPH },
  "src/components/reports/AdminReports.tsx": { count: 1, why: OPERATOR },
};

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) out.push(path);
  }
  return out;
}

/** Every span in a file that nothing in the speaker's own words stands beside, as `file:line`. */
function unmarked(path: string): string[] {
  const lines = code(readFileSync(path, "utf8")).split("\n");
  const found: string[] = [];
  lines.forEach((line, at) => {
    if (!SPAN.test(line)) return;
    const near = lines.slice(Math.max(0, at - ABOVE), at + BELOW + 1).join("\n");
    if (!SPEAKER.test(near)) found.push(`${path}:${at + 1}`);
  });
  return found;
}

const FOUND = new Map<string, string[]>();
for (const path of ROOTS.flatMap(filesUnder)) {
  if (path.startsWith(OWNERS)) continue;
  const spans = unmarked(path);
  if (spans.length > 0) FOUND.set(path, spans);
}

describe("a word and its kanji are one line in the reader's language", () => {
  it("has no hand-written pair that the speaker did not decide", () => {
    const unexplained = [...FOUND].filter(([path]) => EXCEPTIONS[path] === undefined).flatMap(([, spans]) => spans);
    expect(
      unexplained,
      "A `font-mincho` span beside a word, written by hand: draw it with `Paired`, `OneName` or `pairName` (src/components/i18n/), which show a reader of Japanese the Japanese once, or give its file an exception with the reason none of them is a pair.",
    ).toEqual([]);
  });

  it("lists each exception exactly: the count of spans it has, and a reason", () => {
    for (const [path, { count, why }] of Object.entries(EXCEPTIONS)) {
      expect(why.length, `${path} needs a reason`).toBeGreaterThan(20);
      expect(FOUND.get(path)?.length ?? 0, `${path} has a different number of unmarked spans than its exception says: ${(FOUND.get(path) ?? []).join(", ") || "none"}`).toBe(count);
    }
  });
});
