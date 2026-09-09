import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import type { GameDetail, GameMove } from "@/lib/history/gameHistory.types";
import { findLegacyPlayer } from "./legacyPlayers.data";
import type { LegacyGame } from "./legacyPlayers.types";

/**
 * Games kept in full, not just a result — moves proven legal by replaying
 * them through the real engine before they went anywhere near a page. See
 * verifyKeptGame.test.ts, which pins this exact move list against the
 * engine so a future rule change cannot quietly make it illegal.
 */
export const LEGACY_GAMES: LegacyGame[] = [
  {
    id: "iyt-kyokosan-incognito-2005-01-07",
    variant: "freestyle",
    size: 13,
    playedAt: "2005-01-07 02:38",
    source: "ItsYourTurn.com",
    black: "kyokosan",
    white: "jmorris",
    winner: "white",
    moves: [
      { row: 6, col: 6 }, { row: 4, col: 6 }, { row: 5, col: 7 }, { row: 4, col: 8 },
      { row: 4, col: 7 }, { row: 3, col: 7 }, { row: 5, col: 5 }, { row: 5, col: 9 },
      { row: 2, col: 6 }, { row: 6, col: 10 }, { row: 7, col: 11 }, { row: 7, col: 7 },
      { row: 5, col: 8 }, { row: 6, col: 8 }, { row: 8, col: 6 }, { row: 4, col: 10 },
      { row: 3, col: 11 }, { row: 6, col: 9 }, { row: 5, col: 6 }, { row: 5, col: 4 },
      { row: 7, col: 6 }, { row: 9, col: 6 }, { row: 6, col: 5 }, { row: 6, col: 11 },
      { row: 6, col: 7 }, { row: 6, col: 12 },
    ],
  },
];

/** Games where this slug — or this live player key, once linked — sat at either colour. */
export function keptGamesFor(slug: string): LegacyGame[] {
  return LEGACY_GAMES.filter((game) => game.black === slug || game.white === slug);
}

/** The name a kept game shows for one of its slugs — the legacy record's own name, or the slug itself. */
export function keptGameName(slug: string): string {
  return findLegacyPlayer(slug)?.name ?? slug;
}

/** A kept game as the GameReplay board needs it — built from a fixed move list, not a database row. */
export function keptGameDetail(game: LegacyGame): GameDetail {
  // No per-move time was ever recorded for a kept game, only when it finished —
  // so every move carries that, the same honest choice as lastMoveAt below.
  const moves: GameMove[] = game.moves.map((point, index) => ({
    number: index + 1,
    row: point.row,
    col: point.col,
    createdAt: game.playedAt,
    stone: index % 2 === 0 ? "black" : "white",
    kind: "place",
  }));

  return {
    id: game.id,
    playedAt: game.playedAt,
    status: "finished",
    blackName: keptGameName(game.black),
    whiteName: keptGameName(game.white),
    size: game.size,
    winLength: 5,
    variant: game.variant,
    obstacles: "none",
    opener: "black",
    opening: "free",
    handicap: NO_HANDICAP,
    seed: 0,
    moveTimeMs: null,
    timeoutPenalty: "turn",
    lastMoveAt: game.playedAt,
    forfeits: { black: 0, white: 0 },
    allowResign: true,
    drawLimit: "none",
    clockMode: "move",
    blackTimeMs: null,
    whiteTimeMs: null,
    deadlineAt: null,
    extraMs: 0,
    rated: true,
    openSeat: null,
    blackMemberId: null,
    whiteMemberId: null,
    result: game.winner ?? "draw",
    winner: game.winner,
    moveCount: moves.length,
    durationMs: null,
    moves,
    reactions: [],
  };
}
