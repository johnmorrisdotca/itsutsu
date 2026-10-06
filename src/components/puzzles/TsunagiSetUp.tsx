"use client";

import Link from "@/components/ui/Link";
import { useMemo, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BoardPicker } from "@/components/live/BoardPicker";
import { START_PRESS } from "@/components/live/live.constants";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, SET_UP_OPTIONS_AND_PLAY, SET_UP_PLAY_COLUMN } from "@/components/live/picker.constants";
import { SetUpSection } from "@/components/live/SetUpSection";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { puzzleCopy } from "@/lib/puzzles/puzzleCopy";
import { PUZZLE_SIZE_NAMES, sizesOffered } from "@/lib/puzzles/puzzles.constants";
import { blockOf, blockRange, blocksIn } from "@johnmorrisdotca/tsunagi";
import { tsunagiRole } from "@johnmorrisdotca/tsunagi";
import { TsunagiLevelChips } from "./TsunagiLevelChips";
import { firstUnsolvedTsunagiLevel, levelCountOf, nextTsunagiLevel, openTsunagiLevels, TSUNAGI_PORTAL_SIZES, TSUNAGI_SIZES, type TsunagiSet } from "@/lib/puzzles/tsunagi/levels";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { feltOrWoodTheme } from "./GomojiGrid";
import type { TsunagiCheatsChoice, TsunagiExplosionsChoice, TsunagiFill, TsunagiMarks } from "./puzzles.constants";
import { TsunagiHelpPickers } from "./TsunagiHelpPickers";
import { TsunagiLevelPicker, tsunagiLevelPath } from "./TsunagiLevelPicker";
import { TsunagiLevelPreview } from "./TsunagiLevelPreview";
import { SetUpResume } from "./SetUpResume";
import { useSizeShelves } from "./sizeShelves";
import { TsunagiFillPicker, TsunagiMarksPicker, TsunagiSetPicker } from "./TsunagiMarksPicker";
import { keptAttempts, keptSolves, keptSolvesOff } from "./tsunagiKept";
import { inSet, inSetBySize, seedIn } from "./tsunagiSets";
import { useTsunagiCheats, useTsunagiExplosions, useTsunagiFill, useTsunagiMarks } from "./useTsunagiMarks";

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
 * MORE SIZES THAN TILES. The set-up screen keeps room for four boards and no
 * more, so the tiles show four at a time — 4 to 7, 8 to 11 and 12 to 15 — and
 * one press beside them turns to the next shelf, and from the last back to the first. The press is always there,
 * so choosing never moves the page.
 */
export function TsunagiSetUp(props: Omit<Parameters<typeof TsunagiSetUpFor>[0], "set" | "onSet"> & { initialSet?: TsunagiSet }) {
  const { initialSet = "classic", ...rest } = props;
  const [set, setSet] = useState<TsunagiSet>(initialSet);
  // Each set has its own sizes, so choosing one starts the shelves again: the same size where the set has it.
  return <TsunagiSetUpFor key={set} {...rest} set={set} onSet={setSet} />;
}

function TsunagiSetUpFor({
  set,
  onSet,
  hasAccount,
  appearance = DEFAULT_APPEARANCE,
  marksChosen,
  fillChosen = null,
  solved,
  closed = {},
  bestSolves = {},
  explosionsChosen = null,
  cheatsChosen = null,
  attempts = {},
  initialSize,
  resumeHref = null,
}: {
  hasAccount: boolean;
  appearance?: Appearance;
  marksChosen: TsunagiMarks | null;
  fillChosen?: TsunagiFill | null;
  /** The member's solved levels by size, each with its best time: none for anybody without an account. */
  solved: Record<number, Record<number, number>>;
  /** The member's best solve of each level by size, which the preview's time opens: none for anybody without an account. */
  bestSolves?: Record<number, Record<number, string>>;
  /** The member's levels by size solved only with explosions off: shown solved, never counted to open a block. */
  closed?: Record<number, readonly number[]>;
  /** Explosions as made, softened or off, and whether Cheat is allowed, as the account last chose; null where it never has. */
  explosionsChosen?: TsunagiExplosionsChoice | null;
  cheatsChosen?: TsunagiCheatsChoice | null;
  /** The member's attempts by size and level, on the account: none for anybody without one, whose are in this browser. */
  attempts?: Record<number, Record<number, number>>;
  initialSize: number;
  /** A level of Tsunagi already going, if any: offered first, above Start (`SetUpResume`). */
  resumeHref?: string | null;
  /** Which levels: the classic ones, or the ones with portals. */
  set: TsunagiSet;
  onSet: (next: TsunagiSet) => void;
}) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  // Every board the shelves turn to: the same list the front door names (`sizesOffered`), or the sizes the levels with portals come in.
  const boards: readonly number[] = set === "portals" ? TSUNAGI_PORTAL_SIZES : sizesOffered("tsunagi");
  const copy = puzzleCopy("tsunagi", say.locale);
  // Four tiles at a time, the last shelf full (`useSizeShelves`).
  const { size, setSize, shown, onLast, turnShelf, furthest } = useSizeShelves(boards, boards.includes(initialSize) ? initialSize : boards[0]!);
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const { marks, chooseMarks } = useTsunagiMarks(marksChosen, hasAccount);
  const { fill, chooseFill } = useTsunagiFill(fillChosen, hasAccount);
  const { explosions, chooseExplosions } = useTsunagiExplosions(explosionsChosen, hasAccount);
  const { cheats, chooseCheats } = useTsunagiCheats(cheatsChosen, hasAccount);
  const theme = feltOrWoodTheme({ ...appearance, felt });

  /* This browser's solves, read once it has hydrated: the server drew the account's alone, and the two are joined here. */
  // Everything kept is kept by seed; the set on show is read by the level's number in it (`inSet`).
  const here = useMemo<Record<number, Record<number, number>>>(
    () => (hydrated ? Object.fromEntries(TSUNAGI_SIZES.map((each) => [each, inSet(keptSolves(each), set)])) : {}),
    [hydrated, set],
  );
  // And the ones solved here only with explosions off: solved, never counted to open a block.
  const hereOff = useMemo<Record<number, number>>(() => (hydrated ? inSet(keptSolvesOff(size), set) : {}), [hydrated, size, set]);
  const solvedInSet = useMemo(() => inSetBySize(solved, set), [solved, set]);
  const closedInSet = useMemo(() => Object.fromEntries(Object.entries(closed).map(([each, seeds]) => [Number(each), Object.keys(inSet(Object.fromEntries(seeds.map((seed) => [seed, 0])), set)).map(Number)])), [closed, set]);
  const best = useMemo(() => {
    const out: Record<number, number> = { ...hereOff, ...(here[size] ?? {}) };
    for (const [level, ms] of Object.entries(solvedInSet[size] ?? {})) out[Number(level)] = Math.min(ms, out[Number(level)] ?? ms);
    return out;
  }, [here, hereOff, solvedInSet, size]);
  const done = useMemo(() => new Set(Object.keys(best).map(Number)), [best]);
  // Every solved level but the ones solved only with explosions off: these open blocks and decide which level is next.
  const opening = useMemo(() => {
    const shut = new Set(closedInSet[size] ?? []);
    return new Set([...Object.keys(here[size] ?? {}), ...Object.keys(solvedInSet[size] ?? {}).filter((level) => !shut.has(Number(level)))].map(Number));
  }, [here, solvedInSet, closedInSet, size]);
  // A member's attempts are the account's; a visitor's this browser's, read once hydrated as the solves are.
  const tries = useMemo(() => inSet(hasAccount ? (attempts[size] ?? {}) : hydrated ? keptAttempts(size) : {}, set), [hasAccount, attempts, size, hydrated, set]);
  const open = openTsunagiLevels(size, opening, set);
  const next = nextTsunagiLevel(size, opening, set);
  // Said when a later level is solved, so Start's number is not read as a slip.
  const gap = firstUnsolvedTsunagiLevel(size, opening, set);
  const skippedPast = gap !== null && [...opening].some((level) => level > gap);
  const count = levelCountOf(size, set);
  /*
   * THE LEVEL CHOSEN: the next one not yet solved, until a reader chooses
   * another in the picker. The preview draws it and Start plays it. A size
   * change goes back to the next level of that size.
   */
  const [picked, setPicked] = useState<{ size: number; level: number } | null>(null);
  const chosen = picked !== null && picked.size === size ? picked.level : next;
  const chosenLocked = chosen > open && best[chosen] === undefined;
  /*
   * ONE BLOCK AT A TIME: the block the chosen level is in, until a reader turns
   * to another with ‹ and ›. Locked blocks can be looked at, and their levels
   * chosen to be looked at; Start says they are locked.
   */
  const [turnedTo, setTurnedTo] = useState<{ size: number; block: number } | null>(null);
  const blocks = blocksIn(count);
  const block = turnedTo !== null && turnedTo.size === size ? turnedTo.block : blockOf(chosen);
  const { first, last } = blockRange(block, count);
  const turnBlock = (by: number) => setTurnedTo({ size, block: Math.min(blocks, Math.max(1, block + by)) });

  return (
    <section className="flex flex-col gap-5" data-testid="puzzle-set-up" data-kind="tsunagi" data-set={set} {...readyMark(hydrated)}>
      {/*
        THE PREVIEW AND THE LEVEL PICKER, THE SIZES BESIDE THEM OR UNDER THEM. John, 2026-09-26: at
        narrower desk widths the tiles ran off the right edge, "Bigger boards"
        cut in half. The row wraps, so where the two do not fit side by side
        the sizes go under the board, and their column never gives up width
        it needs (`shrink-0`): nothing is ever clipped.
      */}
      <div className={`${PICK_BOARD_ROW} py-2 md:flex-wrap`}>
        <div className={`${PICK_BOARD_PREVIEW} flex flex-col items-center gap-2`}>
          <TsunagiLevelPreview size={size} level={chosen} set={set} best={best[chosen]} solveId={bestSolves[size]?.[seedIn(set, chosen)] ?? null} locked={chosenLocked} marks={marks} fill={fill} theme={theme} />
          <TsunagiLevelPicker
            size={size}
            set={set}
            block={block}
            best={best}
            attempts={tries}
            open={open}
            next={next}
            chosen={chosen}
            onChoose={(level) => setPicked({ size, level })}
            marks={marks}
          />
          <div className="flex items-center gap-2" data-testid="tsunagi-blocks">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => turnBlock(-1)} disabled={block <= 1} aria-label={say.say("pmaze.blockBefore")} data-testid="tsunagi-block-back">
              ‹
            </button>
            <span className="min-w-44 text-center text-sm tabular-nums" data-testid="tsunagi-block" data-block={block}>
              {say.say("pmaze.blockLine", { block: String(block), blocks: String(blocks), first: String(first), last: String(last) })}
            </span>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => turnBlock(1)} disabled={block >= blocks} aria-label={say.say("pmaze.blockAfter")} data-testid="tsunagi-block-on">
              ›
            </button>
          </div>
          <p className="text-xs text-muted" data-testid="tsunagi-levels-caption">
            {say.say("pmaze.tallyBlocks", { what: set === "portals" ? say.say("pmaze.tsunagi.withPortals", { size: String(size) }) : `${size}×${size}`, done: String(done.size), count: String(count) })}
          </p>
        </div>
        <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="tsunagi-sizes">
          <BoardPicker value={size} sizes={shown} onChange={setSize} names={PUZZLE_SIZE_NAMES.tsunagi} beside />
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} text-sm`} onClick={turnShelf} data-testid="tsunagi-more-sizes">
            {onLast ? say.say("pmaze.smallerBoards", { size: `${boards[0]}×${boards[0]}` }) : say.say("pmaze.biggerBoards", { size: `${furthest}×${furthest}` })}
          </button>
        </div>
      </div>

      <div className={SET_UP_OPTIONS_AND_PLAY}>
        <SetUpSection title={say.say("pset.options")} kanji="設定" testId="puzzle-settings">
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {copy.board}
          </p>
          <TsunagiSetPicker set={set} onChoose={onSet} />
          <TsunagiMarksPicker marks={marks} onChoose={chooseMarks} />
          <TsunagiFillPicker fill={fill} onChoose={chooseFill} />
          <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
          <TsunagiHelpPickers explosions={explosions} onExplosions={chooseExplosions} cheats={cheats} onCheats={chooseCheats} />
        </SetUpSection>
        <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
          <SetUpResume href={resumeHref} />
          {chosenLocked ? (
            // The same button, saying why it cannot start: a locked level is looked at, never played.
            <span className={`${PLAY_BUTTON} cursor-not-allowed opacity-60`} aria-disabled="true" data-testid="puzzle-solve" data-level={chosen} data-locked="true">
              <PressLabel words={say.say("pmaze.levelLocked", { level: String(chosen) })} kanji="鍵" />
            </span>
          ) : (
            <Link href={tsunagiLevelPath(size, seedIn(set, chosen))} className={PLAY_BUTTON} data-testid="puzzle-solve" data-level={chosen} data-set={set}>
              <PressLabel words={say.say("pmaze.startLevel", { level: String(chosen) })} kanji={START_PRESS.start.kanji} />
            </Link>
          )}
          {/* What the level Start plays asks, before it is started. */}
          <TsunagiLevelChips size={size} level={chosen} set={set} challenges={tsunagiRole(size, chosen, set)?.challenges ?? (set === "portals" ? ["portals"] : [])} />
          {skippedPast ? (
            <p className="text-xs text-muted" data-testid="tsunagi-first-unsolved">
              {say.say("pmaze.firstUnfinished", { level: String(gap) })}
            </p>
          ) : null}
          <p className="text-xs text-muted" data-testid="tsunagi-kept-where">
            {say.say(hasAccount ? "pmaze.keptAccount" : "pmaze.keptBrowser")}
          </p>
        </div>
      </div>
    </section>
  );
}
