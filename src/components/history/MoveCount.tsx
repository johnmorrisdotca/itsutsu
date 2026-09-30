import { MOVE_COUNT_SIZERS } from "./replay.constants";
import type { MoveCountProps } from "./moveCount.types";

/**
 * "MOVE 123 OF 131", ON ONE LINE, IN ONE WIDTH. A replay's count sits beside
 * or above its scrubber, and it wrapped once the numbers were long — John,
 * 2026-09-29, at a Solitaire's replay: "bug: text wrapping for large numbers.
 * Move 123 of 131 but none for earlier on." It also grew as it went, so the
 * slider beside it narrowed while it was dragged.
 *
 * So the count never wraps, and from its first move it keeps the room its
 * longest wording takes: the last move's, or `start` (what move 0 is called,
 * "The deal"), whichever is wider — laid in the same grid cell, unseen, so the
 * box is exactly that wide in whatever font the reader has. The figures are
 * tabular, so the count does not shuffle as they change.
 */
export function MoveCount({ at, last, start, className = "", testId }: MoveCountProps) {
  const words = (move: number) => (move === 0 && start !== undefined ? start : `Move ${move} of ${last}`);
  // The widths are held by the box's ::before and ::after, which are grid items but not text: a reader, a screen
  // reader and a test reading the count all see only the move shown.
  return (
    <span
      className={`inline-grid whitespace-nowrap tabular-nums ${MOVE_COUNT_SIZERS} ${className}`}
      data-longest={words(last)}
      data-start={start ?? ""}
      data-testid={testId}
    >
      <span className="col-start-1 row-start-1">{words(at)}</span>
    </span>
  );
}
