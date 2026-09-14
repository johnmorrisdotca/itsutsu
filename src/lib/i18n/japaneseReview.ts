import { JA_DRAFTED } from "./dictionaries/ja.drafted.constants";
import { JA_ALREADY_SAID } from "./dictionaries/ja.site.constants";
import { PHRASES, PHRASE_KEYS, type PhraseKey } from "./i18n.constants";
import { placeholdersIn } from "./i18n";

/**
 * The review sheet, built from the dictionaries themselves.
 *
 * John does not read Japanese. That makes a page he can hand to somebody who
 * does the difference between publishing text he has checked and publishing
 * text he has been told about — so the page has to be the text that actually
 * ships, not a copy of it somebody kept up to date. Building it from the same
 * modules the site renders from is what makes that true by construction, and
 * `japanese.coverage.test.ts` fails the build when the file on disk and this
 * function disagree.
 */

/** Where a phrase is met, and how often — which is the order to review in. */
const MET: readonly { prefix: string; seen: string; place: string }[] = [
  { prefix: "nav.", seen: "Every screen", place: "navigation bar" },
  { prefix: "account.", seen: "Every screen", place: "account menu, top right" },
  { prefix: "site.", seen: "Every screen", place: "footer" },
  { prefix: "filter.", seen: "Most list pages", place: "filter bars on the record and players pages" },
  { prefix: "rules.", seen: "39 rules pages", place: "one per game" },
  { prefix: "xp.", seen: "After earning points", place: "the notice that drops in from the top of the page" },
  { prefix: "catalogue.", seen: "The games index, /games", place: "under every game and every family, in all three views" },
  { prefix: "record.", seen: "Finished games of go, Othello, gomoku, renju and Hex", place: "beside Copy as text, in the move list under the replay" },
];

function metBy(key: PhraseKey): { rank: number; seen: string; place: string } {
  const index = MET.findIndex((one) => key.startsWith(one.prefix));
  if (index === -1) return { rank: MET.length, seen: "—", place: "—" };
  const found = MET[index] as (typeof MET)[number];
  return { rank: index, seen: found.seen, place: found.place };
}

function inReadingOrder(keys: readonly PhraseKey[]): PhraseKey[] {
  return [...keys].sort((a, b) => metBy(a).rank - metBy(b).rank || a.localeCompare(b));
}

/** A cell that cannot break the table, whatever the phrase contains. */
function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * One line of the sheet, and the places that line covers.
 *
 * A phrase key is a place on the site, not a word, so two keys legitimately
 * hold the same word: "Rules" is both a section of the bar and a column of the
 * record's filter, and both are 規則. That is right in the code and wrong on
 * the page — a reviewer reading the same row twice has been given nothing to
 * do the second time and has to work out whether they missed a difference.
 *
 * So rows are folded on what they actually show, and the places they cover
 * are joined into the one cell that differs. Nothing is dropped: a word
 * appearing in four places still says all four.
 */
type Row = { key: PhraseKey; cells: string[]; place: string };

function fold(rows: Row[], placeColumn: number): string[][] {
  const byContent = new Map<string, { cells: string[]; places: string[] }>();
  for (const row of rows) {
    /*
     * A separator that cannot occur in a cell, written as an escape rather
     * than as the character itself. As a literal byte it made git call this
     * whole file binary — no diffs, ever — which is a high price for one
     * invisible character.
     */
    const identity = row.cells.join("\u0000");
    const found = byContent.get(identity);
    if (found === undefined) {
      byContent.set(identity, { cells: row.cells, places: [row.place] });
    } else if (!found.places.includes(row.place)) {
      found.places.push(row.place);
    }
  }
  return [...byContent.values()].map(({ cells, places }) => {
    const merged = [...cells];
    merged[placeColumn] = places.join("; ");
    return merged;
  });
}

export function japaneseReview(): string {
  const drafted = inReadingOrder(PHRASE_KEYS.filter((key) => JA_DRAFTED[key] !== undefined));
  const already = inReadingOrder(PHRASE_KEYS.filter((key) => JA_ALREADY_SAID[key] !== undefined));
  const placeheld = drafted.filter((key) => placeholdersIn(PHRASES[key]).length > 0);

  const draftedRows = fold(
    drafted.map((key) => {
      const { seen, place } = metBy(key);
      const row = JA_DRAFTED[key];
      return {
        key,
        place: `${cell(seen)} — ${cell(place)}`,
        cells: ["", cell(PHRASES[key]), `**${cell(row?.text ?? "")}**`, cell(row?.back ?? ""), ""],
      };
    }),
    0,
  );
  const alreadyRows = fold(
    already.map((key) => {
      const row = JA_ALREADY_SAID[key];
      return {
        key,
        place: cell(row?.where ?? ""),
        cells: [cell(PHRASES[key]), cell(row?.text ?? ""), ""],
      };
    }),
    2,
  );

  const lines: string[] = [
    "# Japanese review sheet",
    "",
    "**Generated from the code. Do not edit this file by hand — edit**",
    "**`src/lib/i18n/dictionaries/` and regenerate, or the build will fail.**",
    "",
    "The site speaks English and Japanese. This sheet is **only the Japanese a**",
    "**machine wrote**, which is the only part that needs a reader.",
    "",
    "Rows are in the order a reader meets them: the navigation bar, the account",
    "menu and the footer are on every screen, so they come first. If you only have",
    "time for the top of the table, the top of the table is the part that matters.",
    "",
    "**What it says back** is a literal reading of the Japanese returned to English.",
    "It is there so the site's owner, who does not read Japanese, can see for",
    "himself whether the meaning drifted. If that column does not match the English",
    "beside it, the Japanese is wrong whatever anybody thinks of its style.",
    "",
    `## 1. Written by a machine — please check these (${draftedRows.length})`,
    "",
    "| Where a reader meets it | English on the site | Japanese | What it says back | Correction |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const cells of draftedRows) lines.push(`| ${cells.join(" | ")} |`);

  lines.push("");
  if (placeheld.length > 0) {
    lines.push(
      "`{game}`, `{name}`, `{names}` and `{country}` are filled in when the page is",
      "drawn — a game's name, a country. They have to survive a correction exactly as",
      "written, braces and spelling both, or the sentence loses the word it was about.",
      "",
    );
  }

  lines.push(
    `## 2. Already on the site — nothing to check (${alreadyRows.length})`,
    "",
    "These are **John's own words**, published on the English site as the kanji",
    'beside a heading. Nothing was translated: the kanji that sat next to "Rules"',
    "becomes the heading itself for a Japanese reader, because for that reader the",
    "English half was the redundant one. Listed for completeness, not for review.",
    "",
    "| English on the site | Japanese | Where it already appears |",
    "| --- | --- | --- |",
  );
  for (const cells of alreadyRows) lines.push(`| ${cells.join(" | ")} |`);

  lines.push(
    "",
    "## 3. The game names, and most of the furniture — nothing to check either",
    "",
    "Every game has carried its Japanese name since the day it was added, in the",
    "`kanji` field beside its English one. A Japanese reader is shown that name and",
    "nothing was translated to do it. The same goes for the panel headings, the tab",
    "strips, the buttons and the result words throughout the site: all of them were",
    'already written as an English word and its kanji — "Resign 投了", "Cancel 取消",',
    '"Black won 黒勝" — and a Japanese reader is simply shown the half that was',
    "always theirs.",
    "",
    "## What is still English, and why",
    "",
    "Each game's tagline, origin and rule bullets — the prose across the 39 rules",
    "pages — is still English for everybody. It is the largest body of writing on",
    "the site, it is argument rather than labelling, and it wants a translator",
    "rather than a machine. Long explanatory paragraphs elsewhere (the About page,",
    "the front page) are untranslated for the same reason.",
    "",
  );
  return lines.join("\n");
}
