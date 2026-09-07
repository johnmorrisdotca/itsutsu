import {
  LAST_MOVE_DOT_CLASS,
  STONE_CLASS,
  WINNING_RING_CLASS,
} from "./Board.constants";
import type { StoneMarkProps } from "./board.types";

/**
 * A stone filling ~86% of its container. The container decides the size, so
 * the same component draws board stones and the small status indicator.
 */
export function StoneMark({
  stone,
  isLast = false,
  isWinning = false,
  ghost = false,
}: StoneMarkProps) {
  const classes = [
    "relative flex h-[86%] w-[86%] items-center justify-center rounded-full",
    STONE_CLASS[stone],
    ghost
      ? "opacity-0 transition-opacity group-hover:opacity-50 group-focus-visible:opacity-50"
      : "shadow-[1px_1px_2px_rgba(0,0,0,0.45)]",
    isWinning ? WINNING_RING_CLASS : "",
  ].join(" ");

  return (
    <span className={classes} aria-hidden="true">
      {isLast ? (
        <span
          className={`block h-[28%] w-[28%] rounded-full ${LAST_MOVE_DOT_CLASS[stone]}`}
        />
      ) : null}
    </span>
  );
}
