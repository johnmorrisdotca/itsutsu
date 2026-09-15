import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createRequire } from "node:module";

import nextConfig from "../../../next.config";

/** Next's own compiled picomatch, which ships no types: the shape it is called with in collect-build-traces.js. */
const picomatch = createRequire(import.meta.url)("next/dist/compiled/picomatch") as (
  glob: string,
  options: { dot: boolean; contains: boolean },
) => (route: string) => boolean;

/**
 * THE CHANGELOG IS SHIPPED ONLY TO THE ROUTES THAT NAME IT.
 *
 * `releasesFile.ts` reads CHANGELOG.md off the disk at request time, by a
 * path Next's file tracing cannot see, so a deployed function only has the
 * file if `outputFileTracingIncludes` in next.config.ts names it for that
 * route. Miss one and nothing fails: `readReleases` returns `[]` and logs,
 * the page shows an empty history, and — worse — a rule that reads the
 * changelog to decide something answers as though nothing had ever shipped.
 * That is what the local board's release stamp would have done, before the
 * board moved to Sumilabu: it refused a version the changelog did not name,
 * and on a route with no changelog it would have refused every version, in
 * production and nowhere else. The
 * Board Gate section of AGENTS.md already says pages that read the file must
 * name it; this is that sentence as a test, so it cannot be missed a third
 * time.
 *
 * WHAT IT CAN SEE: every import, transitively. It walks `src/` for import
 * statements, follows them backwards from `releasesFile.ts`, and collects
 * every `page.tsx` and `route.ts` under `src/app` that can reach it — so a
 * page that reaches the reader through a component it renders
 * (`AdminBoardCard.tsx`) is found the same as one importing it directly. A route on the list that never actually
 * calls `readReleases` is over-included, which costs one small file in one
 * function and is the safe side of the line. What it cannot see is a read by
 * a path this file does not know about; there is one changelog reader, and
 * it is the one named here.
 */

const SRC = resolve(__dirname, "../..");
const APP = join(SRC, "app");
const READER = join(SRC, "lib/backlog/releasesFile.ts");
const CHANGELOG = "./CHANGELOG.md";

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) files.push(path);
  }
  return files;
}

/** A specifier resolved to a file under src/, or null for a package or a file that is not there. */
function resolveImport(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/") ? join(SRC, specifier.slice(2)) : specifier.startsWith(".") ? resolve(dirname(from), specifier) : null;
  if (base === null) return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every file that imports each file, directly. */
function importersOf(files: readonly string[]): Map<string, Set<string>> {
  const importers = new Map<string, Set<string>>();
  const pattern = /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']/g;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(pattern)) {
      const target = resolveImport(file, (match[1] ?? match[2]) as string);
      if (target === null) continue;
      if (!importers.has(target)) importers.set(target, new Set());
      importers.get(target)!.add(file);
    }
  }
  return importers;
}

/** Everything that can reach `file` through imports, however many steps away. */
function reachers(file: string, importers: Map<string, Set<string>>): Set<string> {
  const seen = new Set<string>();
  const queue = [file];
  while (queue.length > 0) {
    const next = queue.pop()!;
    for (const importer of importers.get(next) ?? []) {
      if (seen.has(importer)) continue;
      seen.add(importer);
      queue.push(importer);
    }
  }
  return seen;
}

/** `src/app/api/backlog/[id]/route.ts` → `/api/backlog/[id]`; a route group folder is not part of the path. */
function routeOf(file: string): string {
  const path = dirname(file).slice(APP.length).split("/").filter((segment) => segment !== "" && !/^\(.*\)$/.test(segment));
  return `/${path.join("/")}`;
}

/**
 * Whether a config key names a route, EXACTLY the way Next decides it: the
 * same compiled picomatch, with the same options, as
 * `next/dist/build/collect-build-traces.js` passes when it applies
 * `outputFileTracingIncludes` to each route's trace. Not an imitation —
 * an imitation is how this would drift. Two things those options mean that
 * a reader might not expect: `contains` makes a key match any route that
 * CONTAINS it, so `/backlog` already reaches `/api/backlog/[id]`; and an
 * unescaped `[id]` is a character class, matching through the same
 * containment. An explicit, escaped key is still the honest entry: it says
 * the route was meant, rather than reached by a substring.
 */
const NEXT_TRACE_MATCH_OPTIONS = { dot: true, contains: true } as const;

function keyMatches(key: string, route: string): boolean {
  return picomatch(key, NEXT_TRACE_MATCH_OPTIONS)(route);
}

const includes = (nextConfig.outputFileTracingIncludes ?? {}) as Record<string, string[]>;
const changelogKeys = Object.entries(includes)
  .filter(([, patterns]) => patterns.includes(CHANGELOG))
  .map(([key]) => key);

const files = sourceFiles(SRC);
const importers = importersOf(files);
const readingRoutes = [...reachers(READER, importers)]
  .filter((file) => file.startsWith(APP) && /\/(page|route)\.tsx?$/.test(file))
  .map(routeOf)
  .sort();

describe("CHANGELOG.md reaches every route that reads it", () => {
  it("finds the reader's routes at all, so an empty answer cannot pass as a clean one", () => {
    expect(readingRoutes).toContain("/releases");
    expect(readingRoutes).toContain("/admin");
  });

  it("finds the routes that reach the reader through something they render, not only the ones importing it", () => {
    // The Admin page renders `AdminBoardCard`, which reads the changelog; the page never imports releasesFile itself.
    expect(readingRoutes).toContain("/admin");
  });

  it.each(readingRoutes)("%s names ./CHANGELOG.md in outputFileTracingIncludes", (route) => {
    expect(
      changelogKeys.some((key) => keyMatches(key, route)),
      `${route} can read CHANGELOG.md and next.config.ts does not ship it there — see AGENTS.md, Board Gate`,
    ).toBe(true);
  });

  it("matches keys the way Next does: an escaped dynamic segment, containment, and the global key", () => {
    expect(keyMatches("/api/backlog/\\[id\\]", "/api/backlog/[id]")).toBe(true);
    expect(keyMatches("/api/backlog/\\[id\\]", "/api/backlog")).toBe(false);
    // `contains`: a key reaches every route that contains it, however deep the route goes.
    expect(keyMatches("/backlog", "/api/backlog/[id]")).toBe(true);
    expect(keyMatches("/api/backlog", "/api/backlog/[id]")).toBe(true);
    expect(keyMatches("/*", "/api/backlog/[id]")).toBe(true);
    expect(keyMatches("/releases", "/api/backlog/[id]")).toBe(false);
  });
});
