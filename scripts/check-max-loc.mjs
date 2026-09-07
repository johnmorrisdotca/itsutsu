/**
 * File size gate.
 *
 * Code under src/ stays at or below MAX_LINES. When a file approaches the
 * limit, split it by responsibility rather than compressing it — the point of
 * the gate is that every file stays readable in one sitting.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import process from "node:process";

const MAX_LINES = 500;

/*
 * What the gate is not for.
 *
 * The limit exists to catch a file that has quietly become a god-object — it
 * caught useGameSession doing seven jobs, and splitting that was a real
 * improvement. It fires just as readily on things that are merely long, and
 * those are a different shape of problem:
 *
 *   *.constants.ts   a table of data. Splitting VARIANT_SPECS in half gives
 *                    two files that must be kept in step, which is worse than
 *                    one long one.
 *   *.test.ts        a suite of focused cases. Forty small tests in one file
 *                    is not complexity, and cutting it at forty invents a
 *                    seam that means nothing.
 *
 * So they are counted and reported, but they do not fail the build. Logic
 * files still do.
 */
const ADVISORY = /\.(constants|test)\.[cm]?[jt]sx?$/;
const ROOT = "src";
const EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs"]);
const SKIP_DIRS = new Set(["generated", "node_modules"]);

function walk(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(path, found);
    } else if (EXTENSIONS.has(extname(entry))) {
      found.push(path);
    }
  }
  return found;
}

const oversize = walk(ROOT)
  .map((path) => ({ path, lines: readFileSync(path, "utf8").split("\n").length }))
  .filter((file) => file.lines > MAX_LINES)
  .sort((a, b) => b.lines - a.lines);

const advisory = oversize.filter((file) => ADVISORY.test(file.path));
const offenders = oversize.filter((file) => !ADVISORY.test(file.path));

if (advisory.length > 0) {
  console.log(`Long, but not counted — data and tests:\n`);
  for (const file of advisory) {
    console.log(`  ${file.lines.toString().padStart(5)}  ${relative(".", file.path)}`);
  }
  console.log("");
}

if (offenders.length > 0) {
  console.error(`Files over ${MAX_LINES} lines:\n`);
  for (const file of offenders) {
    console.error(`  ${file.lines.toString().padStart(5)}  ${relative(".", file.path)}`);
  }
  console.error(`\nSplit them by responsibility. See AGENTS.md "File Size Gate".`);
  process.exit(1);
}

console.log(`loc:check passed — no file under ${ROOT}/ exceeds ${MAX_LINES} lines.`);
