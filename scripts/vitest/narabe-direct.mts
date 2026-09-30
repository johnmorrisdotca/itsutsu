/*
 * Under vitest, a module that only re-exports Narabe resolves straight to
 * Narabe.
 *
 * The site reaches the rules engine through modules at the old paths
 * (`src/lib/gomoku/engine.ts`, `rules/*.ts` and the rest), each one line of
 * `export * from "@johnmorrisdotca/narabe/…"`. The app's bundler resolves
 * such a line away at build time. Vitest does not: it runs every re-export
 * as a getter, so each call the searches make into the engine, millions of
 * them in a test that plays out a threat sequence, goes through a layer of
 * the site's own before it reaches the package. Measured on 2026-09-30,
 * `threatWin.test.ts` took 78 seconds that way and 5 with this in place.
 *
 * Only a module that is nothing but comments and one such line is skipped,
 * so a module with anything of the site's own in it (gomoku.constants.ts
 * keeps the words players read) is loaded as it is.
 */
import { readFileSync } from "node:fs";

import type { Plugin } from "vitest/config";

const ONLY_NARABE = /^(?:\/\/[^\n]*\n)*export \* from "(@johnmorrisdotca\/narabe\/[^"]+)";\n?$/;

const targets = new Map<string, string | null>();

/** The Narabe module a file only re-exports, or null for any other file. */
function narabeBehind(id: string): string | null {
  if (!targets.has(id)) {
    let target: string | null = null;
    try {
      target = ONLY_NARABE.exec(readFileSync(id, "utf8"))?.[1] ?? null;
    } catch {
      target = null;
    }
    targets.set(id, target);
  }
  return targets.get(id) ?? null;
}

export function narabeDirect(): Plugin {
  return {
    name: "narabe-direct",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer || source.startsWith("@johnmorrisdotca/")) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved || !resolved.id.includes("/src/lib/gomoku/")) return resolved;
      const target = narabeBehind(resolved.id);
      return target ? this.resolve(target, importer, { ...options, skipSelf: true }) : resolved;
    },
  };
}
