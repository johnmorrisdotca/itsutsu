"use client";

import Link from "@/components/ui/Link";
import { useMemo, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BoardPicker } from "@/components/live/BoardPicker";
import { START_PRESS } from "@/components/live/live.constants";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, SET_UP_OPTIONS_AND_PLAY, SET_UP_PLAY_COLUMN } from "@/components/live/picker.constants";
import { SetUpSection } from "@/components/live/SetUpSection";
import { PressLabel } from "@/components/ui/PressLabel";
import { PLAY_BUTTON } from "@/components/ui/ui.constants";
import { PUZZLE_SIZE_NAMES } from "@/lib/puzzles/puzzles.constants";
import { tobiishiLevelCount } from "@/lib/puzzles/tobiishi/levelCounts";
import { tobiishiCodeOf, tobiishiRefOf } from "@/lib/puzzles/tobiishi/levels";
import { TOBIISHI_SIZES, tobiishiSizeLabel } from "@/lib/puzzles/tobiishi/sizes";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { SetUpResume } from "./SetUpResume";
import { keptSolves } from "./tobiishiKept";
import { tobiishiWords } from "./mazeWords";
import { TobiishiLevelChips } from "./TobiishiLevelChips";
import { tobiishiLevelPath, TobiishiLevelPicker } from "./TobiishiLevelPicker";
import { TobiishiLevelPreview } from "./TobiishiLevelPreview";

/** The lowest level of a length not yet solved; the first when every one is, so Start always has a level to play. */
function nextLevelOf(count: number, done: ReadonlySet<number>): number {
  for (let level = 1; level <= count; level += 1) if (!done.has(level)) return level;
  return 1;
}

/**
 * SETTING UP TOBIISHI'S LEVELS, at /games/tobiishi/new: a length, then its twenty-seven levels. The same
 * screen as Meikyuu's, Suido's and Tsunagi's, which it follows: the chosen level's own board stands where
 * every set-up's preview stands, with the length tiles beside it; the levels are the picker under it, and
 * Start plays the one chosen, the next one not yet solved until another is.
 *
 * THREE LENGTHS, THREE TILES, so there is no shelf to turn, and all of a length's levels in one picker, so
 * no block to turn to. Every level is open: a peg puzzle is not a lesson that needs the one before it, so a
 * reader may look at and play any. A member's solves are on the account; anybody's are also in this browser
 * (`tobiishiKept`), joined here once it has hydrated.
 */
export function TobiishiSetUp({
  hasAccount,
  solved,
  bestSolves = {},
  initialSize,
  resumeHref = null,
}: {
  hasAccount: boolean;
  /** The member's solved levels by length, each with its best time: none for anybody without an account. */
  solved: Record<number, Record<number, number>>;
  /** The member's best solve of each level by length, which the preview's time opens: none for anybody without an account. */
  bestSolves?: Record<number, Record<number, string>>;
  initialSize: number;
  /** A Tobiishi already going, if any: offered first, above Start (`SetUpResume`). */
  resumeHref?: string | null;
}) {
  const say = useSpeaker();
  const TOBIISHI_COPY = tobiishiWords(say.locale).copy;
  const hydrated = useHydrated();
  const [size, setSize] = useState(initialSize);

  // This browser's solves, read once the page is in a browser, and joined with the account's.
  const best = useMemo(() => {
    const out: Record<number, number> = hydrated ? { ...keptSolves(size) } : {};
    for (const [level, ms] of Object.entries(solved[size] ?? {})) out[Number(level)] = Math.min(ms, out[Number(level)] ?? ms);
    return out;
  }, [hydrated, solved, size]);
  const done = useMemo(() => new Set(Object.keys(best).map(Number)), [best]);
  const count = tobiishiLevelCount(size);
  const next = nextLevelOf(count, done);

  /* THE LEVEL CHOSEN: the next one not yet solved, until a reader chooses another in the picker. The preview draws it and Start plays it. A length change goes back to the next level of that length. */
  const [picked, setPicked] = useState<{ size: number; level: number } | null>(null);
  const chosen = picked !== null && picked.size === size ? picked.level : next;
  const ref = tobiishiRefOf(size, chosen);

  return (
    <section className="flex flex-col gap-5" data-testid="puzzle-set-up" data-kind="tobiishi" {...readyMark(hydrated)}>
      {/* THE PREVIEW AND THE LEVEL PICKER, THE LENGTHS BESIDE THEM OR UNDER THEM, as Meikyuu's are: where the two do not fit side by side the lengths go under the board. */}
      <div className={`${PICK_BOARD_ROW} py-2 md:flex-wrap`}>
        <div className={`${PICK_BOARD_PREVIEW} flex flex-col items-center gap-2`}>
          <TobiishiLevelPreview size={size} level={chosen} best={best[chosen]} solveId={bestSolves[size]?.[chosen] ?? null} />
          <TobiishiLevelPicker size={size} best={best} next={next} chosen={chosen} onChoose={(level) => setPicked({ size, level })} />
          <p className="text-xs text-muted" data-testid="tobiishi-levels-caption">
            {say.say("pmaze.tally", { what: tobiishiSizeLabel(size, say), done: String(done.size), count: String(count) })}
          </p>
        </div>
        <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="tobiishi-sizes">
          <BoardPicker value={size} sizes={TOBIISHI_SIZES} onChange={setSize} names={PUZZLE_SIZE_NAMES.tobiishi} beside legend={say.say("pmaze.options.legendLength")} />
        </div>
      </div>

      <div className={SET_UP_OPTIONS_AND_PLAY}>
        <SetUpSection title={say.say("pset.options")} kanji="設定" testId="puzzle-settings">
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {TOBIISHI_COPY.levelsNote}
          </p>
        </SetUpSection>
        <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
          <SetUpResume href={resumeHref} />
          <Link href={tobiishiLevelPath(size, chosen)} className={PLAY_BUTTON} data-testid="puzzle-solve" data-level={chosen}>
            <PressLabel words={say.say("pmaze.startLevel", { level: String(chosen) })} kanji={START_PRESS.start.kanji} />
          </Link>
          {/* What the level Start plays is, before it is started. */}
          {/* The room three rows of chips take (three of 1.375rem and two gaps of 0.375rem), the most any level's wrap to at any width: a board's and a goal's names are longer for some levels than others, and the screen must not change height when one is chosen. */}
          <div className="min-h-[4.875rem]" data-testid="tobiishi-chips-room">
            {ref === null ? null : <TobiishiLevelChips code={tobiishiCodeOf(ref)} level={chosen} />}
          </div>
          <p className="text-xs text-muted" data-testid="tobiishi-kept-where">
            {say.say(hasAccount ? "pmaze.keptAccount" : "pmaze.keptBrowser")}
          </p>
        </div>
      </div>
    </section>
  );
}
