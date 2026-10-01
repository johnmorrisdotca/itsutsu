"use client";

import Link from "@/components/ui/Link";
import { useEffect, useMemo, useState } from "react";

import { declaredTwists } from "@johnmorrisdotca/suido/levels";

import { BoardPicker } from "@/components/live/BoardPicker";
import { START_PRESS } from "@/components/live/live.constants";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, SET_UP_OPTIONS_AND_PLAY, SET_UP_PLAY_COLUMN } from "@/components/live/picker.constants";
import { SetUpSection } from "@/components/live/SetUpSection";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { PUZZLE_SIZE_NAMES } from "@/lib/puzzles/puzzles.constants";
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
import { SUIDO_LEVEL_SIZES, suidoSizeWord } from "@/lib/puzzles/suido/sizes";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { SetUpResume } from "./SetUpResume";
import { useSizeShelves } from "./sizeShelves";
import { SUIDO_COPY } from "./suido.constants";
import { SuidoLevelChips } from "./SuidoLevelChips";
import { SuidoLevelPicker, suidoLevelPath } from "./SuidoLevelPicker";
import { SuidoLevelPreview } from "./SuidoLevelPreview";
import { keptSolves } from "./suidoKept";

/**
 * SETTING UP SUIDO'S LEVELS, at /games/suido/new: a size, then its board of
 * levels. The same screen as Tsunagi's (`TsunagiSetUp`), which it follows: the
 * chosen level's own board stands where every set-up's preview stands, with the
 * size tiles beside it; a block of sixteen levels is the picker under it, and
 * Start plays the one chosen — the next one not yet solved until another is.
 *
 * THIRTEEN SIZES, FOUR TILES. The set-up keeps room for four boards and no more
 * (`picker.test.ts`), so the tiles show four at a time — 5 to 8, 9 to 12, 13 to
 * 5×7, and the last four, 14 to 8×14, so every shelf is full — and one press beside
 * them turns to the next shelf, as Tsunagi's nine do (`useSizeShelves`). The three
 * long boards are drawn at their own shape on their tiles and in the preview.
 *
 * A level is open once the block before it is solved; the next, ringed, is where
 * Start goes. A locked level can be looked at: the preview draws it under a lock,
 * and Start says it is locked. A member's solves are on the account; anybody's are
 * also in this browser (`suidoKept`), joined here once it has hydrated.
 */
export function SuidoSetUp({
  hasAccount,
  solved,
  bestSolves = {},
  initialSize,
  resumeHref = null,
}: {
  hasAccount: boolean;
  /** The member's solved levels by size, each with its best time: none for anybody without an account. */
  solved: Record<number, Record<number, number>>;
  /** The member's best solve of each level by size, which the preview's time opens: none for anybody without an account. */
  bestSolves?: Record<number, Record<number, string>>;
  initialSize: number;
  /** A Suido already going, if any (a level or a board made): offered first, above Start (`SetUpResume`). */
  resumeHref?: string | null;
}) {
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
  const turnBlock = (by: number) => setTurnedTo({ size, block: Math.min(blocks, Math.max(1, block + by)) });

  // What the chosen level has: its own twists once its size is here, and a lesson's from the marks before then (`SuidoLevelChips`).
  const twists = ready ? (suidoLevelsAt(size)[chosen - 1] === undefined ? [] : declaredTwists(suidoLevelsAt(size)[chosen - 1]!)) : [];

  return (
    <section className="flex flex-col gap-5" data-testid="puzzle-set-up" data-kind="suido" data-mode="levels" {...readyMark(hydrated)}>
      {/*
        THE PREVIEW AND THE LEVEL PICKER, THE SIZES BESIDE THEM OR UNDER THEM, as
        Tsunagi's are: the row wraps, so where the two do not fit side by side the
        sizes go under the board, and their column never gives up the width it
        needs (`shrink-0`): nothing is ever clipped.
      */}
      <div className={`${PICK_BOARD_ROW} py-2 md:flex-wrap`}>
        <div className={`${PICK_BOARD_PREVIEW} flex flex-col items-center gap-2`}>
          <SuidoLevelPreview size={size} level={chosen} best={best[chosen]} solveId={bestSolves[size]?.[chosen] ?? null} locked={chosenLocked} ready={ready} />
          <SuidoLevelPicker size={size} block={block} best={best} open={open} next={next} chosen={chosen} onChoose={(level) => setPicked({ size, level })} />
          <div className="flex items-center gap-2" data-testid="suido-blocks">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => turnBlock(-1)} disabled={block <= 1} aria-label="The block before" data-testid="suido-block-back">
              ‹
            </button>
            <span className="min-w-44 text-center text-sm tabular-nums" data-testid="suido-block" data-block={block}>
              Block {block} of {blocks} · levels {first}–{last}
            </span>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => turnBlock(1)} disabled={block >= blocks} aria-label="The block after" data-testid="suido-block-on">
              ›
            </button>
          </div>
          <p className="text-xs text-muted" data-testid="suido-levels-caption">
            {suidoSizeWord(size)}: {done.size} of {count} solved. Each block of 16 opens when the one before it is all solved.
          </p>
        </div>
        <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="suido-sizes">
          <BoardPicker value={size} sizes={shown} onChange={setSize} names={PUZZLE_SIZE_NAMES.suido} beside />
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} text-sm`} onClick={turnShelf} data-testid="suido-more-sizes">
            {onLast ? `← Smaller boards, from ${suidoSizeWord(SUIDO_LEVEL_SIZES[0]!)}` : `Bigger boards, to ${suidoSizeWord(furthest)} →`}
          </button>
        </div>
      </div>

      <div className={SET_UP_OPTIONS_AND_PLAY}>
        <SetUpSection title="Options" kanji="設定" testId="puzzle-settings">
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {SUIDO_COPY.levelsNote}
          </p>
          <p className="text-xs text-muted">{SUIDO_COPY.levelsNoHelp}</p>
        </SetUpSection>
        <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
          <SetUpResume href={resumeHref} />
          {chosenLocked ? (
            // The same button, saying why it cannot start: a locked level is looked at, never played.
            <span className={`${PLAY_BUTTON} cursor-not-allowed opacity-60`} aria-disabled="true" data-testid="puzzle-solve" data-level={chosen} data-locked="true">
              <PressLabel words={`Level ${chosen} is locked`} kanji="鍵" />
            </span>
          ) : (
            <Link href={suidoLevelPath(size, chosen)} className={PLAY_BUTTON} data-testid="puzzle-solve" data-level={chosen}>
              <PressLabel words={`${START_PRESS.start.words} level ${chosen}`} kanji={START_PRESS.start.kanji} />
            </Link>
          )}
          {/* What the level Start plays asks, before it is started. */}
          <SuidoLevelChips size={size} level={chosen} twists={twists} />
          {skippedPast ? (
            <p className="text-xs text-muted" data-testid="suido-first-unsolved">
              Level {gap} is the first one you have not finished.
            </p>
          ) : null}
          <p className="text-xs text-muted" data-testid="suido-kept-where">
            {hasAccount ? "Your solved levels are kept on your account." : "Your solved levels are kept in this browser. Join, and they are kept on an account."}
          </p>
        </div>
      </div>
    </section>
  );
}
