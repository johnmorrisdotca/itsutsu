import { TENKA_MAPS, TENKA_MAP_LIST, TENKA_STRINGS, continentNameIn, territoryNameIn } from "@johnmorrisdotca/tenka";
import { colourWords, hitotsuWords } from "@johnmorrisdotca/hitotsu";

import { overlayLines } from "./copyTable";
import type { CopyReview, JaLine } from "./copyJa.types";
import { AGENT_READ_2026_10_06 } from "./copyJa.types";
import { PARTY_COPY_JA } from "./dictionaries/party.ja.constants";
import { PARTY_TABLES_AUTHORED } from "./jaText.build";

/**
 * The review sheet for the words of the party, card and casual games: each game's tagline, origin, rules and
 * board advice, the tables its screens are made of (the lines over and under every board, the set-up's choices,
 * the hand-over, the online tables, the kept games, the casual games' pages), and the words the packages hand back
 * that the site shows in Japanese (Tenka's territories, continents and regions, Hitotsu's colours and cards), each
 * Japanese line with what it literally says in English, beside who has read it.
 *
 * The counterpart of `puzzleCopyReview.ts` for these games; `japaneseReview.ts` does the phrase table, which holds
 * the lines that are not a table's (`party.`, `ctable.` and `casual.`). Built from the modules themselves, so the
 * page somebody who reads Japanese is handed is the text that ships. `partyCopyReview.coverage.test.ts` fails when
 * the file on disk and this function disagree; regenerate with `WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`.
 */

type Row = { where: string; line: JaLine; review: CopyReview | undefined; ask?: string };

function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function reviewLabel(review: CopyReview | undefined, ask: string | undefined): string {
  if (review === undefined) return ask === undefined ? "Drafted, unread" : "Question, unread";
  const who = review.by === "agent" ? "Agent" : "Person";
  return `${who} ${review.on}${ask !== undefined && review.by !== "person" ? ", native read wanted" : ""}`;
}

/** The two things a package hands back that this sheet shows: Tenka's names and Hitotsu's colours and card faces. */
function packageRows(): Row[] {
  const out: Row[] = [];
  const ja = TENKA_STRINGS.ja;
  const worldKeys = new Set(TENKA_MAPS.world.territories.map((territory) => territory.key));
  const worldContinents = new Set(TENKA_MAPS.world.continents.map((continent) => continent.key));
  const ask = "Europe's 49 territory names and 11 regions are the package's own Japanese, in the forms an atlas uses, and nobody who reads Japanese natively has read them yet: is each the name a reader of Japanese expects? Highlands is the one most worth a look.";
  for (const mapKey of TENKA_MAP_LIST) {
    const map = TENKA_MAPS[mapKey];
    for (const territory of map.territories) {
      const europeOnly = mapKey === "europe" && !worldKeys.has(territory.key);
      out.push({ where: `Tenka ${mapKey} map, territory ${territory.key}`, line: [territoryNameIn(ja, territory.key) || territory.name, territory.name], review: AGENT_READ_2026_10_06, ...(europeOnly ? { ask } : {}) });
    }
    for (const continent of map.continents) {
      const europeOnly = mapKey === "europe" && !worldContinents.has(continent.key);
      out.push({ where: `Tenka ${mapKey} map, ${mapKey === "europe" ? "region" : "continent"} ${continent.key}`, line: [continentNameIn(ja, continent.key) || continent.name, continent.name], review: AGENT_READ_2026_10_06, ...(europeOnly ? { ask } : {}) });
    }
  }
  for (const colour of ["R", "Y", "G", "B"] as const) out.push({ where: `Hitotsu colour ${colour}`, line: [colourWords(colour, "ja"), colourWords(colour, "en")], review: AGENT_READ_2026_10_06 });
  for (const card of ["R5", "RS", "RR", "RD", "WW", "WF"] as const) out.push({ where: `Hitotsu card ${card}`, line: [hitotsuWords(card, "ja"), hitotsuWords(card, "en")], review: AGENT_READ_2026_10_06 });
  return out;
}

function rows(): Row[] {
  const out: Row[] = [];
  for (const [kind, copy] of Object.entries(PARTY_COPY_JA)) {
    for (const { path, line } of overlayLines(copy)) out.push({ where: `game ${kind}: ${path}`, line, review: copy.review, ask: copy.ask });
  }
  for (const [name, table] of Object.entries(PARTY_TABLES_AUTHORED)) {
    for (const { path, line } of overlayLines(table)) out.push({ where: `${name}: ${path}`, line, review: AGENT_READ_2026_10_06 });
  }
  out.push(...packageRows());
  return out;
}

/** The sheet, as Markdown. */
export function partyCopyReview(): string {
  const all = rows();
  const asked = all.filter((row, at) => row.ask !== undefined && all.findIndex((other) => other.ask === row.ask && other.where.split(":")[0].split(",")[0] === row.where.split(":")[0].split(",")[0]) === at);
  const lines: string[] = [
    "# Japanese review sheet: the words of the party, card and casual games",
    "",
    "Generated from `src/lib/i18n/dictionaries/party.ja.*` and the packages' own words by `src/lib/i18n/partyCopyReview.ts`; do not edit by hand. Regenerate with `WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`. The phrase table has its own sheet (`japanese-review.md`: the `party.`, `ctable.` and `casual.` lines), and the puzzles' words theirs (`japanese-review-puzzles.md`).",
    "",
    "Each row is one Japanese line, what it literally says in English, and who has read it. A game's name is its kanji beside the English one, so it is not repeated here. A line with a number or a name in it has `{0}`, `{1}` where the figure goes, in the order the screen gives them; a line that reads differently at 0, at 1 or at a kind is shown once for each, with the figure it is for in braces. The last rows are words the packages return (Tenka's territory, continent and region names, Hitotsu's colours and cards), which the site shows as the package gives them.",
    "",
    `${all.length} lines, ${new Set(all.map((row) => row.line[0])).size} distinct. ${all.filter((row) => row.review?.by === "person").length} read by a person, ${all.filter((row) => row.review?.by === "agent").length} by the reviewer agent, ${all.filter((row) => row.review === undefined).length} drafted and unread.`,
    "",
  ];
  if (asked.length > 0) {
    lines.push("## Open for a person", "");
    for (const row of asked) lines.push(`- **${row.where.split(":")[0].split(",")[0]}**: ${row.ask}`);
    lines.push("");
  }
  const folded = new Map<string, { wheres: string[]; row: Row }>();
  for (const row of all) {
    const key = `${row.line[0]}\u0000${row.line[1]}`;
    const found = folded.get(key);
    if (found === undefined) folded.set(key, { wheres: [row.where], row });
    else found.wheres.push(row.where);
  }
  lines.push("## Every line", "", "| Where | Japanese | Literal English | Review |", "| --- | --- | --- | --- |");
  for (const { wheres, row } of folded.values()) {
    lines.push(`| ${cell(wheres.join("; "))} | ${cell(row.line[0])} | ${cell(row.line[1])} | ${reviewLabel(row.review, row.ask)} |`);
  }
  lines.push("");
  return lines.join("\n");
}
