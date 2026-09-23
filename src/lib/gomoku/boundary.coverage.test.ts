import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE ENGINE AND THE COMPUTER PLAYERS STAND ON THEIR OWN.
 *
 * Everything under `src/lib/gomoku/` — the rules, the engine, the graded
 * players, the specialists and their search — is written so that it could be
 * lifted into a repository of its own the day it is worth open-sourcing (board
 * ticket BOT-10). The cost of that day is decided now, by what these files
 * import: nothing of the site's, no database, no framework. That is already
 * true, and it is cheap to keep true and expensive to recover once it is not,
 * so it is a gate rather than a hope.
 *
 * Tests are left out on purpose, and so is test support — the simulator's
 * helpers, which import the test runner and would travel with the tests. A
 * coverage test that checks a site rule across the games — every game has
 * copy, every game has a picture — has to read the site to do it, and it would
 * not travel with the engine anyway.
 *
 * The allowed outside imports are Node's own modules, which the ladder's
 * fingerprint reads files with at build time. Anything else needs a reason
 * written here.
 */

const ROOT = "src/lib/gomoku";

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.ts$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : [];
  });
}

/** The module each import statement names, whatever its quotes. */
function importsOf(text: string): string[] {
  return [...text.matchAll(/^\s*(?:import|export)\s[^;]*?\sfrom\s+["']([^"']+)["']/gm)].map((match) => match[1]);
}

function allowed(module: string): boolean {
  return module.startsWith(".") || module.startsWith("node:");
}

describe("the engine's boundary", () => {
  const files = sources(ROOT);

  it("finds the files at all, so a move cannot make this gate vacuous", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it("imports nothing of the site's: no alias, no database, no framework", () => {
    const crossing = files.flatMap((file) => {
      const modules = importsOf(readFileSync(file, "utf8"));
      // Test support: it imports the runner, and goes wherever the tests go.
      if (modules.includes("vitest")) return [];
      return modules.filter((module) => !allowed(module)).map((module) => `${file}: ${module}`);
    });
    expect(crossing).toEqual([]);
  });

  it("reads the imports it is checking, so a new way of writing one is noticed", () => {
    expect(importsOf('import { a } from "./b";\nexport { c } from "@/d";\nimport type { E } from "next/f";')).toEqual([
      "./b",
      "@/d",
      "next/f",
    ]);
  });
});
