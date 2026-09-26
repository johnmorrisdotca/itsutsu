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
import type { CountdownKey } from "@/lib/puzzles/countdown";

import { CountdownChips } from "./CountdownChips";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { PUZZLE_DISPLAY, PUZZLE_SIZE_NAMES, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import { nextTsunagiLevel, openTsunagiLevels, TSUNAGI_LEVEL_COUNTS, TSUNAGI_SIZES } from "@/lib/puzzles/tsunagi/levels";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { feltOrWoodTheme } from "./GomojiGrid";
import type { TsunagiMarks } from "./puzzles.constants";
import { TsunagiLevelBoard, tsunagiLevelPath } from "./TsunagiLevelBoard";
import { TsunagiMarksPicker } from "./TsunagiMarksPicker";
import { keptSolves } from "./tsunagiKept";
import { useTsunagiMarks } from "./useTsunagiMarks";

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
  solved,
  initialSize,
}: {
  hasAccount: boolean;
  appearance?: Appearance;
  marksChosen: TsunagiMarks | null;
  /** The member's solved levels by size, each with its best time: none for anybody without an account. */
  solved: Record<number, Record<number, number>>;
  initialSize: number;
}) {
  const hydrated = useHydrated();
  const spec = PUZZLE_SPECS.tsunagi;
  const copy = PUZZLE_DISPLAY.tsunagi;
  const [size, setSize] = useState(initialSize);
  // A countdown (`countdown.ts`), none unless chosen: every level's link carries it.
  const [countdown, setCountdown] = useState<CountdownKey | null>(null);
  const [shelf, setShelf] = useState(initialSize > spec.sizes[TILES - 1]! ? spec.sizes.length - TILES : 0);
  const shown = spec.sizes.slice(shelf, shelf + TILES);
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const { marks, chooseMarks } = useTsunagiMarks(marksChosen, hasAccount);
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
    const other = shelf === 0 ? spec.sizes.length - TILES : 0;
    setShelf(other);
    const sizes = spec.sizes.slice(other, other + TILES);
    if (!sizes.includes(size)) setSize(other === 0 ? sizes[sizes.length - 1]! : sizes[0]!);
  };

  return (
    <section className="flex flex-col gap-5" data-testid="puzzle-set-up" data-kind="tsunagi" {...readyMark(hydrated)}>
      <div className={`${PICK_BOARD_ROW} py-2`}>
        <div className={`${PICK_BOARD_PREVIEW} flex flex-col items-center gap-2`}>
          <TsunagiLevelBoard size={size} best={best} open={open} next={next} marks={marks} theme={theme} countdown={countdown} />
          <p className="text-xs text-muted" data-testid="tsunagi-levels-caption">
            {size}×{size}: {done.size} of {count} solved. Rows open ten at a time.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <BoardPicker value={size} sizes={shown} onChange={setSize} names={PUZZLE_SIZE_NAMES.tsunagi} beside />
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} text-sm`} onClick={turnShelf} data-testid="tsunagi-more-sizes">
            {shelf === 0 ? `Bigger boards, to ${spec.sizes[spec.sizes.length - 1]}×${spec.sizes[spec.sizes.length - 1]} →` : `← Smaller boards, from ${spec.sizes[0]}×${spec.sizes[0]}`}
          </button>
        </div>
      </div>

      <div className={SET_UP_OPTIONS_AND_PLAY}>
        <SetUpSection title="Options" kanji="設定" testId="puzzle-settings">
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {copy.board}
          </p>
          <CountdownChips chosen={countdown} onChoose={setCountdown} />
          <TsunagiMarksPicker marks={marks} onChoose={chooseMarks} />
          <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
        </SetUpSection>
        <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
          <Link href={tsunagiLevelPath(size, next, countdown)} className={PLAY_BUTTON} data-testid="puzzle-solve" data-level={next}>
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
