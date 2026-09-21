import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE FINGERPRINT IS HASHED ONCE, AT BUILD, AND NOWHERE ELSE.
 *
 * `ladderFingerprint.ts` reads ten source files and hashes them. That is the
 * right answer to "is this measurement about the code that is running" and the
 * wrong thing to do inside a request: ten file reads and a SHA-256 per page
 * view, for an answer that cannot change between two requests of the same
 * deployment. AGENTS.md calls that shape out by name — no work repeated per
 * request when nothing changed — and Active CPU is what it costs.
 *
 * So `next.config.ts` calls it once and writes the answer into the bundle, and
 * a page asks `builtLadderFingerprint()`. This fails the build if a page or a
 * component ever reaches for the file-reading one instead, which would work
 * perfectly in development and quietly bill for itself in production.
 *
 * It also holds the reason `ladderFingerprint.ts` carries no `server-only`
 * marker: `next.config.ts` imports it outside any React server context, where
 * that marker throws. The marker is what would otherwise have stopped a
 * component importing it, so this test stands in its place.
 */

const SRC = join(process.cwd(), "src");

function sourceFiles(dir: string, prefix: string): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const here = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...sourceFiles(join(dir, entry.name), here));
    else if (/\.tsx?$/.test(entry.name)) out.push({ path: here, text: readFileSync(join(dir, entry.name), "utf8") });
  }
  return out;
}

describe("where the ladder's fingerprint may be read", () => {
  it("is read from the bundle by pages, never hashed in a request", () => {
    const reading = sourceFiles(SRC, "")
      .filter(({ path }) => path.startsWith("app/") || path.startsWith("components/"))
      .filter(({ path }) => !path.endsWith(".test.ts") && !path.endsWith(".test.tsx"))
      .filter(({ text }) => /from\s+["'][^"']*\/ladderFingerprint["']/.test(text))
      .map(({ path }) => path);
    expect(
      reading,
      "a page or component imports ladderFingerprint (which reads ten files and hashes them) instead of ladderFingerprint.built",
    ).toEqual([]);
  });

  it("is written into the bundle by the config, so there is something to read", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    expect(config, "next.config.ts no longer computes LADDER_FINGERPRINT, so every measurement would go silent").toMatch(
      /LADDER_FINGERPRINT:\s*readLadderFingerprint\(\)/,
    );
  });
});
