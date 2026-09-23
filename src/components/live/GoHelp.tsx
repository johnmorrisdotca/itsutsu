import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { pointName } from "@/lib/gomoku/notation";
import type { GameState, Stone } from "@/lib/gomoku/gomoku.types";

import { GO_HELP_COPY } from "./live.constants";
import { colourName, goRisk, groupsInAtari, isGo, otherName, theyJustPassed } from "./goReading";
import type { PendingMove } from "./pendingMove";

/**
 * GO, SAID OUT LOUD FOR SOMEBODY LEARNING IT, under the board.
 *
 * Three things the rules already know and the board did not say — see
 * `goHelp.ts` for the game that asked for them: that the other side has
 * passed and the game can end, which groups are one stone from being taken,
 * and, for a stone not yet sent, that it fills the player's own eye or leaves
 * their group in atari. Nothing here for a watcher's turn beyond the groups in
 * danger, and nothing at all for any game but Go.
 */
export function GoHelp({
  state,
  seat,
  pending,
}: {
  state: GameState;
  seat: Stone | null;
  pending: PendingMove | null;
}) {
  if (!isGo(state)) return null;
  const copy = GO_HELP_COPY;
  const risk = pending === null ? null : goRisk(state, pending.turn, pending.after);
  const placed =
    pending !== null && pending.turn.kind === "place"
      ? pointName(state.settings.size, { row: pending.turn.row, col: pending.turn.col })
      : "";
  const atari = groupsInAtari(pending?.after ?? state, seat);
  const passed = theyJustPassed(state, seat);

  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2 text-sm`} data-testid="go-help">
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {copy.title} <span className="font-mincho normal-case tracking-normal">{copy.kanji}</span>
      </h2>
      {risk !== null ? (
        <p className="font-medium text-shu" role="alert" data-testid="go-help-risk" data-risk={risk}>
          {risk === "fillsOwnEye" ? copy.fillsOwnEye(placed) : copy.selfAtari(placed)}
        </p>
      ) : null}
      {passed && seat !== null ? (
        <p className="font-medium" data-testid="go-help-passed">
          {copy.passed(otherName(seat))}
        </p>
      ) : null}
      {atari.map((group) => (
        <p key={`${group.stone}-${group.at}`} data-testid="go-help-atari" data-mine={group.stone === seat}>
          {group.stone === seat
            ? copy.atariMine(group.at, group.lastLiberty, group.stones)
            : copy.atariTheirs(colourName(group.stone), group.at, group.lastLiberty, group.stones)}
        </p>
      ))}
      <p className="text-xs text-muted">{copy.howToWin}</p>
    </div>
  );
}
