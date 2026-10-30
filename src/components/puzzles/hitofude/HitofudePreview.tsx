"use client";

import { useMemo } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { blankLine } from "@/lib/puzzles/hitofude/code";
import { generateHitofude } from "@/lib/puzzles/hitofude/generate";
import { puzzleName } from "@/lib/puzzles/puzzleCopy";
import { PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";

import { HitofudeBoard } from "./HitofudeBoard";

/** The seed every preview is made from: a real board at the size and level chosen, nobody's puzzle of the day. */
const PREVIEW_SEED = 7;

/**
 * An Hitofude before it is made: a real board at this size and level, with nothing
 * drawn on it and nothing to press. Loaded in the browser only (`PuzzleBoardPreview`),
 * because a board is searched for and that is not the server's work.
 */
export function HitofudePreview({ size, level }: { size: number; level: PuzzleLevel }) {
  const say = useSpeaker();
  const made = useMemo(() => generateHitofude(size, level, PREVIEW_SEED), [size, level]);
  return <HitofudeBoard size={size} givens={made.givens} code={blankLine(made.givens, size) ?? ""} readOnly label={say.say("pset.board.pencil", { game: puzzleName(PUZZLE_KINDS.hitofude, say.locale), size: String(size) })} />;
}
