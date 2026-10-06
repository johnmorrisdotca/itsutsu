import { tsunagiLevelFastest } from "@/lib/puzzles/server/tsunagiRecords";
import { setOfSeed } from "@/lib/puzzles/tsunagi/levels";

import { LevelFastestTable } from "./LevelFastestTable";

/**
 * The fastest on a Tsunagi level, under its board (`LevelFastestTable`, which every game of levels shares).
 * A level with portals is kept as its seed, 1,000 and its number, so the table says its number in its own set.
 */
export async function TsunagiLevelFastest({ size, level }: { size: number; level: number }) {
  const { set, level: number } = setOfSeed(level);
  return <LevelFastestTable prefix="tsunagi" kind="tsunagi" level={number} where={`${size}×${size}${set === "portals" ? " with portals" : ""}`} rows={await tsunagiLevelFastest(size, level)} />;
}
