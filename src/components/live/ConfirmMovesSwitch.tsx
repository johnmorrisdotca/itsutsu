"use client";

import { MOVE_CONFIRM, type MoveConfirm } from "@/lib/preferences/turnFlow";

/**
 * WHETHER A MOVE AGAINST THE COMPUTER WAITS FOR SUBMIT, SWITCHED ON THE BOARD.
 *
 * John, 2026-09-22, playing a computer: "if they are confident and don't want
 * the security of submitting a move and instead wanted it automatically
 * submitted on click then they should be allowed to go back to that model …
 * some users might want a real time experience."
 *
 * On the board rather than only in the settings, because the moment somebody
 * wants it is the moment they are playing, and a switch three pages away is one
 * they never learn exists. Drawn only in a game against a program, where the
 * setting it changes (`moveConfirmComputer`) is the one that applies: against a
 * person, where the record is final and the game is days long, confirming stays
 * whatever the account's own `moveConfirm` says.
 *
 * The board obeys at once; the account is told with one request, so the choice
 * holds on the next game and the next device. A visitor with no account keeps
 * it for the page.
 */
export function ConfirmMovesSwitch({
  value,
  onChange,
}: {
  value: MoveConfirm;
  onChange: (next: MoveConfirm) => void;
}) {
  const confirming = value === MOVE_CONFIRM.preview;
  return (
    <label className="flex items-center gap-2 self-end text-xs text-muted" data-testid="confirm-moves-switch">
      <input
        type="checkbox"
        checked={confirming}
        onChange={(event) => onChange(event.target.checked ? MOVE_CONFIRM.preview : MOVE_CONFIRM.straightAway)}
        className="size-4 accent-ink"
        data-testid="confirm-moves"
      />
      <span>Confirm each move before it is sent</span>
    </label>
  );
}
