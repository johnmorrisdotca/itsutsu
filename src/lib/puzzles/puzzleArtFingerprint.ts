import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fingerprintOf } from "../gomoku/ladderFingerprint.ts";

/**
 * The files that decide how a puzzle's picture looks: the grid, its look,
 * and the scene the picture is taken of. The same idea as
 * `boardArtFingerprint.ts` for the boards, kept apart so that a change to a
 * puzzle's grid asks for the puzzles' pictures to be re-taken and not the
 * forty-five boards', and the other way about.
 */
export const PUZZLE_ART_FILES: readonly string[] = [
  "src/components/puzzles/PuzzleBoard.tsx",
  "src/components/puzzles/PuzzleGrid.tsx",
  "src/components/puzzles/HiddenStonesGrid.tsx",
  "src/components/puzzles/TowerRing.tsx",
  "src/components/puzzles/BlackAndWhiteGrid.tsx",
  "src/components/puzzles/GomojiGrid.tsx",
  "src/components/puzzles/TsunagiGrid.tsx",
  // Tsunagi's picture is one of its levels, which are the package's.
  "node_modules/@johnmorrisdotca/tsunagi/package.json",
  "src/components/puzzles/KumimojiTable.tsx",
  "src/components/puzzles/kumimoji.constants.ts",
  "src/components/puzzles/KoushiGrid.tsx",
  "src/components/puzzles/BridgesGrid.tsx",
  "src/components/puzzles/PictureLogicGrid.tsx",
  "src/components/puzzles/SolitaireTable.tsx",
  "src/components/puzzles/FreeCellTable.tsx",
  "src/components/puzzles/SpiderTable.tsx",
  "src/components/puzzles/patienceTable.tsx",
  "src/components/cards/PlayingCard.tsx",
  "src/components/cards/CardFace.tsx",
  "src/components/cards/CardBack.tsx",
  "src/components/cards/CardPile.tsx",
  "src/components/cards/Cards.constants.ts",
  "src/components/cards/pileLayout.ts",
  "src/components/puzzles/MahjongBoard.tsx",
  "src/components/puzzles/MahjongTileFace.tsx",
  "src/components/puzzles/mahjong.constants.ts",
  "src/components/puzzles/puzzles.constants.ts",
  "src/components/board/StoneMark.tsx",
  // The Numbers family (Number Place, Jigsaw, Diagonal, Sum Cages, More or Less, Towers) is Kazu's: its puzzles, solver, check and cage outline. A new version of it is a picture to re-take.
  "node_modules/@johnmorrisdotca/kazu/package.json",
  "src/lib/puzzles/kazu.ts",
  "src/lib/puzzles/jigsaw/shake.ts",
  "src/lib/puzzles/hiddenStones/generate.ts",
  "src/lib/puzzles/hiddenStones/regions.ts",
  "src/lib/puzzles/blackAndWhite/generate.ts",
  "src/lib/puzzles/blackAndWhite/solve.ts",
  "node_modules/@johnmorrisdotca/kumimoji/dist/generate.js",
  "src/lib/puzzles/koushi/generate.ts",
  "src/lib/puzzles/bridges/generate.ts",
  "src/lib/puzzles/bridges/solve.ts",
  "src/lib/puzzles/bridges/code.ts",
  "src/lib/puzzles/pictureLogic/generate.ts",
  "src/lib/puzzles/pictureLogic/picture.ts",
  "src/lib/puzzles/pictureLogic/solve.ts",
  "src/lib/puzzles/pictureLogic/lines.ts",
  "src/lib/puzzles/pictureLogic/code.ts",
  "src/lib/puzzles/solitaire/generate.ts",
  "src/lib/puzzles/solitaire/rules.ts",
  "src/lib/puzzles/freecell/generate.ts",
  "src/lib/puzzles/spider/generate.ts",
  // The three solitaires' deals, rules and solvers are Toranpu's since 1.3.0: a new version of it is a picture to re-take.
  "node_modules/@johnmorrisdotca/toranpu/package.json",
  "src/lib/puzzles/winnableSeed.ts",
  "src/lib/puzzles/mahjong/generate.ts",
  // Mahjong's tiles, layouts and deals are Jarajara's since 2026-10-01: a new version of it is a picture to re-take.
  "node_modules/@johnmorrisdotca/jarajara/package.json",
  "src/lib/puzzles/cube/generate.ts",
  "src/components/puzzles/CubeBoard.tsx",
  // Kyuubu draws the cube; its version says when its drawing may have changed.
  "node_modules/@johnmorrisdotca/kyuubu/package.json",
  "src/lib/puzzles/suido/generate.ts",
  "src/components/puzzles/SuidoBoard.tsx",
  // Suido's boards, pieces and water are the package's: a new version of it is a picture to re-take.
  "node_modules/@johnmorrisdotca/suido/package.json",
  "src/lib/puzzles/meikyuu/way.ts",
  "src/components/puzzles/MeikyuuBoard.tsx",
  // Meikyuu's mazes, walls and line are the package's: a new version of it is a picture to re-take.
  "node_modules/@johnmorrisdotca/meikyuu/package.json",
  "src/lib/puzzles/tobiishi/way.ts",
  "src/components/puzzles/TobiishiBoard.tsx",
  // Tobiishi's boards and pegs are drawn by the package: a new version of it is a picture to re-take.
  "node_modules/@johnmorrisdotca/tobiishi/package.json",
  "e2e/puzzle-screenshots.spec.ts",
];

export function readPuzzleArtFingerprint(root: string = process.cwd()): string | null {
  try {
    return fingerprintOf(PUZZLE_ART_FILES.map((path) => ({ path, text: readFileSync(join(root, path), "utf8") })));
  } catch {
    return null;
  }
}
