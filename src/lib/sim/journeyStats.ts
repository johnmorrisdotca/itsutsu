import type { Percentiles } from "./journeys.types";

/** Sorts ascending and reads the 10th, 50th and 90th percentile by nearest-rank. Empty input reads as all zeros. */
export function percentiles(values: readonly number[]): Percentiles {
  if (values.length === 0) return { p10: 0, p50: 0, p90: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];
  return { p10: at(0.1), p50: at(0.5), p90: at(0.9) };
}

/** The median (p50) alone, for a quick sort key. */
export function median(values: readonly number[]): number {
  return percentiles(values).p50;
}

/** The top `count` entries of `rows`, ranked by `value` descending. */
export function topN<T extends { value: number }>(rows: readonly T[], count: number): (T & { rank: number })[] {
  return [...rows]
    .sort((a, b) => b.value - a.value)
    .slice(0, count)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}
