import { loadPopGuesses, readPopGuessesWith } from "./popWords";

/**
 * POP GOMOJI'S GUESSES WHERE THERE IS NO BROWSER: the server's own checks, a
 * unit test, a browser spec's own process. Importing this module is what lets
 * `loadPopGuesses` answer there; no page imports it (see `wordData.ts`).
 */
readPopGuessesWith(async () => (await import("@johnmorrisdotca/kotoba/pop-guesses")).POP_GUESSES);

/** The guesses at a length, read from their module: `loadPopGuesses` for a caller with no browser. */
export function loadPopGuessesFromModule(size: number): Promise<void> {
  return loadPopGuesses(size);
}
