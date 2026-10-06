import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Packed } from "@johnmorrisdotca/kotoba";

import { unpackText } from "@/lib/packed/pack";

import { type KanaWords, loadKanaWords, readKanaWordsWith } from "./kanaWords";

/**
 * THE KANA LISTS WHERE THERE IS NO BROWSER: the server's own checks, the pages
 * that replay a kana dodger's word (`PuzzleSolvePage`, `PuzzleMePage`), a unit
 * test, a browser spec's own process. Importing this module is what lets
 * `loadKanaWords` answer there (see `kanaWords.ts`).
 */
let everyList: Record<number, Packed> | null = null;

/**
 * The three lengths' lists, read from `kanaWords.json.br` (`src/lib/packed/`, 173 KB) the first time a server needs one and once
 * for the life of the process, by a path the build's tracer can follow, so keep it literal. The package's own three were 408 KB
 * of source in the pages' function (measured 2026-10-06); `pnpm data:pack` writes the file from them and
 * `packedData.coverage.test.ts` fails when the two come apart.
 */
function packedLists(): Record<number, Packed> {
  everyList ??= JSON.parse(unpackText(readFileSync(join(process.cwd(), "src/lib/packed", "kanaWords.json.br")))) as Record<number, Packed>;
  return everyList;
}

readKanaWordsWith(async (size) => {
  const list = packedLists()[size];
  if (list === undefined) throw new Error(`No ${size}-kana words.`);
  return list;
});

/** A length's words, read from their module: `loadKanaWords` for a caller with no browser. */
export function loadKanaWordsFromModule(size: number): Promise<KanaWords> {
  return loadKanaWords(size);
}
