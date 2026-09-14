/**
 * A MEMBER'S EXPERIENCE, AS A FIXTURE WRITES IT: ALL THREE COLUMNS, ALWAYS.
 *
 * `Member.xp` is the Itsutsu total, `Member.xpImported` the credit for another
 * site's kept record, and `Member.xpEverywhere` their sum — and the badge, the
 * /me panel, the Everywhere board and the rungs read `xpEverywhere`
 * (`xpForBadge` in `src/lib/xp/xpScope.ts`). A seed that writes `xp` alone
 * leaves a member whose standing reads 0 everywhere that matters, and a spec
 * asserting it fails in a file about something else: `xp-history.spec.ts`
 * seeded 510 and /me printed "0 XP" (CI run 34825313782).
 *
 * So every fixture that sets a member's standing spreads this into its `data`,
 * and `src/lib/xp/xp.coverage.test.ts` fails the build when a file under `e2e/`
 * writes `xp` to a member without it.
 */
export function standingData({ here, imported = 0 }: { here: number; imported?: number }): {
  xp: number;
  xpImported: number;
  xpEverywhere: number;
} {
  return { xp: here, xpImported: imported, xpEverywhere: here + imported };
}
