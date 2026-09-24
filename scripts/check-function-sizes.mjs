/**
 * Refuses a build whose server functions are too big, or have grown too much,
 * before any of it is uploaded.
 *
 * Vercel rejects a function over 250 MB uncompressed, and it says so only
 * after the whole build has been uploaded: UmaKuma 1.539.0 uploaded 226 MB
 * three times over and failed each time on a 278 MB function, and a refused
 * deploy still costs a slot of the hundred a day the shared account allows.
 * Ported from UmaKuma on 2026-09-23, when Itsutsu's functions were 104 to
 * 127 MB, most of it Prisma engines for databases and machines it never runs. Every function
 * also counts against the Functions Storage every project on the account
 * shares, so a function that creeps towards the limit is a problem well before
 * it reaches it.
 *
 * Two limits, from `src/lib/functionSizeGate.mjs`: no function over 60 MB,
 * and none more than 20% and more than 5 MB over the size recorded for it in
 * `scripts/function-sizes.baseline.json`. A function the baseline does not
 * know has the ceiling alone.
 *
 * Reads `.vercel/output/functions` as `vercel build` leaves it - on the CI
 * runner, so it measures the Linux build that ships rather than a Mac's. A
 * function is a `.func` folder (the symlinked ones are routes sharing another's
 * bundle); its size is the files in it plus every file its `.vc-config.json`
 * maps in from the project, which is how Vercel counts it. Only `stat`, so it
 * takes a fraction of a second.
 *
 *   node scripts/check-function-sizes.mjs            check against both limits
 *   node scripts/check-function-sizes.mjs --record   write this build's sizes as the baseline
 *   FUNCTION_SIZE_LIMIT_MB=150 node scripts/...      another ceiling
 *
 * A deliberate change in size is recorded in the same commit as the change,
 * with `pnpm functions:size --record`, so a reviewer sees the jump in the diff.
 *
 * To measure locally without pulling the project's secrets, give `vercel build`
 * its settings by hand in `.vercel/project.json` - `{"projectId":"local",
 * "orgId":"local","settings":{"framework":"nextjs","nodeVersion":"24.x"}}` -
 * then run `vercel build --yes`. A Mac's build came within 0.3 MB of the CI
 * runner's on every function, since Prisma ships only the Linux engine.
 */
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { FUNCTION_GROWTH_ALLOWED, FUNCTION_GROWTH_FLOOR_MB, FUNCTION_SIZE_LIMIT_MB, judgeFunctionSizes, recordBaseline } from "../src/lib/functionSizeGate.mjs";

const LIMIT_MB = Number(process.env.FUNCTION_SIZE_LIMIT_MB ?? FUNCTION_SIZE_LIMIT_MB);
const root = process.cwd();
const output = join(root, ".vercel/output/functions");
const baselineFile = join(root, "scripts/function-sizes.baseline.json");
const recording = process.argv.includes("--record");

if (!existsSync(output)) {
  console.error(`No ${relative(root, output)}: run \`vercel build\` first.`);
  process.exit(1);
}

/* Every `.func` folder, and every route that is a link to one. */
const folders = [];
const links = new Map();
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      if (name.endsWith(".func")) links.set(path, resolve(dirname(path), readlinkSync(path)));
      continue;
    }
    if (!stat.isDirectory()) continue;
    if (name.endsWith(".func")) folders.push(path);
    else walk(path);
  }
};
walk(output);

const folderSize = (dir) =>
  readdirSync(dir).reduce((total, name) => {
    const stat = statSync(join(dir, name));
    return total + (stat.isDirectory() ? folderSize(join(dir, name)) : stat.size);
  }, 0);

const routeName = (path) => relative(output, path).replace(/\.func$/, "");

/* Where a link ends, following a link to a link. */
const endOf = (link) => {
  let end = links.get(link);
  for (let hops = 0; links.has(end) && hops < 10; hops += 1) end = links.get(end);
  return end;
};

const measured = folders.map((dir) => {
  let bytes = folderSize(dir);
  const config = join(dir, ".vc-config.json");
  if (existsSync(config)) {
    const { filePathMap = {} } = JSON.parse(readFileSync(config, "utf8"));
    for (const source of new Set(Object.values(filePathMap))) {
      try {
        bytes += statSync(resolve(root, source)).size;
      } catch {
        /* A mapped file the build did not leave is Vercel's to refuse, not this. */
      }
    }
  }
  const routes = [routeName(dir), ...[...links.keys()].filter((link) => endOf(link) === dir).map(routeName)];
  return { name: routeName(dir), mb: bytes / 1e6, routes };
});

if (recording) {
  writeFileSync(baselineFile, `${JSON.stringify(recordBaseline(measured), null, 2)}\n`);
  console.log(`Recorded ${measured.length} functions in ${relative(root, baselineFile)}.`);
  process.exit(0);
}

const baseline = existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")) : null;
const verdicts = judgeFunctionSizes(measured, baseline, { limitMb: LIMIT_MB });
verdicts.sort((left, right) => right.mb - left.mb);

console.log(`${verdicts.length} functions (ceiling ${LIMIT_MB} MB, or ${Math.round(FUNCTION_GROWTH_ALLOWED * 100)}% and ${FUNCTION_GROWTH_FLOOR_MB} MB over the recorded size):`);
for (const { name, mb, allowedMb, baseline: recorded } of verdicts) {
  const was = recorded ? `recorded ${recorded.mb.toFixed(1)}` : "not recorded";
  console.log(`  ${mb.toFixed(1).padStart(7)} MB  allowed ${allowedMb.toFixed(1).padStart(6)}  ${was.padEnd(15)}  ${name}`);
}

const failures = verdicts.filter((verdict) => verdict.failure);
if (failures.length > 0) {
  for (const { failure } of failures) {
    console.error(
      `::error::${failure} Find what it traces in .next/server/**/*.nft.json - a whole folder read by a path the tracer cannot follow is the usual cause. If the growth is meant, record it with \`pnpm functions:size --record\` in the same commit.`,
    );
  }
  process.exit(1);
}
