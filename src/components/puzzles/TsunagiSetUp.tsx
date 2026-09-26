"use client";

import Link from "@/components/ui/Link";
import { useMemo, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { BoardPicker } from "@/components/live/BoardPicker";
import { START_PRESS } from "@/components/live/live.constants";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, SET_UP_OPTIONS_AND_PLAY, SET_UP_PLAY_COLUMN } from "@/components/live/picker.constants";
import { SetUpSection } from "@/components/live/SetUpSection";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { PUZZLE_DISPLAY, PUZZLE_SIZE_NAMES, sizesOffered } from "@/lib/puzzles/puzzles.constants";
import { nextTsunagiLevel, openTsunagiLevels, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES } from "@/lib/puzzles/tsunagi/levels";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { feltOrWoodTheme } from "./GomojiGrid";
import type { TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { TsunagiLevelBoard, tsunagiLevelPath } from "./TsunagiLevelBoard";
import { SetUpResume } from "./SetUpResume";
import { TsunagiFillPicker, TsunagiMarksPicker } from "./TsunagiMarksPicker";
import { keptSolves } from "./tsunagiKept";
import { useTsunagiFill, useTsunagiMarks } from "./useTsunagiMarks";

/** The sizes the tiles show at once: four, as every set-up screen keeps room for (`picker.test.ts`). */
const TILES = 4;

/**
 * SETTING UP TSUNAGI, at /games/tsunagi/new: a size, then its board of levels.
 *
 * John, 2026-09-26: "there's a page with a grid of all the available levels
 * that you've passed and all the available levels that you still have to do".
 * The board of levels stands where every set-up screen's preview stands, with
 * the size tiles beside it; a level on it is a link to play it, and Start
 * plays the next one not yet solved. The options are how the pairs are told
 * apart (colours or numbers) and the board's colour.
 *
 * SIX SIZES, FOUR TILES. The set-up screen keeps room for four boards and no
 * more, so the tiles show four at a time, 4 to 7 or 6 to 9, and one press
 * beside them turns to the other four. The press is always there, so choosing
 * never moves the page.
 */
export function TsunagiSetUp({
  hasAccount,
  appearance = DEFAULT_APPEARANCE,
  marksChosen,
  fillChosen = null,
  solved,
  initialSize,
  resumeHref = null,
}: {
  hasAccount: boolean;
  appearance?: Appearance;
  marksChosen: TsunagiMarks | null;
  fillChosen?: TsunagiFill | null;
  /** The member's solved levels by size, each with its best time: none for anybody without an account. */
  solved: Record<number, Record<number, number>>;
  initialSize: number;
  /** A level of Tsunagi already going, if any: offered first, above Start (`SetUpResume`). */
  resumeHref?: string | null;
}) {
  const hydrated = useHydrated();
  // Every board the shelves turn to: the same list the front door names (`sizesOffered`).
  const boards = sizesOffered("tsunagi");
  const copy = PUZZLE_DISPLAY.tsunagi;
  const [size, setSize] = useState(initialSize);
  const [shelf, setShelf] = useState(initialSize > boards[TILES - 1]! ? boards.length - TILES : 0);
  const shown = boards.slice(shelf, shelf + TILES);
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const { marks, chooseMarks } = useTsunagiMarks(marksChosen, hasAccount);
  const { fill, chooseFill } = useTsunagiFill(fillChosen, hasAccount);
  const theme = feltOrWoodTheme({ ...appearance, felt });

  /* This browser's solves, read once it has hydrated: the server drew the account's alone, and the two are joined here. */
  const here = useMemo<Record<number, Record<number, number>>>(
    () => (hydrated ? Object.fromEntries(TSUNAGI_SIZES.map((each) => [each, keptSolves(each)])) : {}),
    [hydrated],
  );
  const best = useMemo(() => {
    const out: Record<number, number> = { ...(here[size] ?? {}) };
    for (const [level, ms] of Object.entries(solved[size] ?? {})) out[Number(level)] = Math.min(ms, out[Number(level)] ?? ms);
    return out;
  }, [here, solved, size]);
  const done = useMemo(() => new Set(Object.keys(best).map(Number)), [best]);
  const open = openTsunagiLevels(size, done);
  const next = nextTsunagiLevel(size, done);
  const count = TSUNAGI_LEVEL_COUNTS[size] ?? 0;

  const turnShelf = () => {
    const other = shelf === 0 ? boards.length - TILES : 0;
    setShelf(other);
    const sizes = boards.slice(other, other + TILES);
    if (!sizes.includes(size)) setSize(other === 0 ? sizes[sizes.length - 1]! : sizes[0]!);
  };

  return (
    <section className="flex flex-col gap-5" data-testid="puzzle-set-up" data-kind="tsunagi" {...readyMark(hydrated)}>
      {/*
        THE SIZES BESIDE THE BOARD OF LEVELS, OR UNDER IT. John, 2026-09-26: at
        narrower desk widths the tiles ran off the right edge, "Bigger boards"
        cut in half. The row wraps, so where the two do not fit side by side
        the sizes go under the board, and their column never gives up width
        it needs (`shrink-0`): nothing is ever clipped.
      */}
      <div className={`${PICK_BOARD_ROW} py-2 md:flex-wrap`}>
        <div className={`${PICK_BOARD_PREVIEW} flex flex-col items-center gap-2`}>
          <TsunagiLevelBoard size={size} best={best} open={open} next={next} marks={marks} theme={theme} />
          <p className="text-xs text-muted" data-testid="tsunagi-levels-caption">
            {size}×{size}: {done.size} of {count} solved. Rows open ten at a time.
          </p>
        </div>
        <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="tsunagi-sizes">
          <BoardPicker value={size} sizes={shown} onChange={setSize} names={PUZZLE_SIZE_NAMES.tsunagi} beside />
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} text-sm`} onClick={turnShelf} data-testid="tsunagi-more-sizes">
            {shelf === 0 ? `Bigger boards, to ${boards[boards.length - 1]}×${boards[boards.length - 1]} →` : `← Smaller boards, from ${boards[0]}×${boards[0]}`}
          </button>
        </div>
      </div>

      <div className={SET_UP_OPTIONS_AND_PLAY}>
        <SetUpSection title="Options" kanji="設定" testId="puzzle-settings">
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {copy.board}
          </p>
          <TsunagiMarksPicker marks={marks} onChoose={chooseMarks} />
          <TsunagiFillPicker fill={fill} onChoose={chooseFill} />
          <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
        </SetUpSection>
        <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
          <SetUpResume href={resumeHref} />
          <Link href={tsunagiLevelPath(size, next)} className={PLAY_BUTTON} data-testid="puzzle-solve" data-level={next}>
            <PressLabel words={`${START_PRESS.start.words} level ${next}`} kanji={START_PRESS.start.kanji} />
          </Link>
          <p className="text-xs text-muted" data-testid="tsunagi-kept-where">
            {hasAccount ? "Your solved levels are kept on your account." : "Your solved levels are kept in this browser. Join, and they are kept on an account."}
          </p>
        </div>
      </div>
    </section>
  );
}
