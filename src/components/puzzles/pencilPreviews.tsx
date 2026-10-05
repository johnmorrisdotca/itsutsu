"use client";

import { useMemo } from "react";

import { generateJirai } from "@/lib/puzzles/jirai/generate";
import { jiraiRecipeOf } from "@/lib/puzzles/jirai/board";
import { previewJiraiSeed, type JiraiVariant } from "@/lib/puzzles/jirai/variants";
import { pencilEngine } from "@/lib/puzzles/pencil/engines";
import { generatePencil } from "@/lib/puzzles/pencil/generate";
import type { PencilKind } from "@/lib/puzzles/pencil/pencil.types";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";

import { JiraiBoard } from "./JiraiBoard";
import { PencilBoard } from "./pencil/PencilBoard";

/**
 * A pencil puzzle before it is made: a real board at this size from a fixed seed,
 * easy where it has levels so it is made at once, on the board the solve draws
 * (`PencilBoard`) with nothing written on it and nothing to press.
 */
export function PencilPreview({ kind, size }: { kind: PencilKind; size: number }) {
  const made = useMemo(() => generatePencil(kind, size, "easy", 7), [kind, size]);
  return <PencilBoard kind={kind} size={size} givens={made.givens} code={pencilEngine(kind).blank(size, made.givens)} readOnly label={`${PUZZLE_DISPLAY[kind].label} board, ${size} by ${size}`} />;
}

/**
 * A Jirai before it is played: a real board of the chosen kind and size from a fixed seed, with its opening
 * uncovered, on the board the solve draws (`JiraiBoard`) and nothing to press.
 */
export function JiraiPreview({ size, variant }: { size: number; variant: JiraiVariant }) {
  const made = useMemo(() => generateJirai(size, "easy", previewJiraiSeed(variant)), [size, variant]);
  const recipe = jiraiRecipeOf(size, made.givens);
  return recipe === null ? null : <JiraiBoard size={size} givens={made.givens} code={recipe.cells} readOnly label={`Jirai board, ${size} by ${size}`} />;
}
