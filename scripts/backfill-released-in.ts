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
 * ═══════════════════════════════════════════════════════════════════════════
 * THERE IS NO DOOR FOR THIS YET, AND THIS SCRIPT PROVES IT RATHER THAN
 * ASSUMING IT.
 *
 * `finishItem` is the only thing that has ever written `releasedIn`, and it
 * refuses a row that is not `inProgress` — which every row here is not, being
 * done already. `changeItem` takes no such field: `PATCH` with `releasedIn`
 * and no `status` falls through to it, `releasedIn` lands in the `...edit`
 * rest, `editProblems` has no opinion on it, and the write it composes is
 * `{ ...textData, ...gradeData }` — both empty. **So the API answers 200 and
 * changes nothing.** A backfill written to trust that 200 would report every
 * row stamped and stamp none, which is the worst of the shapes AGENTS.md
 * names: a gate answering a question it cannot answer.
 *
 * So `--run` re-reads every row it wrote and compares. The first row that
 * comes back unstamped after a 200 stops the whole run, because that is the
 * API telling us the door is not there yet — and one row quietly not written
 * is indistinguishable from all of them.
 *
 * The addition that opens it, for whoever takes that decision (it is a change
 * to the board's contract, so it wants the operator's word, not a script's):
 *
 *   1. `src/lib/backlog/backlogStore.ts` — a `stampRelease(id, release, actor)`
 *      beside `finishItem`, writing `releasedIn`/`releasedAt` and NOTHING else
 *      on a row that is already `done` and unstamped. Not a move: no `status`,
 *      no `movedAt`, no claim. BOARD_RULES.md invariant 1 ("a done row does not
 *      move") and 9 ("the release tool writes `done`") both hold — this moves
 *      nothing and grants no new way to REACH done. Refuse a row that is not
 *      done, and refuse one already stamped, so it can never rewrite a release
 *      that has been stated.
 *   2. `src/app/api/backlog/[id]/route.ts` — before the `status === done`
 *      branch, route a body carrying `releasedIn`/`releasedAt` and NO `status`
 *      to `stampRelease`, token actors only (`who.via !== "token"` → 422), with
 *      the same `SEMVER` and date checks the done branch already makes.
 *
 * Until that lands this script is a report, and says so.
 * ═══════════════════════════════════════════════════════════════════════════
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
      why: `the API answered ${response.status} and the row still reads releasedIn=${after.releasedIn === null ? "null" : `"${after.releasedIn}"`}. This is the missing door described at the top of this file, not a bad mapping: PATCH accepts releasedIn without a status, validates nothing, writes nothing, and reports success`,
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
    console.log("\nReport only — nothing was written. Pass --run to apply.");
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
