#!/usr/bin/env node
/**
 * PRINTS ONE BROWSER SHARD'S SPEC FILES, balanced by time (`src/lib/e2eShards.mjs`).
 *
 *   node scripts/e2e-shard.mjs <shard> <total>      e.g. 3 14
 *
 * Every `*.spec.ts` under e2e/, as Playwright's `testDir` finds them. It exits
 * non-zero rather than print nothing, because `playwright test` given no file
 * runs the WHOLE suite — a shard that lost its list would pass slowly instead
 * of failing.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { splitByTime } from "../src/lib/e2eShards.mjs";

const [shard, total] = process.argv.slice(2).map(Number);
if (!Number.isInteger(shard) || !Number.isInteger(total) || shard < 1 || shard > total) {
  console.error("Usage: node scripts/e2e-shard.mjs <shard> <total>, with 1 <= shard <= total");
  process.exit(1);
}

function specs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return specs(path);
    return entry.name.endsWith(".spec.ts") ? [path] : [];
  });
}

const times = JSON.parse(readFileSync("e2e/shard-times.json", "utf8"));
const mine = splitByTime(specs("e2e"), times, total)[shard - 1];
if (mine.length === 0) {
  console.error(`Shard ${shard} of ${total} has no spec files; refusing to print none.`);
  process.exit(1);
}
console.log(mine.join(" "));
