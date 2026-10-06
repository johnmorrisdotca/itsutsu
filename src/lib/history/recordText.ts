import { GAME_RESULT_DISPLAY } from "./gameHistory.constants";
import type { GameSummary } from "./gameHistory.types";
import { seatName } from "@/lib/gomoku/seatWords";
import { variantName } from "@/lib/gomoku/variantCopy";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * The whole record as plain text.
 *
 * A replay can already be copied out one game at a time. This is the other
 * half: every game at once, in something a person can select, paste into a
 * mail or a text file, and keep after this site has stopped existing. That is
 * the point of it — a record you cannot take with you is a record somebody
 * else is holding for you.
 *
 * Aligned columns rather than commas. A comma-separated file is for a
 * program; this is meant to be read as it stands, and the alignment is what
 * makes a column of names scannable. The dates are ISO, not the reader's
 * locale, because a date in a kept file is read years later by somebody who
 * may not share the locale that wrote it — and because they sort.
 */

/**
 * The columns, in the order they are printed. A count is set to the right,
 * the way a column of numbers is set everywhere else, so the digits line up
 * and the eye can compare them without reading them.
 */
const COLUMNS = [
  { heading: "played.textDate", numeric: false },
  { heading: "played.textGame", numeric: false },
  { heading: "played.textBlack", numeric: false },
  { heading: "played.textWhite", numeric: false },
  { heading: "played.textResult", numeric: false },
  { heading: "played.textMoves", numeric: true },
] as const satisfies readonly { heading: PhraseKey; numeric: boolean }[];

const GAP = "  ";

function nameOr(name: string, fallback: string): string {
  return name.trim() === "" ? fallback : name.trim();
}

function rowFor(game: GameSummary, say: Speaker): string[] {
  return [
    game.playedAt.slice(0, 10),
    variantName(game.variant, say),
    nameOr(game.blackName, seatName(say, "one")),
    nameOr(game.whiteName, seatName(say, "two")),
    say.pairName(GAME_RESULT_DISPLAY[game.result].label, GAME_RESULT_DISPLAY[game.result].kanji).text,
    String(game.moveCount),
  ];
}

/**
 * How wide each column has to be.
 *
 * Measured from the text rather than fixed, because a name is the one thing
 * here we do not get to choose the length of, and truncating it would throw
 * away the very thing somebody is keeping the file for.
 */
function widthsFor(rows: string[][], headings: string[]): number[] {
  return headings.map((heading, column) =>
    rows.reduce((widest, row) => Math.max(widest, widthOf(row[column])), widthOf(heading)),
  );
}

/**
 * How many columns of a monospaced listing a text takes: a Japanese character
 * is two, so a column of names that mixes scripts still lines up.
 */
function widthOf(text: string): number {
  let width = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const wide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6);
    width += wide ? 2 : 1;
  }
  return width;
}

function pad(cell: string, width: number, end: boolean): string {
  const fill = " ".repeat(Math.max(0, width - widthOf(cell)));
  return end ? cell + fill : fill + cell;
}

function line(cells: string[], widths: number[]): string {
  return cells
    .map((cell, column) => pad(cell, widths[column], !COLUMNS[column].numeric))
    .join(GAP)
    // Trailing spaces on every line are litter in a file somebody is keeping.
    .trimEnd();
}

export function recordAsText(
  games: GameSummary[],
  { heading, total }: { heading: string; total: number },
  say: Speaker = speaker("en"),
): string {
  if (games.length === 0) return `${heading}\n\n${say.say("played.textNone")}\n`;

  const rows = games.map((game) => rowFor(game, say));
  const headings = COLUMNS.map((column) => say.say(column.heading));
  const widths = widthsFor(rows, headings);

  const out = [
    heading,
    games.length === total
      ? say.sentence(say.count("count.gamePlayed", total))
      : say.say("played.textPartial", { shown: String(games.length), total: String(total) }),
    "",
    line(headings, widths),
    line(
      widths.map((width) => "-".repeat(width)),
      widths,
    ),
    ...rows.map((row) => line(row, widths)),
    "",
  ];
  return out.join("\n");
}
