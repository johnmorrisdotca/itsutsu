import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY SURFACE A PERSON PLAYS ON ASKS "ARE YOU STILL THERE?"
 *
 * John, 2026-09-24: "don't we have the ARE YOU THERE Modal that we have in other
 * games? All games should have that... why do we have games that don't have
 * it????" Only the practice board asked. A live game went quiet without a word
 * and a puzzle ran its clock on for whoever had walked away, and nothing knew
 * that "a surface somebody plays on" was a kind of thing with a rule.
 *
 * A surface is found by what it draws — a board (`<Board`), a grid of numbers
 * (`<PuzzleGrid`) or a grid of stones (`<HiddenStonesGrid`) — so a new game or
 * puzzle is on this list the day it draws one, without anybody adding it. It
 * asks if its file calls the watch itself (`useIdleWatch(`, as the practice
 * board does to pause its clock), draws `<AskIfAway`, or solves through
 * `useSolve(`, which pauses a puzzle on it. The two carriers are held below to
 * really call the watch.
 */

/** Drawn but not played on, each with the reason. A file here must say `readOnly`, so the reason stays true. */
const NOT_PLAYED_ON: Record<string, string> = {
  "src/components/live/BoardPreview.tsx": "the set-up screen's picture of a board; nothing on it is a move",
  "src/components/live/PuzzleBoardPreview.tsx": "the set-up screen's picture of a puzzle's board; a Gomoji's is drawn done, with no row to type in",
  "src/components/history/GameReplay.tsx": "a finished game played back; nobody is at it to be asked",
  "src/components/famous/FamousReplay.tsx": "a famous game from a published record, stepped through; nobody is playing it",
  "src/components/puzzles/FinishedPuzzle.tsx": "a puzzle already finished, drawn as it ended; nobody is solving it",
  "src/components/puzzles/WordReplay.tsx": "a word puzzle already over, replayed guess by guess with its keyboard readOnly; nobody is playing it",
  "src/components/party/PartySetUp.tsx": "a pass-and-play table's set-up: the board beside it is the live board set out for that many, readOnly, before anybody moves",
  "src/components/party/DotsSetUp.tsx": "Dots and Boxes' set-up: the board beside it is the live board at the size chosen, readOnly (no line to tap), before anybody draws",
  "src/components/party/MancalaSetUp.tsx": "Mancala's set-up: the board beside it is the live board under the rules chosen, readOnly (no pit to tap), before anybody sows",
  "src/components/party/tenka/TenkaSetUp.tsx": "Tenka's set-up: the map beside it is the live map dealt for that many, with nothing to tap, before anybody moves",
};

/**
 * Played on, and not asked, each with the reason. The embed is a board on
 * somebody else's page: it has no clock to stop, polls nothing, keeps nothing,
 * and a dialogue over another site's page would be ours taking over theirs.
 */
const NOT_ASKED: Record<string, string> = {
  "src/components/game/EmbedGame.tsx": "a board inside another site's page, with no clock, no polling and nothing kept",
};

/**
 * A part of another surface, never a page's board on its own, each with the
 * reason: it is asked through whatever draws it, and the test below holds
 * every file that draws it to asking, or to being listed as not played on.
 */
const PART_OF: Record<string, string> = {
  "src/components/puzzles/WordBoards.tsx": "a Futago's or a Yotsugo's Gomoji grids, two words to a board, drawn only by a Gomoji's solve, which asks, or its replay, which is not played on",
};

/*
 * And Dots and Boxes' board (2026-09-28), the first party game's surface, drawn by its table and its set-up;
 * Superghost's fragment, the letters its table watches, drawn by its table alone; Bridges' grid the same day;
 * and Mancala's board, drawn by its table and its set-up; Picture logic's grid (2026-09-29); and Tenka's map, the same.
 */
const DRAWS_A_SURFACE = /<(Board|PuzzleGrid|HiddenStonesGrid|BlackAndWhiteGrid|BridgesGrid|PictureLogicGrid|GomojiGrid|DotsBoard|GhostFragment|MancalaBoard|TenkaMap)[\s>]/;
const ASKS = /useIdleWatch\(|<AskIfAway[\s>]|useSolve\(/;

function tsxUnder(folder: string): string[] {
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    .map((entry) => join(entry.parentPath, entry.name));
}

const surfaces = [...tsxUnder("src/components"), ...tsxUnder("src/app")].filter((file) =>
  DRAWS_A_SURFACE.test(readFileSync(file, "utf8")),
);

describe("the idle question", () => {
  it("finds the surfaces it is guarding", () => {
    expect(surfaces).toContain("src/components/game/GameView.tsx");
    expect(surfaces).toContain("src/components/live/SharedGame.tsx");
    expect(surfaces).toContain("src/components/puzzles/NumberSolve.tsx");
    expect(surfaces).toContain("src/components/puzzles/HiddenStonesSolve.tsx");
    expect(surfaces).toContain("src/components/puzzles/BlackAndWhiteSolve.tsx");
    expect(surfaces).toContain("src/components/puzzles/BridgesSolve.tsx");
    expect(surfaces).toContain("src/components/puzzles/PictureLogicSolve.tsx");
    expect(surfaces).toContain("src/components/party/DotsGame.tsx");
    expect(surfaces).toContain("src/components/party/GhostGame.tsx");
    expect(surfaces).toContain("src/components/party/MancalaGame.tsx");
    expect(surfaces).toContain("src/components/party/tenka/TenkaPlay.tsx");
  });

  it("is asked on every surface a person plays on", () => {
    for (const file of surfaces) {
      if (file in NOT_PLAYED_ON || file in NOT_ASKED || file in PART_OF) continue;
      expect(readFileSync(file, "utf8"), `${file} draws a board or a grid and never asks whether anybody is there`).toMatch(ASKS);
    }
  });

  it("leaves out only what is not played on, and says so in the source", () => {
    for (const file of Object.keys(NOT_PLAYED_ON)) {
      expect(surfaces, `${file} no longer draws a board; take it off the list`).toContain(file);
      expect(readFileSync(file, "utf8"), `${file} is listed as not played on but draws a board that is not readOnly`).toMatch(/readOnly/);
    }
    for (const file of Object.keys(NOT_ASKED)) expect(surfaces, `${file} no longer draws a board; take it off the list`).toContain(file);
  });

  it("a part is asked through every file that draws it", () => {
    const every = [...tsxUnder("src/components"), ...tsxUnder("src/app")];
    for (const part of Object.keys(PART_OF)) {
      expect(surfaces, `${part} no longer draws a board; take it off the list`).toContain(part);
      const name = part.slice(part.lastIndexOf("/") + 1, -".tsx".length);
      const drawers = every.filter((file) => new RegExp(`<${name}[\\s>]`).test(readFileSync(file, "utf8")));
      expect(drawers.length, `${part} is drawn by nothing`).toBeGreaterThan(0);
      for (const file of drawers) {
        expect(file in NOT_PLAYED_ON || ASKS.test(readFileSync(file, "utf8")), `${file} draws ${name} and never asks whether anybody is there`).toBe(true);
      }
    }
  });

  it("the carriers really ask", () => {
    expect(readFileSync("src/components/game/AskIfAway.tsx", "utf8")).toMatch(/useIdleWatch\(/);
    const solve = readFileSync("src/components/puzzles/solveShared.tsx", "utf8");
    expect(solve).toMatch(/useIdleWatch\(/);
    expect(solve).toMatch(/<IdleModal[\s>]/);
  });

  /*
   * AND WHAT IS PLAYED IS KEPT. John, 2026-09-24, having paused a puzzle and
   * clicked away: "why is it not showing up in my current games list?… that
   * seems like a BIG MISS". A game was always kept — on the site, or in this
   * browser for the practice board — and a puzzle lived only in its tab. A
   * puzzle is kept through `useSolve`, which hands what is written to
   * `useKeptRun`; a solve screen that stopped handing it over would keep a
   * run with nothing in it.
   */
  it("keeps a puzzle when it is left, with what is written on it", () => {
    expect(readFileSync("src/components/puzzles/solveShared.tsx", "utf8")).toMatch(/useKeptRun\(/);
    for (const file of surfaces.filter((each) => /useSolve\(/.test(readFileSync(each, "utf8")))) {
      expect(readFileSync(file, "utf8"), `${file} solves a puzzle and does not hand what is written to be kept`).toMatch(/progress: encode\w+Progress\(/);
    }
  });
});
