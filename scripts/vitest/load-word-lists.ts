import { loadWordData } from "../../src/lib/puzzles/gomoji/wordData";
// Every puzzle's lists, read from their modules where there is no browser (`everyListModule.ts`).
import "../../src/lib/puzzles/everyListModule";

/*
 * GOMOJI'S WORD LISTS, LOADED BEFORE EVERY TEST FILE. The site loads a list
 * when a puzzle that uses it is prepared (`preparePuzzle`), and reading one
 * before that is an error (`wordData.ts`). Dozens of unit tests make and check
 * Gomoji, Koushi and Kumimoji puzzles directly, as the pure functions they are,
 * so the three lists are loaded here once for each file rather than in each of
 * them. The browser suite is what proves the pages load their own.
 */
await Promise.all([loadWordData("en"), loadWordData("fr"), loadWordData("de")]);
