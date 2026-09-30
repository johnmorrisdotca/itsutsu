"use client";

import { useMemo } from "react";

import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { dealFreeCell, dealOfSeed, deckOf } from "@johnmorrisdotca/toranpu/freecell";
import { dealSpider, spiderDealOfSeed, spiderDeckOf } from "@johnmorrisdotca/toranpu/spider";

import { FreeCellTable } from "./FreeCellTable";
import { SpiderTable } from "./SpiderTable";

/**
 * FREECELL AND SPIDER BEFORE THEY ARE DEALT, on the set-up screen: a real
 * deal from a fixed seed on the table the game is played on, in the reader's
 * wood, as Solitaire's preview is — FreeCell with the free cells the tile
 * chosen says, Spider in the suits it says. Square, as the tables always are;
 * nothing on it can be pressed. Dealt without the solver, since a preview
 * needs a deal and not a winnable one.
 */
export function PatiencePreview({ kind, size, appearance }: { kind: "freecell" | "spider"; size: number; appearance: Appearance }) {
  const theme = BOARD_THEMES[appearance.boardTheme] ?? BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme];
  const freeCell = useMemo(() => (kind === "freecell" ? dealFreeCell(deckOf(dealOfSeed(7))!, size) : null), [kind, size]);
  const spider = useMemo(() => (kind === "spider" ? dealSpider(spiderDeckOf(spiderDealOfSeed(7, size), size)!) : null), [kind, size]);
  if (freeCell !== null) return <FreeCellTable table={freeCell} theme={theme} readOnly />;
  if (spider !== null) return <SpiderTable table={spider} theme={theme} readOnly />;
  return null;
}
