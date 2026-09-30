"use client";

import { decodePairGo, encodePairGo, pairPlayers } from "@/lib/gomoku/party/pairGo";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";

import { keptInBrowser } from "./keptInBrowser";
import { PAIR_GO_STORAGE_KEY } from "./pairGo.constants";
import { GAME_STATUS, RULE_VARIANTS, STONES } from "@/lib/gomoku/gomoku.constants";
import { tableRecord } from "./keptRules";

/**
 * THE PAIR GO GAME KEPT IN THIS BROWSER: one at a time, as its board size,
 * its four names and its moves (`encodePairGo`), under a key of its own.
 *
 * Its own key rather than the practice board's (`gameStorage.ts`), so a
 * table's game and a board for two can both be going in one browser, and
 * neither ever opens as the other: the board for two is read exactly as it
 * always was, and a kept one still opens.
 */
const kept = keptInBrowser<PairGoGame>(
  PAIR_GO_STORAGE_KEY,
  encodePairGo,
  decodePairGo,
  // The four in the order their first turns come; the winning team is both of its players, a resigned team's opponents.
  tableRecord<PairGoGame>(RULE_VARIANTS.go, {
    over: (game) => game.resigned !== null || game.state.status !== GAME_STATUS.playing,
    winners: (game) => {
      const winner = game.resigned !== null ? (game.resigned === STONES.black ? STONES.white : STONES.black) : game.state.status === GAME_STATUS.won ? game.state.winner : null;
      return winner === null ? [] : pairPlayers(game).filter((player) => player.stone === winner).map((player) => player.turnOrder);
    },
    names: (game) => pairPlayers(game).map((player) => player.name),
  }),
);

/** Write a game down, or forget the kept one; everybody reading it hears. */
export const keepPairGo = kept.keep;

/** The kept game (`undefined` until the browser has been asked, null when none) and the way to keep another. */
export const useKeptPairGo = kept.useKept;
export const adoptKeptPairGo = kept.adopt;
