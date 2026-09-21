"use client";

import { Button } from "@/components/ui/Controls";
import { LIVE_MOVE_COPY } from "./live.constants";

/**
 * SUBMIT, OR START THE MOVE OVER.
 *
 * Shown only while a move is sitting on the board unsent. The stone is already
 * drawn where it would go — by the engine, so a capture or a win shows as it
 * really would — and these are the two things left to do about it.
 *
 * TWO BUTTONS, NOT FIVE. ItsYourTurn's row is Submit, Submit then go to game
 * status, Submit then next ladder game, next tournament game, next
 * non-tournament game; GoldToken's is four. That is one job wearing five
 * controls, and it puts the choice in front of a player on every single move
 * of every single game. Where Submit takes you is a thing somebody decides
 * ONCE, so it lives in the settings (`afterMove`) and the button says where it
 * is going — "Submit and go to the next Pente", "Submit and go to my games" —
 * rather than asking again every turn.
 *
 * Start over is destructive of nothing: the move has not been sent, so this
 * clears a local choice rather than taking anything back. It says "Start this
 * move over", which is ItsYourTurn's wording and is plainer than Undo, which
 * would suggest something had happened.
 */
export function PendingMoveControls({
  onSubmit,
  onStartOver,
  sending,
  where,
}: {
  onSubmit: () => void;
  onStartOver: () => void;
  sending: boolean;
  /** Where Submit will leave them, so the button says so rather than surprising them. */
  where: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="pending-move">
      <Button onClick={onSubmit} disabled={sending} data-testid="pending-move-submit">
        {where}
      </Button>
      <button
        type="button"
        onClick={onStartOver}
        disabled={sending}
        className="text-xs text-muted underline underline-offset-4 disabled:opacity-50"
        data-testid="pending-move-start-over"
      >
        {LIVE_MOVE_COPY.startOver}
      </button>
    </div>
  );
}
