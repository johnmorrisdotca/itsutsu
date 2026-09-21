"use client";

import { Button } from "@/components/ui/Controls";
import { LIVE_MOVE_COPY } from "./live.constants";
import { NUDGE_DIRECTIONS, type NudgeDirection } from "./nudgeMove";

/**
 * SUBMIT, OR START THE MOVE OVER.
 *
 * Shown only while a move is sitting on the board unsent. The stone is already
 * drawn where it would go — by the engine, so a capture or a win shows as it
 * really would — and these are the things left to do about it.
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
 *
 * AND, ON A BOARD WHOSE POINTS ARE SMALLER THAN A FINGER, where the stone went
 * and four arrows to move it. A 19×19 go board on a phone has 17.6-pixel
 * cells; the board cannot be made bigger, so the miss is made cheap instead.
 * See `nudgeMove.ts` for which boards get them and why the hexagon boards do
 * not. The arrows are the one place on this row a target is sized for a thumb.
 */
export function PendingMoveControls({
  onSubmit,
  onStartOver,
  onNudge,
  nudges,
  placedAt,
  sending,
  where,
}: {
  onSubmit: () => void;
  onStartOver: () => void;
  /** Move the placed stone one point, on the boards that take arrows. */
  onNudge?: (direction: NudgeDirection) => void;
  /** The directions that lead to a legal move — every other arrow is disabled, not refused. */
  nudges?: ReadonlySet<NudgeDirection>;
  /** The point the stone is on, in the game's own notation, or null where a turn has no single point. */
  placedAt?: string | null;
  sending: boolean;
  /** Where Submit will leave them, so the button says where rather than surprising them. */
  where: string;
}) {
  const arrows = onNudge !== undefined && nudges !== undefined && nudges.size > 0;
  return (
    <div className="flex flex-col gap-2" data-testid="pending-move">
      {/*
        Where it went and how to move it, above the send — the order somebody
        reads them in, since checking comes before sending.
      */}
      {placedAt !== null && placedAt !== undefined ? (
        <p className="text-xs text-muted" data-testid="pending-move-where">
          {LIVE_MOVE_COPY.placedAt(placedAt)}
        </p>
      ) : null}
      {arrows ? (
        <div className="flex items-center gap-1.5" data-testid="pending-move-nudge">
          <span className="sr-only">{LIVE_MOVE_COPY.nudge.label}</span>
          {NUDGE_DIRECTIONS.map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => onNudge(direction)}
              /*
                Disabled rather than missing, so the row does not reflow under
                a thumb between one press and the next — a button that moves
                while being aimed at is the fault this is here to fix.
              */
              disabled={sending || !nudges.has(direction)}
              className="flex size-11 items-center justify-center rounded-lg border border-rule-strong/80 bg-ivory/80 text-base text-ink transition-colors hover:bg-rule/60 disabled:cursor-not-allowed disabled:opacity-35"
              data-testid={`pending-move-${direction}`}
              aria-label={LIVE_MOVE_COPY.nudge[direction]}
              title={LIVE_MOVE_COPY.nudge[direction]}
            >
              {ARROW[direction]}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
}

/** The glyph on each arrow. Text, not an icon set: four characters against a font nobody has to load. */
const ARROW: Record<NudgeDirection, string> = {
  up: "↑",
  left: "←",
  right: "→",
  down: "↓",
};
