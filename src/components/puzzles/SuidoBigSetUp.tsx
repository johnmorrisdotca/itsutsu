"use client";

import { useEffect, useMemo, useState } from "react";

import { declaredTwists } from "@johnmorrisdotca/suido/levels-info";

import {
  blockOf,
  blockRange,
  blocksIn,
  firstUnsolvedSuidoBigLevel, loadSuidoBigRows, nextSuidoBigLevel, openSuidoBigLevels,
  SUIDO_BIG_LEVEL_COUNT,
  SUIDO_BIG_SIZE_LIST,
  suidoBigBoardRow,
  suidoBigLevelsAt,
  suidoBigSizeOf,
} from "@/lib/puzzles/suido/levels";
import type { SuidoSet } from "@/lib/puzzles/suido/seed";
import { suidoSizeWord } from "@/lib/puzzles/suido/sizes";
import { useHydrated } from "@/lib/ui/hydrated";

import { SIZE_TILES, shelfFor, shelvesOf } from "./sizeShelves";
import { SuidoSetUpLayout, type SuidoScreen } from "./SuidoSetUpLayout";
import type { SuidoSetUpProps } from "./SuidoSetUp";
import { keptBigSolves } from "./suidoKept";

/**
 * SETTING UP THE BIG-PIECES LEVELS: sixty-four levels with big pieces among the ordinary ones, numbered across every size and in blocks of sixteen
 * that open one after another, drawn by the same screen as the levels by size (`SuidoSetUpLayout`). A level of the set is a level of its own size, so
 * the size tiles stay where they are and are a way of moving about the set: a press goes to the first level of that size that is not solved, and
 * picking any level makes its size the one the tiles show. Nothing on the screen changes height whichever set it is showing.
 *
 * A member's solves are on the account; anybody's are also in this browser (`suidoKept`), joined here once it has hydrated.
 */
export function SuidoBigSetUp({ hasAccount, bigSolved = {}, bigBestSolves = {}, askedSize = null, onSet }: SuidoSetUpProps & { onSet: (next: SuidoSet) => void }) {
  const hydrated = useHydrated();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void loadSuidoBigRows().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);

  // This browser's solves, read once the set's levels are here, and joined with the account's.
  const best = useMemo(() => {
    const out: Record<number, number> = hydrated && ready ? { ...keptBigSolves() } : {};
    for (const [level, ms] of Object.entries(bigSolved)) out[Number(level)] = Math.min(ms, out[Number(level)] ?? ms);
    return out;
  }, [hydrated, ready, bigSolved]);
  const done = useMemo(() => new Set(Object.keys(best).map(Number)), [best]);
  const open = openSuidoBigLevels(done);
  const next = nextSuidoBigLevel(done);
  const gap = firstUnsolvedSuidoBigLevel(done);
  const skippedPast = gap !== null && [...done].some((level) => level > gap);

  // The levels of a size, as a press on its tile chooses among them: the first not yet solved and open, or the first.
  const levelAt = (of: number): number => {
    const levels = suidoBigLevelsAt(of);
    if (levels.length === 0) return next;
    return levels.find((level) => level <= open && best[level] === undefined) ?? levels[0]!;
  };

  // THE LEVEL CHOSEN: the next one not yet solved (or the first of the size an address asked for), until a reader chooses another in the picker or presses a size.
  const [picked, setPicked] = useState<number | null>(null);
  const [wanted, setWanted] = useState<number | null>(askedSize);
  const chosen = picked ?? (wanted === null ? next : levelAt(wanted));
  const chosenLocked = chosen > open && best[chosen] === undefined;
  const size = suidoBigSizeOf(chosen) ?? SUIDO_BIG_SIZE_LIST[0]!;
  // ONE BLOCK AT A TIME, as the levels by size: the block of the chosen level until a reader turns to another.
  const [turnedTo, setTurnedTo] = useState<number | null>(null);
  const blocks = blocksIn(SUIDO_BIG_LEVEL_COUNT);
  const block = turnedTo ?? blockOf(chosen);
  const { first, last } = blockRange(block, SUIDO_BIG_LEVEL_COUNT);

  // The sizes four at a time, with one press beside them to the next four: the shelf of the chosen size, until a reader turns the shelf.
  const boards = SUIDO_BIG_SIZE_LIST;
  const shelves = shelvesOf(boards.length);
  const [shelf, setShelf] = useState<number | null>(null);
  const start = shelf ?? shelfFor(boards, size);
  const onLast = start === shelves[shelves.length - 1];
  const nextStart = onLast ? 0 : shelves[shelves.indexOf(start) + 1]!;
  const choose = (level: number) => {
    setPicked(level);
    setWanted(null);
    setTurnedTo(null);
    setShelf(null);
  };

  const row = ready ? suidoBigBoardRow(chosen) : undefined;
  const screen: SuidoScreen = {
    set: "big",
    onSet,
    hasAccount,
    hydrated,
    size,
    ready,
    best,
    bestSolves: bigBestSolves,
    open,
    next,
    chosen,
    chosenLocked,
    onChoose: choose,
    skippedPast: skippedPast ? gap : null,
    count: SUIDO_BIG_LEVEL_COUNT,
    done: done.size,
    block,
    blocks,
    first,
    last,
    turnBlock: (by) => setTurnedTo(Math.min(blocks, Math.max(1, block + by))),
    tiles: {
      sizes: boards.slice(start, start + SIZE_TILES),
      onChange: (to) => {
        setPicked(levelAt(to));
        setWanted(null);
        setTurnedTo(null);
      },
      onLast,
      turnShelf: () => {
        setShelf(nextStart);
        setPicked(levelAt(boards[nextStart]!));
        setWanted(null);
        setTurnedTo(null);
      },
      furthest: boards[Math.min(boards.length, nextStart + SIZE_TILES) - 1]!,
      smallest: boards[0]!,
    },
    twists: row === undefined ? [] : declaredTwists(row),
    describe: (level) => {
      const of = suidoBigSizeOf(level);
      return of === null ? "" : suidoSizeWord(of);
    },
  };
  return <SuidoSetUpLayout screen={screen} />;
}
