/**
 * The word lists where there is no browser: a server checking a finished
 * game, a test, a script. Importing this entry is what lets `loadTileWords`
 * answer there, reading the lists from this package's own files.
 */
export { loadTileWordsFromModule } from "./tileWordsModule.ts";
