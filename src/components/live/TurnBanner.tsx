"use client";

import { discCount } from "@/lib/gomoku/engine";
import { STONE_DISPLAY, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { replayGame } from "@/lib/gomoku/replay";
import { TONE_CLASS } from "@/components/ui/ui.constants";

/**
 * The one line above the board that says where the game stands: your move,
 * their move, watching, or how it ended.
 *
 * Lifted out of SharedGame when that file went past the size gate. It is the
 * whole of how a result is put into words — every way a game here can end,
 * from a resignation to a full camp to a board nobody can move on — and that
 * is a job of its own, kept in one place so a new way to win has one place to
 * be described.
 */
export function TurnBanner({
  state,
  seat,
  yourTurn,
  finished,
  finishedAt = null,
}: {
  state: ReturnType<typeof replayGame>;
  seat: Stone | null;
  yourTurn: boolean;
  finished: boolean;
  /** When the last move landed, once the game is over; shown so nobody has to go to the record for it. */
  finishedAt?: string | null;
}) {
  if (finished) {
    const won = state.winner;
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${TONE_CLASS.great}`} data-testid="turn-banner">
        {won === null
          ? "Draw. The board is full."
          : state.winBy === WIN_REASONS.resign
            ? `${STONE_DISPLAY[won].label} wins by resignation.`
            : state.winBy === null
              ? `${STONE_DISPLAY[won].label} wins. The game is over.`
            : state.winBy === WIN_REASONS.count
              ? `${STONE_DISPLAY[won].label} wins on discs, ${discCount(state.board).black} to ${discCount(state.board).white}.`
              : state.winBy === WIN_REASONS.camp
                ? `${STONE_DISPLAY[won].label} wins: the far camp is full.`
                : state.winBy === WIN_REASONS.connection
                  ? `${STONE_DISPLAY[won].label} wins: their two sides are joined.`
                : state.winBy === WIN_REASONS.blocked
                  ? `${STONE_DISPLAY[won].label} wins: the other side has no move left.`
                : `${STONE_DISPLAY[won].label} wins in ${state.moves.length} moves.`}
        {finishedAt !== null ? (
          <span className="block text-xs font-normal opacity-80" data-testid="finished-at">
            Finished {new Date(finishedAt).toLocaleString()}
          </span>
        ) : null}
      </p>
    );
  }

  if (seat === null) {
    return (
      <p className={`rounded-xl border px-3 py-2.5 text-sm ${TONE_CLASS.calm}`}>
        You are watching. {STONE_DISPLAY[state.toPlay].label} to play.
      </p>
    );
  }

  return (
    <p
      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
        yourTurn ? TONE_CLASS.good : TONE_CLASS.calm
      }`}
      data-testid="turn-banner"
    >
      {yourTurn
        ? `Your move — you are ${STONE_DISPLAY[seat].label}.`
        : `Waiting for ${STONE_DISPLAY[state.toPlay].label}…`}
    </p>
  );
}
