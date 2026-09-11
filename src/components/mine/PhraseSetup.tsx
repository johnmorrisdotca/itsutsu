"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { PHRASE_LENGTH } from "@/lib/phrase/phrase";
import type { PhraseDrawFields, PhraseStatusFields } from "@/lib/phrase/phraseSetup.types";

/**
 * The four-word phrase, on the member's own page.
 *
 * THE KITCHEN TABLE is what this is for: a second way into the account that
 * works on a device somebody else is signed in on, so a child can play a real,
 * rated game against a parent on one iPad. Setting one here is step one of
 * that; claiming a seat with it (`SitAsPanel`) is step two.
 *
 * THE PICKER, not typing. Four candidates are offered, one is kept, four
 * rounds make a phrase. Rerolling is unlimited on purpose — an attacker never
 * learns which words were shown, so the search space is the whole list
 * however many times somebody looked, and a child should be able to ask for
 * four more until she recognises a word.
 *
 * THE WORDS NEVER OUTLIVE THIS SCREEN. They live in this component's state
 * and nowhere else — not the address, not a log — and `finish` below clears
 * that state the moment they are saved, or abandoned.
 */
export function PhraseSetup({ initial }: { initial: PhraseStatusFields }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [status, setStatus] = useState(initial);
  const [picking, setPicking] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [offered, setOffered] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const done = slots.length === PHRASE_LENGTH && slots.every((word) => word !== null);

  async function draw(body: Record<string, unknown>): Promise<void> {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me/phrase/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not offer any words.");
      return;
    }
    const state = (await response.json()) as PhraseDrawFields;
    setTicket(state.ticket);
    setSlots(state.slots);
    setOffered(state.offered);
  }

  function startPicking(): void {
    setPicking(true);
    setSaved(false);
    setAcknowledged(false);
    void draw({});
  }

  /** Abandons the pick. The words held so far are dropped, not kept anywhere. */
  function cancel(): void {
    setPicking(false);
    setTicket(null);
    setSlots([]);
    setOffered([]);
    setAcknowledged(false);
    setError(null);
  }

  async function refreshStatus(): Promise<void> {
    const response = await fetch("/api/me/phrase");
    if (!response.ok) return;
    setStatus((await response.json()) as PhraseStatusFields);
  }

  async function save(): Promise<void> {
    if (ticket === null || !acknowledged) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me/phrase", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket, acknowledged: true }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not set those words.");
      return;
    }
    // The words are done with the moment they are saved: nothing here keeps them.
    cancel();
    await refreshStatus();
    setSaved(true);
    router.refresh();
  }

  async function remove(): Promise<void> {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me/phrase", { method: "DELETE" });
    setBusy(false);
    setConfirmingRemove(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Could not remove those words.");
      return;
    }
    await refreshStatus();
    router.refresh();
  }

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="phrase-setup" {...readyMark(hydrated)}>
      <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        Four words <span className="font-mincho normal-case tracking-normal">四語</span>
      </h2>
      <p className="text-xs text-muted">
        A second way into this account, so somebody can sit in as themselves on a device you are signed in
        on — a shared tablet at the kitchen table — and have the game count for them.
      </p>

      {!picking ? (
        <>
          <p className="text-sm" data-testid="phrase-status">
            {status.set ? (
              <>Four words are set{status.setAt ? ` (${new Date(status.setAt).toLocaleDateString()})` : ""}.</>
            ) : (
              "No four words are set yet."
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startPicking}
              className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4`}
              data-testid="phrase-set-button"
            >
              {status.set ? "Change your four words" : "Set four words"}
            </button>
            {status.set && status.mayRemove ? (
              confirmingRemove ? (
                <span className="flex items-center gap-2 text-xs">
                  Remove them?
                  <button
                    type="button"
                    onClick={remove}
                    disabled={busy}
                    className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 text-shu`}
                    data-testid="phrase-remove-confirm"
                  >
                    Yes, remove
                  </button>
                  <button type="button" onClick={() => setConfirmingRemove(false)} className="text-muted underline underline-offset-4">
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(true)}
                  className="text-xs text-muted underline underline-offset-4"
                  data-testid="phrase-remove"
                >
                  Remove
                </button>
              )
            ) : null}
          </div>
          {status.set && !status.mayRemove ? (
            <p className="text-xs text-muted">
              Your four words are the only way into this account, so they cannot be removed. Add a sign-in
              address first, and then they can go.
            </p>
          ) : null}
          {saved ? <p className="text-xs text-moss">Saved.</p> : null}
        </>
      ) : (
        <div className="flex flex-col gap-3" data-testid="phrase-picker">
          <p className="text-xs text-muted">
            Four words are offered below. Tap one to keep it — do that four times. Not keen on any of them?
            Ask for four more, as many times as you like.
          </p>
          <ol className="flex flex-wrap gap-2" data-testid="phrase-slots">
            {Array.from({ length: PHRASE_LENGTH }, (_, index) => {
              const word = slots[index] ?? null;
              return (
                <li key={index}>
                  <button
                    type="button"
                    disabled={word === null || busy}
                    onClick={() => void draw({ ticket, drop: index })}
                    data-testid={`phrase-slot-${index}`}
                    className={`min-w-20 rounded-lg border px-3 py-2 text-sm ${
                      word === null
                        ? "border-dashed border-rule text-muted"
                        : "border-moss bg-moss-soft text-ink"
                    }`}
                    title={word === null ? "Empty" : "Tap to take this word back out"}
                  >
                    {word ?? "—"}
                  </button>
                </li>
              );
            })}
          </ol>

          {!done ? (
            <>
              <div className="flex flex-wrap gap-2" data-testid="phrase-candidates">
                {offered.map((word, index) => (
                  <button
                    key={`${word}-${index}`}
                    type="button"
                    disabled={busy}
                    onClick={() => void draw({ ticket, keep: index })}
                    data-testid={`phrase-candidate-${index}`}
                    className={`${BUTTON_BASE} ${BUTTON_QUIET} min-w-20`}
                  >
                    {word}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void draw({ ticket })}
                className="self-start text-xs text-muted underline underline-offset-4"
                data-testid="phrase-reroll"
              >
                Show me four more
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-ochre/40 bg-ochre-soft p-3">
              <p className="text-sm font-medium">Write these four words down somewhere now.</p>
              <p className="text-xs text-muted">
                Once they are set they cannot be shown again — not to you, not to anyone. If you forget them,
                the fix is to pick four new ones, so there is no crisis, only a re-pick.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  data-testid="phrase-acknowledge"
                />
                I have written these four words down.
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!acknowledged || busy}
                  onClick={() => void save()}
                  className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4`}
                  data-testid="phrase-save"
                >
                  Save
                </button>
                <button type="button" onClick={startPicking} className="text-xs text-muted underline underline-offset-4">
                  Start over
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={cancel}
            className="self-start text-xs text-muted underline underline-offset-4"
            data-testid="phrase-cancel"
          >
            Cancel
          </button>
        </div>
      )}

      {error !== null ? (
        <p className="text-xs text-shu" data-testid="phrase-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
