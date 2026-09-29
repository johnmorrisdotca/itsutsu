"use client";

import { keptInBrowser } from "@/components/party/keptInBrowser";
import { playPath } from "@/lib/gomoku/slugs";
import { decodeTable, encodeTable } from "@/lib/puzzles/mahjong/table";
import type { MahjongTable } from "@/lib/puzzles/mahjong/table.types";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";

import { MAHJONG_TABLE_STORAGE_KEY } from "./mahjong.constants";

/**
 * THE GAME AT THE TABLE THIS BROWSER IS KEEPING: one at a time, as its deal,
 * its seats and its pairs (`encodeTable`), written after every pair. A table
 * round one device has no seat on the server, so it is kept here — leave half
 * way, come back, and it is where it was, waiting on My games and on the
 * set-up screen — and a finished one is let go. How it is kept, and why only
 * here, is `keptInBrowser.ts`.
 */
const kept = keptInBrowser<MahjongTable>(MAHJONG_TABLE_STORAGE_KEY, encodeTable, decodeTable);

/** The kept table (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptMahjongTable = kept.useKept;

/** The address a kept table is played at: its deal's size, level and seed, and how many sit at it. */
export function tableAddress(table: MahjongTable): string {
  return `${playPath("mahjong")}${puzzleQuery({ size: table.size, level: table.level, seed: table.seed, players: table.seats.length })}`;
}
