"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { meikyuuWords } from "./mazeWords";
import { MEIKYUU_SOLID_KINDS, type MeikyuuSolidKind } from "@/lib/puzzles/meikyuu/sizes";
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
  const say = useSpeaker();
  const words = meikyuuWords(say.locale);
  // A maze over a solid has four parts to its recipe (`cube:7:prim:48213`): the solid it is over, and one way to play, over the surface.
  const solidKind = code.split(":").length === 4 ? code.split(":")[0] : null;
  const solid = solidKind !== null && (MEIKYUU_SOLID_KINDS as readonly string[]).includes(solidKind) ? words.solid[solidKind as MeikyuuSolidKind] : undefined;
  const facts = solid === undefined ? meikyuuFacts(code) : null;
  const shape = solid ?? (facts === null ? undefined : words.shape[facts.shape]);
  const way = solid === undefined ? (facts === null ? undefined : words.way[facts.mode]) : words.surface;
  if (shape === undefined || way === undefined) return null;
  const chips: LevelChip[] = [
    { key: "shape", label: shape.label, kanji: shape.kanji, says: shape.says },
    { key: "way", label: way.label, kanji: way.kanji, says: way.says },
    { key: "cells", label: say.count("pmaze.count.cell", cells), says: say.say("pmaze.meikyuu.cellsSays") },
  ];
  // The five marks are the score in fifths; the score itself is in the chip's line, so a level can be told from its neighbour.
  const copy = { ...words.chips, difficulty: { ...words.chips.difficulty, says: say.say("pmaze.meikyuu.score", { says: words.chips.difficulty.says, score: String(score) }) } };
  return <LevelChips prefix="meikyuu" level={level} marks={Math.min(5, Math.max(1, Math.ceil(score / 20)))} role={null} twists={chips} copy={copy} />;
}
