"use client";

import Link from "next/link";
import { useState } from "react";

import { PICK_CHIP, PICK_CHIP_OPEN } from "@/components/live/picker.constants";
import { BUTTON_BASE, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { playPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SIZE_NAMES, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BoardPicker } from "@/components/live/BoardPicker";

import { sizeWord } from "./puzzles.constants";

/**
 * Setting a puzzle up, at /games/<slug>/new: a size, a level, and Solve.
 *
 * The same address a game is set up at, and the same shape — tiles for the
 * one choice that has a picture, chips for the one that has not — with
 * everything a game asks left out: no seats, no clock, no opponent, because
 * a puzzle has none. Nothing is written when Solve is pressed; the address
 * it leads to holds the whole of the choice, and the browser makes the
 * puzzle when it gets there.
 */
export function PuzzleSetUp({
  kind,
  framed = true,
  sized,
}: {
  kind: PuzzleKind;
  framed?: boolean;
  /**
   * The size, when the caller holds it and draws the size tiles itself — the
   * set-up screen puts them beside the puzzle's picture, the way it puts a
   * game's boards beside the board (`PuzzleHere`). Left out, this draws them.
   */
  sized?: { size: number; onSize: (size: number) => void };
}) {
  const hydrated = useHydrated();
  const spec = PUZZLE_SPECS[kind];
  const copy = PUZZLE_DISPLAY[kind];
  const [ownSize, setOwnSize] = useState(spec.defaultSize);
  const size = sized?.size ?? ownSize;
  const [level, setLevel] = useState<PuzzleLevel>(spec.defaultLevel);

  return (
    // Unframed inside the set-up screen's own panel, which already is one: a box in a box is what the page-shape rules forbid.
    <section className={`${framed ? PANEL_CLASS : ""} flex flex-col gap-5`} data-testid="puzzle-set-up" {...readyMark(hydrated)}>
      {sized === undefined ? <PuzzleSizes kind={kind} size={size} onSize={setOwnSize} /> : null}

      <fieldset className="flex flex-col gap-2">
        {/* Headed the way the board tiles above it are ("Board"), so the two read as one form. */}
        <legend className="mb-0.5 text-sm text-ink-soft">Level</legend>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Level">
          {spec.levels.map((each) => (
            <button
              key={each}
              type="button"
              role="radio"
              aria-checked={level === each}
              className={`${PICK_CHIP} min-h-11 ${level === each ? PICK_CHIP_OPEN : ""}`}
              onClick={() => setLevel(each)}
              data-testid={`puzzle-level-${each}`}
            >
              {PUZZLE_LEVEL_DISPLAY[each].label} <span className="font-mincho opacity-70">{PUZZLE_LEVEL_DISPLAY[each].kanji}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted" data-testid="puzzle-level-blurb">
          {PUZZLE_LEVEL_DISPLAY[level].blurb}
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Link href={`${playPath(kind)}${puzzleQuery({ size, level, seed: null })}`} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2`} data-testid="puzzle-solve">
          Solve a {sizeWord(size)} {copy.label} →
        </Link>
        <span className="text-xs text-muted">Made in your browser, one answer, timed from your first entry.</span>
      </div>
    </section>
  );
}

/**
 * A puzzle's sizes, as the tiles every board size on this site is chosen
 * from: `BoardPicker`, with the big number in the board's own lattice
 * (`BoardSizeMark`), the chosen mark, and a name for what the size is for.
 *
 * John, 2026-09-24, on these tiles as they first shipped — a picture of their
 * own with "4×4" printed under it: "Why does those size boards look different
 * than every other single size board we have ever created." They were drawn by
 * a second component the puzzles brought with them; `boardSizeMark.coverage`
 * now refuses a size picture that is not `BoardSizeMark`.
 */
export function PuzzleSizes({ kind, size, onSize, beside = false }: { kind: PuzzleKind; size: number; onSize: (size: number) => void; beside?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <BoardPicker value={size} sizes={PUZZLE_SPECS[kind].sizes} onChange={onSize} names={PUZZLE_SIZE_NAMES[kind]} beside={beside} />
      <p className="text-xs text-muted">{PUZZLE_DISPLAY[kind].board}</p>
    </div>
  );
}
