import { describe, it } from "vitest";

/**
 * Close the rows that shipped, by calling the board's OWN checked function.
 *
 * WHY THIS IS A `.test.ts` AND NOT A SCRIPT: the same reason
 * `botSeries.play.test.ts` is one — `@/` aliases do not resolve in a plain
 * node script, and `backlogStore.ts` imports `server-only`. Running it under
 * vitest is the pattern this repository already sanctions for reaching a
 * chosen database with the real modules in process.
 *
 * WHY NOT A PRISMA SCRIPT. It calls `changeItem`, which is the exact function
 * `PATCH /api/backlog/[id]` calls: it runs `moveProblems`, `draftProblems` and
 * `editProblems`, and writes under `moveWhere`'s conditional so two sessions
 * cannot both move a row only one of them read. Nothing here reimplements a
 * rule or reaches a column directly. What it skips is the HTTP layer and the
 * operator session — authentication, not validation — because the operator's
 * production token is John's and he has declined to hand it out, which is the
 * right answer.
 *
 * It writes nothing unless asked twice, and prints which database it reached
 * before it does: `.env` has silently overridden an inline DATABASE_URL in
 * this project before, so the count is the only thing that settles it.
 */
import { BACKLOG_STATUSES } from "./backlog.constants";
import { changeItem, fetchBoard } from "./backlogStore";
import { prisma } from "@/lib/prisma";

/** The rows that shipped in 0.129.0 through 0.141.0. */
const KEYS = [
  "a-reader-who-chooses-japanese-cannot-choose-back",
  "twenty-games-at-once-is-the-limit",
  "a-record-follows-the-person-not-the-name",
  "a-players-address-should-not-carry-their-whole-name",
  "a-challenger-is-handed-their-opponents-seat-key",
  "settle-the-rules-before-the-game-exists",
  "after-a-move-take-me-to-the-next-game-that-is-waiting",
  "a-game-in-a-list-shows-its-board",
  "a-card-offers-a-button-not-a-name-to-aim-at",
  "the-page-the-nav-calls-play-is-addressed-my-games",
  "a-finished-game-offers-no-rematch-and-little-else",
  "a-game-is-drawn-the-way-it-is-traditionally-drawn",
  "a-list-of-games-replays-every-one-of-them",
  "four-words-are-how-you-get-back-to-your-games",
  "somewhere-for-a-preference-to-live",
];

const ACTOR = "Opus merge session";
const WRITE = process.env.CLOSE_ROWS === "1";

function server(): string {
  try {
    const parsed = new URL(process.env.DATABASE_URL ?? "");
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "an address this runner could not read";
  }
}

describe("closing the rows that shipped", () => {
  it(
    "moves each one as far as the board's own rules allow",
    async () => {
      const rows = await prisma.backlogItem.count();
      console.log(`\nDatabase: ${server()} — ${rows} board rows.`);
      console.log(WRITE ? "WRITING.\n" : "Reporting only. CLOSE_ROWS=1 to write.\n");

      const board = await fetchBoard();
      const byKey = new Map(board.map((item) => [item.key, item]));

      // The stored spelling, which `fetchBoard` folds away — `proposed` reads
      // as `open` and `building` as `inProgress`. Worth printing, because
      // `moveWhere` matches on the FOLDED value and the row holds the raw one.
      const raw = new Map(
        (await prisma.backlogItem.findMany({ select: { key: true, status: true } })).map((r) => [r.key, r.status]),
      );

      let done = 0;
      let refused = 0;
      for (const key of KEYS) {
        const item = byKey.get(key);
        if (item === undefined) {
          console.log(`  ?  ${key} — not on the board`);
          refused += 1;
          continue;
        }
        if (item.status === BACKLOG_STATUSES.done) {
          console.log(`  ·  ${key} — already done`);
          continue;
        }

        const steps =
          item.status === BACKLOG_STATUSES.inProgress
            ? [BACKLOG_STATUSES.done]
            : [BACKLOG_STATUSES.inProgress, BACKLOG_STATUSES.done];
        const stored = raw.get(key);
        const folded = stored !== item.status ? ` [stored "${stored}", reads "${item.status}"]` : "";

        if (!WRITE) {
          console.log(`  would move  ${key}: ${steps.join(" → ")}${folded}`);
          continue;
        }

        let failed: string | null = null;
        for (const step of steps) {
          const outcome = await changeItem(item.id, { status: step }, ACTOR);
          if (!outcome.ok) {
            failed = `${step}: ${outcome.reason}${outcome.problems === undefined ? "" : ` ${outcome.problems.join("; ")}`}`;
            break;
          }
        }
        if (failed === null) {
          console.log(`  ✓  ${key}${folded}`);
          done += 1;
        } else {
          console.log(`  ✗  ${key} — ${failed}${folded}`);
          refused += 1;
        }
      }

      console.log(`\n${WRITE ? "Closed" : "Would close"} ${done}, refused ${refused}.`);
      await prisma.$disconnect();
    },
    600_000,
  );
});
