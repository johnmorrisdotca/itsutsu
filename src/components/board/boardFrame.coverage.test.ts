import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * EVERY BOARD IS THE SAME BOARD, AND THE SET-UP PREVIEW IS ALWAYS A LIVE ONE.
 *
 * John, 2026-09-24, with Numbers chosen on the set-up screen: a screenshot of
 * one 9×9 sat where every game draws its wooden board at the chosen size.
 * "Each image is supposed to change based on size and type… the rest of the
 * board should look like the rest of the boards", and "The effect of having
 * the same size and look is that when the user clicks at anything the board
 * and page doesn't shift". Then: "Why did it not follow the rules of every
 * single other board. This must not have been written down somewhere." It
 * was not. This is where it is written down, and held:
 *
 * - the frame — wood, rim, coordinates, shadow — is drawn by `BoardFrame`
 *   alone, and `Board` and every puzzle grid are drawn inside it;
 * - the set-up screen's preview is a live board at the chosen size, for a
 *   game (`BoardPreview`) and a puzzle (`PuzzleBoardPreview`) alike, in one
 *   shared box (`SET_UP_PREVIEW_BOX`), and never a picture file.
 */

const read = (path: string) => readFileSync(path, "utf8");

describe("the board frame", () => {
  it("is drawn in one place, and Board is drawn inside it", () => {
    expect(read("src/components/board/Board.tsx")).toContain("<BoardFrame");
    expect(read("src/components/board/Board.tsx")).not.toContain("boxShadow");
    expect(read("src/components/board/BoardFrame.tsx")).toContain("boxShadow");
  });

  it("holds the star a table of players passes round, drawn with the two-player board's own holes", () => {
    const star = read("src/components/party/PartyStarBoard.tsx");
    expect(star).toContain("<BoardFrame");
    expect(star).toContain("<BoardLines");
    expect(star).toContain("<LatticeGround");
    expect(star).not.toContain("boxShadow");
  });

  it("holds Halma's square a table of four passes round, ruled by the two-player board's own lines", () => {
    const square = read("src/components/party/PartySquareBoard.tsx");
    expect(square).toContain("<BoardFrame");
    expect(square).toContain("<BoardLines");
    expect(square).not.toContain("boxShadow");
  });

  it("holds Dots and Boxes' dots and lines, on the reader's own wood, with its dots on the crossings", () => {
    const dots = read("src/components/party/DotsBoard.tsx");
    expect(dots).toContain("<BoardFrame");
    expect(dots).not.toContain("boxShadow");
    // Its set-up's preview is that live board at the chosen size, never a picture of one.
    expect(read("src/components/party/DotsSetUp.tsx")).toContain("<DotsBoard game={preview}");
    expect(read("src/components/party/DotsSetUp.tsx")).not.toMatch(/<GameThumb|<img|\.jpg/);
  });

  it("holds Mancala's pits and stores, on the reader's own wood", () => {
    const mancala = read("src/components/party/MancalaBoard.tsx");
    expect(mancala).toContain("<BoardFrame");
    expect(mancala).not.toContain("boxShadow");
    // Its set-up's preview is that live board under the rules chosen, never a picture of one.
    expect(read("src/components/party/MancalaSetUp.tsx")).toContain("<MancalaBoard game={preview}");
    expect(read("src/components/party/MancalaSetUp.tsx")).not.toMatch(/<GameThumb|<img|\.jpg/);
  });

  it("holds every puzzle grid, on white paper", () => {
    for (const grid of ["src/components/puzzles/PuzzleGrid.tsx", "src/components/puzzles/HiddenStonesGrid.tsx"]) {
      expect(read(grid), `${grid} draws its grid off the board`).toContain("<PuzzleBoard");
    }
    expect(read("src/components/puzzles/PuzzleBoard.tsx")).toContain("<BoardFrame");
  });
});

describe("the set-up preview", () => {
  it("is a live board at the chosen size for a puzzle as for a game, in the same box", () => {
    const game = read("src/components/live/BoardPreview.tsx");
    const puzzle = read("src/components/live/PuzzleBoardPreview.tsx");
    expect(game).toContain("SET_UP_PREVIEW_BOX");
    expect(puzzle).toContain("SET_UP_PREVIEW_BOX");
    expect(puzzle).toContain("<BoardFrame");
    // One row of preview and sizes, on the screen that chooses among every game and on a puzzle's own set-up.
    expect(read("src/components/puzzles/PuzzleBoardAndSizes.tsx")).toContain("<PuzzleBoardPreview kind={kind} size={size}");
    expect(read("src/components/live/PuzzleHere.tsx")).toContain("<PuzzleBoardAndSizes kind={puzzle} size={size}");
    expect(read("src/components/puzzles/PuzzleSetUp.tsx")).toContain("<PuzzleBoardAndSizes kind={kind} size={size}");
  });

  it("is never a picture file", () => {
    for (const file of ["src/components/live/PuzzleHere.tsx", "src/components/live/PuzzleBoardPreview.tsx", "src/components/live/BoardPreview.tsx", "src/components/puzzles/PuzzleSetUp.tsx"]) {
      expect(read(file), `${file} draws a picture where the live board belongs`).not.toMatch(/<GameThumb|<img|\.jpg/);
    }
  });
});
