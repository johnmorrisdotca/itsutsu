import { ALSO_LISTED_COPY_JA, FAMILY_COPY_JA } from "./dictionaries/families.ja.constants";
import { rulesAttributionJa } from "./dictionaries/attribution.ja.constants";
import { BOT_COPY_JA } from "./dictionaries/bots.ja.constants";
import { HANDICAP_COPY_JA, OPENING_COPY_JA, SECOND_STONE_COPY_JA } from "./dictionaries/openings.ja.constants";
import { VARIANT_COPY_JA } from "./dictionaries/variants.ja.constants";
import type { CopyReview, JaLine } from "./copyJa.types";

/**
 * The review sheet for the words that belong to data: every game's rules, the
 * openings, the handicap switches, the computer players, the families, the
 * shelves and the attribution notice, each Japanese line with what it
 * literally says, beside who has read it.
 *
 * `japaneseReview.ts` does the same for the phrase table; this is its
 * counterpart for the sibling tables (`src/lib/i18n/dictionaries/*.ja.*`),
 * built from the modules themselves so the page somebody who reads Japanese is
 * handed is the text that ships. `gameCopyReview.coverage.test.ts` fails when
 * the file on disk and this function disagree; regenerate with
 * `WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`.
 *
 * The attribution notice names puzzles, so it is built with their English
 * labels written out here as the Japanese reader would meet them.
 */

type Row = { where: string; line: JaLine; review: CopyReview | undefined; ask?: string };

function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/** The phrase sheet's words: a stamp, and ", native read wanted" while a note for a person stands over an agent's pass. */
function reviewLabel(review: CopyReview | undefined, ask: string | undefined): string {
  if (review === undefined) return ask === undefined ? "Drafted, unread" : "Question, unread";
  const who = review.by === "agent" ? "Agent" : "Person";
  return `${who} ${review.on}${ask !== undefined && review.by !== "person" ? ", native read wanted" : ""}`;
}

function rows(): Row[] {
  const out: Row[] = [];
  for (const [variant, copy] of Object.entries(VARIANT_COPY_JA)) {
    out.push({ where: `game ${variant}: tagline`, line: copy.tagline, review: copy.review, ask: copy.ask });
    out.push({ where: `game ${variant}: origin`, line: copy.origin, review: copy.review });
    copy.rules.forEach((line, at) => out.push({ where: `game ${variant}: rule ${at + 1}`, line, review: copy.review }));
    out.push({ where: `game ${variant}: board advice`, line: copy.board, review: copy.review });
  }
  for (const [opening, copy] of Object.entries(OPENING_COPY_JA)) {
    out.push({ where: `opening ${opening}: name shown`, line: [copy.label, copy.label], review: copy.review, ask: copy.ask });
    out.push({ where: `opening ${opening}: tagline`, line: copy.tagline, review: copy.review });
    copy.rules.forEach((line, at) => out.push({ where: `opening ${opening}: rule ${at + 1}`, line, review: copy.review }));
  }
  for (const [rule, copy] of Object.entries(HANDICAP_COPY_JA)) {
    out.push({ where: `handicap ${rule}: sentence`, line: copy.description, review: copy.review });
    out.push({ where: `handicap ${rule}: from`, line: copy.from, review: copy.review });
  }
  for (const [squares, copy] of Object.entries(SECOND_STONE_COPY_JA)) {
    out.push({ where: `second stone, ${squares} squares`, line: copy.label, review: copy.review });
  }
  for (const [tier, copy] of Object.entries(BOT_COPY_JA)) {
    out.push({ where: `computer ${tier}: strength`, line: copy.strength, review: copy.review });
    out.push({ where: `computer ${tier}: blurb`, line: copy.blurb, review: copy.review });
    out.push({ where: `computer ${tier}: bio`, line: copy.bio, review: copy.review, ask: copy.ask });
  }
  for (const [key, copy] of Object.entries(FAMILY_COPY_JA)) {
    out.push({ where: `family ${key}: blurb`, line: copy.blurb, review: copy.review, ask: copy.ask });
  }
  for (const [key, copy] of Object.entries(ALSO_LISTED_COPY_JA)) {
    out.push({ where: `shelf ${key}: reason`, line: copy.why, review: copy.review });
  }
  const attribution = rulesAttributionJa((kind) => ({ ja: kind, en: kind }));
  attribution.paragraphs.forEach((line, at) =>
    out.push({ where: `attribution: paragraph ${at + 1}`, line, review: attribution.review, ask: attribution.ask }),
  );
  return out;
}

/** The sheet, as Markdown. */
export function gameCopyReview(): string {
  const all = rows();
  const asked = all.filter((row) => row.ask !== undefined);
  const lines: string[] = [
    "# Japanese review sheet: the words of games, openings, computer players and families",
    "",
    "Generated from `src/lib/i18n/dictionaries/*.ja.*` by `src/lib/i18n/gameCopyReview.ts`; do not edit by hand. Regenerate with `WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`. The phrase table has its own sheet, `japanese-review.md`.",
    "",
    "Each row is one Japanese line, what it literally says in English, and who has read it. A game's, family's or colour's name is its kanji beside the English one and is not repeated here. The attribution paragraphs name each puzzle by its own kanji, written here as the puzzle's key.",
    "",
    `${all.length} lines, ${new Set(all.map((row) => row.line[0])).size} distinct. ${all.filter((row) => row.review?.by === "person").length} read by a person, ${all.filter((row) => row.review?.by === "agent").length} by the reviewer agent, ${all.filter((row) => row.review === undefined).length} drafted and unread.`,
    "",
  ];
  if (asked.length > 0) {
    lines.push("## Open for a person", "");
    for (const row of asked) lines.push(`- **${row.where}**: ${row.ask}`);
    lines.push("");
  }
  /*
   * One row for each distinct line, with every place it is met in one cell: a
   * rule four draughts games share is one thing to read, not four.
   */
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
