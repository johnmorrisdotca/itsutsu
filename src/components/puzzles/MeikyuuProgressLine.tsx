"use client";

import { useEffect, useMemo, useState } from "react";

import { progressOf, type SolvedLevels } from "@/lib/puzzles/meikyuu/completion";
import { everyMeikyuuLevelLoaded, loadEveryMeikyuuLevels } from "@/lib/puzzles/meikyuu/levels";
import { MEIKYUU_COLOSSAL_SIZES, MEIKYUU_SIZES, MEIKYUU_TALL_SIZES, meikyuuSizeLabel } from "@/lib/puzzles/meikyuu/sizes";
import { useHydrated } from "@/lib/ui/hydrated";

import { PROGRESS_COPY } from "./meikyuu.constants";
import { hasKeptSolves, keptSolvedLevels } from "./meikyuuKept";
import { MeikyuuProgress } from "./MeikyuuProgress";

/**
 * HOW FAR THROUGH EACH SIZE A READER IS, on Meikyuu's front door: one row for each of the four sizes, each of the six
 * tall ones and each of the two colossal ones (`MeikyuuProgress`), "12 of 256" and a mark where one is whole. The account's solves are handed in by the page
 * (one read, `MeikyuuFrontProgress`); this browser's are added once it has hydrated, and the levels are fetched to say which
 * mazes they were only if this browser has kept any. A stranger, or a reader who has solved nothing, sees the rows at nought:
 * an empty table is data, and it shows what there is to finish.
 */
export function MeikyuuProgressLine({ account = null }: { account?: SolvedLevels | null }) {
  const hydrated = useHydrated();
  const [, setArrived] = useState(0);
  useEffect(() => {
    if (!hydrated || everyMeikyuuLevelLoaded() || !hasKeptSolves()) return;
    let live = true;
    void loadEveryMeikyuuLevels().then(() => live && setArrived((count) => count + 1));
    return () => {
      live = false;
    };
  }, [hydrated]);
  const device = hydrated && everyMeikyuuLevelLoaded() ? keptSolvedLevels([...MEIKYUU_SIZES, ...MEIKYUU_TALL_SIZES, ...MEIKYUU_COLOSSAL_SIZES]) : null;
  const squares = useMemo(() => progressOf(MEIKYUU_SIZES, account, device), [account, device]);
  const tall = useMemo(() => progressOf(MEIKYUU_TALL_SIZES, account, device), [account, device]);
  const colossal = useMemo(() => progressOf(MEIKYUU_COLOSSAL_SIZES, account, device), [account, device]);
  return (
    <section className="flex flex-col gap-2" aria-label={PROGRESS_COPY.yours} data-testid="meikyuu-front-progress">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{PROGRESS_COPY.yours}</h3>
      <MeikyuuProgress rows={squares} label={meikyuuSizeLabel} className="max-w-sm" />
      <p className="pt-1 text-xs text-muted">Tall, for a phone held upright</p>
      <MeikyuuProgress rows={tall} label={meikyuuSizeLabel} className="max-w-sm" />
      <p className="pt-1 text-xs text-muted">Colossal, about ten thousand cells: a square box, then a tall one</p>
      <MeikyuuProgress rows={colossal} label={meikyuuSizeLabel} className="max-w-sm" />
    </section>
  );
}
