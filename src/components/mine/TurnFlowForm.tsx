"use client";

import { useId, useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Select } from "@/components/ui/Controls";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { AFTER_MOVE, MOVE_CONFIRM, type AfterMove, type MoveConfirm } from "@/lib/preferences/turnFlow";

/**
 * HOW A TURN WORKS: whether a click sends the move, and where Submit leaves you.
 *
 * Two questions somebody answers ONCE. The elder correspondence sites put
 * every destination on the board as its own button — ItsYourTurn has five,
 * GoldToken four — which asks the same question on every move of every game.
 * Deciding it here means the board carries one Submit that says where it is
 * going.
 *
 * KEPT ON THE ACCOUNT, so somebody who turned the preview off on their laptop
 * finds it off on their phone. A misclick is a property of the person's hands
 * and the medium, not of the browser they happen to be holding.
 */
export function TurnFlowForm({
  initial,
}: {
  initial: { moveConfirm: MoveConfirm; moveConfirmComputer: MoveConfirm; afterMove: AfterMove };
}) {
  const say = useSpeaker();
  const confirmHint = useId();
  const afterHint = useId();
  const computerHint = useId();
  const [fields, setFields] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(next: Partial<typeof fields>) {
    const merged = { ...fields, ...next };
    setFields(merged);
    setSaved(false);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: merged }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? say.say("mine.saveFailed"));
        return;
      }
      setSaved(true);
    } catch {
      setError(say.say("mine.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  /*
   * The hydration race every form on this page has: these are real selects
   * before React attaches, and a choice made in that window is lost with no
   * error to show for it. `ready(page, "turn-flow")` is how a spec waits.
   */
  return (
    <div className="flex flex-col gap-4" data-testid="turn-flow" {...readyMark(useHydrated())}>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{say.say("mine.tfMove")}</span>
        <Select
          value={fields.moveConfirm}
          aria-describedby={confirmHint}
          disabled={busy}
          onChange={(event) => void save({ moveConfirm: event.target.value as MoveConfirm })}
          data-testid="turn-flow-confirm"
        >
          <option value={MOVE_CONFIRM.preview}>{say.say("mine.tfPreview")}</option>
          <option value={MOVE_CONFIRM.straightAway}>{say.say("mine.tfStraight")}</option>
        </Select>
        <span id={confirmHint} className="text-xs text-muted">
          {say.say("mine.tfMoveNote")}
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{say.say("mine.tfBot")}</span>
        <Select
          value={fields.moveConfirmComputer}
          aria-describedby={computerHint}
          disabled={busy}
          onChange={(event) => void save({ moveConfirmComputer: event.target.value as MoveConfirm })}
          data-testid="turn-flow-confirm-computer"
        >
          <option value={MOVE_CONFIRM.preview}>{say.say("mine.tfPreview")}</option>
          <option value={MOVE_CONFIRM.straightAway}>{say.say("mine.tfStraight")}</option>
        </Select>
        <span id={computerHint} className="text-xs text-muted">
          {say.say("mine.tfBotNote")}
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{say.say("mine.tfAfter")}</span>
        <Select
          value={fields.afterMove}
          aria-describedby={afterHint}
          disabled={busy}
          onChange={(event) => void save({ afterMove: event.target.value as AfterMove })}
          data-testid="turn-flow-after"
        >
          <option value={AFTER_MOVE.nextWaiting}>{say.say("mine.tfNext")}</option>
          <option value={AFTER_MOVE.sameGame}>{say.say("mine.tfSame")}</option>
          <option value={AFTER_MOVE.myGames}>{say.say("mine.tfMyGames")}</option>
          <option value={AFTER_MOVE.stay}>{say.say("mine.tfStay")}</option>
        </Select>
        <span id={afterHint} className="text-xs text-muted">
          {say.say("mine.tfAfterNote")}
        </span>
      </label>

      {error !== null ? <p className="text-sm text-clay">{error}</p> : null}
      {saved && error === null ? (
        <p className="text-sm text-muted" data-testid="turn-flow-saved">
          {say.say("mine.saved")}
        </p>
      ) : null}
    </div>
  );
}
