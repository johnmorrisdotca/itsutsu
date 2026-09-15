/**
 * GENERATED: how the graded computer players actually did against each other, per game.
 *
 * Written by `ladder.match.test.ts` with LADDER_WRITE=1; never edit a row by hand.
 * Every row carries the fingerprint of the files that decide a grade's play
 * (`LADDER_FINGERPRINT_FILES`), and `measuredLadder` answers nothing for a row
 * whose fingerprint is not the current code's. A stale measurement is not shown,
 * and it does not fail the build either: silence, not a guess.
 *
 * To measure again, on your own CPU, writing only this file:
 *
 *   BOT_LADDER=1 LADDER_WRITE=1 LADDER_BOARDS=reversi:8,checkers:8 LADDER_GAMES=20 LADDER_NODES=4000 pnpm exec vitest run src/lib/gomoku/ladder.match.test.ts --disable-console-intercept
 */
import type { LadderStrengthTable } from "./ladderStrength.types";

export const LADDER_STRENGTH: LadderStrengthTable = {
  "checkers": {
    "variant": "checkers",
    "size": 8,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-15",
    "fingerprint": "df36f699f0fd6e79",
    "tiers": [
      "razryad",
      "kyu",
      "dan",
      "meijin",
      "guoshou"
    ],
    "pairings": [
      {
        "first": "razryad",
        "second": "kyu",
        "wins": 8,
        "losses": 12,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 6,
        "losses": 12,
        "draws": 2
      },
      {
        "first": "razryad",
        "second": "meijin",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "guoshou",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "dan",
        "wins": 7,
        "losses": 12,
        "draws": 1
      },
      {
        "first": "kyu",
        "second": "meijin",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "guoshou",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "meijin",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 5,
        "losses": 7,
        "draws": 8
      }
    ]
  },
  "reversi": {
    "variant": "reversi",
    "size": 8,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-15",
    "fingerprint": "df36f699f0fd6e79",
    "tiers": [
      "razryad",
      "kyu",
      "dan",
      "meijin",
      "guoshou"
    ],
    "pairings": [
      {
        "first": "razryad",
        "second": "kyu",
        "wins": 7,
        "losses": 13,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 9,
        "losses": 11,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "meijin",
        "wins": 1,
        "losses": 19,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "guoshou",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "dan",
        "wins": 2,
        "losses": 17,
        "draws": 1
      },
      {
        "first": "kyu",
        "second": "meijin",
        "wins": 1,
        "losses": 19,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "guoshou",
        "wins": 1,
        "losses": 19,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "meijin",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 9,
        "losses": 8,
        "draws": 3
      }
    ]
  }
};
