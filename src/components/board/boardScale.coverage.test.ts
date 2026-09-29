import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PUZZLE_CAGE_SUM, PUZZLE_MARK_RIGHT, PUZZLE_TOWER_CLUE, puzzleCellText } from "@/components/puzzles/puzzles.constants";

/**
 * EVERY BOARD A PERSON PLAYS ON OFFERS REGULAR, LARGE AND FULL.
 *
 * John, 2026-09-28: "Desktop sizing must be offered for ALL games (unless
 * there's an issue)." A size chooser added to one page and not the next is the
 * shape this site has met with every column and every link, so the rule is
 * held here, from the source, the way the dead-end and XP gates hold theirs:
 *
 * - every file that lays out a play — the practice and hot-seat board
 *   (`GameViewClient`), a live game (`SharedGame`), a puzzle's solve and a
 *   race's seat (`PuzzlePlayClient`), a pass-and-play table — wraps it in
 *   `BoardScaled`;
 * - every play marks the column its board is drawn in (`data-scale-board`),
 *   so the size has something to grow: each party table's own component, the
 *   puzzles' shared `SolvePaused`, the practice board's column, the live
 *   board's column, Kumimoji's pass-and-play table;
 * - a board drawn for reading and not for playing is named below with the
 *   reason it has no chooser, and the file must still exist, so the list
 *   cannot outlive what it excuses.
 */

const ROOTS = ["src/app", "src/components"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, text: readFileSync(path, "utf8") }));

/** A play being laid out on a page: the component that plays each kind of board. */
const PLAY_SURFACE = /<(GameViewClient|PuzzlePlayClient|SharedGame)\b|<Game appearance=/;

/**
 * BOARDS DRAWN TO BE READ, NOT PLAYED, and so offered no size. Each is a file
 * that draws a board, with the reason it is not a play.
 */
const NOT_A_PLAY: Record<string, string> = {
  "src/app/games/[slug]/match/[id]/FiledMatchPage.tsx":
    "a finished game's replay: read, not played, and its ⤢ opens the board on its own at the screen's size",
  "src/components/history/GameReplay.tsx": "the replay a finished game and a famous game are read in, as above",
  "src/app/famous/page.tsx": "a page of famous games' replays, each opened on its own with ⤢",
  "src/app/embed/page.tsx": "a board framed inside another site's page, whose frame decides its size",
  "src/components/puzzles/PuzzleSolvePage.tsx": "a finished puzzle's record: the grid as it was handed in, not played",
  "src/components/live/PuzzleBoardPreview.tsx":
    "the set-up screen's preview, in the one fixed box (SET_UP_PREVIEW_BOX) so nothing on that screen changes height",
};

describe("every board a person plays on offers Regular, Large and Full", () => {
  it("wraps every play a page lays out in BoardScaled", () => {
    const plays = FILES.filter(({ text }) => PLAY_SURFACE.test(text));
    expect(plays.length, "no page lays out a play: the pattern above no longer finds them").toBeGreaterThan(4);
    const bare = plays.filter(({ text }) => !text.includes("<BoardScaled")).map(({ path }) => path);
    expect(
      bare,
      "These files lay out a board to play on without the size chooser. Wrap the play in <BoardScaled> " +
        "(src/components/board/BoardScaled.tsx), or, if it is not a play, name it in NOT_A_PLAY with the reason.",
    ).toEqual([]);
  });

  it("marks the column every party table draws its board in", () => {
    const tables = FILES.filter(({ path }) => path.startsWith(join("src", "components", "party")) && path.endsWith("Game.tsx"));
    expect(tables.length).toBeGreaterThan(3);
    // A table that hands its game to the race table's component is marked there.
    const unmarked = tables.filter(({ text }) => !text.includes("data-scale-board") && !text.includes("<PartyRaceGame")).map(({ path }) => path);
    expect(unmarked, "a party table whose board the size chooser cannot find: put data-scale-board on its board's column, and data-scale-desk on the table").toEqual([]);
  });

  it("marks every puzzle's board through the one shared pause cover, and Kumimoji's pass-and-play table", () => {
    const solves = FILES.filter(({ path }) => path.startsWith(join("src", "components", "puzzles")) && path.endsWith("Solve.tsx"));
    expect(solves.length).toBeGreaterThan(6);
    const unmarked = solves.filter(({ text }) => !text.includes("<SolvePaused") && !text.includes("data-scale-board")).map(({ path }) => path);
    expect(unmarked, "a puzzle whose board is not in SolvePaused and not marked data-scale-board").toEqual([]);
    const shared = FILES.find(({ path }) => path.endsWith(join("puzzles", "solveShared.tsx")))!.text;
    expect(shared).toMatch(/data-testid="puzzle-pausable"[^>]*data-scale-board data-scale-stack/);
    const party = FILES.find(({ path }) => path.endsWith(join("puzzles", "KumimojiPartyTurn.tsx")))!.text;
    expect(party).toContain("data-scale-board data-scale-stack");
  });

  it("marks the practice board's column and the live board's column", () => {
    for (const file of ["src/components/game/GameView.tsx", "src/components/live/BoardColumn.tsx"]) {
      expect(readFileSync(file, "utf8"), file).toContain("data-scale-board");
    }
  });

  it("names only files that exist among the boards drawn to be read", () => {
    const gone = Object.keys(NOT_A_PLAY).filter((path) => !existsSync(path));
    expect(gone, "an exception for a file that is no longer there: take it out of NOT_A_PLAY").toEqual([]);
    for (const [path, reason] of Object.entries(NOT_A_PLAY)) {
      expect(reason.length, path).toBeGreaterThan(20);
      expect(PLAY_SURFACE.test(readFileSync(path, "utf8")), `${path} lays out a play, so it is not an exception`).toBe(false);
    }
  });
});

describe("text a number puzzle prints in its squares grows with them", () => {
  const css = readFileSync("src/app/globals.css", "utf8");

  /*
   * globals.css multiplies each fixed size by how much the board grew, so it
   * has to name the same size the class does at a desk's width (`sm:`). If a
   * class changes, the rule has to change with it, and this says which.
   */
  it("multiplies the sizes the classes draw at a desk's width", () => {
    expect(puzzleCellText(9)).toContain("sm:text-xl");
    expect(css).toContain("font-size: calc(1.25rem * var(--board-grow, 1));");
    expect(puzzleCellText(16)).toContain("sm:text-base");
    expect(css).toContain("font-size: calc(1rem * var(--board-grow, 1));");
    expect(PUZZLE_CAGE_SUM).toContain("sm:text-[0.65rem]");
    expect(css).toContain("font-size: calc(0.65rem * var(--board-grow, 1));");
    expect(PUZZLE_MARK_RIGHT).toContain("sm:size-6 sm:text-lg");
    expect(css).toContain("width: calc(1.5rem * var(--board-grow, 1));");
    expect(css).toContain("font-size: calc(1.125rem * var(--board-grow, 1));");
    expect(PUZZLE_TOWER_CLUE).toContain("sm:text-xl");
  });
});
