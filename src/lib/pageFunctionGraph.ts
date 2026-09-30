import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/**
 * WHAT THE PAGES' SERVER FUNCTION CARRIES, READ FROM THE SOURCE.
 *
 * Every page is built into one function (`_not-found` in
 * `scripts/function-sizes.baseline.json`), and it holds whatever a page, a
 * layout or anything they import can reach: the server components, and the
 * client components too, which are drawn on the server for the first paint.
 * `pnpm functions:size` measures that function, but only in the deploy job,
 * after a build. This reads the same reach from the imports, in a second, so
 * `pageFunction.coverage.test.ts` can refuse what should not be in it before
 * anything is pushed.
 *
 * Three things are NOT reached, because the build leaves them out:
 *  - a component loaded with `dynamic(() => import(…), { ssr: false })`, which
 *    is never drawn on the server;
 *  - an import inside `if (typeof window !== "undefined") { … }`, which the
 *    build removes from the server's copy (the word lists are fetched so);
 *  - a type-only import.
 *
 * Asked only by that test, never by a page: it reads the whole of `src`.
 */

const SRC = resolve(__dirname, "..");
const ROOT = resolve(SRC, "..");

/** The files Next builds a page's function from: a page and what wraps it. Route handlers are another function. */
const PAGE_FILE = /^(?:page|layout|template|default|loading|error|not-found|global-error)\.tsx$/;

export type SourceFile = {
  /** From the repository's root, as `src/lib/…`. */
  path: string;
  bytes: number;
  client: boolean;
  /** Files of `src` this one brings into a server build. */
  reaches: string[];
  /** Packages this one brings into a server build, as written. */
  packages: string[];
  /** Dynamic imports that are not behind `typeof window`, as written: a module that reads for the server. */
  serverDynamic: string[];
  /** Dynamic imports behind `typeof window`, as written: fetched by a browser only. */
  browserDynamic: string[];
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|mjs)$/.test(entry) && !/\.test\.|\.d\.ts$/.test(entry) ? [path] : [];
  });
}

function resolved(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(SRC, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null;
  if (base === null) return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** The end of the bracket that opens at `open`, or the end of the text. */
function closeOf(text: string, open: number, pair: "()" | "{}"): number {
  let depth = 0;
  for (let at = open; at < text.length; at += 1) {
    if (text[at] === pair[0]) depth += 1;
    else if (text[at] === pair[1]) {
      depth -= 1;
      if (depth === 0) return at;
    }
  }
  return text.length;
}

/** The stretches of a file the server's build does not have: `ssr: false` loads, and `typeof window` branches. */
function browserOnlySpans(text: string): { ssrFalse: [number, number][]; windowOnly: [number, number][] } {
  const ssrFalse: [number, number][] = [];
  for (const match of text.matchAll(/\bdynamic\s*\(/g)) {
    const open = match.index + match[0].length - 1;
    const close = closeOf(text, open, "()");
    if (/\bssr:\s*false\b/.test(text.slice(open, close))) ssrFalse.push([open, close]);
  }
  const windowOnly: [number, number][] = [];
  for (const match of text.matchAll(/if\s*\(\s*typeof window !== "undefined"\s*\)\s*\{/g)) {
    const open = match.index + match[0].length - 1;
    windowOnly.push([open, closeOf(text, open, "{}")]);
  }
  return { ssrFalse, windowOnly };
}

const within = (at: number, spans: [number, number][]) => spans.some(([from, to]) => at > from && at < to);

function read(path: string): SourceFile {
  const raw = readFileSync(path, "utf8");
  // Comments name imports too ("`import("./words.en.data")`"); only code counts.
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, (comment) => " ".repeat(comment.length)).replace(/(^|[^:"'`])\/\/[^\n]*/g, (comment) => " ".repeat(comment.length));
  const { ssrFalse, windowOnly } = browserOnlySpans(text);
  const reaches = new Set<string>();
  const packages = new Set<string>();
  const serverDynamic: string[] = [];
  const browserDynamic: string[] = [];
  const take = (spec: string) => {
    const file = resolved(path, spec);
    if (file !== null) reaches.add(relative(ROOT, file));
    else if (!spec.startsWith(".") && !spec.startsWith("@/")) packages.add(spec);
  };
  for (const match of text.matchAll(/^[ \t]*(?:import|export)\s+(?!type\s)(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']/gm)) take(match[1]!);
  for (const match of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) {
    if (within(match.index, ssrFalse)) continue;
    if (within(match.index, windowOnly)) {
      browserDynamic.push(match[1]!);
      continue;
    }
    serverDynamic.push(match[1]!);
    take(match[1]!);
  }
  return {
    path: relative(ROOT, path),
    bytes: Buffer.byteLength(raw),
    client: /^(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*["']use client["']/.test(raw),
    reaches: [...reaches],
    packages: [...packages],
    serverDynamic,
    browserDynamic,
  };
}

let graph: Map<string, SourceFile> | null = null;

/** Every source file under `src`, tests apart, by its path. Read once. */
export function sourceGraph(): Map<string, SourceFile> {
  graph ??= new Map(sourceFiles(SRC).map((path) => { const file = read(path); return [file.path, file] as const; }));
  return graph;
}

/** Everything the given files bring into a server build, themselves included, each with the file that first brought it. */
export function reachOf(roots: readonly string[]): Map<string, string | null> {
  const files = sourceGraph();
  const from = new Map<string, string | null>(roots.map((root) => [root, null]));
  const queue = [...roots];
  for (let at = 0; at < queue.length; at += 1) {
    for (const next of files.get(queue[at]!)?.reaches ?? []) {
      if (from.has(next)) continue;
      from.set(next, queue[at]!);
      queue.push(next);
    }
  }
  return from;
}

/** The pages and what wraps them: what the pages' function is built from. */
export function pageRoots(): string[] {
  return [...sourceGraph().keys()].filter((path) => path.startsWith("src/app/") && PAGE_FILE.test(path.split("/").pop()!));
}

/** How a file came to be reached, root first: for a failure that says what to cut. */
export function chainTo(reach: Map<string, string | null>, path: string): string {
  const chain: string[] = [];
  for (let at: string | null | undefined = path; at !== null && at !== undefined; at = reach.get(at)) chain.unshift(at);
  return chain.join(" → ");
}
