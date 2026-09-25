"use client";

import { useSyncExternalStore } from "react";

import type { Appearance, Felt } from "@/components/board/board.types";
import { readTurned, subscribeTurned, turnedFor } from "@/components/board/turned";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import type { GameSettings, Stone } from "@/lib/gomoku/gomoku.types";
import { boardStartsFlipped } from "@/lib/gomoku/orientation";

/**
 * HOW THIS READER'S BOARD OF A LIVE GAME IS DRESSED: which way up, and the
 * colour of a Reversi board's felt. Neither reaches the game or the other seat.
 *
 * Which way up has three answers, in order of how particular they are: what
 * this person turned this game to (remembered in this browser, `turned.ts`),
 * then what they prefer everywhere, then — where they have said neither — their
 * own side of the board, nearest them. Unset means the account's standing
 * preference stands, so turning every board round in the settings still turns
 * the ones nobody has spoken about.
 *
 * The felt is the account's (`Appearance.felt`), changed by a press on its
 * patches (`useFeltChoice`, as on the set-up screen). Nothing is sent while a
 * game is merely being played.
 */
export function useSharedBoard(
  gameId: string,
  appearance: Appearance,
  settings: GameSettings,
  seat: Stone | null,
): { board: Appearance; turned: boolean; chooseFelt: (felt: Felt) => void } {
  const override = useSyncExternalStore(
    subscribeTurned,
    () => readTurned(gameId),
    () => null,
  );
  const turned = turnedFor(override, appearance.flipped ?? boardStartsFlipped(settings, seat));
  const { felt, chooseFelt } = useFeltChoice(appearance);
  return { board: { ...appearance, flipped: turned, felt }, turned, chooseFelt };
}
