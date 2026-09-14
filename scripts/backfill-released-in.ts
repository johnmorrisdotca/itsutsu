/**
 * Gives the done rows back the release that carried them.
 *
 *   pnpm board:released-in                      report only, writes nothing
 *   pnpm board:released-in --board <dump.json>  the same report, with no credential
 *   pnpm board:released-in --run                write the certain rows
 *
 * `--board` rehearses the report against a board dumped to a file — the same
 * dump `scripts/derive-released-in.ts` takes — so the exact list of rows can be
 * read and argued about by somebody who has no board token, and so a run
 * against production is never the first time anyone sees it. It refuses
 * `--run`: a file is not a board, and a script that appeared to write to one
 * would be the only thing here worse than writing to the wrong one.
 *
 * Reads `docs/plans/board-convergence/released-in-backfill.json`, which
 * `scripts/derive-released-in.ts` produced from CHANGELOG.md and git, and
 * writes `releasedIn`/`releasedAt` onto the rows it marks `certain` — never a
 * `likely`, never a `possible`. Dry run by default, the way
 * `scripts/cleanup-backlog-litter.ts` is: a board every session reads from is
 * not somewhere to find out what a command does.
 *
 * THROUGH THE API, NEVER THE TABLE. AGENTS.md, "WRITE THROUGH THE API, NEVER
 * STRAIGHT TO THE TABLE": two sessions reached `BacklogItem` with a
 * `PrismaClient` on 2026-09-11, wrote about forty rows between them, and left
 * eleven whose detail is past the 4,000-character cap — rows the board's own
 * owner can no longer save from the board at all. This is the same column
 * those sessions were after, so it goes the one way a click goes: `PATCH
 * /api/backlog/:id` with the board token, exactly as `scripts/release-take.ts`
 * does for a row it closes.
 *
 * THE DOOR. `PATCH /api/backlog/:id` with `releasedIn`/`releasedAt` and no
 * `status` is a release stamp: `stampRelease` in `backlogStore.ts` writes the
 * two release columns onto a row that is already done and unstamped, and
 * nothing else — no status, no `movedAt`, no claim. The API refuses a row
 * that is not done, a row already stamped, and a version CHANGELOG.md does
 * not name, each as a 4xx with its reason. Before that door existed this
 * script was a report and said so: the same PATCH used to be answered 200
 * with nothing written, and a backfill that trusted the 200 would have
 * reported every row stamped and stamped none. `--run` still re-reads every
 * row it writes and stops on the first that did not take, because a 200 is
 * cheaper to check than to believe.
 *
 * A WRITE IS ASKED FOR TWICE, the way `bots:play` is. `--run` says write, and
 * BOARD_URL set in the environment says where: the default board is the live
 * site, which is fine for a report and not for a write, so `--run` with no
 * BOARD_URL named refuses rather than assuming production was meant. It
 * prints the board and how many done rows it holds before writing anything;
 * read that line — production and a scratch board are not close in size.
 */
import { readFileSync } from "node:fs";

const PLAN_PATH = "docs/plans/board-convergence/released-in-backfill.json";

type Mapping = {
  key: string;
  title: string;
  releasedIn: string;
  releasedAt: string;
  confidence: string;
  evidence: { rule: string; quote: string; score: number };
};

type BoardRow = {
  id: string;
  key: string;
  status: string;
  releasedIn: string | null;
  releasedAt: string | null;
};

const BOARD_URL = (process.env.BOARD_URL ?? "https://itsutsu.com").replace(/\/+$/, "");
const BOARD_TOKEN = process.env.BOARD_TOKEN ?? "";
const ACTOR = process.env.BOARD_ACTOR ?? "backfill-released-in";

function headers(hasBody: boolean): Record<string, string> {
  return {
    Authorization: `Bearer ${BOARD_TOKEN}`,
    "X-Board-Actor": ACTOR,
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };
}

async function readBoard(): Promise<BoardRow[]> {
  const response = await fetch(`${BOARD_URL}/api/backlog`, { headers: headers(false) });
  if (!response.ok) throw new Error(`Could not read ${BOARD_URL}/api/backlog (${response.status}).`);
  return ((await response.json()) as { items: BoardRow[] }).items;
}

/** One row's PATCH, then a re-read: a 200 is not the same claim as a stamped row. */
async function stamp(row: BoardRow, mapping: Mapping): Promise<{ ok: true } | { ok: false; why: string }> {
  const response = await fetch(`${BOARD_URL}/api/backlog/${row.id}`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify({ releasedIn: mapping.releasedIn, releasedAt: mapping.releasedAt }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    return { ok: false, why: `the API refused it (${response.status}): ${body.error ?? "no reason given"}` };
  }

  const after = (await readBoard()).find((item) => item.key === mapping.key);
  if (after === undefined) return { ok: false, why: "the row is no longer on the board" };
  if (after.releasedIn !== mapping.releasedIn) {
    return {
      ok: false,
      why: `the API answered ${response.status} and the row still reads releasedIn=${after.releasedIn === null ? "null" : `"${after.releasedIn}"`}. A 200 that stamped nothing: the board this was sent to does not have the stamp door`,
    };
  }
  return { ok: true };
}

type Verdict =
  | { do: "stamp"; row: BoardRow; mapping: Mapping }
  | { do: "skip"; key: string; why: string };

/** What each certain mapping would do, decided before anything is written. */
function planAgainstBoard(mappings: readonly Mapping[], board: readonly BoardRow[]): Verdict[] {
  const byKey = new Map(board.map((row) => [row.key, row]));
  return mappings.map((mapping) => {
    const row = byKey.get(mapping.key);
    if (row === undefined) return { do: "skip", key: mapping.key, why: "no row with that key is on this board" };
    if (row.status !== "done") return { do: "skip", key: mapping.key, why: `the row is "${row.status}", not done` };
    if (row.releasedIn !== null) {
      return {
        do: "skip",
        key: mapping.key,
        why: row.releasedIn === mapping.releasedIn
          ? `already stamped ${row.releasedIn} — nothing to do`
          : `already stamped ${row.releasedIn}, and this plan says ${mapping.releasedIn}; a stated release is not this script's to rewrite`,
      };
    }
    return { do: "stamp", row, mapping };
  });
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const run = argv.includes("--run");
  const dumpAt = argv.indexOf("--board");
  const dump = dumpAt === -1 ? null : argv[dumpAt + 1] ?? null;

  if (dump !== null && run) {
    console.error("--board rehearses against a file and --run writes to a board; they cannot both be meant. Drop one.");
    process.exit(1);
  }
  /*
   * A write is asked for twice: `--run`, and the board named by hand. Refused
   * here, before a single request is made, so a `--run` that forgot the board
   * never so much as reads the default one.
   */
  if (run && process.env.BOARD_URL === undefined) {
    console.error("--run writes to a board, so name it: BOARD_URL=<the board> pnpm board:released-in --run. Nothing was read or written.");
    process.exit(1);
  }

  const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8")) as { mapped: Mapping[]; generatedAt?: string };
  const certain = plan.mapped.filter((mapping) => mapping.confidence === "certain");
  const held = plan.mapped.length - certain.length;
  console.log(`${PLAN_PATH}: ${plan.mapped.length} mapped row(s)${plan.generatedAt === undefined ? "" : `, derived ${plan.generatedAt}`}.`);
  console.log(`${certain.length} certain, ${held} not certain — only the certain ones are ever written.\n`);

  if (dump === null && BOARD_TOKEN === "") {
    console.error("BOARD_TOKEN is not set, so there is no way to read or write the board. Pass --board <dump.json> to rehearse, or see .env.example.");
    process.exit(1);
  }
  console.log(dump === null ? `Board: ${BOARD_URL}` : `Board: ${dump} (a dump on disk — rehearsal only, nothing can be written)`);

  const board = dump === null
    ? await readBoard()
    : ((JSON.parse(readFileSync(dump, "utf8")) as { items: BoardRow[] }).items);
  const done = board.filter((row) => row.status === "done");
  console.log(`${board.length} rows on it, ${done.length} done, ${done.filter((row) => row.releasedIn === null).length} of those with no releasedIn.\n`);

  const verdicts = planAgainstBoard(certain, board);
  const toStamp = verdicts.filter((verdict): verdict is Extract<Verdict, { do: "stamp" }> => verdict.do === "stamp");
  for (const verdict of verdicts) {
    if (verdict.do === "stamp") console.log(`  stamp   ${verdict.mapping.releasedIn.padEnd(9)} ${verdict.mapping.key}`);
    else console.log(`  skip    ${" ".repeat(9)} ${verdict.key} — ${verdict.why}`);
  }
  console.log(`\n${toStamp.length} row(s) would be stamped; ${verdicts.length - toStamp.length} skipped.`);

  if (!run) {
    console.log("\nReport only — nothing was written. Pass --run, with BOARD_URL named, to apply.");
    return;
  }
  if (toStamp.length === 0) {
    console.log("\nNothing to write.");
    return;
  }

  console.log("\nWriting…");
  let written = 0;
  for (const verdict of toStamp) {
    const outcome = await stamp(verdict.row, verdict.mapping);
    if (outcome.ok) {
      written += 1;
      console.log(`  ${verdict.mapping.key} → ${verdict.mapping.releasedIn}`);
      continue;
    }
    /*
     * STOP, rather than carry on and report a total. One row that did not
     * take means either the door is missing or the board has moved under
     * this run, and in both cases every row after it is the same question.
     * A partial backfill that says "37 written" and wrote none is the
     * failure this script exists to avoid.
     */
    console.error(`\n${verdict.mapping.key} did not take: ${outcome.why}.`);
    console.error(`Stopped after ${written} row(s). Nothing else was attempted.`);
    process.exitCode = 1;
    return;
  }
  console.log(`\n${written} row(s) stamped.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
