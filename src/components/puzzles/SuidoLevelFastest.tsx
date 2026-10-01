import { suidoLevelFastest } from "@/lib/puzzles/server/suidoRecords";
import { suidoSizeWord } from "@/lib/puzzles/suido/sizes";

import { LevelFastestTable } from "./LevelFastestTable";

/** The fastest on a Suido level, under its board (`LevelFastestTable`, which every game of levels shares). */
export async function SuidoLevelFastest({ size, level }: { size: number; level: number }) {
  return <LevelFastestTable prefix="suido" kind="suido" level={level} where={suidoSizeWord(size)} rows={await suidoLevelFastest(size, level)} />;
}
