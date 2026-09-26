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
  "blockFive": {
    "variant": "blockFive",
    "size": 13,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-26",
    "fingerprint": "902f8788326026fe",
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
        "wins": 5,
        "losses": 15,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 0,
        "losses": 20,
        "draws": 0
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
        "wins": 2,
        "losses": 18,
        "draws": 0
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
        "wins": 5,
        "losses": 15,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 4,
        "losses": 16,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 6,
        "losses": 14,
        "draws": 0
      }
    ]
  },
  "checkers": {
    "variant": "checkers",
    "size": 8,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-26",
    "fingerprint": "902f8788326026fe",
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
        "wins": 3,
        "losses": 6,
        "draws": 11
      }
    ]
  },
  "chineseCheckers": {
    "variant": "chineseCheckers",
    "size": 17,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-26",
    "fingerprint": "902f8788326026fe",
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
        "wins": 3,
        "losses": 17,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 1,
        "losses": 19,
        "draws": 0
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
        "wins": 0,
        "losses": 20,
        "draws": 0
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
        "wins": 4,
        "losses": 16,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 4,
        "losses": 16,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 11,
        "losses": 9,
        "draws": 0
      }
    ]
  },
  "dominoFive": {
    "variant": "dominoFive",
    "size": 13,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-26",
    "fingerprint": "902f8788326026fe",
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
        "wins": 14,
        "losses": 6,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 6,
        "losses": 14,
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
        "wins": 8,
        "losses": 12,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "meijin",
        "wins": 4,
        "losses": 16,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "guoshou",
        "wins": 5,
        "losses": 15,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "meijin",
        "wins": 11,
        "losses": 9,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 7,
        "losses": 13,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 11,
        "losses": 9,
        "draws": 0
      }
    ]
  },
  "dropFour": {
    "variant": "dropFour",
    "size": 7,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-26",
    "fingerprint": "902f8788326026fe",
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
        "wins": 10,
        "losses": 10,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 1,
        "losses": 19,
        "draws": 0
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
        "wins": 1,
        "losses": 19,
        "draws": 0
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
        "wins": 1,
        "losses": 19,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "meijin",
        "wins": 2,
        "losses": 17,
        "draws": 1
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 5,
        "losses": 14,
        "draws": 1
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 9,
        "losses": 11,
        "draws": 0
      }
    ]
  },
  "freestyle": {
    "variant": "freestyle",
    "size": 15,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-26",
    "fingerprint": "902f8788326026fe",
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
        "wins": 6,
        "losses": 14,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 1,
        "losses": 19,
        "draws": 0
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
        "wins": 1,
        "losses": 19,
        "draws": 0
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
        "losses": 18,
        "draws": 2
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 10,
        "losses": 10,
        "draws": 0
      }
    ]
  },
  "go": {
    "variant": "go",
    "size": 9,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-26",
    "fingerprint": "902f8788326026fe",
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
        "wins": 4,
        "losses": 16,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 6,
        "losses": 14,
        "draws": 0
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
        "wins": 4,
        "losses": 16,
        "draws": 0
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
        "wins": 9,
        "losses": 11,
        "draws": 0
      }
    ]
  },
  "halma": {
    "variant": "halma",
    "size": 8,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-23",
    "fingerprint": "be8722767ed5dd80",
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
        "wins": 0,
        "losses": 20,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 0,
        "losses": 20,
        "draws": 0
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
        "wins": 2,
        "losses": 18,
        "draws": 0
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
        "wins": 7,
        "losses": 13,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 7,
        "losses": 13,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 8,
        "losses": 5,
        "draws": 7
      }
    ]
  },
  "hex": {
    "variant": "hex",
    "size": 11,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-23",
    "fingerprint": "be8722767ed5dd80",
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
        "wins": 12,
        "losses": 8,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 10,
        "losses": 10,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "meijin",
        "wins": 3,
        "losses": 17,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "guoshou",
        "wins": 3,
        "losses": 17,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "dan",
        "wins": 10,
        "losses": 10,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "meijin",
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "guoshou",
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "meijin",
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 10,
        "losses": 10,
        "draws": 0
      }
    ]
  },
  "ninuki": {
    "variant": "ninuki",
    "size": 15,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-23",
    "fingerprint": "be8722767ed5dd80",
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
        "wins": 9,
        "losses": 11,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 0,
        "losses": 20,
        "draws": 0
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
        "wins": 1,
        "losses": 19,
        "draws": 0
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
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 11,
        "losses": 9,
        "draws": 0
      }
    ]
  },
  "reversi": {
    "variant": "reversi",
    "size": 8,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-23",
    "fingerprint": "be8722767ed5dd80",
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
        "wins": 2,
        "losses": 17,
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
        "wins": 7,
        "losses": 13,
        "draws": 0
      }
    ]
  },
  "tictactoe": {
    "variant": "tictactoe",
    "size": 3,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-23",
    "fingerprint": "be8722767ed5dd80",
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
        "wins": 6,
        "losses": 9,
        "draws": 5
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 3,
        "losses": 10,
        "draws": 7
      },
      {
        "first": "razryad",
        "second": "meijin",
        "wins": 0,
        "losses": 9,
        "draws": 11
      },
      {
        "first": "razryad",
        "second": "guoshou",
        "wins": 0,
        "losses": 9,
        "draws": 11
      },
      {
        "first": "kyu",
        "second": "dan",
        "wins": 3,
        "losses": 8,
        "draws": 9
      },
      {
        "first": "kyu",
        "second": "meijin",
        "wins": 0,
        "losses": 9,
        "draws": 11
      },
      {
        "first": "kyu",
        "second": "guoshou",
        "wins": 0,
        "losses": 9,
        "draws": 11
      },
      {
        "first": "dan",
        "second": "meijin",
        "wins": 0,
        "losses": 7,
        "draws": 13
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 0,
        "losses": 7,
        "draws": 13
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 0,
        "losses": 0,
        "draws": 20
      }
    ]
  },
  "toroidalFive": {
    "variant": "toroidalFive",
    "size": 9,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-23",
    "fingerprint": "be8722767ed5dd80",
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
        "wins": 4,
        "losses": 16,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 0,
        "losses": 20,
        "draws": 0
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
        "wins": 1,
        "losses": 19,
        "draws": 0
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
        "wins": 3,
        "losses": 17,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 11,
        "losses": 9,
        "draws": 0
      }
    ]
  },
  "twistFive": {
    "variant": "twistFive",
    "size": 6,
    "gamesPerPairing": 20,
    "nodesPerMove": 4000,
    "measuredOn": "2026-09-23",
    "fingerprint": "be8722767ed5dd80",
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
        "wins": 5,
        "losses": 15,
        "draws": 0
      },
      {
        "first": "razryad",
        "second": "dan",
        "wins": 0,
        "losses": 20,
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
        "wins": 1,
        "losses": 19,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "dan",
        "wins": 3,
        "losses": 17,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "meijin",
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "kyu",
        "second": "guoshou",
        "wins": 2,
        "losses": 18,
        "draws": 0
      },
      {
        "first": "dan",
        "second": "meijin",
        "wins": 7,
        "losses": 9,
        "draws": 4
      },
      {
        "first": "dan",
        "second": "guoshou",
        "wins": 7,
        "losses": 9,
        "draws": 4
      },
      {
        "first": "meijin",
        "second": "guoshou",
        "wins": 6,
        "losses": 14,
        "draws": 0
      }
    ]
  }
};
