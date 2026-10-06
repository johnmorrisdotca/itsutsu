import { speaker } from "./i18n";
import { overlayLines } from "./copyTable";
import type { CopyReview, JaLine } from "./copyJa.types";
import { AGENT_READ_2026_10_06 } from "./copyJa.types";
import { tobiishiJumpsWord } from "../puzzles/tobiishi/sizes";
import {
  FREECELL_COPY_JA,
  MAHJONG_COPY_JA,
  SOLITAIRE_COPY_JA,
  SOLITAIRE_OPTIONS_JA,
  SPIDER_COPY_JA,
} from "./dictionaries/puzzles.ja.cards.constants";
import { PUZZLE_COPY_JA } from "./dictionaries/puzzles.ja.constants";
import {
  BRIDGES_CELL_WORDS_JA,
  BRIDGES_COPY_JA,
  JIRAI_COPY_JA,
  PENCIL_COPY_JA,
  PICTURE_CELL_WORDS_JA,
  PICTURE_COPY_JA,
} from "./dictionaries/puzzles.ja.grid.constants";
import {
  CARD_SIZE_WORDS_JA,
  JIRAI_GRID_DISPLAY_JA,
  JIRAI_LEVEL_BLURBS_JA,
  PUZZLE_CLOCK_DISPLAY_JA,
  PUZZLE_LEVEL_BLURBS_JA,
  PUZZLE_LEVEL_DISPLAY_JA,
} from "./dictionaries/puzzles.ja.levels.constants";
import { CUBE_COPY_JA, SUIDO_WORDS_JA, TOBIISHI_WORDS_JA, TSUNAGI_CHIPS_JA, tobiishiLevelsLineJa } from "./dictionaries/puzzles.ja.mazeUi.constants";
import { MEIKYUU_WORDS_JA } from "./dictionaries/puzzles.ja.meikyuuUi.constants";
import { KUMIMOJI_SHOTS_JA, KUMIMOJI_WALLPAPER_COPY_JA, LOOK_COPY_JA, WORD_STYLE_DISPLAY_JA } from "./dictionaries/puzzles.ja.misc.constants";

/**
 * The review sheet for the words of puzzles: each puzzle's tagline, origin, rules and board advice, and the
 * tables its screens are made of (levels, clocks, sizes, the lines under every board, Meikyuu's, Suido's,
 * Tobiishi's and the Cube's screens, the card and tile puzzles'), each Japanese line with what it literally
 * says, beside who has read it.
 *
 * The counterpart of `gameCopyReview.ts` for the puzzles; `japaneseReview.ts` does the phrase table. Built from
 * the modules themselves, so the page somebody who reads Japanese is handed is the text that ships.
 * `puzzleCopyReview.coverage.test.ts` fails when the file on disk and this function disagree; regenerate with
 * `WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`.
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

/** The screens' tables, each with a name for the sheet. A table made only of lines is read as it stands. */
const TABLES: readonly (readonly [string, unknown])[] = [
  ["level names", PUZZLE_LEVEL_DISPLAY_JA],
  ["clocks", PUZZLE_CLOCK_DISPLAY_JA],
  ["level blurbs", PUZZLE_LEVEL_BLURBS_JA],
  ["card sizes", CARD_SIZE_WORDS_JA],
  ["Jirai levels", JIRAI_LEVEL_BLURBS_JA],
  ["Jirai neighbours", JIRAI_GRID_DISPLAY_JA],
  ["Jirai screen", JIRAI_COPY_JA],
  ["Gomoji grid styles", WORD_STYLE_DISPLAY_JA],
  ["Kumimoji pictures", KUMIMOJI_SHOTS_JA],
  ["Kumimoji wallpaper", KUMIMOJI_WALLPAPER_COPY_JA],
  ["Meikyuu colours", LOOK_COPY_JA],
  ["Meikyuu screen", MEIKYUU_WORDS_JA],
  ["Suido screen", SUIDO_WORDS_JA],
  ["Tobiishi screen", TOBIISHI_WORDS_JA],
  ["Cube screen", CUBE_COPY_JA],
  ["Tsunagi chips", TSUNAGI_CHIPS_JA],
  ["Bridges screen", BRIDGES_COPY_JA],
  ["Bridges cells", BRIDGES_CELL_WORDS_JA],
  ["Picture logic screen", PICTURE_COPY_JA],
  ["Picture logic cells", PICTURE_CELL_WORDS_JA],
  ["pencil puzzles screen", PENCIL_COPY_JA],
  ["Mahjong Solitaire screen", MAHJONG_COPY_JA],
  ["FreeCell screen", FREECELL_COPY_JA],
  ["Spider screen", SPIDER_COPY_JA],
  ["Solitaire screen", SOLITAIRE_COPY_JA],
  ["Solitaire set-up", SOLITAIRE_OPTIONS_JA],
];

function rows(): Row[] {
  const out: Row[] = [];
  for (const [kind, copy] of Object.entries(PUZZLE_COPY_JA)) {
    for (const { path, line } of overlayLines(copy)) out.push({ where: `puzzle ${kind}: ${path}`, line, review: copy.review, ask: copy.ask });
  }
  for (const [name, table] of TABLES) {
    for (const { path, line } of overlayLines(table)) out.push({ where: `${name}: ${path}`, line, review: AGENT_READ_2026_10_06 });
  }
  /* Tobiishi's front-door line is built from the package's word for each length. */
  out.push({
    where: "Tobiishi screen: copy.levelsLine",
    line: tobiishiLevelsLineJa((size) => tobiishiJumpsWord(size, speaker("ja")), (size) => tobiishiJumpsWord(size)),
    review: AGENT_READ_2026_10_06,
  });
  return out;
}

/** The sheet, as Markdown. */
export function puzzleCopyReview(): string {
  const all = rows();
  const asked = all.filter((row, at) => row.ask !== undefined && all.findIndex((other) => other.ask === row.ask && other.where.split(":")[0] === row.where.split(":")[0]) === at);
  const lines: string[] = [
    "# Japanese review sheet: the words of puzzles",
    "",
    "Generated from `src/lib/i18n/dictionaries/puzzles.ja.*` by `src/lib/i18n/puzzleCopyReview.ts`; do not edit by hand. Regenerate with `WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`. The phrase table has its own sheet (`japanese-review.md`), and the games' words theirs (`japanese-review-games.md`).",
    "",
    "Each row is one Japanese line, what it literally says in English, and who has read it. A puzzle's name is its kanji beside the English one, and the names of levels, sizes and chips that sit beside a kanji are shown as the kanji to a Japanese reader, so neither is repeated here. A line with a number or a name in it has `{0}`, `{1}` where the figure goes, in the order the screen gives them; a line that reads differently at 0, at 1 or at a kind is shown once for each, with the figure it is for in braces.",
    "",
    `${all.length} lines, ${new Set(all.map((row) => row.line[0])).size} distinct. ${all.filter((row) => row.review?.by === "person").length} read by a person, ${all.filter((row) => row.review?.by === "agent").length} by the reviewer agent, ${all.filter((row) => row.review === undefined).length} drafted and unread.`,
    "",
  ];
  if (asked.length > 0) {
    lines.push("## Open for a person", "");
    for (const row of asked) lines.push(`- **${row.where.split(":")[0]}**: ${row.ask}`);
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
