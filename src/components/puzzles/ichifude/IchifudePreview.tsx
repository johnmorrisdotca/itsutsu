"use client";

import { useMemo } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { blankLine } from "@/lib/puzzles/ichifude/code";
import { generateIchifude } from "@/lib/puzzles/ichifude/generate";
import { puzzleName } from "@/lib/puzzles/puzzleCopy";
import { PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";

import { IchifudeBoard } from "./IchifudeBoard";

/** The seed every preview is made from: a real board at the size and level chosen, nobody's puzzle of the day. */
const PREVIEW_SEED = 7;

/**
 * An Ichifude before it is made: a real board at this size and level, with nothing
 * drawn on it and nothing to press. Loaded in the browser only (`PuzzleBoardPreview`),
 * because a board is searched for and that is not the server's work.
 */
export function IchifudePreview({ size, level }: { size: number; level: PuzzleLevel }) {
  const say = useSpeaker();
  const made = useMemo(() => generateIchifude(size, level, PREVIEW_SEED), [size, level]);
  return <IchifudeBoard size={size} givens={made.givens} code={blankLine(made.givens, size) ?? ""} readOnly label={say.say("pset.board.pencil", { game: puzzleName(PUZZLE_KINDS.ichifude, say.locale), size: String(size) })} />;
}
