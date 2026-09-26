/**
 * A whole number with thousands separators, WITHOUT `toLocaleString` or
 * `Intl` — both are refused under `src/components` and `src/app`
 * (`localTime.coverage.test.ts`), because either can format differently on
 * the server and in the reader's browser and throw the server's markup away.
 * These numbers are a fixed, English grouping of a plain integer and nothing
 * about them depends on a reader's locale or zone, but the gate is
 * deliberately crude — it reads the method name, not what it is used for —
 * so the honest fix is not to call it at all.
 */
export function formatCount(n: number): string {
  const rounded = Math.round(n);
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return rounded < 0 ? `-${grouped}` : grouped;
}
