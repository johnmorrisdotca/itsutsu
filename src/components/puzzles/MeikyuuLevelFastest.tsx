import { meikyuuLevelFastest } from "@/lib/puzzles/server/meikyuuRecords";
import { meikyuuSizeLabel } from "@/lib/puzzles/meikyuu/sizes";

import { LevelFastestTable } from "./LevelFastestTable";

/** The fastest on a Meikyuu level, under its board (`LevelFastestTable`, which every game of levels shares). */
export async function MeikyuuLevelFastest({ size, level }: { size: number; level: number }) {
  return <LevelFastestTable prefix="meikyuu" kind="meikyuu" level={level} where={`${meikyuuSizeLabel(size).toLowerCase()} size`} rows={await meikyuuLevelFastest(size, level)} />;
}
