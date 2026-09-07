"use client";

import { pointName } from "@/lib/gomoku/notation";
import { Button } from "@/components/ui/Controls";
import { TONE_CLASS } from "@/components/ui/ui.constants";
import { GAME_COPY } from "./game.constants";
import type { GamePanelProps } from "./game.types";

/**
 * Shown while an earlier position is on the board.
 *
 * Without it, a board that quietly refuses stones looks broken rather than
 * read only — so it says which move is being looked at and offers the way back.
 */
export function ReviewBanner({ session, actions }: GamePanelProps) {
  if (!session.reviewing) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 ${TONE_CLASS.calm}`}
      role="status"
      data-testid="review-banner"
    >
      <span className="font-mincho text-lg leading-none" aria-hidden="true">
        {GAME_COPY.reviewing.kanji}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">
          {GAME_COPY.reviewing.label} — move {session.moveIndex} of{" "}
          {session.moveTotal}
        </span>
        <span className="text-xs opacity-85">
          {session.boardReadOnly
            ? GAME_COPY.reviewingDetail
            : `${GAME_COPY.reviewingDetail} Playing here starts a new line.`}
        </span>
      </span>
      <span className="ml-auto">
        <Button onClick={actions.returnToLatest} data-testid="return-to-latest">
          {GAME_COPY.returnToLatest.label}
        </Button>
      </span>
    </div>
  );
}

/**
 * The confirmation before a branch throws moves away.
 *
 * It names the intersection and the exact number of moves that would be lost,
 * because "are you sure?" without a number is not a decision anyone can make.
 */
export function BranchPrompt({ session, actions }: GamePanelProps) {
  const { pendingBranch, branchDiscards, state } = session;
  if (pendingBranch === null) return null;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border px-3 py-2.5 ${TONE_CLASS.warn}`}
      role="alertdialog"
      aria-label={GAME_COPY.branchTitle}
      data-testid="branch-prompt"
    >
      <p className="text-sm font-semibold">{GAME_COPY.branchTitle}</p>
      <p className="text-xs leading-snug">
        Playing{" "}
        <span className="font-mono font-semibold">
          {pointName(state.settings.size, pendingBranch)}
        </span>{" "}
        from here discards the {branchDiscards} move
        {branchDiscards === 1 ? "" : "s"} that came after this position. This
        cannot be undone.
      </p>
      <div className="flex gap-2">
        <Button onClick={actions.confirmBranch} strong data-testid="confirm-branch">
          {GAME_COPY.branchConfirm.label}
        </Button>
        <Button onClick={actions.cancelBranch}>
          {GAME_COPY.branchCancel.label}
        </Button>
      </div>
    </div>
  );
}
