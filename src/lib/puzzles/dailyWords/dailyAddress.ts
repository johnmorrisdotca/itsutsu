import { gamePath, playPath } from "@/lib/gomoku/slugs";

import { DAILY_PARAM } from "../daily";
import { toKatakana } from "../gomojiKana/kanaCode";
import { puzzleQuery } from "../puzzleAddress";
import { PUZZLE_SPECS } from "../puzzles.constants";
import type { PuzzleKind } from "../puzzles.types";
import { dailyWordSeed } from "./dailyDay";
import { futagoDailySeed } from "../gomoji/futagoSeed";

/**
 * WHERE THE DAILY WORDS ARE, and how a kept solve is matched to a day's word.
 *
 * The archive is /games/<slug>/daily and one day of it /games/<slug>/daily/
 * 2026-10-03: the game in the path, then the day, which is identity. A day's
 * word is played at the kind's usual level (`defaultLevel`: medium for the
 * alphabet Gomojis, easy for kana), as "Today's word" always was.
 */

/** /games/<slug>/daily — every past day's words. */
export function dailyWordsPath(kind: PuzzleKind): string {
  return `${gamePath(kind)}/daily`;
}

/** /games/<slug>/daily/<day> — one day's words and the fastest at each. */
export function dailyDayPath(kind: PuzzleKind, day: string): string {
  return `${dailyWordsPath(kind)}/${day}`;
}

/** The address a day's word is played at, at a length: an ordinary solve with the day's seed. */
export function dailyPlayPath(kind: PuzzleKind, size: number, day: string): string {
  return `${playPath(kind)}${puzzleQuery({ size, level: PUZZLE_SPECS[kind].defaultLevel, seed: dailyWordSeed(day) })}`;
}

/**
 * Today's word at a length, for a page drawn before anybody asked (the front
 * door is prerendered): the play page turns `?daily=1` into today's seed when
 * it is opened, so the link is right on whatever day it is followed.
 */
export function todayPlayPath(kind: PuzzleKind, size: number): string {
  return `${playPath(kind)}${puzzleQuery({ size, level: PUZZLE_SPECS[kind].defaultLevel, seed: null })}&${DAILY_PARAM}=1`;
}

/** The address a day's Futago is played at, at a length: its two words, at the day's Futago seed (`futagoDailySeed`). */
export function dailyFutagoPlayPath(kind: PuzzleKind, size: number, day: string): string {
  return `${playPath(kind)}${puzzleQuery({ size, level: PUZZLE_SPECS[kind].defaultLevel, seed: futagoDailySeed(day), twins: true })}`;
}

/** Today's Futago at a length, for a page drawn before anybody asked: `?daily=1` with `twins=1` turns into today's Futago seed. */
export function todayFutagoPlayPath(kind: PuzzleKind, size: number): string {
  return `${playPath(kind)}${puzzleQuery({ size, level: PUZZLE_SPECS[kind].defaultLevel, seed: null, twins: true })}&${DAILY_PARAM}=1`;
}

/** The givens a solve of this word was kept with, for a query: exactly, or as the start before a kana puzzle's grey word. */
export function givensOfWord(kind: PuzzleKind, word: string): { exactly: string; before?: string } {
  if (kind === "gomojiKana") return { exactly: toKatakana(word), before: `${toKatakana(word)}|` };
  return { exactly: word.toUpperCase() };
}

/** A day's word as the page prints it: capitals, as the grid draws letters; kana as it is. */
export function shownWord(kind: PuzzleKind, word: string): string {
  return kind === "gomojiKana" ? word : word.toUpperCase();
}
