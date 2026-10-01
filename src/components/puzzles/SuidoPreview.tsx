"use client";

import { useMemo } from "react";

import { newGame } from "@johnmorrisdotca/suido";

import { generateSuido } from "@/lib/puzzles/suido/generate";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";

import { SuidoBoard } from "./SuidoBoard";

/**
 * Suido before it is made: a real board of this size and level from a fixed
 * seed, as the solve draws it (`SuidoBoard`), the pieces as they are dealt and
 * the water as far as it gets, with nothing to press. A millisecond or two,
 * and only a picture. Keyed on the size and level, so a new board is a new
 * drawing and the water is not painted across another's pieces. Loaded in the
 * browser only (`PuzzleBoardPreview`): the set-up page is drawn on a server,
 * and a picture is not worth making a board there.
 */
export function SuidoPreview({ size, level }: { size: number; level: PuzzleLevel }) {
  const game = useMemo(() => newGame(generateSuido(size, level, 7).givens), [size, level]);
  if (game === null) return null;
  return <SuidoBoard key={`${size}-${level}`} layout={game.start} masks={game.masks} quarters={game.quarters} readOnly done />;
}
