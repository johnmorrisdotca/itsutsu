"use client";

import Link from "@/components/ui/Link";
import { useEffect, useMemo, useState } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BoardPicker } from "@/components/live/BoardPicker";
import { START_PRESS } from "@/components/live/live.constants";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, PICK_CHIP_OPEN, PICK_CHIP_SHUT, SET_UP_OPTIONS_AND_PLAY, SET_UP_PLAY_COLUMN } from "@/components/live/picker.constants";
import { SetUpSection } from "@/components/live/SetUpSection";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, PLAY_BUTTON } from "@/components/ui/ui.constants";
import { meikyuuBlockOf, meikyuuBlockRange, meikyuuBlocksIn, meikyuuLevelCount } from "@/lib/puzzles/meikyuu/levelCounts";
import { loadMeikyuuLevelsFor, meikyuuLevelsAt, meikyuuLevelsLoaded } from "@/lib/puzzles/meikyuu/levels";
import { isMeikyuuColossal, isMeikyuuSolid, isMeikyuuTall, MEIKYUU_COLOSSAL_SIZE, MEIKYUU_COLOSSAL_SIZES, MEIKYUU_SIZES, MEIKYUU_SOLID_STEPS, MEIKYUU_TALL_SIZES, meikyuuSizeLabel, meikyuuSolidOf, meikyuuSolidSize, meikyuuSolidTiles, meikyuuTallShape, type MeikyuuSolidStep } from "@/lib/puzzles/meikyuu/sizes";
import { progressOf, type SolvedLevels } from "@/lib/puzzles/meikyuu/completion";
import { PUZZLE_SIZE_NAMES } from "@/lib/puzzles/puzzles.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { MEIKYUU_CHOICE } from "./meikyuu.constants";
import { meikyuuWords } from "./mazeWords";
import { MeikyuuColours } from "./MeikyuuColours";
import { MeikyuuLevelChips } from "./MeikyuuLevelChips";
import { meikyuuLevelPath, MeikyuuLevelPicker } from "./MeikyuuLevelPicker";
import { MeikyuuLevelPreview } from "./MeikyuuLevelPreview";
import { keptSolvedLevels, keptSolves } from "./meikyuuKept";
import { MeikyuuProgress } from "./MeikyuuProgress";
import { MeikyuuStones } from "./MeikyuuStones";
import { MeikyuuWayUp } from "./MeikyuuStand";
import { SetUpResume } from "./SetUpResume";

/** How many tall sizes a shelf of the set-up holds: the four tiles every set-up keeps room for. */
const TALL_SHELF = 4;

/** The four shapes of the set-up: the squares and shapes, the tall mazes, the colossal ones, and the mazes over a solid. */
type Shape = "square" | "tall" | "colossal" | "solid";

const SHAPES: readonly Shape[] = ["square", "tall", "colossal", "solid"];

/** A tall size as it is read, "20×30". */
function sizeFrom(size: number): string {
  const shape = meikyuuTallShape(size);
  return shape === null ? String(size) : `${shape.width}×${shape.height}`;
}

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
 * FOUR SHAPES, NO MORE THAN FOUR TILES IN ANY: the squares and shapes have four sizes, so no shelf to turn; the tall ones have six and a
 * shelf that turns; the two COLOSSAL mazes (about ten thousand cells, a square box and a tall one) are a shape of their own, beside the
 * other two; and the SOLIDS (a maze over the whole surface of a cube, a sphere, an octahedron or an icosahedron: the tiles are the four solids)
 * are the fourth, with their three steps (small, medium, large) chosen in the room the tall shelf's press keeps under the tiles, so a set-up
 * never has a fifth tile, nothing that was there moves, and no shape is taller than another. Every level is open: a maze
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
  const say = useSpeaker();
  const words = meikyuuWords(say.locale);
  const sizeLabel = (each: number) => meikyuuSizeLabel(each, say);
  const hydrated = useHydrated();
  const [size, setSize] = useState(initialSize);
  const shapeOf = (each: number): Shape => (isMeikyuuSolid(each) ? "solid" : isMeikyuuColossal(each) ? "colossal" : isMeikyuuTall(each) ? "tall" : "square");
  const shape = shapeOf(size);
  /* A solid and its step (small, medium, large); the tiles are the four solids at this step, and the step is chosen under them. */
  const solid = meikyuuSolidOf(size);
  const step: MeikyuuSolidStep = solid?.step ?? "small";
  /* A maze in a tall box, which the way-up choice is for: the tall sizes and the colossal tall one. */
  const upright = isMeikyuuTall(size);
  const tall = shape === "tall";
  /* The size last chosen of each shape, so turning to another shape and back leaves it where it was. */
  const [lastOf, setLastOf] = useState<Record<Shape, number>>({
    square: shape === "square" ? initialSize : MEIKYUU_SIZES[0]!,
    tall: shape === "tall" ? initialSize : MEIKYUU_TALL_SIZES[0]!,
    colossal: shape === "colossal" ? initialSize : MEIKYUU_COLOSSAL_SIZE,
    solid: shape === "solid" ? initialSize : meikyuuSolidSize("cube", "small"),
  });
  const chooseSize = (next: number) => {
    setSize(next);
    setLastOf((before) => ({ ...before, [shapeOf(next)]: next }));
  };
  /* The tall sizes are six and a shelf holds four: the first four, then the last four, turned between with a press. */
  const [moreTall, setMoreTall] = useState(tall && MEIKYUU_TALL_SIZES.indexOf(initialSize) >= TALL_SHELF);
  const tallShown = useMemo(() => (moreTall ? MEIKYUU_TALL_SIZES.slice(-TALL_SHELF) : MEIKYUU_TALL_SIZES.slice(0, TALL_SHELF)), [moreTall]);
  const turnTall = () => {
    const next = !moreTall;
    setMoreTall(next);
    const shown = next ? MEIKYUU_TALL_SIZES.slice(-TALL_SHELF) : MEIKYUU_TALL_SIZES.slice(0, TALL_SHELF);
    if (tall && !shown.includes(size)) chooseSize(next ? shown[shown.length - 1]! : shown[0]!);
  };

  // The list of levels the size is in: one script, fetched when this screen opens and again for the other shape.
  const [, setArrivals] = useState(0);
  const ready = meikyuuLevelsLoaded(size);
  useEffect(() => {
    let live = true;
    void loadMeikyuuLevelsFor(size).then(() => live && setArrivals((count) => count + 1));
    return () => {
      live = false;
    };
  }, [size]);

  // This browser's solves, read once the levels are here to say which mazes they were, and joined with the account's.
  const best = useMemo(() => {
    const out: Record<number, number> = hydrated && ready ? { ...keptSolves(size) } : {};
    for (const [level, ms] of Object.entries(solved[size] ?? {})) out[Number(level)] = Math.min(ms, out[Number(level)] ?? ms);
    return out;
  }, [hydrated, ready, solved, size]);
  const done = useMemo(() => new Set(Object.keys(best).map(Number)), [best]);
  const count = meikyuuLevelCount(size);
  /* HOW FAR THROUGH EACH SIZE ON SHOW: the account's solves, which the page read once for every size, and this browser's, joined (`completion.ts`). */
  const solidTiles = meikyuuSolidTiles(step);
  const shownSizes = shape === "solid" ? solidTiles : shape === "colossal" ? MEIKYUU_COLOSSAL_SIZES : tall ? tallShown : MEIKYUU_SIZES;
  const account: SolvedLevels = Object.fromEntries(Object.entries(solved).map(([each, levels]) => [Number(each), Object.keys(levels).map(Number)]));
  const progress = progressOf(shownSizes, account, hydrated && ready ? keptSolvedLevels(shownSizes) : null);
  const whole = progress.find((row) => row.size === size)?.complete === true;
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
  /* A solid's step, chosen under the tiles: the same solid at another size. */
  const chooseStep = (next: MeikyuuSolidStep) => {
    if (solid !== null) chooseSize(meikyuuSolidSize(solid.kind, next));
  };
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
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => turnBlock(-1)} disabled={block <= 1} aria-label={say.say("pmaze.blockBefore")} data-testid="meikyuu-block-back">
              ‹
            </button>
            <span className="min-w-44 text-center text-sm tabular-nums" data-testid="meikyuu-block" data-block={block}>
              {say.say("pmaze.blockLine", { block: String(block), blocks: String(blocks), first: String(first), last: String(last) })}
            </span>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2.5 py-1 text-sm`} onClick={() => turnBlock(1)} disabled={block >= blocks} aria-label={say.say("pmaze.blockAfter")} data-testid="meikyuu-block-on">
              ›
            </button>
          </div>
          <p className="text-xs text-muted" data-testid="meikyuu-levels-caption" data-complete={whole ? "true" : "false"}>
            {whole ? `★ ${words.progress.cheer(sizeLabel(size).toLowerCase(), count)}` : say.say("pmaze.tally", { what: sizeLabel(size), done: String(done.size), count: String(count) })}
          </p>
        </div>
        <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="meikyuu-sizes">
          {/* The shape of the mazes: squares and shapes in four sizes, or the tall ones, for a phone held upright. */}
          <fieldset className="flex min-w-0 flex-col gap-1.5 self-stretch" data-testid="meikyuu-shapes">
            <legend className="mb-0.5 text-sm text-ink-soft">{words.shapeCopy.legend}</legend>
            <div className="flex gap-1.5">
              {SHAPES.map((each) => (
                <button
                  key={each}
                  type="button"
                  className={`${MEIKYUU_CHOICE} ${each === shape ? PICK_CHIP_OPEN : PICK_CHIP_SHUT} flex-1 !px-2`}
                  aria-pressed={each === shape}
                  title={words.shapeCopy[each].says}
                  onClick={() => chooseSize(lastOf[each])}
                  data-testid={`meikyuu-shape-${each}`}
                  data-chosen={each === shape ? "true" : "false"}
                >
                  <Paired en={words.shapeCopy[each].label} kanji={words.shapeCopy[each].kanji} kanjiClassName="text-xs whitespace-nowrap opacity-70" inReadersLanguage />
                </button>
              ))}
            </div>
          </fieldset>
          <BoardPicker value={size} sizes={shape === "solid" ? solidTiles : shape === "colossal" ? MEIKYUU_COLOSSAL_SIZES : tall ? tallShown : MEIKYUU_SIZES} onChange={chooseSize} names={PUZZLE_SIZE_NAMES.meikyuu} beside legend={say.say(shape === "solid" ? "pmaze.options.legendSolid" : "pmaze.options.legendSize")} />
          {/* The press that turns the tall sizes' shelf: always in its place, so a square size's screen is as tall as a tall one's. A solid's three steps are chosen in the same room. */}
          <div className="relative flex w-full justify-center" data-testid="meikyuu-under-tiles">
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} text-sm ${tall ? "" : "invisible"}`} onClick={turnTall} disabled={!tall} aria-hidden={tall ? undefined : true} tabIndex={tall ? undefined : -1} data-testid="meikyuu-more-sizes">
              {moreTall ? words.shapeCopy.lessTall(sizeFrom(MEIKYUU_TALL_SIZES[0]!)) : words.shapeCopy.moreTall(sizeFrom(MEIKYUU_TALL_SIZES[MEIKYUU_TALL_SIZES.length - 1]!))}
            </button>
            {solid === null ? null : (
              <div className="absolute inset-0 flex items-center justify-center gap-1.5" role="group" aria-label={words.shapeCopy.stepLegend} data-testid="meikyuu-steps">
                {MEIKYUU_SOLID_STEPS.map((each) => (
                  <button
                    key={each}
                    type="button"
                    className={`${BUTTON_BASE} !rounded-full ${each === step ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
                    aria-pressed={each === step}
                    title={words.step[each].says}
                    onClick={() => chooseStep(each)}
                    data-testid={`meikyuu-step-${each}`}
                    data-chosen={each === step ? "true" : "false"}
                  >
                    {words.step[each].label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* How many of each size on show are solved: every level is open, and this is what there is to finish. Four rows whichever shape is chosen, so nothing moves. */}
          <MeikyuuProgress rows={progress} label={sizeLabel} className="max-w-[14.5rem]" holds={4} />
        </div>
      </div>

      <div className={SET_UP_OPTIONS_AND_PLAY}>
        <SetUpSection title={say.say("pset.options")} kanji="設定" testId="puzzle-settings">
          <p className="text-xs text-muted" data-testid="puzzle-size-note">
            {words.copy.levelsNote}
          </p>
          {/* The colours of the preview above and of every maze drawn after it (`MeikyuuColours`). */}
          <MeikyuuColours className="self-start" />
          {/* Which way up a tall maze is shown; it keeps its place for a square one, dimmed, so choosing a size moves nothing. */}
          <MeikyuuWayUp active={upright} />
          {/* How many stones may lie at once, for every maze: a setting, so it keeps its place whatever size is chosen. */}
          <MeikyuuStones />
        </SetUpSection>
        <div className={SET_UP_PLAY_COLUMN} data-testid="puzzle-play-buttons">
          <SetUpResume href={resumeHref} />
          <Link href={meikyuuLevelPath(size, chosen)} className={PLAY_BUTTON} data-testid="puzzle-solve" data-level={chosen}>
            <PressLabel words={say.say("pmaze.startLevel", { level: String(chosen) })} kanji={START_PRESS.start.kanji} />
          </Link>
          {/* What the level Start plays is, before it is started. */}
          {row === undefined ? null : <MeikyuuLevelChips code={row.code} cells={row.cells} score={row.score} level={chosen} />}
          <p className="text-xs text-muted" data-testid="meikyuu-kept-where">
            {say.say(hasAccount ? "pmaze.keptAccount" : "pmaze.keptBrowser")}
          </p>
        </div>
      </div>
    </section>
  );
}
