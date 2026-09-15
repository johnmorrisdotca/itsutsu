import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";

import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase.ts";
import { EXPORT_ACTOR, PRODUCTION_SOURCE } from "../src/lib/sumilabu/boardExport.constants.ts";
import { diffTickets, freshen, inBatches, planExport, rehearsalSuffix, withoutKeys } from "../src/lib/sumilabu/boardExport.ts";
import type { StoredBacklogRow } from "../src/lib/sumilabu/boardExport.types.ts";
import { diffLines, planLines } from "../src/lib/sumilabu/boardExportReport.ts";
import { importBatch, listTargetTickets, targetTakesKeys } from "../src/lib/sumilabu/boardExportWire.ts";
import { SUMILABU_PROJECTS, liveOptIn, sumilabuTarget, targetLine } from "../src/lib/sumilabu/sumilabuProject.ts";

/**
 * Itsutsu's backlog, exported and imported onto Sumilabu's board.
 *
 *   DATABASE_URL=… DIRECT_URL=… pnpm board:export --out <dir>        report only: writes nothing to Sumilabu
 *   … pnpm board:export --out <dir> --fresh-ids --run                 a rehearsal into itsutsu-dev
 *   SUMILABU_PROJECT_KEY=itsutsu pnpm board:export:prod --out <dir> --run    the real move, at a freeze
 *
 * WHAT IT READS. The `BacklogItem` table of `DATABASE_URL`, inside a READ ONLY
 * transaction, so the database itself refuses a write whatever this file
 * becomes. A source that is not this machine is refused here; production is
 * read by `board:export:prod` alone, which asks Neon for the address.
 *
 * WHAT IT WRITES FIRST. The whole export, untrimmed and including who added
 * each row, as JSON under `--out`, before it asks Sumilabu anything. Never
 * inside the repository: the path is refused if it is.
 *
 * WHERE IT WRITES. `sumilabuTarget` decides, and forgetting lands on
 * itsutsu-dev. Two pairings more are refused here, because each would do
 * lasting harm while every write in it succeeded:
 *
 *  - itsutsu-dev takes only rehearsals, under `--fresh-ids`. Sumilabu refuses
 *    an import whose id another project already holds, so Itsutsu's real ids
 *    rehearsed into itsutsu-dev would block the real import into itsutsu.
 *  - Production's rows go to the live project and nowhere else, and the live
 *    project takes production's rows and nothing else.
 *
 * Keys are sent once the target takes them, which it is asked rather than
 * told (`targetTakesKeys`). Batches of at most five hundred; the import
 * upserts by id, so a run stopped half way is run again.
 */

const args = process.argv.slice(2);
const RUN = args.includes("--run");
const FRESH = args.includes("--fresh-ids");

function flag(name: string): string | undefined {
  const at = args.indexOf(`--${name}`);
  return at > -1 ? args[at + 1] : undefined;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function serverOf(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "an address this script could not read";
  }
}

/** The checkout and the repository it belongs to: a worktree lives inside the main checkout. */
function repositoryRoots(): string[] {
  const here = resolve(import.meta.dirname, "..");
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: here, encoding: "utf8" }).trim();
    return [here, dirname(common)];
  } catch {
    return [here];
  }
}

function archivePath(now: Date): string {
  const asked = flag("out");
  if (!asked) fail("--out <directory or file.json> is required: the full, untrimmed export is written there before anything else happens.");
  const path = resolve(asked);
  if (repositoryRoots().some((root) => path === root || path.startsWith(`${root}${sep}`))) {
    fail(`--out ${path} is inside the repository. The export holds every row's full text and who added it; keep it outside.`);
  }
  return path.endsWith(".json") ? path : join(path, `itsutsu-backlog-${now.toISOString().replace(/[:.]/g, "-")}.json`);
}

async function readRows(url: string): Promise<StoredBacklogRow[]> {
  const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });
  try {
    const [, rows] = await prisma.$transaction([
      prisma.$executeRaw`SET TRANSACTION READ ONLY`,
      prisma.backlogItem.findMany({ orderBy: { createdAt: "asc" } }),
    ]);
    return rows;
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const now = new Date();
  const url = process.env.DATABASE_URL ?? "";
  const production = process.env.BOARD_EXPORT_SOURCE === PRODUCTION_SOURCE;
  if (!url) fail("DATABASE_URL is not set. Name the database to read inline.");
  if (production && isLocalDatabase(url)) fail(`board:export:prod was handed ${serverOf(url)}, which is this machine. Nothing ran.`);
  if (!production && !isLocalDatabase(url)) {
    fail(`DATABASE_URL names ${serverOf(url)}, which is not this machine. Production is read by pnpm board:export:prod and nothing else.`);
  }

  let target;
  try {
    target = sumilabuTarget("board");
  } catch (error) {
    fail((error as Error).message);
  }
  const live = target.projectKey === SUMILABU_PROJECTS.live;
  console.log(`source: ${production ? "PRODUCTION" : "local"} ${serverOf(url)}, read only`);
  console.log(`target: ${targetLine(target)}${live ? ` — the LIVE project, opted in by ${liveOptIn()}` : ""}\n`);
  if (live && !production) fail("The live project takes production's rows and nothing else.");
  if (live && FRESH) fail("--fresh-ids is for rehearsals on itsutsu-dev. The live import keeps every id and key.");
  if (RUN && !live && production) fail("Production's rows go to the live project only, never to itsutsu-dev.");
  if (RUN && !live && !FRESH) {
    fail("An import into itsutsu-dev needs --fresh-ids: Sumilabu refuses an id another project holds, so real ids there would block the real import into itsutsu.");
  }

  const archive = archivePath(now);
  const stored = await readRows(url);
  mkdirSync(dirname(archive), { recursive: true });
  writeFileSync(archive, `${JSON.stringify({ exportedAt: now.toISOString(), source: serverOf(url), production, count: stored.length, rows: stored }, null, 2)}\n`, { flag: "wx" });
  console.log(`${stored.length} rows archived whole to ${archive}\n`);

  const plan = planExport(stored, basename(archive));
  const takesKeys = await targetTakesKeys(target);
  const suffix = rehearsalSuffix(now);
  const freshened = FRESH ? freshen(plan.rows, suffix) : plan.rows;
  const rows = takesKeys ? freshened : withoutKeys(freshened);
  console.log(`the target ${takesKeys ? "takes ticket keys: they are sent" : "does not take ticket keys yet: rows go without them, and a later run adds them"}`);
  if (FRESH) console.log(`rehearsal: every id and key ends -${suffix}`);
  for (const line of planLines(plan, takesKeys)) console.log(line);
  console.log("");
  for (const line of diffLines(diffTickets(rows, await listTargetTickets(target), takesKeys), "against the target now")) console.log(line);

  if (!RUN) {
    console.log(`\nReport only: nothing was written to ${targetLine(target)}. Add --run to import.`);
    return;
  }
  if (plan.unmappable.length > 0) fail(`\n${plan.unmappable.length} unmappable values; nothing was imported.`);
  if (takesKeys && plan.keyProblems.length > 0) fail(`\n${plan.keyProblems.length} keys Sumilabu would refuse; nothing was imported.`);

  const actor = flag("by") ?? EXPORT_ACTOR;
  const batches = inBatches(rows);
  let imported = 0;
  for (const [index, batch] of batches.entries()) {
    const outcome = await importBatch(target, batch, actor);
    if (!outcome.ok) {
      fail(`\nbatch ${index + 1} of ${batches.length} refused (${outcome.status}), after ${imported} rows:\n${outcome.problems.map((line) => `  ${line}`).join("\n")}`);
    }
    imported += outcome.imported;
    console.log(`\nbatch ${index + 1} of ${batches.length}: ${outcome.imported} rows imported into ${targetLine(target)}`);
  }

  const after = diffTickets(rows, await listTargetTickets(target), takesKeys);
  for (const line of diffLines(after, "against the target afterwards")) console.log(line);
  if (after.toAdd.length > 0 || after.changed.length > 0) fail("The target does not hold what was sent. Read the lines above before running again.");
  console.log(`\n${imported} rows imported; the target holds every one as sent.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
