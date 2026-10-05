"use client";

import { useState } from "react";

import type { Appearance, Felt } from "@/components/board/board.types";
import { BoardPicker } from "@/components/live/BoardPicker";
import { PuzzleBoardPreview } from "@/components/live/PuzzleBoardPreview";
import { PICK_BOARD_PREVIEW, PICK_BOARD_ROW, PICK_BOARD_ROW_UNDER_FAMILIES } from "@/components/live/picker.constants";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { listedGameOf, settingsOf } from "@/lib/catalogue/gameSettings";
import type { WordCount } from "@/lib/puzzles/gomoji/words.types";
import type { JiraiVariant } from "@/lib/puzzles/jirai/variants";
import type { SuidoWay } from "@/lib/puzzles/suido/seed";
import { CARD_SIZE_WORDS, PUZZLE_SIZE_NAMES, PUZZLE_SPECS, sizesOffered } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";

import { sizeWord } from "./puzzles.constants";
import { SIZE_TILES, shelfFor, shelvesOf } from "./sizeShelves";

/**
 * A puzzle's sizes, as the tiles every board size on this site is chosen
 * from: `BoardPicker`, with the big number in the board's own lattice
 * (`BoardSizeMark`), the chosen mark, and a name for what the size is for.
 *
 * John, 2026-09-24, on these tiles as they first shipped — a picture of their
 * own with "4×4" printed under it: "Why does those size boards look different
 * than every other single size board we have ever created." They were drawn by
 * a second component the puzzles brought with them; `boardSizeMark.coverage`
 * now refuses a size picture that is not `BoardSizeMark`. What each size is
 * for is said in the settings below (`PuzzleSetUp`), not under the tiles.
 */
/**
 * A puzzle's live preview with its sizes beside it: the row a game's board and
 * its boards stand in (`PICK_BOARD_ROW`), on the set-up screen that chooses
 * among every game (`PuzzleHere`, under the families) and on a puzzle's own.
 */
export function PuzzleBoardAndSizes({
  kind,
  size,
  onSize,
  level,
  appearance,
  onFelt,
  underFamilies = false,
  words = 1,
  jirai,
  suido,
}: {
  kind: PuzzleKind;
  size: number;
  onSize: (size: number) => void;
  level?: PuzzleLevel;
  appearance?: Appearance;
  onFelt?: (felt: Felt) => void;
  /** How many words a Gomoji hides: a Futago's preview is two boards (`futago.ts`), a Yotsugo's two boards of two quarters (`yotsugo.ts`). */
  words?: WordCount;
  /** Under the row of families, where from a laptop's width the pair joins that row (`PICK_BOARD_ROW_UNDER_FAMILIES`). */
  underFamilies?: boolean;
  /** Jirai's way to play, as chosen: its preview is a board of that kind. */
  jirai?: JiraiVariant;
  /** Suido's kind of board and squares, as chosen: its preview is a board of that kind. */
  suido?: SuidoWay;
}) {
  return (
    <div className={`${PICK_BOARD_ROW} py-2 ${underFamilies ? PICK_BOARD_ROW_UNDER_FAMILIES : ""}`}>
      <div className={PICK_BOARD_PREVIEW}>
        <PuzzleBoardPreview kind={kind} size={size} level={level} appearance={appearance} onFelt={onFelt} wordCount={words} jirai={jirai} suido={suido} />
      </div>
      {/* A puzzle's own page turns its shelves; under the families the row keeps one height, so it shows the first shelf only. */}
      <PuzzleSizes kind={kind} size={size} onSize={onSize} beside shelves={!underFamilies} />
    </div>
  );
}

/**
 * A PUZZLE'S SIZES, four tiles at a time. A puzzle with more sizes than the
 * four the set-up keeps room for (`shelves`: Pop Gomoji's three to seven
 * letters, Suido's sixteen sizes) shows them a shelf at a time, four to a shelf
 * and the last moved back so it is full, with a press to turn between them, as Tsunagi's board of levels does
 * (`TsunagiSetUp`). Where `shelves` is off, the first shelf alone.
 */
export function PuzzleSizes({
  kind,
  size,
  onSize,
  beside = false,
  shelves = false,
}: {
  kind: PuzzleKind;
  size: number;
  onSize: (size: number) => void;
  beside?: boolean;
  shelves?: boolean;
}) {
  const spec = PUZZLE_SPECS[kind];
  const every = sizesOffered(kind);
  const shelved = shelves && every.length > spec.offered.length;
  /*
   * THE SHELVES: where each starts (`shelvesOf`: every four, the last moved back so it too is full), the one the size asked for is on, and a press that turns to
   * the next and from the last back to the first. Pop Gomoji's five sizes are two shelves, Suido's sixteen four.
   */
  const starts = shelvesOf(every.length);
  const [shelf, setShelf] = useState(() => (shelved ? shelfFor(every, size) : 0));
  const shown = !shelved ? spec.offered : every.slice(shelf, shelf + SIZE_TILES);
  const onLast = shelf === starts[starts.length - 1];
  const nextShelf = onLast ? 0 : starts[starts.indexOf(shelf) + 1]!;
  const turn = () => {
    setShelf(nextShelf);
    const sizes = every.slice(nextShelf, nextShelf + SIZE_TILES);
    if (!sizes.includes(size)) onSize(nextShelf === 0 ? sizes[sizes.length - 1]! : (sizes.find((each) => each > size) ?? sizes[0]!));
  };
  const picker = <BoardPicker value={size} sizes={shown} onChange={onSize} names={PUZZLE_SIZE_NAMES[kind]} beside={beside} legend={CARD_SIZE_WORDS[kind]?.legend} />;
  /*
   * A setting of a game whose other settings turn shelves keeps the room the
   * press takes, drawn and hidden, so choosing Pop culture on a Gomoji or
   * leaving it moves nothing under the sizes (`WordSettingChips`).
   */
  const sibling = shelves && !shelved && settingsOf(listedGameOf(kind)).some((other) => PUZZLE_SPECS[other].shelves === true && sizesOffered(other).length > PUZZLE_SPECS[other].offered.length);
  if (sibling) {
    return (
      <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="puzzle-sizes-shelved">
        {picker}
        <span className={`${BUTTON_BASE} ${BUTTON_QUIET} invisible text-sm`} aria-hidden="true">
          Longer →
        </span>
      </div>
    );
  }
  if (!shelved) return picker;
  return (
    <div className="flex max-w-full flex-col items-center gap-2 md:shrink-0" data-testid="puzzle-sizes-shelved">
      {picker}
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} text-sm`} onClick={turn} data-testid="puzzle-more-sizes">
        {onLast ? `← Shorter, from ${sizeWord(every[0]!, kind)}` : `Longer, to ${sizeWord(every[Math.min(every.length, nextShelf + SIZE_TILES) - 1]!, kind)} →`}
      </button>
    </div>
  );
}
