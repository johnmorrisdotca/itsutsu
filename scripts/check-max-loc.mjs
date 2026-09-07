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

const offenders = walk(ROOT)
  .map((path) => ({ path, lines: readFileSync(path, "utf8").split("\n").length }))
  .filter((file) => file.lines > MAX_LINES)
  .sort((a, b) => b.lines - a.lines);

if (offenders.length > 0) {
  console.error(`Files over ${MAX_LINES} lines:\n`);
  for (const file of offenders) {
    console.error(`  ${file.lines.toString().padStart(5)}  ${relative(".", file.path)}`);
  }
  console.error(`\nSplit them by responsibility. See AGENTS.md "File Size Gate".`);
  process.exit(1);
}

console.log(`loc:check passed — no file under ${ROOT}/ exceeds ${MAX_LINES} lines.`);
