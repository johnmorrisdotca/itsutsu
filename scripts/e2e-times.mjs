#!/usr/bin/env node
/**
 * WRITES e2e/shard-times.json FROM A RUN'S LOG: the seconds each spec file took,
 * summed from the gaps between the `[n/N]` lines every shard prints.
 *
 *   gh run view <run-id> --log | node scripts/e2e-times.mjs > e2e/shard-times.json
 *
 * Use a run that went green on its first try: a retry repeats tests and would
 * count them twice. The setup project runs on every shard and is not a file to
 * place, so it is left out.
 */
import { readFileSync } from "node:fs";

const line = /^e2e \/ playwright \((\d+)\)\t[^\t]*\t(\S+) \[(\d+)\/(\d+)\] \[(\w+)\] › (e2e\/[^:]+):/;
const stamp = /^e2e \/ playwright \((\d+)\)\t[^\t]*\t(\S+)/;
const rows = new Map();
const last = new Map();
for (const text of readFileSync(0, "utf8").split("\n")) {
  const at = stamp.exec(text);
  if (at !== null) last.set(at[1], at[2]);
  const test = line.exec(text);
  if (test === null) continue;
  if (!rows.has(test[1])) rows.set(test[1], []);
  rows.get(test[1]).push({ at: test[2], file: test[6] });
}
const seconds = {};
for (const [shard, tests] of rows) {
  tests.forEach((test, i) => {
    const next = i + 1 < tests.length ? tests[i + 1].at : last.get(shard);
    if (test.file.endsWith("auth.setup.ts")) return;
    seconds[test.file] = (seconds[test.file] ?? 0) + (Date.parse(next) - Date.parse(test.at)) / 1000;
  });
}
const sorted = Object.fromEntries(Object.keys(seconds).sort().map((file) => [file, Math.round(seconds[file] * 10) / 10]));
console.log(JSON.stringify(sorted, null, 1));
