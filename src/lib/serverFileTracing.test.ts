import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/*
 * A FILE READ OFF DISK NAMES ITS FOLDER IN A STRING THE BUILD CAN SEE.
 *
 * Next's file tracer decides what goes into a server function by reading the
 * paths the code opens. `join(process.cwd(), "CHANGELOG.md")` it can follow;
 * `join(process.cwd(), file)` it cannot, and it packs whatever might match to
 * be safe. UmaKuma 1.539.0 read its ladder archive that way and one function
 * came to 278 MB, over Vercel's 250 MB limit: the deploy failed three times.
 * Ported from UmaKuma's `serverFileTracing.test.ts` on 2026-09-23, with
 * `scripts/check-function-sizes.mjs` as the gate that measures the result.
 * Spell the folder out and join the variable part after it.
 */

const SRC = resolve(__dirname, "..");

/*
 * Reads the build never ships, each with the reason. Nothing here is imported
 * by a page, a route or anything they import, so no function traces it.
 */
const NEVER_SERVED: ReadonlyMap<string, string> = new Map([
  [
    "src/lib/learn/images.ts",
    "Asked only by variants.coverage.test.ts, the New Game Gate: whether a game's screenshot and thumbnail exist under public/.",
  ],
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|mjs)$/.test(entry) && !entry.includes(".test.") ? [path] : [];
  });
}

function offendersOf(pattern: RegExp): string[] {
  return sourceFiles(SRC)
    .map((file) => `src/${relative(SRC, file)}`)
    .filter((file) => !NEVER_SERVED.has(file))
    .filter((file) => pattern.test(readFileSync(resolve(SRC, "..", file), "utf8")));
}

describe("server file reads name their folder", () => {
  it("never joins process.cwd() straight to a variable", () => {
    expect(offendersOf(/(?:join|resolve)\(\s*process\.cwd\(\)\s*,\s*[^"'`\s)]/)).toEqual([]);
  });

  /*
   * The same hole one step removed: the whole of public/ or src/ as the root,
   * joined to a file name after it. On UmaKuma that put forty-seven megabytes
   * of catalogue export into every function that printed three facts.
   */
  it("never roots a read at the whole of public or src", () => {
    expect(offendersOf(/(?:join|resolve)\(\s*process\.cwd\(\)\s*,\s*(?:"public"|"src")\s*,\s*[^"'\s]/)).toEqual([]);
  });

  it("names only exemptions that still exist and still need it", () => {
    for (const file of NEVER_SERVED.keys()) {
      const source = readFileSync(resolve(SRC, "..", file), "utf8");
      expect(source, `${file} no longer reads a whole folder; take it off the list`).toMatch(/process\.cwd\(\)\s*,\s*"public"/);
    }
  });
});
