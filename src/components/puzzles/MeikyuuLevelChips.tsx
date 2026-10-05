"use client";

import { thousands } from "@/lib/ui/thousands";

import { MEIKYUU_SHAPE_COPY, MEIKYUU_CHIPS, MEIKYUU_WAY_COPY } from "./meikyuu.constants";
import { LevelChips, type LevelChip } from "./LevelChips";
import { meikyuuFacts } from "./meikyuuFacts";

/**
 * ONE ROW UNDER A MEIKYUU LEVEL: how hard it is, what shape it is, how it is
 * played and how many cells it has. The row is the one every game of fixed levels
 * has (`LevelChips`); what is Meikyuu's is its words (`MEIKYUU_SHAPE_COPY`,
 * `MEIKYUU_WAY_COPY`) and its chips, read from the level's recipe and its score.
 * Null while the level's list is not here yet, and nothing is guessed.
 */
export function MeikyuuLevelChips({ code, cells, score, level }: { code: string; cells: number; score: number; level: number }) {
  const facts = meikyuuFacts(code);
  const shape = facts === null ? undefined : MEIKYUU_SHAPE_COPY[facts.shape];
  const way = facts === null ? undefined : MEIKYUU_WAY_COPY[facts.mode];
  if (shape === undefined || way === undefined) return null;
  const chips: LevelChip[] = [
    { key: "shape", label: shape.label, kanji: shape.kanji, says: shape.says },
    { key: "way", label: way.label, kanji: way.kanji, says: way.says },
    { key: "cells", label: `${thousands(cells)} ${cells === 1 ? "cell" : "cells"}`, says: "How many cells the maze has: the more there are, the more there is to look at, and the bigger ones are zoomed." },
  ];
  // The five marks are the score in fifths; the score itself is in the chip's line, so a level can be told from its neighbour.
  const copy = { ...MEIKYUU_CHIPS, difficulty: { ...MEIKYUU_CHIPS.difficulty, says: `${MEIKYUU_CHIPS.difficulty.says} This one scores ${score}.` } };
  return <LevelChips prefix="meikyuu" level={level} marks={Math.min(5, Math.max(1, Math.ceil(score / 20)))} role={null} twists={chips} copy={copy} />;
}
