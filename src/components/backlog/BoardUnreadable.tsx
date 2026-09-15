import { TONE_CLASS } from "@/components/ui/ui.constants";

import type { BoardUnreadableProps } from "./backlogBoard.types";

/**
 * What the board says when Sumilabu could not be read: an alert, never an
 * empty board. "Nothing here" and "nothing could be read" are different facts,
 * and a page that drew the second as the first would tell the operator that
 * nothing is wanted.
 */
export function BoardUnreadable({ problem }: BoardUnreadableProps) {
  return (
    <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.alarm}`} role="alert" data-testid="backlog-unreadable">
      The board could not be read from Sumilabu just now, so none of it is shown. {problem}
    </p>
  );
}
