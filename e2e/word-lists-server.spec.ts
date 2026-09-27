import { expect, test } from "@playwright/test";

import { generatePuzzle, preparePuzzle } from "../src/lib/puzzles/generate";
import { answersFor, languageOf } from "../src/lib/puzzles/gomoji/code";
import type { PuzzleKind } from "../src/lib/puzzles/puzzles.types";
import { loadEveryWordList } from "./wordLists";

// Words worked out here, in node, need Gomoji's lists loaded (`wordLists.ts`).
test.beforeAll(loadEveryWordList);

/**
 * THE SERVER STILL KNOWS ITS WORDS. Gomoji's word lists moved out of the
 * page bundles into chunks loaded when a puzzle needs them (`wordData.ts`,
 * `preparePuzzle`), so the functions Vercel runs carry one copy of each rather
 * than five. The solve route is what must still read them: a guess that is not
 * a word is refused, by name, and a solve of real words is kept.
 *
 * Driven as the browser drives it — the puzzle made here from a seed as the
 * page makes it, the solve posted to `/api/puzzles/solved` — for French (Mot)
 * at its shortest and longest, and Pop at the two lengths with guesses of its
 * own, 3 and 7.
 */
const CASES: { kind: PuzzleKind; size: number }[] = [
  { kind: "gomojiMot", size: 4 },
  { kind: "gomojiMot", size: 6 },
  { kind: "gomojiPop", size: 3 },
  { kind: "gomojiPop", size: 7 },
];

for (const { kind, size } of CASES) {
  test(`the server refuses a non-word and keeps real words, ${kind} at ${size} letters`, async ({ page }) => {
    await preparePuzzle(kind, size);
    const puzzle = generatePuzzle(kind, size, "medium", 20260926 + size);
    const hidden = puzzle.solution;
    const post = (answer: string) =>
      page.request.post("/api/puzzles/solved", {
        data: { kind, size, level: puzzle.level, seed: puzzle.seed, givens: puzzle.givens, answer, elapsedMs: 30_000 },
      });

    // A guess of the right length and letters that is no word of any list.
    const nonsense = "q".repeat(size);
    const refused = await post(`${nonsense}${hidden}`);
    expect(refused.status()).toBe(422);
    expect(((await refused.json()) as { error?: string }).error).toContain(`${nonsense} is not in the word list`);

    // A real word first, then the hidden one: kept.
    const other = answersFor(size, false, languageOf(kind)).find((word) => word !== hidden)!;
    const kept = await post(`${other}${hidden}`);
    expect(kept.status(), await kept.text()).toBe(200);
  });
}
