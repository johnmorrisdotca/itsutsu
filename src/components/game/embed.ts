import { BOARD_THEMES, STONE_SETS } from "@/components/board/Board.constants";
import type { BoardTheme, StoneSet } from "@/components/board/board.types";

/**
 * Query-string readers for the embed page.
 *
 * These live outside the client component on purpose: the page that reads the
 * query is a server component, and a `"use client"` module cannot export a
 * plain function for it to call. Every reader falls back rather than throwing,
 * so a host cannot break the board by mistyping a parameter.
 */
export function readTheme(
  value: string | undefined,
  fallback: BoardTheme,
): BoardTheme {
  return value !== undefined && value in BOARD_THEMES
    ? (value as BoardTheme)
    : fallback;
}

export function readStoneSet(
  value: string | undefined,
  fallback: StoneSet,
): StoneSet {
  return value !== undefined && value in STONE_SETS
    ? (value as StoneSet)
    : fallback;
}
