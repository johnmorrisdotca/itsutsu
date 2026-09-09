import { GAME_RESULT_DISPLAY } from "./gameHistory.constants";
import type { GameSummary } from "./gameHistory.types";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { variantLabel } from "@/lib/gomoku/variants.constants";

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
  { heading: "Date", numeric: false },
  { heading: "Game", numeric: false },
  { heading: "Black", numeric: false },
  { heading: "White", numeric: false },
  { heading: "Result", numeric: false },
  { heading: "Moves", numeric: true },
] as const;

const GAP = "  ";

function nameOr(name: string, fallback: string): string {
  return name.trim() === "" ? fallback : name.trim();
}

function rowFor(game: GameSummary): string[] {
  return [
    game.playedAt.slice(0, 10),
    variantLabel(game.variant),
    nameOr(game.blackName, SEAT_DISPLAY.one.label),
    nameOr(game.whiteName, SEAT_DISPLAY.two.label),
    GAME_RESULT_DISPLAY[game.result].label,
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
function widthsFor(rows: string[][]): number[] {
  return COLUMNS.map(({ heading }, column) =>
    rows.reduce((widest, row) => Math.max(widest, row[column].length), heading.length),
  );
}

function line(cells: string[], widths: number[]): string {
  return cells
    .map((cell, column) =>
      COLUMNS[column].numeric ? cell.padStart(widths[column]) : cell.padEnd(widths[column]),
    )
    .join(GAP)
    // Trailing spaces on every line are litter in a file somebody is keeping.
    .trimEnd();
}

export function recordAsText(
  games: GameSummary[],
  { heading, total }: { heading: string; total: number },
): string {
  if (games.length === 0) return `${heading}\n\nNo games yet.\n`;

  const rows = games.map(rowFor);
  const widths = widthsFor(rows);

  const out = [
    heading,
    games.length === total
      ? `${total} ${total === 1 ? "game" : "games"}.`
      : `${games.length} of ${total} games; the rest are on the site.`,
    "",
    line(COLUMNS.map(({ heading }) => heading), widths),
    line(
      widths.map((width) => "-".repeat(width)),
      widths,
    ),
    ...rows.map((row) => line(row, widths)),
    "",
  ];
  return out.join("\n");
}
