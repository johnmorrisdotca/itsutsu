import { tobiishiJumpsWord } from "@/lib/puzzles/tobiishi/sizes";
import { tobiishiLevelFastest } from "@/lib/puzzles/server/tobiishiRecords";

import { LevelFastestTable } from "./LevelFastestTable";

/** The fastest on a Tobiishi level, under its board (`LevelFastestTable`, which every game of levels shares). */
export async function TobiishiLevelFastest({ size, level }: { size: number; level: number }) {
  return <LevelFastestTable prefix="tobiishi" kind="tobiishi" level={level} where={tobiishiJumpsWord(size)} rows={await tobiishiLevelFastest(size, level)} />;
}
