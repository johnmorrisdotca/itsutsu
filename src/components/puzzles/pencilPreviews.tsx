"use client";

import { useMemo } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { generateJirai } from "@/lib/puzzles/jirai/generate";
import { jiraiRecipeOf } from "@/lib/puzzles/jirai/board";
import { previewJiraiSeed, type JiraiVariant } from "@/lib/puzzles/jirai/variants";
import { pencilEngine } from "@/lib/puzzles/pencil/engines";
import { generatePencil } from "@/lib/puzzles/pencil/generate";
import type { PencilKind } from "@/lib/puzzles/pencil/pencil.types";
import { puzzleName } from "@/lib/puzzles/puzzleCopy";
import { PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";

import { JiraiBoard } from "./JiraiBoard";
import { PencilBoard } from "./pencil/PencilBoard";

/**
 * A pencil puzzle before it is made: a real board at this size and the level chosen, from a fixed seed
 * (Kazu 1.3.0 makes every level of every size in about half a second at the very most, which `docs/plans/pencil/README.md`
 * measures), on the board the solve draws (`PencilBoard`) with nothing written on it and nothing to press.
 */
export function PencilPreview({ kind, size, level }: { kind: PencilKind; size: number; level: PuzzleLevel }) {
  const say = useSpeaker();
  const made = useMemo(() => generatePencil(kind, size, level, 7), [kind, size, level]);
  return <PencilBoard kind={kind} size={size} givens={made.givens} code={pencilEngine(kind).blank(size, made.givens)} readOnly label={say.say("pset.board.pencil", { game: puzzleName(kind, say.locale), size: String(size) })} />;
}

/**
 * A Jirai before it is played: a real board of the chosen kind, size and level from a fixed seed, with its opening
 * uncovered, on the board the solve draws (`JiraiBoard`) and nothing to press.
 */
export function JiraiPreview({ size, level, variant }: { size: number; level: PuzzleLevel; variant: JiraiVariant }) {
  const say = useSpeaker();
  const made = useMemo(() => generateJirai(size, level, previewJiraiSeed(variant)), [size, level, variant]);
  const recipe = jiraiRecipeOf(size, made.givens);
  return recipe === null ? null : <JiraiBoard size={size} givens={made.givens} code={recipe.cells} readOnly label={say.say("pset.board.pencil", { game: puzzleName(PUZZLE_KINDS.jirai, say.locale), size: String(size) })} />;
}
