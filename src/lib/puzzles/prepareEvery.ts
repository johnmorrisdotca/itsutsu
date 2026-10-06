import "./everyListModule";
// The whole levels, answers too: a test or a spec plays a level, which a server only checks (`tsunagi/layoutsModule.ts`).
import "./tsunagi/levelsModule";
// Suido's boards too: a test or a spec plays a level, which a server only names by its hash (`suido/levelsModule.ts`).
import "./suido/levelsModule";
import { loadWordData } from "./gomoji/wordData";
import { POP_OWN_GUESS_LENGTHS, loadPopGuesses } from "./gomoji/popWords";
import { KANA_SIZES, loadKanaWords } from "./gomojiKana/kanaWords";
import { loadDailyPools } from "./dailyWords/dailyPools";
import { loadEveryTsunagiLevel } from "./tsunagi/levels";
import { loadEveryMeikyuuLevels } from "./meikyuu/levels";
import { loadTileWordsFromModule } from "./kumimoji/tileWordsModule";

/**
 * EVERY LIST EVERY PUZZLE READS, loaded at once — for the tests and the
 * browser specs that make puzzles in node. Never a page's: a page prepares
 * the one puzzle it shows (`preparePuzzle`). Its own module, and not the
 * generator's, because the lists are read here from their modules
 * (`everyListModule.ts`), which no page's components may import.
 */
export async function prepareEveryPuzzle(): Promise<void> {
  await Promise.all([
    loadWordData("en"),
    loadWordData("fr"),
    loadWordData("de"),
    ...KANA_SIZES.map((size) => loadKanaWords(size)),
    loadDailyPools("gomojiKana", KANA_SIZES),
    loadEveryTsunagiLevel(),
    loadEveryMeikyuuLevels(),
    loadTileWordsFromModule(),
    loadTileWordsFromModule("japanese"),
    ...POP_OWN_GUESS_LENGTHS.map((size) => loadPopGuesses(size)),
  ]);
}
