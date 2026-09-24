"use client";

import { useEffect, useRef, useState } from "react";

import { BUTTON_QUIET, BUTTON_STRONG, BUTTON_TAP, INPUT_CLASS, SECTION_HEADING } from "@/components/ui/ui.constants";
import { removalConfirmed, removalPhrase } from "@/lib/auth/removeAccountRules";

import { ADMIN_REMOVE_COPY } from "./admin.constants";
import type { MemberRemoveModalProps } from "./admin.types";

/**
 * REMOVE, from a member's row on Admin: the operator doing on request what the
 * member can do from their own Profile tab (PRIV-04), for somebody who wrote
 * in or a parent. The same typed name, the same choice about the name on old
 * games, and a reason kept in the log; `POST /api/admin/members/<id>/remove`
 * checks it all again. A modal, like Words and Attach, because it is the one
 * act on the row that cannot be taken back.
 */
export function MemberRemoveModal({ member, onClose, onRemoved }: MemberRemoveModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [blankSeats, setBlankSeats] = useState<boolean | null>(null);
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phrase = removalPhrase(member.name);
  const ready = blankSeats !== null && removalConfirmed(typed, member.name);

  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);

  async function remove() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/members/${encodeURIComponent(member.id)}/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: typed, blankSeats, reason }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? ADMIN_REMOVE_COPY.failed);
      return;
    }
    setRemoved(true);
    onRemoved();
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="member-remove-title"
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-2xl border border-rule bg-paper p-5 text-ink shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
      data-testid="member-remove-modal"
    >
      <div className="flex flex-col gap-4">
        <h2 id="member-remove-title" className={SECTION_HEADING}>
          {ADMIN_REMOVE_COPY.title} {member.name}
          <span className="font-mincho text-base font-normal opacity-70">{ADMIN_REMOVE_COPY.linkKanji}</span>
        </h2>
        {removed ? (
          <p className="text-base" data-testid="member-remove-done">
            {ADMIN_REMOVE_COPY.done(member.name)}
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void remove();
            }}
          >
            <p className="text-sm text-muted">{ADMIN_REMOVE_COPY.lead}</p>
            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="sr-only">Their name on their old games</legend>
              {[false, true].map((blank) => (
                <label key={String(blank)} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="member-remove-blank"
                    checked={blankSeats === blank}
                    onChange={() => setBlankSeats(blank)}
                    data-testid={blank ? "member-remove-blank" : "member-remove-keep-name"}
                  />
                  {blank ? ADMIN_REMOVE_COPY.blankName : ADMIN_REMOVE_COPY.keepName}
                </label>
              ))}
            </fieldset>
            <label className="flex flex-col gap-1 text-sm">
              {ADMIN_REMOVE_COPY.reason}
              <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} className={INPUT_CLASS} data-testid="member-remove-reason" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {ADMIN_REMOVE_COPY.type(phrase)}
              <input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" className={INPUT_CLASS} data-testid="member-remove-confirm" />
            </label>
            {error !== null ? (
              <p className="text-sm text-shu" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy || !ready} className={`${BUTTON_TAP} ${BUTTON_STRONG}`} data-testid="member-remove-press">
                {ADMIN_REMOVE_COPY.press}
              </button>
              <button type="button" onClick={onClose} className={`${BUTTON_TAP} ${BUTTON_QUIET}`}>
                Cancel
              </button>
            </div>
          </form>
        )}
        {removed ? (
          <button type="button" onClick={onClose} className={`${BUTTON_TAP} ${BUTTON_QUIET} self-start`}>
            Close
          </button>
        ) : null}
      </div>
    </dialog>
  );
}
