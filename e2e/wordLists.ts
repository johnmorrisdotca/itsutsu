import { loadWordData } from "../src/lib/puzzles/gomoji/wordData";

/**
 * Gomoji's word lists, for a spec that works out words itself — an answer to
 * type, a guess to refuse. The site loads a list when a puzzle is prepared
 * (`preparePuzzle`), and reading one before is an error (`wordData.ts`), so a
 * spec that reads one in node loads the three first, once, in `beforeAll`.
 */
export async function loadEveryWordList(): Promise<void> {
  await Promise.all([loadWordData("en"), loadWordData("fr"), loadWordData("de")]);
}
