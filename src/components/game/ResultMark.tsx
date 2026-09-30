import { RESULT_MARK_LOOK } from "./resultMark.constants";
import type { ResultMarkProps } from "./resultMark.types";

/**
 * HOW ONE GAME ENDED, AT A GLANCE: a tick for a win or a solve, a cross for a
 * loss, a give-up or a clock run out, a bar for a draw or a game nobody
 * finished. John, 2026-09-29: "let's show a checkmark for success/win/ an
 * appropriate icon for loss/fail/quit any other icon for othe rste?
 * incomlete/abanoned/something? if we need a third state I'm ok with it".
 *
 * Beside the words, never instead of them: the mark is hidden from a screen
 * reader, which reads the words it stands beside. Drawn in SVG with no text,
 * so it is the same on every browser, one line of text tall.
 *
 * Only ever for ONE game's result. A count of wins and losses stays a number
 * that leads to the games it counted ("Nothing Is A Dead End", AGENTS.md).
 */
export function ResultMark({ kind, className = "" }: ResultMarkProps) {
  const look = RESULT_MARK_LOOK[kind];
  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block h-[1.1em] w-[1.1em] shrink-0 align-[-0.2em] ${look.colour} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-testid="result-mark"
      data-mark={look.name}
    >
      <circle cx="12" cy="12" r="10" strokeWidth={1.6} />
      <path d={look.path} />
    </svg>
  );
}
