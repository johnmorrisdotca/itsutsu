"use client";

import { useEffect, useMemo, useState } from "react";

import { declaredTwists } from "@johnmorrisdotca/suido/levels-info";

import { useHydrated } from "@/lib/ui/hydrated";
import {
  blockOf,
  blockRange,
  blocksIn,
  firstUnsolvedSuidoLevelAt,
  loadSuidoLevelsAt,
  nextSuidoLevelAt,
  openSuidoLevelsAt,
  suidoLevelCount,
  suidoLevelsAt,
} from "@/lib/puzzles/suido/levels";
import type { SuidoSet } from "@/lib/puzzles/suido/seed";
import { SUIDO_LEVEL_SIZES } from "@/lib/puzzles/suido/sizes";

import { useSizeShelves } from "./sizeShelves";
import { SuidoBigSetUp } from "./SuidoBigSetUp";
import { SuidoSetUpLayout, type SuidoScreen } from "./SuidoSetUpLayout";
import { keptSolves } from "./suidoKept";

/**
 * SETTING UP SUIDO'S LEVELS, at /games/suido/new: a size, then its board of
 * levels. The same screen as Tsunagi's (`TsunagiSetUp`), which it follows: the
 * chosen level's own board stands where every set-up's preview stands, with the
 * size tiles beside it; a block of sixteen levels is the picker under it, and
 * Start plays the one chosen — the next one not yet solved until another is.
 *
 * TWO SETS OF LEVELS, as Tsunagi has: the ones by size (this file), and the sixty-four
 * with big pieces among the ordinary ones (`SuidoBigSetUp`), chosen with a pair of chips
 * under the board. Both are drawn by one screen (`SuidoSetUpLayout`), so choosing a set
 * moves nothing on the page.
 *
 * SIXTEEN SIZES, FOUR TILES. The set-up keeps room for four boards and no more
 * (`picker.test.ts`), so the tiles show four at a time — 5 to 8, 9 to 12, the 13 and
 * 14 with the huge 20 and 28, and the four long boards, 5×7 to the huge 20×50, so every
 * shelf is full — and one press beside them turns to the next shelf, as Tsunagi's nine
 * do (`useSizeShelves`). The long boards are drawn at their own shape on their tiles
 * and in the preview. The huge three have sixty-four levels, four blocks, and not 256.
 *
 * A level is open once the block before it is solved; the next, ringed, is where
 * Start goes. A locked level can be looked at: the preview draws it under a lock,
 * and Start says it is locked. A member's solves are on the account; anybody's are
 * also in this browser (`suidoKept`), joined here once it has hydrated.
 */
export type SuidoSetUpProps = {
  hasAccount: boolean;
  /** The member's solved levels by size, each with its best time: none for anybody without an account. */
  solved: Record<number, Record<number, number>>;
  /** The member's best solve of each level by size, which the preview's time opens: none for anybody without an account. */
  bestSolves?: Record<number, Record<number, string>>;
  /** The member's solved levels of the big-pieces set by their number in it, each with its best time. */
  bigSolved?: Record<number, number>;
  /** The member's best solve of each level of the big-pieces set. */
  bigBestSolves?: Record<number, string>;
  initialSize: number;
  /** The size an address asked for in the big-pieces set, or null where it asked for none. */
  askedSize?: number | null;
  initialSet?: SuidoSet;
};

export function SuidoSetUp({ initialSet = "classic", ...props }: SuidoSetUpProps) {
  const [set, setSet] = useState<SuidoSet>(initialSet);
  // Each set has its own sizes and its own levels, so choosing one starts its screen again: the same size where the set has it.
  return set === "big" ? <SuidoBigSetUp key="big" {...props} onSet={setSet} /> : <SuidoClassicSetUp key="classic" {...props} onSet={setSet} />;
}

function SuidoClassicSetUp({ hasAccount, solved, bestSolves = {}, initialSize, onSet }: SuidoSetUpProps & { onSet: (next: SuidoSet) => void }) {
  const hydrated = useHydrated();
  const { size, setSize, shown, onLast, turnShelf, furthest } = useSizeShelves(SUIDO_LEVEL_SIZES, initialSize);

  // The size whose levels have arrived: each size's data is its own file, fetched when the size is chosen.
  const [loadedSize, setLoadedSize] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void loadSuidoLevelsAt(size).then(() => live && setLoadedSize(size));
    return () => {
      live = false;
    };
  }, [size]);
  const ready = loadedSize === size;

  // This browser's solves, read once the size's levels are here to say which boards they were, and joined with the account's.
  const best = useMemo(() => {
    const out: Record<number, number> = hydrated && ready ? { ...keptSolves(size) } : {};
    for (const [level, ms] of Object.entries(solved[size] ?? {})) out[Number(level)] = Math.min(ms, out[Number(level)] ?? ms);
    return out;
  }, [hydrated, ready, solved, size]);
  const done = useMemo(() => new Set(Object.keys(best).map(Number)), [best]);
  const open = openSuidoLevelsAt(size, done);
  const next = nextSuidoLevelAt(size, done);
  // Said when a later level is solved, so Start's number is not read as a slip.
  const gap = firstUnsolvedSuidoLevelAt(size, done);
  const skippedPast = gap !== null && [...done].some((level) => level > gap);
  const count = suidoLevelCount(size);

  /*
   * THE LEVEL CHOSEN: the next one not yet solved, until a reader chooses
   * another in the picker. The preview draws it and Start plays it. A size
   * change goes back to the next level of that size.
   */
  const [picked, setPicked] = useState<{ size: number; level: number } | null>(null);
  const chosen = picked !== null && picked.size === size ? picked.level : next;
  const chosenLocked = chosen > open && best[chosen] === undefined;
  /* ONE BLOCK AT A TIME: the block the chosen level is in, until a reader turns to another with ‹ and ›. Locked blocks can be looked at; Start says they are locked. */
  const [turnedTo, setTurnedTo] = useState<{ size: number; block: number } | null>(null);
  const blocks = blocksIn(count);
  const block = turnedTo !== null && turnedTo.size === size ? turnedTo.block : blockOf(chosen);
  const { first, last } = blockRange(block, count);

  // What the chosen level has: its own twists once its size is here, and a lesson's from the marks before then (`SuidoLevelChips`).
  const twists = ready ? (suidoLevelsAt(size)[chosen - 1] === undefined ? [] : declaredTwists(suidoLevelsAt(size)[chosen - 1]!)) : [];

  const screen: SuidoScreen = {
    set: "classic",
    onSet,
    hasAccount,
    hydrated,
    size,
    ready,
    best,
    bestSolves: bestSolves[size] ?? {},
    open,
    next,
    chosen,
    chosenLocked,
    onChoose: (level) => setPicked({ size, level }),
    skippedPast: skippedPast ? gap : null,
    count,
    done: done.size,
    block,
    blocks,
    first,
    last,
    turnBlock: (by) => setTurnedTo({ size, block: Math.min(blocks, Math.max(1, block + by)) }),
    tiles: { sizes: shown, onChange: setSize, onLast, turnShelf, furthest, smallest: SUIDO_LEVEL_SIZES[0]! },
    twists,
  };
  return <SuidoSetUpLayout screen={screen} />;
}
