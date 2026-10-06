"use client";

import { useMemo } from "react";

import { reviewAcrossVariants, type ReviewNote } from "@/lib/gomoku/review";
import { pointName } from "@/lib/gomoku/notation";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { pairedText, seatName, stoneName } from "@/lib/gomoku/seatWords";
import { variantName } from "@/lib/gomoku/variantCopy";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";
import { FORBIDDEN_PATTERN_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { GameState, Seat, Stone } from "@/lib/gomoku/gomoku.types";
import { SectionTitle } from "@/components/ui/Controls";
import { gameCopy } from "./game.constants";
import type { GameSession } from "./game.types";

/** Consecutive wins per seat, as the record knows them; null while unknown. */
export type WinStreaks = Record<Seat, number | null>;

function describe(note: ReviewNote, state: GameState, say: Speaker): string {
  const GAME_COPY = gameCopy(say);
  const variant = variantName(note.variant, say);
  const colour = stoneName(say, note.stone);
  const move = state.moves[note.moveNumber - 1];
  const where = `${note.moveNumber} (${pointName(state.settings.size, move)})`;

  switch (note.kind) {
    case "forbiddenElsewhere": {
      const shape =
        note.pattern === null
          ? ""
          : pairedText(say, FORBIDDEN_PATTERN_DISPLAY[note.pattern].label, FORBIDDEN_PATTERN_DISPLAY[note.pattern].kanji);
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
  const say = useSpeaker();
  const GAME_COPY = gameCopy(say);
  const { state, names, fatalMoves } = session;
  const finished = state.status !== GAME_STATUS.playing;
  const notes = useMemo(() => (finished ? reviewAcrossVariants(state) : []), [finished, state]);

  const nameFor = (stone: Stone) => {
    const seat = state.seats[stone];
    return names[seat].trim() || seatName(say, seat);
  };

  const winner = state.winner;
  const recovered =
    winner === null ? 0 : fatalMoves.filter((move) => move.stone === winner).length;
  const streak = winner === null ? null : streaks[state.seats[winner]];

  return (
    <section className="flex flex-col gap-3" data-testid="review-panel">
      <SectionTitle kanji={GAME_COPY.review.kanji}>{GAME_COPY.review.label}</SectionTitle>

      {!finished ? (
        <p className="text-xs text-muted">{GAME_COPY.reviewEmpty}</p>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          {winner !== null ? (
            <ul className="flex flex-col gap-1 text-ink-soft">
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
              <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
                {GAME_COPY.reviewOtherRules}
              </p>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-xs leading-snug text-ink-soft">
                {notes.map((note) => (
                  <li key={`${note.variant}-${note.moveNumber}`} data-testid="review-note">
                    {describe(note, state, say)}
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
