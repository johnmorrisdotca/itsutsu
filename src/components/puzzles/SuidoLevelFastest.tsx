import { suidoBigLevelFastest, suidoLevelFastest } from "@/lib/puzzles/server/suidoRecords";
import type { SuidoSet } from "@/lib/puzzles/suido/seed";
import { suidoSizeWord } from "@/lib/puzzles/suido/sizes";

import { LevelFastestTable } from "./LevelFastestTable";

/** The fastest on a Suido level, under its board (`LevelFastestTable`, which every game of levels shares): a level by size, or one of the big-pieces set. */
export async function SuidoLevelFastest({ size, level, set = "classic" }: { size: number; level: number; set?: SuidoSet }) {
  return <LevelFastestTable prefix="suido" kind="suido" level={level} where={suidoSizeWord(size)} rows={await (set === "big" ? suidoBigLevelFastest(level) : suidoLevelFastest(size, level))} />;
}
