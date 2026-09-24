import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY NAME IS DRAWN BY A NAME COMPONENT, AND EVERY LIST DRAWS IT THE SAME WAY.
 *
 * John, 2026-09-24, HIGH: "why do we show names differently in the XP page. We
 * really need to be using components that show names in the same way
 * everywhere in the site... we can have several components but right now it's
 * no holds barred, every man for himself... there's no consistency. make tests
 * for this too."
 *
 * There are two, and each has one job:
 *
 * - `PlayerName` — a name in running text: "Champion: Hanako M.", "Hanako M.
 *   vs Taro S.", "against Hanako M.".
 * - `MemberTag` — a name as the subject of a row, with its marks after it in
 *   one order: here now, 新, the flag, BOT, You.
 *
 * What this found when it was written: the XP board, its promotions and its
 * rungs drew a program with no BOT badge; the ladders and champions drew a
 * bare link with no flag; "My people" drew names that led nowhere; the here-now
 * lists and the players list built their own links around `shownName`; a
 * second component, `PlayerLink`, did what `PlayerName` does under another
 * name. Each list drew what its own query happened to select.
 *
 * Crude on purpose, in the manner of `gameLinks.coverage.test.ts`: it reads the
 * source. Every exception is a line below with its reason, so it can be argued
 * with rather than discovered.
 */

const ROOTS = ["src/app", "src/components"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    // `.tsx` only: a `.ts` module that composes a sentence ("Hanako M. won")
    // hands a string to a component and draws nothing itself.
    else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, source: readFileSync(path, "utf8") }));

const NAME_COMPONENTS = new Set(["src/components/players/PlayerName.tsx", "src/components/players/MemberTag.tsx"]);

/** Files that print `shownName(…)` themselves, each with why it is not a name drawn on a page. */
const SHOWN_NAME_ALLOWED = new Map<string, string>([
  [
    "src/app/players/[slug]/page.tsx",
    "The heading of a person's own page: the name is the page's title, at a title's size, and it leads nowhere because the reader is already there.",
  ],
  [
    "src/app/games/[slug]/match/[id]/MatchPage.tsx",
    "A string handed to the board for the sentence that offers a draw or a takeback; the board words it, it is not a name drawn on its own.",
  ],
  [
    "src/components/players/PlayerActions.tsx",
    "The words of a menu's label (“Buddy Hanako M.”), not a name on the page.",
  ],
  ["src/components/players/directoryActions.tsx", "The same menu's label, handed to it from the players list."],
  [
    "src/components/mine/StartGame.tsx",
    "An <option> in the opponent select. An option cannot hold a link or a badge; it is text by nature.",
  ],
  [
    "src/components/live/OpponentChoice.tsx",
    "A tile to choose an opponent by. The tile is the control, so the name on it cannot also be a link to somebody's page.",
  ],
]);

/** The marks a list draws after a name. Drawn by `MemberTag` and nowhere else. */
const MARKS = /<MemberKindBadge\b|<CountryMark\b|<RecencyMark\b|data-testid="record-new"/;

const MARKS_ALLOWED = new Map<string, string>([
  [
    "src/app/players/[slug]/page.tsx",
    "The person's own page heads itself with the country in full words and the kind in its badge, because there is room there that no row has.",
  ],
  [
    "src/components/mine/OpenGamesBoard.tsx",
    "The poster's place has a Location column of its own on this table, written out in full. A flag beside the name would say it twice.",
  ],
]);

/**
 * A `<PlayerName` opening a table cell or a `RecordTable` row's subject — a row
 * about a person — directly or inside a wrapper that opens the cell.
 */
function namesARowWithPlayerName(source: string): string[] {
  const lines = source.split("\n");
  const found: string[] = [];
  lines.forEach((line, index) => {
    if (!/<PlayerName\b/.test(line)) return;
    if (/subject:\s*<PlayerName\b/.test(line)) found.push(`${index + 1}: ${line.trim()}`);
    // The nearest line above that is not a comment.
    for (let at = index - 1; at >= Math.max(0, index - 8); at -= 1) {
      const above = lines[at].trim();
      if (above === "" || above.startsWith("{/*") || above.startsWith("*") || above.startsWith("//") || above.endsWith("*/}")) continue;
      // A wrapper around the name is still the cell the name heads: ComputerPlayers put its badges in one.
      if (/^<(span|div)\b[^>]*>$/.test(above)) continue;
      if (/^<td\b[^>]*>$/.test(above) || /^subject:\s*\($/.test(above)) found.push(`${index + 1}: ${line.trim()}`);
      break;
    }
  });
  return found;
}

const ROW_ALLOWED = new Map<string, string>([
  [
    "src/components/mine/OpenGamesBoard.tsx",
    "The row is an open SEAT, not a person — its subject is the game, and the poster's place and standing have columns of their own. See the marks exception above.",
  ],
]);

describe("names are drawn by the name components", () => {
  it("finds the names at all, so an empty sweep cannot pass for a clean one", () => {
    expect(FILES.filter((file) => /<PlayerName\b/.test(file.source)).length).toBeGreaterThanOrEqual(10);
    expect(FILES.filter((file) => /<MemberTag\b/.test(file.source)).length).toBeGreaterThanOrEqual(10);
  });

  it("prints a shortened name only through PlayerName or MemberTag", () => {
    const found = FILES.filter(
      (file) => !NAME_COMPONENTS.has(file.path) && !SHOWN_NAME_ALLOWED.has(file.path) && /\bshownName\s*\(/.test(file.source),
    ).map((file) => file.path);
    expect(
      found,
      "These files print a member's name by calling shownName themselves, so the name is styled, linked and " +
        "marked however that file decided. Draw it with <PlayerName> (a name in a sentence) or <MemberTag> (a " +
        "name heading a row) from src/components/players — or add the file to SHOWN_NAME_ALLOWED with the " +
        "reason it is not a name drawn on a page.",
    ).toEqual([]);
  });

  it("draws the marks after a name only in MemberTag", () => {
    const found = FILES.filter(
      (file) =>
        !NAME_COMPONENTS.has(file.path) &&
        !MARKS_ALLOWED.has(file.path) &&
        !file.path.endsWith("/MemberKindBadge.tsx") &&
        !file.path.endsWith("/CountryMark.tsx") &&
        !file.path.endsWith("/Recency.tsx") &&
        MARKS.test(file.source),
    ).map((file) => file.path);
    expect(
      found,
      "These files draw 新, a flag, a BOT badge or a here-now mark beside a name by hand, so their list shows " +
        "different marks from every other list. Pass `marks` (from memberMarks in src/lib/players/memberMarks.ts, " +
        "selected with MEMBER_MARKS_SELECT) to <MemberTag> instead, or add the file to MARKS_ALLOWED with the reason.",
    ).toEqual([]);
  });

  it("heads a row about a person with MemberTag, not a bare PlayerName", () => {
    const found = FILES.filter((file) => !ROW_ALLOWED.has(file.path)).flatMap((file) =>
      namesARowWithPlayerName(file.source).map((line) => `${file.path}:${line}`),
    );
    expect(
      found,
      "A table cell or a RecordTable subject that opens with <PlayerName> is a row about a person drawn without " +
        "its marks — a program with no BOT badge, a person with no flag. Use <MemberTag> with the row's `marks`, " +
        "or add the file to ROW_ALLOWED with the reason the row is not about the person.",
    ).toEqual([]);
  });

  it("marks your own row only through MemberTag", () => {
    const found = FILES.filter(
      (file) => !NAME_COMPONENTS.has(file.path) && /<PlayerName\b/.test(file.source) && />\s*You\s*</.test(file.source),
    ).map((file) => file.path);
    expect(found, "Pass `you` to <MemberTag> rather than drawing a “You” of your own beside the name.").toEqual([]);
  });

  it("has one component for a name in a sentence, not two", () => {
    // `PlayerLink` did what `PlayerName` does, under another name, in another file.
    const found = FILES.filter((file) => /\bfunction PlayerLink\b|<PlayerLink\b/.test(file.source)).map((file) => file.path);
    expect(found, "Use <PlayerName>; PlayerLink was folded into it.").toEqual([]);
  });

  it("every exception is a file that still exists", () => {
    for (const path of [...SHOWN_NAME_ALLOWED.keys(), ...MARKS_ALLOWED.keys(), ...ROW_ALLOWED.keys()]) {
      expect(() => readFileSync(path, "utf8"), `${path} is exempted and is not there`).not.toThrow();
    }
  });
});
