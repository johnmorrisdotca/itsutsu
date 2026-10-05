"use client";

import Link from "@/components/ui/Link";
import { useEffect, useMemo, useState } from "react";

import { BoardPicker } from "@/components/live/BoardPicker";
import { START_PRESS } from "@/components/live/live.constants";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, SET_UP_OPTIONS_AND_PLAY, SET_UP_PLAY_COLUMN } from "@/components/live/picker.constants";
import { SetUpSection } from "@/components/live/SetUpSection";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { meikyuuBlockOf, meikyuuBlockRange, meikyuuBlocksIn, meikyuuLevelCount } from "@/lib/puzzles/meikyuu/levelCounts";
import { loadMeikyuuLevels, meikyuuLevelsAt, meikyuuLevelsLoaded } from "@/lib/puzzles/meikyuu/levels";
import { MEIKYUU_SIZES, meikyuuSizeLabel } from "@/lib/puzzles/meikyuu/sizes";
import { PUZZLE_SIZE_NAMES } from "@/lib/puzzles/puzzles.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MEIKYUU_COPY } from "./meikyuu.constants";
import { MeikyuuColours } from "./MeikyuuColours";
import { MeikyuuLevelChips } from "./MeikyuuLevelChips";
import { meikyuuLevelPath, MeikyuuLevelPicker } from "./MeikyuuLevelPicker";
import { MeikyuuLevelPreview } from "./MeikyuuLevelPreview";
import { keptSolves } from "./meikyuuKept";
import { SetUpResume } from "./SetUpResume";

/** The lowest level of a size not yet solved; the first when every one is, so Start always has a level to play. */
function nextLevelOf(count: number, done: ReadonlySet<number>): number {
  for (let level = 1; level <= count; level += 1) if (!done.has(level)) return level;
  return 1;
}

/**
 * SETTING UP MEIKYUU'S LEVELS, at /games/meikyuu/new: a size, then its board of
 * levels. The same screen as Suido's and Tsunagi's, which it follows: the chosen
 * level's own maze stands where every set-up's preview stands, with the size tiles
 * beside it; a block of sixteen levels is the picker under it, and Start plays the
 * one chosen — the next one not yet solved until another is.
 *
 * FOUR SIZES, FOUR TILES, so there is no shelf to turn. Every level is open: a maze
 * is not a lesson that needs the one before it (the package orders its list so that
 * none is easier than the one before, which is what the order is for), so a reader
 * may look at and play any. A member's solves are on the account; anybody's are
 * also in this browser (`meikyuuKept`), joined here once it has hydrated.
 */
export function MeikyuuSetUp({
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
  /** A Meikyuu already going, if any: offered first, above Start (`SetUpResume`). */
  resumeHref?: string | null;
}) {
  const hydrated = useHydrated();
  const [size, setSize] = useState(initialSize);

  // The list of levels: one script, fetched when this screen opens.
  const [ready, setReady] = useState(meikyuuLevelsLoaded());
  useEffect(() => {
    let live = true;
    void loadMeikyuuLevels().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);

  // This browser's solves, read once the levels are here to say which mazes they were, and joined with the account's.
  const best = useMemo(() => {
    const out: Record<number, number> = hydrated && ready ? { ...keptSolves(size) } : {};
    for (const [level, ms] of Object.entries(solved[size] ?? {})) out[Number(level)] = Math.min(ms, out[Number(level)] ?? ms);
    return out;
  }, [hydrated, ready, solved, size]);
  const done = useMemo(() => new Set(Object.keys(best).map(Number)), [best]);
  const count = meikyuuLevelCount(size);
  const next = nextLevelOf(count, done);

  /*
   * THE LEVEL CHOSEN: the next one not yet solved, until a reader chooses another in
   * the picker. The preview draws it and Start plays it. A size change goes back to
   * the next level of that size.
   */
  const [picked, setPicked] = useState<{ size: number; level: number } | null>(null);
  const chosen = picked !== null && picked.size === size ? picked.level : next;
  /* ONE BLOCK AT A TIME: the block the chosen level is in, until a reader turns to another with ‹ and ›. */
  const [turnedTo, setTurnedTo] = useState<{ size: number; block: number } | null>(null);
  const blocks = meikyuuBlocksIn(count);
  const block = turnedTo !== null && turnedTo.size === size ? turnedTo.block : meikyuuBlockOf(chosen);
  const { first, last } = meikyuuBlockRange(block, count);
  const turnBlock = (by: number) => setTurnedTo({ size, block: Math.min(blocks, Math.max(1, block + by)) });
  const row = ready ? meikyuuLevelsAt(size)[chosen - 1] : undefined;

  return (
    <section className="flex flex-col gap-5" data-testid="puzzle-set-up" data-kind="meikyuu" {...readyMark(hydrated)}>
      {/* THE PREVIEW AND THE LEVEL PICKER, THE SIZES BESIDE THEM OR UNDER THEM, as Suido's are: where the two do not fit side by side the sizes go under the board. */}
      <div className={`${PICK_BOARD_ROW} py-2 md:flex-wrap`}>
        <div className={`${PICK_BOARD_PREVIEW} flex flex-col items-center gap-2`}>
          <MeikyuuLevelPreview size={size} level={chosen} best={best[chosen]} solveId={bestSolves[size]?.[chosen] ?? null} ready={ready} />
          <MeikyuuLevelPicker size={size} block={block} best={best} next={next} chosen={chosen} onChoose={(level) => setPicked({ size, level })} />
          <div className="flex items-center gap-2" data-testid="meikyuu-blocks">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => turnBlock(-1)} disabled={block <= 1} aria-label="The block before" data-testid="meikyuu-block-back">
              ‹
            </button>
            <span className="min-w-44 text-center text-sm tabular-nums" data-testid="meikyuu-block" data-block={block}>
              Block {block} of {blocks} · levels {first}–{last}
            </span>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => turnBlock(1)} disabled={block >= blocks} aria-label="The block after" data-testid="meikyuu-block-on">
              ›
            </button>
          </div>
          <p className="text-xs text-muted" data-testid="meikyuu-levels-caption">
            {meikyuuSizeLabel(size)}: {done.size} of {count} solved.
          </p>
        </div>
        <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="meikyuu-sizes">
          <BoardPicker value={size} sizes={MEIKYUU_SIZES} onChange={setSize} names={PUZZLE_SIZE_NAMES.meikyuu} beside legend="Size" />
        </div>
      </div>

      <div className={SET_UP_OPTIONS_AND_PLAY}>
        <SetUpSection title="Options" kanji="設定" testId="puzzle-settings">
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {MEIKYUU_COPY.levelsNote}
          </p>
          {/* The colours of the preview above and of every maze drawn after it (`MeikyuuColours`). */}
          <MeikyuuColours className="self-start" />
        </SetUpSection>
        <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
          <SetUpResume href={resumeHref} />
          <Link href={meikyuuLevelPath(size, chosen)} className={PLAY_BUTTON} data-testid="puzzle-solve" data-level={chosen}>
            <PressLabel words={`${START_PRESS.start.words} level ${chosen}`} kanji={START_PRESS.start.kanji} />
          </Link>
          {/* What the level Start plays is, before it is started. */}
          {row === undefined ? null : <MeikyuuLevelChips code={row.code} cells={row.cells} score={row.score} level={chosen} />}
          <p className="text-xs text-muted" data-testid="meikyuu-kept-where">
            {hasAccount ? "Your solved levels are kept on your account." : "Your solved levels are kept in this browser. Join, and they are kept on an account."}
          </p>
        </div>
      </div>
    </section>
  );
}
