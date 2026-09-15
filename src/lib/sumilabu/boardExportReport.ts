import type { ExportPlan, RowFinding, TicketDiff } from "./boardExport.types.ts";

/**
 * The report `pnpm board:export` prints, as lines, so a test can read it.
 *
 * Every trimmed row is listed with its lengths before and after, not counted:
 * the point of a report-only run is to be able to say which rows were cut
 * before anybody agrees to cut them.
 */

function listed(title: string, rows: readonly RowFinding[]): string[] {
  if (rows.length === 0) return [`${title}: none`];
  return [`${title}: ${rows.length}`, ...rows.map((row) => `  ${row.key} (${row.id}): ${row.says}`)];
}

export function planLines(plan: ExportPlan, takesKeys: boolean): string[] {
  const read = plan.rows.length + new Set(plan.unmappable.map((row) => row.id)).size;
  return [
    `${read} rows read. Stored statuses: ${JSON.stringify(plan.storedStatuses)}`,
    `${plan.rows.length} would be sent, as: ${JSON.stringify(plan.statuses)}`,
    `done with no release stamp (sent with releasedIn empty): ${plan.doneWithoutRelease}`,
    `addedBy on ${plan.addedByNotCarried} rows: Sumilabu has no column for it, so only the archive keeps it`,
    ...(plan.reshaped.length === 0
      ? ["reshaped to fit Sumilabu's caps: none"]
      : [
          `reshaped to fit Sumilabu's caps: ${plan.reshaped.length}`,
          ...plan.reshaped.map(
            (row) => `  ${row.key} (${row.id}): ${row.fields.map((field) => `${field.field} ${field.before} -> ${field.after}`).join(", ")}`,
          ),
        ]),
    ...listed("unmappable, which stops --run", plan.unmappable),
    ...listed(takesKeys ? "key problems, which stop --run" : "key problems (keys are not sent to this target yet)", plan.keyProblems),
    ...listed("sent as they stand, but worth knowing", plan.notes),
  ];
}

export function diffLines(diff: TicketDiff, heading: string): string[] {
  const shown = 20;
  return [
    `${heading}: ${diff.toAdd.length} to add, ${diff.same.length} the same, ${diff.changed.length} different, ${diff.onlyOnTarget.length} only on the target`,
    ...diff.changed.slice(0, shown).map((row) => `  different: ${row.id} (${row.fields.join(", ")})`),
    ...(diff.changed.length > shown ? [`  … and ${diff.changed.length - shown} more different`] : []),
  ];
}
