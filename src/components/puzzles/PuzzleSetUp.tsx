"use client";

import Link from "next/link";
import { useState } from "react";

import { PICK_CARD, PICK_CHIP, PICK_CHIP_OPEN } from "@/components/live/picker.constants";
import { BUTTON_BASE, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { playPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PuzzleSizeMark } from "./PuzzleSizeMark";
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
export function PuzzleSetUp({ kind }: { kind: PuzzleKind }) {
  const hydrated = useHydrated();
  const spec = PUZZLE_SPECS[kind];
  const copy = PUZZLE_DISPLAY[kind];
  const [size, setSize] = useState(spec.defaultSize);
  const [level, setLevel] = useState<PuzzleLevel>(spec.defaultLevel);

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-5`} data-testid="puzzle-set-up" {...readyMark(hydrated)}>
      <fieldset className="flex flex-col gap-2">
        <legend className={SECTION_TITLE}>
          Size <span className="font-mincho normal-case tracking-normal">大きさ</span>
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(6rem,8rem))]" role="radiogroup" aria-label="Size">
          {spec.sizes.map((side) => (
            <button
              key={side}
              type="button"
              role="radio"
              aria-checked={size === side}
              data-chosen={size === side ? "true" : "false"}
              className={`${PICK_CARD} min-h-11 flex-col gap-1.5 p-2`}
              onClick={() => setSize(side)}
              data-testid={`puzzle-size-${side}`}
            >
              <PuzzleSizeMark kind={kind} size={side} picture="regular" />
              <span className="text-sm font-semibold" data-testid="puzzle-size-name">
                {sizeWord(side)}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{copy.board}</p>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={SECTION_TITLE}>
          Level <span className="font-mincho normal-case tracking-normal">難易度</span>
        </legend>
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
