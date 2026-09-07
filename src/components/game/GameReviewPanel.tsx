"use client";

import { useMemo } from "react";

import { reviewAcrossVariants, type ReviewNote } from "@/lib/gomoku/review";
import { pointName } from "@/lib/gomoku/notation";
import { GAME_STATUS, SEAT_DISPLAY, STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import {
  FORBIDDEN_PATTERN_DISPLAY,
  RULE_VARIANT_DISPLAY,
} from "@/lib/gomoku/variants.constants";
import type { GameState, Seat, Stone } from "@/lib/gomoku/gomoku.types";
import { SectionTitle } from "@/components/ui/Controls";
import { GAME_COPY } from "./game.constants";
import type { GameSession } from "./game.types";

/** Consecutive wins per seat, as the record knows them; null while unknown. */
export type WinStreaks = Record<Seat, number | null>;

function describe(note: ReviewNote, state: GameState): string {
  const variant = RULE_VARIANT_DISPLAY[note.variant].label;
  const colour = STONE_DISPLAY[note.stone].label;
  const move = state.moves[note.moveNumber - 1];
  const where = `${note.moveNumber} (${pointName(state.settings.size, move)})`;

  switch (note.kind) {
    case "forbiddenElsewhere": {
      const shape =
        note.pattern === null
          ? ""
          : `${FORBIDDEN_PATTERN_DISPLAY[note.pattern].label} ${FORBIDDEN_PATTERN_DISPLAY[note.pattern].kanji}`;
      return GAME_COPY.reviewForbidden(where, colour, variant, shape);
    }
    case "wouldNotWin":
      return GAME_COPY.reviewWouldNotWin(colour, variant);
    case "earlierWin":
      return GAME_COPY.reviewEarlierWin(where, colour, variant);
    case "captureElsewhere":
      return GAME_COPY.reviewCapture(where, colour, variant);
  }
}

/**
 * The post-game review (感想戦): what would have happened under other rules,
 * whether the winner gave the game away on the way, and where this result sits
 * in the record. Everything here is read from the engine and the analysis
 * already done; nothing is decided.
 */
export function GameReviewPanel({
  session,
  streaks,
}: {
  session: GameSession;
  streaks: WinStreaks;
}) {
  const { state, names, fatalMoves } = session;
  const finished = state.status !== GAME_STATUS.playing;
  const notes = useMemo(() => (finished ? reviewAcrossVariants(state) : []), [finished, state]);

  const nameFor = (stone: Stone) => {
    const seat = state.seats[stone];
    return names[seat].trim() || SEAT_DISPLAY[seat].label;
  };

  const winner = state.winner;
  const recovered =
    winner === null ? 0 : fatalMoves.filter((move) => move.stone === winner).length;
  const streak = winner === null ? null : streaks[state.seats[winner]];

  return (
    <section className="flex flex-col gap-3" data-testid="review-panel">
      <SectionTitle kanji={GAME_COPY.review.kanji}>{GAME_COPY.review.label}</SectionTitle>

      {!finished ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{GAME_COPY.reviewEmpty}</p>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          {winner !== null ? (
            <ul className="flex flex-col gap-1 text-zinc-700 dark:text-zinc-200">
              <li>
                {recovered > 0
                  ? GAME_COPY.reviewRecovered(nameFor(winner), recovered)
                  : GAME_COPY.reviewClean(nameFor(winner))}
              </li>
              {streak !== null ? (
                <li data-testid="review-streak">
                  {streak > 1
                    ? GAME_COPY.reviewStreak(nameFor(winner), streak)
                    : GAME_COPY.reviewFirstWin(nameFor(winner))}
                </li>
              ) : null}
            </ul>
          ) : null}

          {notes.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400">
                {GAME_COPY.reviewOtherRules}
              </p>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-snug text-zinc-700 dark:text-zinc-300">
                {notes.map((note) => (
                  <li key={`${note.variant}-${note.moveNumber}`} data-testid="review-note">
                    {describe(note, state)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
