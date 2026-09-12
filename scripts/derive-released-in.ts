/**
 * Works out which release carried each done row that carries no release, and
 * writes the answer down with its evidence.
 *
 *   node --env-file=.env scripts/derive-released-in.ts --board <dump.json>
 *   node --env-file=.env scripts/derive-released-in.ts            (reads the board over the API)
 *
 * Gathering only. Every decision is `src/lib/backlog/releasedInBackfill.ts`,
 * which is pure and unit-tested; this reads the three things it needs and
 * writes the two files it produces:
 *
 *   docs/plans/board-convergence/released-in-backfill.json   the mapping
 *   docs/plans/board-convergence/released-in-backfill.md     the same, to read
 *
 * WRITES NO DATABASE. It reads the board — over the API with a board token,
 * or from a dump with `--board` — and writes two files in the repository.
 * `scripts/backfill-released-in.ts` is what applies the mapping, separately
 * and on somebody's word.
 *
 * The release timeline comes from git rather than from CHANGELOG.md, because
 * the changelog dates only the 32 releases `pnpm release:take` has written
 * and the other 168 are the ones that need placing. The commit that first
 * bumped `package.json` to a version is when that version went out, to the
 * second, for all 215 of them.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { parseReleases } from "../src/lib/backlog/releases.ts";
import { looksLikeTestLitter, planBackfill, tallyPlan } from "../src/lib/backlog/releasedInBackfill.ts";
import type { BackfillRow, ReleaseMoment } from "../src/lib/backlog/releasedInBackfill.types.ts";

const OUT_JSON = "docs/plans/board-convergence/released-in-backfill.json";
const OUT_MD = "docs/plans/board-convergence/released-in-backfill.md";

function git(args: readonly string[]): string {
  return execFileSync("git", [...args], { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
}

/** Every version `package.json` has ever held, with the instant it first held it. */
function versionTimeline(): Map<string, { at: string; commit: string }> {
  const log = git(["log", "--reverse", "--format=%H|%cI", "--", "package.json"]).trim();
  const timeline = new Map<string, { at: string; commit: string }>();
  if (log === "") return timeline;
  for (const line of log.split("\n")) {
    const [sha, at] = line.split("|");
    if (sha === undefined || at === undefined) continue;
    let version: string | undefined;
    try {
      version = (JSON.parse(git(["show", `${sha}:package.json`])) as { version?: string }).version;
    } catch {
      continue;
    }
    if (version === undefined) continue;
    if (!timeline.has(version)) timeline.set(version, { at, commit: sha.slice(0, 8) });
  }
  return timeline;
}

/**
 * When each `## <version>` heading was first written into CHANGELOG.md.
 *
 * The fallback for a release `package.json` never held, and there are 40 of
 * them: 0.2.0–0.32.0, written retroactively when versioning arrived at
 * 0.33.0, and 0.113.0–0.120.0, eight releases that shipped with no bump at
 * all and were acknowledged a day later in one commit (see AGENTS.md, "fifteen
 * commits once landed in one night with no version bump"). It says when the
 * release was WRITTEN DOWN rather than when it went out, which is why the
 * rules never let an instant from here reach `certain`.
 */
function headingInstants(versions: readonly string[]): Map<string, { at: string; commit: string }> {
  const instants = new Map<string, { at: string; commit: string }>();
  for (const version of versions) {
    const log = git(["log", "--reverse", "--format=%H|%cI", `-S## ${version}`, "--", "CHANGELOG.md"]).trim();
    const first = log === "" ? undefined : log.split("\n")[0];
    if (first === undefined) continue;
    const [sha, at] = first.split("|");
    if (sha === undefined || at === undefined) continue;
    instants.set(version, { at, commit: sha.slice(0, 8) });
  }
  return instants;
}

/** Commit subjects and bodies, for the rule that reads a row's key out of one. */
function commitMessages(): { sha: string; at: string; message: string }[] {
  const log = git(["log", "--format=%H%x1f%cI%x1f%B%x1e"]);
  return log
    .split("\u001e")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [sha = "", at = "", message = ""] = entry.split("\u001f");
      return { sha: sha.slice(0, 8), at, message };
    });
}

type BoardItem = BackfillRow & { id?: string };

/** The board, from a dump on disk or over its own API — never from the table. */
async function readBoard(argv: readonly string[]): Promise<BoardItem[]> {
  const dumpAt = argv.indexOf("--board");
  if (dumpAt !== -1 && argv[dumpAt + 1] !== undefined) {
    const raw = JSON.parse(readFileSync(argv[dumpAt + 1]!, "utf8")) as BoardItem[] | { items: BoardItem[] };
    return Array.isArray(raw) ? raw : raw.items;
  }

  const base = (process.env.BOARD_URL ?? "https://itsutsu.com").replace(/\/+$/, "");
  const token = process.env.BOARD_TOKEN ?? "";
  if (token === "") {
    console.error("BOARD_TOKEN is not set and no --board <dump.json> was given, so there is no board to read.");
    process.exit(1);
  }
  const response = await fetch(`${base}/api/backlog`, {
    headers: { Authorization: `Bearer ${token}`, "X-Board-Actor": process.env.BOARD_ACTOR ?? "derive-released-in" },
  });
  if (!response.ok) {
    console.error(`Could not read ${base}/api/backlog (${response.status}).`);
    process.exit(1);
  }
  return ((await response.json()) as { items: BoardItem[] }).items;
}

function summary(
  plan: ReturnType<typeof planBackfill>,
  counts: { boardRows: number; done: number; unstamped: number },
  timelineSize: number,
  releaseCount: number,
): string {
  const tally = tallyPlan(plan);
  const lines: string[] = [];
  lines.push("# `releasedIn` backfill — the mapping, and what could not be mapped");
  lines.push("");
  lines.push("Generated by `node --env-file=.env scripts/derive-released-in.ts`. The rules are");
  lines.push("`src/lib/backlog/releasedInBackfill.ts`, which is pure and unit-tested;");
  lines.push("`scripts/backfill-released-in.ts` is what applies a `certain` row, on somebody's word.");
  lines.push("");
  lines.push("## What was read");
  lines.push("");
  lines.push(`- **${counts.boardRows}** rows on the board read, **${counts.done}** of them done.`);
  lines.push(`- **${counts.unstamped}** done rows carry no \`releasedIn\` — the working set.`);
  lines.push(`- **${releaseCount}** releases in \`CHANGELOG.md\`, and **${timelineSize}** versions`);
  lines.push("  in git's `package.json` history, each with the instant it was bumped.");
  lines.push("");
  lines.push("## What came out");
  lines.push("");
  lines.push(`| | rows |`);
  lines.push(`|---|---|`);
  lines.push(`| certain — what \`--run\` would write | ${tally.certain} |`);
  lines.push(`| likely — for a person to confirm | ${tally.likely} |`);
  lines.push(`| possible — not evidence | ${tally.possible} |`);
  lines.push(`| unmapped | ${tally.unmapped} |`);
  lines.push("");
  lines.push("Only `certain` is ever written. A `likely` or a `possible` is in the JSON so it");
  lines.push("can be read and judged, and `scripts/backfill-released-in.ts` skips both.");
  lines.push("");
  lines.push("## There is no door for this yet");
  lines.push("");
  lines.push("Nothing above the database can stamp a row that is already `done`, and that was");
  lines.push("measured rather than assumed — a probe against `backlogStore.ts` with Prisma mocked:");
  lines.push("");
  lines.push("- `finishItem` is the only writer `releasedIn` has ever had, and it refuses");
  lines.push("  anything that is not `inProgress`: *\"Only a row in progress may be marked done;");
  lines.push("  this one is \"done\".\"*");
  lines.push("- `changeItem` takes no such field. A `PATCH` carrying `releasedIn` and no");
  lines.push("  `status` reaches it, the field lands in the `...edit` rest, `editProblems` has");
  lines.push("  no opinion on it, and the write it composes is `{}`. The call returns");
  lines.push("  `ok: true` and the row is unchanged — **the API answers 200 and stamps");
  lines.push("  nothing.**");
  lines.push("");
  lines.push("So a backfill that trusted that 200 would report every row stamped and stamp none.");
  lines.push("`scripts/backfill-released-in.ts` re-reads each row it writes and stops on the");
  lines.push("first one that did not take, rather than counting successes it cannot see.");
  lines.push("");
  lines.push("**The addition that opens it** — a change to the board's contract, so it wants the");
  lines.push("operator's word rather than a script's:");
  lines.push("");
  lines.push("1. `backlogStore.ts`: a `stampRelease(id, release, actor)` beside `finishItem`,");
  lines.push("   writing `releasedIn`/`releasedAt` and nothing else onto a row that is already");
  lines.push("   `done` and unstamped. Not a move — no `status`, no `movedAt`, no claim — so");
  lines.push("   BOARD_RULES.md invariant 1 (\"a done row does not move\") and 9 (\"the release");
  lines.push("   tool writes `done`\") both still hold: it grants no new way to REACH done.");
  lines.push("   Refuse a row that is not done, and refuse one already stamped, so a release");
  lines.push("   that has been stated can never be rewritten.");
  lines.push("2. `src/app/api/backlog/[id]/route.ts`: before the `status === done` branch, route");
  lines.push("   a body carrying `releasedIn`/`releasedAt` and NO `status` to `stampRelease`,");
  lines.push("   token actors only, with the `SEMVER` and date checks the done branch makes.");
  lines.push("");
  lines.push("Until that lands, `pnpm board:released-in` is a report.");
  lines.push("");
  lines.push("## Why a row could not be placed");
  lines.push("");
  for (const [reason, count] of Object.entries(tally.reasons).sort((a, b) => b[1] - a[1])) {
    lines.push(`- **${count}** × \`${reason}\``);
  }
  lines.push("");
  lines.push("## The mapping");
  lines.push("");
  for (const confidence of ["certain", "likely", "possible"] as const) {
    const rows = plan.mapped.filter((row) => row.confidence === confidence);
    if (rows.length === 0) continue;
    lines.push(`### ${confidence} (${rows.length})`);
    lines.push("");
    for (const row of rows) {
      lines.push(`- **${row.releasedIn}** — \`${row.key}\``);
      lines.push(`  - "${row.title}"`);
      lines.push(`  - rule \`${row.evidence.rule}\`, score ${row.evidence.score} on ${row.evidence.matchedWords}/${row.evidence.rowWords} distinctive words${row.evidence.runnerUp === null ? "" : `, runner-up ${row.evidence.runnerUp.version} at ${row.evidence.runnerUp.score}`}`);
      lines.push(`  - changelog: "${row.evidence.quote}"`);
      lines.push(`  - ${row.releasedAt} from \`${row.evidence.commit ?? "?"}\` (${row.evidence.instantFrom}); row closed ${row.evidence.closedAt}`);
      if (row.heldBackBy !== undefined) lines.push(`  - not certain: ${row.heldBackBy}`);
    }
    lines.push("");
  }
  lines.push("## Unmapped");
  lines.push("");
  const litter = plan.unmapped.filter((row) => row.reason === "test-litter");
  const real = plan.unmapped.filter((row) => row.reason !== "test-litter");
  if (litter.length > 0) {
    lines.push(`### ${litter.length} rows a browser test left behind`);
    lines.push("");
    lines.push("No release carried these, so no release can be stamped on them. They are what");
    lines.push("`pnpm backlog:cleanup-litter` sweeps — see `scripts/cleanup-backlog-litter.ts`.");
    lines.push("");
    lines.push(`Keys: ${litter.map((row) => `\`${row.key}\``).join(", ")}`);
    lines.push("");
  }
  if (real.length > 0) {
    lines.push(`### ${real.length} rows nothing could place`);
    lines.push("");
    for (const row of real) {
      lines.push(`- \`${row.key}\` — "${row.title}"`);
      lines.push(`  - \`${row.reason}\`: ${row.note}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  const items = await readBoard(argv);
  const done = items.filter((item) => item.status === "done");
  const working = done.filter((item) => item.releasedIn === null || item.releasedIn === undefined);
  console.log(`${items.length} rows read, ${done.length} done, ${working.length} of those with no releasedIn.`);
  console.log(`${working.filter((row) => looksLikeTestLitter(row.title)).length} of the working set look like browser-test litter.`);

  const timeline = versionTimeline();
  const parsed = parseReleases(readFileSync("CHANGELOG.md", "utf8"));
  console.log(`${parsed.length} releases in CHANGELOG.md; ${timeline.size} versions in git's package.json history.`);

  const unbumped = parsed.filter((release) => !timeline.has(release.version)).map((release) => release.version);
  const headings = unbumped.length === 0 ? new Map() : headingInstants(unbumped);
  console.log(`${unbumped.length} release(s) have no package.json bump; ${headings.size} of those can be dated from when their changelog heading was written.`);

  const releases: ReleaseMoment[] = parsed.map((release) => {
    const bump = timeline.get(release.version);
    if (bump !== undefined) {
      return { version: release.version, date: release.date, notes: release.notes, at: bump.at, instantFrom: "version-bump", commit: bump.commit };
    }
    const heading = headings.get(release.version);
    return {
      version: release.version,
      date: release.date,
      notes: release.notes,
      at: heading?.at ?? null,
      instantFrom: heading === undefined ? null : "changelog-heading",
      commit: heading?.commit ?? null,
    };
  });
  const withoutInstant = releases.filter((release) => release.at === null);
  if (withoutInstant.length > 0) {
    console.log(`${withoutInstant.length} release(s) git cannot date at all: ${withoutInstant.map((r) => r.version).join(", ")}`);
  }

  const rows: BackfillRow[] = working.map((item) => ({
    key: item.key,
    title: item.title,
    status: item.status,
    createdAt: item.createdAt,
    movedAt: item.movedAt,
    releasedIn: item.releasedIn ?? null,
  }));

  const plan = planBackfill(rows, releases, { commits: commitMessages() });
  const tally = tallyPlan(plan);
  console.log(`\ncertain ${tally.certain} | likely ${tally.likely} | possible ${tally.possible} | unmapped ${tally.unmapped}`);
  for (const [reason, count] of Object.entries(tally.reasons).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count} × ${reason}`);
  }

  const payload = {
    /*
     * What this file is, said inside it: it is read by a script that writes to
     * the board, and a reader who finds it in a year should not have to guess
     * where the numbers came from or what may be done with them.
     */
    about: "Which release carried each done backlog row that carries no releasedIn. Derived from CHANGELOG.md and git by scripts/derive-released-in.ts; the rules are src/lib/backlog/releasedInBackfill.ts. Only rows with confidence 'certain' may be written, and only by scripts/backfill-released-in.ts.",
    generatedAt: new Date().toISOString(),
    board: { rows: items.length, done: done.length, unstamped: working.length },
    releases: { inChangelog: parsed.length, versionsInGit: timeline.size },
    tally,
    mapped: plan.mapped,
    unmapped: plan.unmapped,
  };

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(OUT_MD, summary(plan, { boardRows: items.length, done: done.length, unstamped: working.length }, timeline.size, parsed.length));
  console.log(`\nWritten ${OUT_JSON} and ${OUT_MD}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
