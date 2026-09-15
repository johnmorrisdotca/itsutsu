"use client";

import { useEffect, useRef, useState } from "react";

import { GameCount } from "@/components/games/GameCount";
import { BUTTON_QUIET, BUTTON_STRONG, BUTTON_TAP, INPUT_CLASS } from "@/components/ui/ui.constants";
import type { ClaimPlan } from "@/lib/auth/claimRecord.types";

import { ADMIN_CLAIM_COPY } from "./admin.constants";
import type { MemberClaimModalProps } from "./admin.types";

/** What the route answers: what moved or would, or why not. */
type ClaimAnswer = { plan?: ClaimPlan; error?: string };

/**
 * The operator attaching a record kept under a name nobody had an account for,
 * from the Members list.
 *
 * LOOK, THEN ATTACH. The operator types the name the games were played under and
 * is shown what would move — the games, as a count that opens exactly those
 * games, the seats that carry nobody's id, the rating and the per-game standings
 * — before anything is written. A refusal is said in the server's own sentence.
 * Changing the name drops what was looked at, so the button that attaches is
 * only ever beside the record it would attach.
 *
 * The same dialog mechanics as the Words modal beside it: the native element, so
 * the page behind is inert and Escape closes.
 */
export function MemberClaimModal({ member, onClose, onAttached }: MemberClaimModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [looked, setLooked] = useState<{ name: string; plan: ClaimPlan } | null>(null);
  const [attached, setAttached] = useState<ClaimPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);

  /** The one address, asked with or without `confirm`. The name goes in the body, never the address. */
  async function ask(asked: string, confirm: boolean, failed: string): Promise<ClaimPlan | null> {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/admin/members/${encodeURIComponent(member.id)}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(confirm ? { name: asked, confirm: true } : { name: asked }),
    });
    setBusy(false);
    const payload = (await response.json().catch(() => null)) as ClaimAnswer | null;
    if (!response.ok || payload?.plan === undefined) {
      setError(payload?.error ?? failed);
      return null;
    }
    return payload.plan;
  }

  async function look() {
    const asked = name.trim();
    setLooked(null);
    const plan = await ask(asked, false, ADMIN_CLAIM_COPY.lookFailed);
    if (plan !== null) setLooked({ name: asked, plan });
  }

  async function attach() {
    if (looked === null) return;
    const plan = await ask(looked.name, true, ADMIN_CLAIM_COPY.attachFailed);
    if (plan === null) return;
    setAttached(plan);
    onAttached();
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="member-claim-title"
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-2xl border border-rule bg-paper p-5 text-ink shadow-2xl backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
      data-testid="member-claim-modal"
    >
      <div className="flex flex-col gap-4">
        <h2 id="member-claim-title" className="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
          {ADMIN_CLAIM_COPY.title} {member.name}
          <span className="font-mincho text-base font-normal opacity-70">{ADMIN_CLAIM_COPY.linkKanji}</span>
        </h2>

        {attached !== null ? (
          <p className="text-base" data-testid="claim-done">
            {ADMIN_CLAIM_COPY.done(member.name)}
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">{ADMIN_CLAIM_COPY.lead(member.name)}</p>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void look();
              }}
            >
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                {ADMIN_CLAIM_COPY.nameLabel}
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setLooked(null);
                  }}
                  maxLength={60}
                  autoComplete="off"
                  className={INPUT_CLASS}
                  data-testid="claim-name"
                />
              </label>
              <button
                type="submit"
                disabled={busy || name.trim() === ""}
                className={`${BUTTON_TAP} ${BUTTON_QUIET}`}
                data-testid="claim-look"
              >
                {ADMIN_CLAIM_COPY.look}
              </button>
            </form>

            {looked !== null ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-rule p-4" data-testid="claim-plan">
                <p className="text-sm font-semibold">{ADMIN_CLAIM_COPY.underName(looked.name)}</p>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                  <li>
                    <GameCount count={looked.plan.games} player={looked.name} testId="claim-games" />
                    {ADMIN_CLAIM_COPY.finished(looked.plan.games)}
                  </li>
                  <li data-testid="claim-seats">{ADMIN_CLAIM_COPY.seats(looked.plan.seats, member.name)}</li>
                  <li data-testid="claim-rating">{ADMIN_CLAIM_COPY.rating(looked.plan.rating)}</li>
                  <li data-testid="claim-standings">{ADMIN_CLAIM_COPY.standings(looked.plan.standings)}</li>
                </ul>
                <p className="text-xs text-muted">{ADMIN_CLAIM_COPY.whatStays}</p>
                <button
                  type="button"
                  onClick={() => void attach()}
                  disabled={busy}
                  className={`${BUTTON_TAP} ${BUTTON_STRONG} self-start`}
                  data-testid="claim-attach"
                >
                  {ADMIN_CLAIM_COPY.attach(member.name)}
                </button>
              </div>
            ) : null}
          </>
        )}

        {error !== null ? (
          <p className="text-sm text-shu" role="alert" data-testid="claim-refused">
            {error}
          </p>
        ) : null}

        <button type="button" onClick={onClose} className={`${BUTTON_TAP} ${BUTTON_QUIET} self-start`} data-testid="claim-close">
          {ADMIN_CLAIM_COPY.close}
        </button>
      </div>
    </dialog>
  );
}
