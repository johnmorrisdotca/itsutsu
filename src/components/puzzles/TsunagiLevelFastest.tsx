import { tsunagiLevelFastest } from "@/lib/puzzles/server/tsunagiRecords";

import { LevelFastestTable } from "./LevelFastestTable";

/** The fastest on a Tsunagi level, under its board (`LevelFastestTable`, which every game of levels shares). */
export async function TsunagiLevelFastest({ size, level }: { size: number; level: number }) {
  return <LevelFastestTable prefix="tsunagi" kind="tsunagi" level={level} where={`${size}×${size}`} rows={await tsunagiLevelFastest(size, level)} />;
}
