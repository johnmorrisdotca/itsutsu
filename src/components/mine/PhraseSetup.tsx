"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_QUIET, BUTTON_STRONG, BUTTON_TAP } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { PHRASE_LENGTH } from "@/lib/phrase/phrase";
import type { PhraseDrawFields, PhraseStatusFields } from "@/lib/phrase/phraseSetup.types";

import { WORDS_COPY } from "./mine.constants";
import { emptyArrangement, reconcileArrangement, swapBoxes, type Arrangement } from "./phraseArrangement";
import { WordCandidates } from "./WordCandidates";
import { WordTiles } from "./WordTiles";

/**
 * When the words were set, as a date a person reads, in the zone they are
 * reading it in.
 *
 * Rendered only once the browser has taken over — see where it is called —
 * because the server does not know where the reader is: formatted there, an
 * evening's pick came out as the next day (UTC had already turned), and a date
 * that differs between the server and the browser is a hydration mismatch as
 * well as a wrong one. The day-month-year order is fixed rather than left to
 * the browser's locale so the line reads the same on every device.
 */
function sinceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * The four-word phrase, on its own tab of the member's page.
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
 * four more until she recognises a word. There is no text box on this screen
 * and there must never be one: `phraseSetup.coverage.test.ts` fails the build
 * if one appears.
 *
 * TWO LISTS, ONE AUTHORITY. `slots` is the ticket's: which words are kept, in
 * the order the server filled them. `arranged` is the person's: which box
 * each word is shown in, after they have dragged it about. The ticket never
 * hears about the arrangement and never needs to — a phrase is a set, sorted
 * before it is hashed (see phraseArrangement.ts) — so saving sends the ticket
 * and nothing the browser arranged.
 *
 * THE WORDS NEVER OUTLIVE THIS SCREEN. They live in this component's state
 * and nowhere else — not the address, not a log — and `cancel` below clears
 * that state the moment they are saved, or abandoned.
 */
export function PhraseSetup({ initial }: { initial: PhraseStatusFields }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [status, setStatus] = useState(initial);
  const [picking, setPicking] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [arranged, setArranged] = useState<Arrangement>(() => emptyArrangement());
  const [offered, setOffered] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const done = slots.length === PHRASE_LENGTH && slots.every((word) => word !== null);
  const remaining = arranged.filter((word) => word === null).length;

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
      setError(payload?.error ?? WORDS_COPY.drawFailed);
      return;
    }
    const state = (await response.json()) as PhraseDrawFields;
    setTicket(state.ticket);
    setSlots(state.slots);
    setOffered(state.offered);
    setArranged((shown) => reconcileArrangement(shown, state.slots));
  }

  function startPicking(): void {
    setPicking(true);
    setSaved(false);
    setAcknowledged(false);
    setArranged(emptyArrangement());
    void draw({});
  }

  /** Abandons the pick. The words held so far are dropped, not kept anywhere. */
  function cancel(): void {
    setPicking(false);
    setTicket(null);
    setSlots([]);
    setArranged(emptyArrangement());
    setOffered([]);
    setAcknowledged(false);
    setError(null);
  }

  /** A kept word tapped: back out it goes, by the slot the TICKET holds it in. */
  function takeOut(word: string): void {
    const at = slots.indexOf(word);
    if (at === -1) return;
    void draw({ ticket, drop: at });
  }

  /** A word carried to another box. The browser's business alone; nothing is sent. */
  function move(from: number, to: number): void {
    setArranged((shown) => swapBoxes(shown, from, to));
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
      setError(payload?.error ?? WORDS_COPY.saveFailed);
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
      setError(payload?.error ?? WORDS_COPY.removeFailed);
      return;
    }
    await refreshStatus();
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-4" data-testid="phrase-setup" {...readyMark(hydrated)}>
      <p className="text-sm text-muted">{WORDS_COPY.lead}</p>

      {!picking ? (
        <>
          {/*
            The boxes stand here whether or not there is anything in them: four
            dashed ones say what is about to be asked for, four masked ones say
            there are four and that they cannot be shown. Both tell the truth
            at a glance, which a sentence on its own did not.
          */}
          <WordTiles words={emptyArrangement()} mode={status.set ? "kept" : "empty"} />
          <p className="text-base" data-testid="phrase-status">
            {status.set ? (
              <>
                {WORDS_COPY.setStatus}
                {hydrated && status.setAt ? WORDS_COPY.since(sinceDate(status.setAt)) : ""}.
              </>
            ) : (
              WORDS_COPY.unsetStatus
            )}
          </p>
          {status.set ? <p className="text-sm text-muted">{WORDS_COPY.kept}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startPicking}
              className={`${BUTTON_TAP} ${BUTTON_STRONG}`}
              data-testid="phrase-set-button"
            >
              {status.set ? WORDS_COPY.chooseAgain : WORDS_COPY.choose}
            </button>
            {status.set && status.mayRemove ? (
              confirmingRemove ? (
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  {WORDS_COPY.removeQuestion}
                  <button
                    type="button"
                    onClick={() => void remove()}
                    disabled={busy}
                    className={`${BUTTON_TAP} ${BUTTON_QUIET} text-shu`}
                    data-testid="phrase-remove-confirm"
                  >
                    {WORDS_COPY.removeYes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingRemove(false)}
                    className={`${BUTTON_TAP} ${BUTTON_QUIET}`}
                  >
                    {WORDS_COPY.removeNo}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(true)}
                  className={`${BUTTON_TAP} ${BUTTON_QUIET}`}
                  data-testid="phrase-remove"
                >
                  {WORDS_COPY.remove}
                </button>
              )
            ) : null}
          </div>
          {status.set && !status.mayRemove ? <p className="text-sm text-muted">{WORDS_COPY.cannotRemove}</p> : null}
          {saved ? (
            <p className="text-sm text-moss" data-testid="phrase-saved">
              {WORDS_COPY.saved}
            </p>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col gap-4" data-testid="phrase-picker">
          <WordTiles words={arranged} mode="picking" busy={busy} onTakeOut={takeOut} onMove={move} />
          <p className="text-sm text-muted">{WORDS_COPY.arrange}</p>

          {!done ? (
            offered.length === 0 ? (
              <p className="text-sm text-muted">{WORDS_COPY.finding}</p>
            ) : (
              <WordCandidates
                offered={offered}
                busy={busy}
                remaining={remaining}
                onKeep={(index) => void draw({ ticket, keep: index })}
                onRefresh={() => void draw({ ticket })}
              />
            )
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-ochre/40 bg-ochre-soft p-4">
              <p className="text-base font-semibold">{WORDS_COPY.writeDown}</p>
              <p className="text-sm text-ink-soft">{WORDS_COPY.writeDownWhy}</p>
              <label className="flex min-h-12 items-center gap-3 text-base">
                <input
                  type="checkbox"
                  className="size-5 shrink-0"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  data-testid="phrase-acknowledge"
                />
                {WORDS_COPY.acknowledge}
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!acknowledged || busy}
                  onClick={() => void save()}
                  className={`${BUTTON_TAP} ${BUTTON_STRONG}`}
                  data-testid="phrase-save"
                >
                  {WORDS_COPY.save}
                </button>
                <button
                  type="button"
                  onClick={startPicking}
                  className="min-h-12 px-1 py-2 text-sm text-muted underline underline-offset-4"
                >
                  {WORDS_COPY.startOver}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={cancel}
            className="min-h-12 self-start px-1 py-2 text-sm text-muted underline underline-offset-4"
            data-testid="phrase-cancel"
          >
            {WORDS_COPY.cancel}
          </button>
        </div>
      )}

      {error !== null ? (
        <p className="text-sm text-shu" data-testid="phrase-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
