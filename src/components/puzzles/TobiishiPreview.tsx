import { tobiishiCodeOf, tobiishiRefOf } from "@/lib/puzzles/tobiishi/levels";

import { TobiishiStill } from "./TobiishiStill";

/**
 * Tobiishi before it is chosen: the first level of the length, as the level screen draws it
 * (`TobiishiStill`), with nothing to press. Used by the preview a puzzle's page and the games' lists
 * draw (`PuzzleBoardPreview`).
 */
export function TobiishiPreview({ size }: { size: number }) {
  const ref = tobiishiRefOf(size, 1);
  if (ref === null) return null;
  return <TobiishiStill code={tobiishiCodeOf(ref)} testId="tobiishi-preview-board" />;
}
