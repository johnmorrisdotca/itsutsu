"use client";

import Link from "@/components/ui/Link";
import type { ReactNode } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BoardPicker } from "@/components/live/BoardPicker";
import { START_PRESS } from "@/components/live/live.constants";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, SET_UP_OPTIONS_AND_PLAY, SET_UP_PLAY_COLUMN } from "@/components/live/picker.constants";
import { SetUpSection } from "@/components/live/SetUpSection";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { PUZZLE_SIZE_NAMES } from "@/lib/puzzles/puzzles.constants";
import { suidoSizeWord } from "@/lib/puzzles/suido/sizes";
import { readyMark } from "@/lib/ui/hydrated";

import { suidoWords } from "./mazeWords";
import { SuidoLevelChips } from "./SuidoLevelChips";
import { SuidoLevelPicker, suidoLevelPath } from "./SuidoLevelPicker";
import { SuidoLevelPreview } from "./SuidoLevelPreview";
import { SuidoSetPicker } from "./SuidoSetPicker";
import type { SuidoSet } from "@/lib/puzzles/suido/seed";
import type { Twist } from "@johnmorrisdotca/suido";

/** What the chooser of one set of levels hands the screen both sets share: the same screen, whichever set is on it. */
export type SuidoScreen = {
  set: SuidoSet;
  onSet: (next: SuidoSet) => void;
  hasAccount: boolean;
  hydrated: boolean;
  /** The size the chosen level is at, and whether this set's levels have arrived. */
  size: number;
  ready: boolean;
  /** The levels solved, each with its best time, and the member's best solve of each, which a time opens. */
  best: Record<number, number>;
  bestSolves: Record<number, string>;
  open: number;
  next: number;
  chosen: number;
  chosenLocked: boolean;
  onChoose: (level: number) => void;
  /** The first level not yet solved when a later one is, so Start's number is not read as a slip. */
  skippedPast: number | null;
  /** The levels in the set the screen is on, and how many are solved. */
  count: number;
  done: number;
  /** The block of sixteen shown, how many there are, and ‹ › to turn to another. */
  block: number;
  blocks: number;
  first: number;
  last: number;
  turnBlock: (by: number) => void;
  /** The size tiles, four at a time, and the press beside them that turns to the next four. */
  tiles: { sizes: readonly number[]; onChange: (size: number) => void; onLast: boolean; turnShelf: () => void; furthest: number; smallest: number };
  twists: readonly Twist[];
  /** What each level of the picker is, said after its number: the size it is on, where the numbers run across sizes. */
  describe?: (level: number) => string;
};

/**
 * THE LEVELS' SET-UP SCREEN, whichever set is on it: the preview of the chosen level with the picker under it, the sizes beside them, and the
 * options and Start under both. The two sets read their levels differently (`SuidoSetUp`: a size's own numbers; `SuidoBigSetUp`: sixty-four
 * numbers across every size) and hand this one the same things to draw, so the screen is one and never changes height when a set is chosen.
 */
export function SuidoSetUpLayout({ screen }: { screen: SuidoScreen }) {
  const say = useSpeaker();
  const copy = suidoWords(say.locale).copy;
  const sets = suidoWords(say.locale).sets;
  const { set, size, tiles } = screen;
  return (
    <section className="flex flex-col gap-5" data-testid="puzzle-set-up" data-kind="suido" data-mode="levels" data-set={set} {...readyMark(screen.hydrated)}>
      {/*
        THE PREVIEW AND THE LEVEL PICKER, THE SIZES BESIDE THEM OR UNDER THEM, as
        Tsunagi's are: the row wraps, so where the two do not fit side by side the
        sizes go under the board, and their column never gives up the width it
        needs (`shrink-0`): nothing is ever clipped.
      */}
      <div className={`${PICK_BOARD_ROW} py-2 md:flex-wrap`}>
        <div className={`${PICK_BOARD_PREVIEW} flex flex-col items-center gap-2`}>
          <SuidoLevelPreview size={size} set={set} level={screen.chosen} best={screen.best[screen.chosen]} solveId={screen.bestSolves[screen.chosen] ?? null} locked={screen.chosenLocked} ready={screen.ready} />
          <SuidoLevelPicker size={size} set={set} block={screen.block} best={screen.best} open={screen.open} next={screen.next} chosen={screen.chosen} onChoose={screen.onChoose} describe={screen.describe} />
          <div className="flex items-center gap-2" data-testid="suido-blocks">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => screen.turnBlock(-1)} disabled={screen.block <= 1} aria-label={say.say("pmaze.blockBefore")} data-testid="suido-block-back">
              ‹
            </button>
            <span className="min-w-44 text-center text-sm tabular-nums" data-testid="suido-block" data-block={screen.block}>
              {say.say("pmaze.blockLine", { block: String(screen.block), blocks: String(screen.blocks), first: String(screen.first), last: String(screen.last) })}
            </span>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => screen.turnBlock(1)} disabled={screen.block >= screen.blocks} aria-label={say.say("pmaze.blockAfter")} data-testid="suido-block-on">
              ›
            </button>
          </div>
          <p className="text-xs text-muted" data-testid="suido-levels-caption">
            {say.say("pmaze.tallyBlocks", { what: set === "big" ? sets.big.label : suidoSizeWord(size), done: String(screen.done), count: String(screen.count) })}
          </p>
        </div>
        <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="suido-sizes">
          <BoardPicker value={size} sizes={tiles.sizes} onChange={tiles.onChange} names={PUZZLE_SIZE_NAMES.suido} beside />
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} text-sm`} onClick={tiles.turnShelf} data-testid="suido-more-sizes">
            {tiles.onLast ? say.say("pmaze.smallerBoards", { size: suidoSizeWord(tiles.smallest) }) : say.say("pmaze.biggerBoards", { size: suidoSizeWord(tiles.furthest) })}
          </button>
        </div>
      </div>

      <div className={SET_UP_OPTIONS_AND_PLAY}>
        <SetUpSection title={say.say("pset.options")} kanji="設定" testId="puzzle-settings">
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {set === "big" ? copy.bigNote : copy.levelsNote}
          </p>
          <SuidoSetPicker set={set} onChoose={screen.onSet} />
          <p className="text-xs text-muted">{copy.levelsNoHelp}</p>
        </SetUpSection>
        <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
          {screen.chosenLocked ? (
            // The same button, saying why it cannot start: a locked level is looked at, never played.
            <span className={`${PLAY_BUTTON} cursor-not-allowed opacity-60`} aria-disabled="true" data-testid="puzzle-solve" data-level={screen.chosen} data-locked="true">
              <PressLabel words={say.say("pmaze.levelLocked", { level: String(screen.chosen) })} kanji="鍵" />
            </span>
          ) : (
            <Link href={suidoLevelPath(size, screen.chosen, set)} className={PLAY_BUTTON} data-testid="puzzle-solve" data-level={screen.chosen}>
              <PressLabel words={say.say("pmaze.startLevel", { level: String(screen.chosen) })} kanji={START_PRESS.start.kanji} />
            </Link>
          )}
          {/* What the level Start plays asks, before it is started. */}
          <SuidoLevelChips size={size} level={screen.chosen} twists={screen.twists} set={set} />
          {screen.skippedPast !== null ? (
            <p className="text-xs text-muted" data-testid="suido-first-unsolved">
              {say.say("pmaze.firstUnfinished", { level: String(screen.skippedPast) })}
            </p>
          ) : null}
          <p className="text-xs text-muted" data-testid="suido-kept-where">
            {say.say(screen.hasAccount ? "pmaze.keptAccount" : "pmaze.keptBrowser")}
          </p>
        </div>
      </div>
    </section>
  );
}
