import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { code } from "@/components/games/sourceScan";

import { GAME_ENDING_COPY } from "./gameEnding.constants";

/**
 * EVERY GAME IN PROGRESS OFFERS THE SAME CONTROLS: Continue and New game on its
 * front door, Resign (or Give up) and New game under its board.
 *
 * John, 2026-10-02, at Tenka's front door, which showed a lone "Continue →",
 * and its table, where the only way to start over was a small button in a
 * corner: "Where is the option to start a new game, rather than Continue/
 * Resume? Where is the quit game or lose button, aka Resign? … We have to be
 * consistent for all games where there is an ongoing game. Right now it's
 * disparate/different per family and variant." Fourteen tables had fourteen
 * copies of a New game button and its question, a puzzle's door said Resume,
 * the patience games gave up without asking, and one table's Resign was called
 * Give up.
 *
 * A surface somebody plays on is found by what it does, the way
 * `idleWatch.coverage.test.ts` finds one: it asks "are you still there"
 * (`<AskIfAway`, `useIdleWatch(`) or solves through `useSolve(`. Each either
 * draws the shared controls (`GameEnding` and the buttons in it) or is named
 * below with the reason, and the exceptions are held to the reason.
 */

const ROOT = "src";
const read = (path: string) => readFileSync(path, "utf8");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.(test|coverage\.test|play\.test)\.ts$/.test(entry.name) ? [path] : [];
  });
}

const FILES = sources(ROOT);
const SHARED = /\b(GameEnding|NewGameButton|EndGameButton|NewGameLink|TableEnding)\b/;
/** The shared controls' own files: the words and the three that draw them. */
const SHARED_FILES = new Set(["src/components/play/GameEnding.tsx", "src/components/play/gameEnding.constants.ts", "src/components/play/GameInProgressOffer.tsx"]);

/** A play surface and the shared controls it is covered by instead of drawing them itself, each with the reason. */
const COVERED_ELSEWHERE: Record<string, { by: string; reason: string }> = {
  "src/components/game/GameView.tsx": { by: "src/components/game/GameControls.tsx", reason: "the practice board draws its controls in the panel beside the board (`GameControls`)" },
  "src/components/live/SharedGame.tsx": { by: "src/components/live/SharedGameFooter.tsx", reason: "a live game between members draws its Resign and New game in the footer under the board" },
  "src/components/puzzles/MahjongTableGame.tsx": { by: "src/components/puzzles/PuzzleNewGame.tsx", reason: "a puzzle's solve is mounted by `PuzzlePlay`, which draws `PuzzleNewGame` under every solve without a row of its own" },
};

/** Play surfaces not yet on the shared controls, each with the reason. A surface here that gains them must leave this list. */
const NOT_YET: Record<string, string> = {
  "src/components/party/online/BlocksOnline.tsx": "a table on several devices ends through the table's own Leave and End (`OnlineTable`), whose words and effect differ; see docs/plans/game-controls/README.md",
  "src/components/party/online/DotsOnline.tsx": "as BlocksOnline",
  "src/components/party/online/GhostOnline.tsx": "as BlocksOnline",
  "src/components/party/online/HitotsuOnline.tsx": "as BlocksOnline",
  "src/components/party/online/MancalaOnline.tsx": "as BlocksOnline",
  "src/components/party/online/RaceOnline.tsx": "as BlocksOnline",
  "src/components/party/online/SugorokuOnline.tsx": "as BlocksOnline",
  "src/components/party/online/TenkaOnline.tsx": "as BlocksOnline",
  "src/components/party/online/TrainOnline.tsx": "as BlocksOnline",
};

/** Files that carry the idle watch or the solve hook without being a surface: the hook itself and its carriers. */
const NOT_A_SURFACE = new Set([
  "src/components/game/AskIfAway.tsx",
  "src/components/game/useIdleWatch.ts",
  "src/components/puzzles/solveShared.tsx",
]);

/** Every solve screen, mounted by `PuzzlePlay`, which draws New game under all of them but the four that draw their own row. */
const SOLVES = FILES.filter((path) => /^src\/components\/puzzles\/\w+Solve\.tsx$/.test(path));
const HAS_OWN_ROW = new Set(["src/components/puzzles/SolitaireSolve.tsx", "src/components/puzzles/CubeSolve.tsx", "src/components/puzzles/FreeCellSolve.tsx", "src/components/puzzles/SpiderSolve.tsx"]);

describe("every game in progress offers the same controls", () => {
  const surfaces = FILES.filter((path) => !NOT_A_SURFACE.has(path) && /<AskIfAway|useIdleWatch\(|useSolve\(/.test(code(read(path))));

  it("finds the surfaces it should", () => {
    expect(surfaces.length).toBeGreaterThan(30);
    expect(surfaces).toContain("src/components/party/tenka/TenkaPlay.tsx");
    expect(surfaces).toContain("src/components/puzzles/NumberSolve.tsx");
  });

  it("draws the shared controls on every play surface, or says why not", () => {
    const bare = surfaces.filter((path) => {
      if (SHARED.test(code(read(path)))) return false;
      if (path in COVERED_ELSEWHERE || path in NOT_YET) return false;
      // A solve is covered by the row `PuzzlePlay` mounts, or by its own.
      return !SOLVES.includes(path);
    });
    expect(bare, "a surface somebody plays on must draw GameEnding (New game, and Resign or Give up where the game has a result), or be listed with the reason").toEqual([]);
  });

  it("holds each exception to its reason", () => {
    for (const [path, { by }] of Object.entries(COVERED_ELSEWHERE)) {
      expect(SHARED.test(code(read(by))), `${path} is covered by ${by}, which must draw the shared controls`).toBe(true);
    }
    for (const path of Object.keys(NOT_YET)) {
      expect(SHARED.test(code(read(path))), `${path} now draws the shared controls: take it off the list`).toBe(false);
    }
  });

  it("mounts New game under every puzzle solve, and the four that give up draw it beside Give up", () => {
    expect(code(read("src/components/puzzles/PuzzlePlay.tsx"))).toContain("<PuzzleNewGame");
    expect(code(read("src/components/puzzles/PuzzleNewGame.tsx"))).toMatch(/NewGameLink/);
    for (const path of HAS_OWN_ROW) {
      const source = code(read(path));
      const patience = path.endsWith("FreeCellSolve.tsx") || path.endsWith("SpiderSolve.tsx");
      // Free Cell and Spider draw it through the controls they share.
      expect(patience ? code(read("src/components/puzzles/PatienceControls.tsx")) : source, `${path} gives up through EndGameButton`).toContain("EndGameButton");
    }
    expect(SOLVES.length).toBeGreaterThan(15);
  });
});

describe("every door offers Continue and New game", () => {
  const OFFERS = FILES.filter((path) => /^src\/components\/party\/(\w+\/)?\w*Offer\.tsx$/.test(path));
  const BARE_DOOR = ["src/components/party/PartyOffer.tsx", "src/components/party/PairGoOffer.tsx", "src/components/party/PartyBlocksOffer.tsx"];

  it("finds the offers", () => {
    expect(OFFERS.length).toBeGreaterThanOrEqual(14);
  });

  it("draws every offer with GameInProgressOffer, never its own Continue", () => {
    for (const path of [...OFFERS, ...BARE_DOOR, "src/components/puzzles/PuzzlePlayOrResume.tsx"]) {
      expect(code(read(path)), `${path} must draw GameInProgressOffer`).toContain("<GameInProgressOffer");
    }
  });

  it("keeps Continue and Resume to one meaning each", () => {
    // No game defines a Continue of its own: the door says Continue → everywhere.
    for (const path of FILES.filter((p) => /^src\/components\/party\/.*constants\.ts$/.test(p))) {
      expect(code(read(path)), `${path} defines a Continue of its own`).not.toMatch(/\bcontinue:\s*["`]/);
    }
    // Resume is un-pausing a clock, in the pause button and its cover and nowhere else.
    const pause = new Set(["src/components/puzzles/SolveHeader.tsx", "src/components/puzzles/solveShared.tsx"]);
    const resume = FILES.filter((path) => /["'`>]\s*Resume\b/.test(code(read(path))) && !/\.constants\.ts$/.test(path) && !pause.has(path));
    expect(resume, "Resume is only the word for un-pausing a clock; going back to a game is Continue").toEqual([]);
  });
});

describe("no table asks its own question about starting again", () => {
  it("keeps the question, its answers and its words in the shared controls", () => {
    const own = FILES.filter((path) => !SHARED_FILES.has(path) && /\b(confirmNew|confirmYes|newGameConfirm|newGameYes|newGameNo)\b|-confirm-new"/.test(code(read(path))));
    expect(own, "a New game's question is GAME_ENDING_COPY.newGameAsk, asked by NewGameButton").toEqual([]);
  });

  it("says Resign for a game against somebody and Give up for one played alone, in one set of words", () => {
    expect(GAME_ENDING_COPY.resign).toBe("Resign");
    expect(GAME_ENDING_COPY.giveUp).toBe("Give up");
    expect(GAME_ENDING_COPY.newGame).toBe("New game");
    expect(GAME_ENDING_COPY.continue).toBe("Continue →");
    // The question for Resign says the other side wins; the one for Give up says it ends unsolved.
    expect(GAME_ENDING_COPY.resignAsk).toMatch(/other side wins/);
    expect(GAME_ENDING_COPY.giveUpAsk).toMatch(/unsolved/);
    // A table never words its own Give up or Resign as a literal button.
    const own = FILES.filter((path) => !SHARED_FILES.has(path) && /(label|aria-label)="(Resign|Give up|New game)"|>\s*(Resign|Give up)\s*</.test(code(read(path))));
    expect(own).toEqual([]);
  });
});

/**
 * A table round one device can be resigned from (John, 2026-10-02: "add Resign
 * to the hot-seat tables"). The rule is `lib/party/resign.ts`; the row is
 * `TableEnding`; the kept store reads the resignation back. A table that has
 * no Resign must say why.
 */
describe("every table round one device can be resigned", () => {
  const TABLES = FILES.filter((path) => /^src\/components\/party\/(?!online\/)(\w+\/)?\w+\.tsx$/.test(path) && /<AskIfAway/.test(code(read(path))));

  /** A table whose Resign is drawn somewhere else, or is its own, with the reason. */
  const OWN_RESIGN: Record<string, string> = {
    "src/components/party/PairGoGame.tsx": "Pair Go has resigned since it arrived: its engine ends the game for the team to move (`pairResign`), drawn with EndGameButton",
    "src/components/party/sugoroku/SugorokuPlay.tsx": "Sugoroku concedes through its engine's own move, drawn in the stage's fixed row of three presses (`SugorokuStage`, in GAME_ENDING_COPY's words)",
  };

  it("finds the tables", () => {
    expect(TABLES.length).toBeGreaterThanOrEqual(14);
    expect(TABLES).toContain("src/components/party/tenka/TenkaPlay.tsx");
  });

  it("draws Resign through TableEnding, or says why not", () => {
    const without = TABLES.filter((path) => !/\bTableEnding\b/.test(code(read(path))) && !(path in OWN_RESIGN));
    expect(without, "a table round one device has Resign (TableEnding), or is named in OWN_RESIGN with the reason").toEqual([]);
    for (const [path, reason] of Object.entries(OWN_RESIGN)) expect(reason.length, path).toBeGreaterThan(20);
    expect(code(read("src/components/party/sugoroku/SugorokuStage.tsx"))).toContain("SUGOROKU_COPY.giveUp");
    expect(code(read("src/components/party/PairGoGame.tsx"))).toContain("EndGameButton");
  });

  it("reads a resignation back from every table's kept store", () => {
    const stores = FILES.filter((path) => /^src\/components\/party\/(\w+\/)?\w*[sS]tore\.ts$/.test(path) && /keptInBrowser</.test(code(read(path))));
    const OWN: Record<string, string> = {
      "src/components/party/pairGoStore.ts": "Pair Go's engine ends a resigned game itself, and keeps the move",
      "src/components/party/sugoroku/sugorokuStore.ts": "a conceded Sugoroku match is a move of the engine's, kept with the rest",
    };
    const bare = stores.filter((path) => !/\bresign\w*/.test(code(read(path)).replace(/keptInBrowser/g, "")) && !(path in OWN));
    expect(bare, "a kept table store passes the way its game ends when resigned (resignTables.ts)").toEqual([]);
    expect(stores.length).toBeGreaterThanOrEqual(13);
  });
});
