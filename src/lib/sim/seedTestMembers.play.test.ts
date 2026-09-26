/**
 * SEEDS 1000 TEST MEMBERS, from the same 18 roles the player-journeys
 * projection uses (`journeyRoles.constants.ts`), for Test Mode
 * (`docs/plans/test-mode/README.md`) to have somebody real in the database to
 * hide.
 *
 * A `.play.test.ts`, run under vitest the way `botSeries.play.test.ts` is,
 * for the same reason: `@/` aliases and `server-only` only resolve there, and
 * it does nothing unless asked. Writes only with `TEST_MEMBERS_RUN=1`, and
 * prints the database host and how many test members it already holds before
 * writing a single row.
 *
 *   pnpm exec vitest run src/lib/sim/seedTestMembers.play.test.ts --disable-console-intercept
 *   TEST_MEMBERS_RUN=1 pnpm exec vitest run src/lib/sim/seedTestMembers.play.test.ts --disable-console-intercept
 *
 * IDEMPOTENT: each row's id is `test-<seed>-<index>`, curated rather than
 * random, so running this twice with the same seed upserts the same 1000
 * rows rather than making 2000. `TEST_MEMBERS_SEED` picks the seed (default
 * below); a different seed makes a SEPARATE population alongside whatever is
 * already there, which is a way to grow the test population deliberately,
 * not a footgun — nothing here ever deletes a row.
 */
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";

import { JOURNEY_ROLES, JOURNEY_TOTAL_PLAYERS } from "./journeyRoles.constants";

const ASKED = process.env.TEST_MEMBERS === "1" || process.env.TEST_MEMBERS_RUN === "1";
const run = process.env.TEST_MEMBERS_RUN === "1";
const SEED = process.env.TEST_MEMBERS_SEED ?? "20260925";

/** `test-20260925-0042`: curated, sortable, and unmistakably a fixture — see the file's own header. */
function testMemberId(seed: string, index: number): string {
  return `test-${seed}-${String(index).padStart(4, "0")}`;
}

/**
 * `Test·Elite 0042`: the role's own name as the "first name" plus a
 * four-digit index, joined with a middle dot no real name on this site
 * uses — unmistakably a fixture in any list, converted to Test Mode or not.
 */
function testMemberName(roleName: string, index: number): string {
  return `Test·${roleName} ${String(index).padStart(4, "0")}`;
}

/** The 1000 rows this seed makes: one per player, in role order. */
export function plannedTestMembers(seed: string): { id: string; name: string; roleKey: string }[] {
  const planned: { id: string; name: string; roleKey: string }[] = [];
  let index = 0;
  for (const role of JOURNEY_ROLES) {
    for (let i = 0; i < role.share; i += 1) {
      planned.push({ id: testMemberId(seed, index), name: testMemberName(role.name, index), roleKey: role.key });
      index += 1;
    }
  }
  return planned;
}

describe.skipIf(!ASKED)("seed 1000 test members", () => {
  it(run ? "writes them" : "reports only", async () => {
    const host = new URL(process.env.DATABASE_URL ?? "postgresql://unknown").host;
    const already = await prisma.member.count({ where: { unclaimableBecause: UNCLAIMABLE_REASONS.test } });
    console.log(`Database: ${host}. Test members already there: ${already}.`);

    const planned = plannedTestMembers(SEED);
    expect(planned).toHaveLength(JOURNEY_TOTAL_PLAYERS);

    if (!run) {
      console.log(`Report only. Would upsert ${planned.length} test members (seed ${SEED}). Set TEST_MEMBERS_RUN=1 to write.`);
      return;
    }

    let written = 0;
    for (const member of planned) {
      await prisma.member.upsert({
        where: { id: member.id },
        // Deliberately empty, the same reason `ensureMember` (e2e/members.ts) leaves it
        // empty: an existing row that matched this id was written by an earlier run of
        // this same seed, and re-running must not silently change what it is.
        update: {},
        create: {
          id: member.id,
          email: null,
          name: member.name,
          // The Test kind: nobody signs in as a fixture, and every reader but the
          // operator in Test mode is shown none of them (`testMode.ts`).
          unclaimableBecause: UNCLAIMABLE_REASONS.test,
        },
      });
      written += 1;
    }
    console.log(`Upserted ${written} test members (seed ${SEED}) on ${host}.`);

    const now = await prisma.member.count({ where: { unclaimableBecause: UNCLAIMABLE_REASONS.test } });
    console.log(`Database now holds ${now} test members in total.`);
  });
});
