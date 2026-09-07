"use client";

import { useEffect, useRef, useState } from "react";

import { GAME_STATUS, SEATS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Seat } from "@/lib/gomoku/gomoku.types";
import type { GameHistoryPage } from "@/lib/history/gameHistory.types";
import { winStreak } from "@/lib/history/streaks";
import type { WinStreaks } from "./GameReviewPanel";
import type { GameSession } from "./game.types";

/** How far back the record is read when counting a run of wins. */
const STREAK_WINDOW = 25;

const NO_STREAKS: WinStreaks = { one: null, two: null };

/**
 * A seat's run of consecutive wins, read back from the record it was just
 * filed in. Anonymous seats have no record to read, so they stay unknown.
 */
async function fetchStreak(name: string): Promise<number | null> {
  if (name === "") return null;
  const query = new URLSearchParams({
    player: name,
    sortBy: "playedAt",
    sortDir: "desc",
    pageSize: String(STREAK_WINDOW),
  });
  const response = await fetch(`/api/games?${query}`);
  if (!response.ok) return null;
  const page = (await response.json()) as GameHistoryPage;
  return winStreak(page.items, name);
}

/**
 * Records a game to the history API the moment it finishes.
 *
 * A game is written once. The guard is the move list rather than a flag, so
 * taking a move back and playing on records the new ending too, while
 * re-rendering the same finished position does not write it twice.
 */
export function useGameRecording(session: GameSession): WinStreaks {
  const recorded = useRef(new Set<string>());
  /*
   * Streaks are remembered against the game they were read for, so a new game
   * or a rewound one reports nothing rather than the last game's run.
   */
  const [streaks, setStreaks] = useState<{ game: string; value: WinStreaks }>({
    game: "",
    value: NO_STREAKS,
  });
  const { state, names } = session;
  const signature = state.moves
    .map((move) => `${move.row},${move.col},${move.stone}`)
    .join("|");

  useEffect(() => {
    const finished =
      state.status === GAME_STATUS.won || state.status === GAME_STATUS.draw;
    if (!finished) return;

    if (recorded.current.has(signature)) return;
    recorded.current.add(signature);

    const nameFor = (stone: "black" | "white") => names[state.seats[stone]].trim();

    const body = {
      blackName: nameFor(STONES.black),
      whiteName: nameFor(STONES.white),
      size: state.settings.size,
      winLength: state.settings.winLength,
      variant: state.settings.variant,
      obstacles: state.settings.obstacles,
      opening: state.settings.opening,
      handicap: state.settings.handicap.stone === null ? null : state.settings.handicap,
      seed: state.settings.seed,
      opener: state.opener,
      result: state.winner ?? "draw",
      winner: state.winner,
      moves: state.moves.map((move) => ({
        row: move.row,
        col: move.col,
        stone: move.stone,
        kind: move.kind,
        from: move.from,
        twist: move.twist,
        cells: move.cells,
      })),
    };

    void fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("not recorded");
        const seatName = (seat: Seat) => names[seat].trim();
        const [one, two] = await Promise.all([
          fetchStreak(seatName(SEATS.one)),
          fetchStreak(seatName(SEATS.two)),
        ]);
        setStreaks({ game: signature, value: { one, two } });
      })
      .catch(() => {
        // A game that could not be filed is not a reason to interrupt play.
        recorded.current.delete(signature);
      });
  }, [names, signature, state]);

  return streaks.game === signature ? streaks.value : NO_STREAKS;
}
