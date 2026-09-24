"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, INPUT_CLASS, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { removalConfirmed, removalPhrase } from "@/lib/auth/removeAccountRules";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { REMOVE_COPY } from "./mine.constants";
import type { RemoveAccountProps } from "./removeAccount.types";

/** Back to this tab after Google, through the route that turns Google's answer into a session. */
const AFTER_GOOGLE = `/api/session/google?next=${encodeURIComponent("/me?view=profile")}`;

/**
 * REMOVE THIS ACCOUNT, at the foot of the Profile tab (PRIV-04).
 *
 * Shut until asked for, then everything a person needs to decide before the
 * press: what goes, what stays, whether their name stays on their old games,
 * and their own name typed to say they mean it. A Google account signs in
 * again first. The press is `POST /api/me/remove`, which checks all of it
 * again; afterwards the browser goes to the front page as a stranger.
 */
export function RemoveAccount({ name, google, fresh }: RemoveAccountProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [blankSeats, setBlankSeats] = useState<boolean | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phrase = removalPhrase(name);
  const ready = blankSeats !== null && removalConfirmed(typed, name) && (!google || fresh);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: typed, blankSeats }),
    });
    if (response.ok) {
      // Replaced rather than pushed, so Back does not return to a page for an account that is gone; refreshed, so no cached page still thinks it exists.
      router.replace("/");
      router.refresh();
      return;
    }
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setError(body?.error ?? "Your account could not be removed.");
    setBusy(false);
  }

  return (
    <section className="flex flex-col gap-3 border-t border-rule pt-4" data-testid="remove-account" {...readyMark(hydrated)}>
      <h3 className="text-sm font-semibold">
        {REMOVE_COPY.heading} <span className="font-mincho text-muted">{REMOVE_COPY.kanji}</span>
      </h3>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${BUTTON_BASE} ${BUTTON_QUIET} self-start px-4 py-2 ${TAP_HEIGHT}`}
          data-testid="remove-account-open"
        >
          {REMOVE_COPY.open}
        </button>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3" data-testid="remove-account-form">
          <p className="text-sm text-ink-soft">{REMOVE_COPY.lead}</p>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Your name on your old games</legend>
            {[false, true].map((blank) => (
              <label key={String(blank)} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="remove-blank-seats"
                  checked={blankSeats === blank}
                  onChange={() => setBlankSeats(blank)}
                  data-testid={blank ? "remove-account-blank" : "remove-account-keep-name"}
                />
                {blank ? REMOVE_COPY.blankName : REMOVE_COPY.keepName}
              </label>
            ))}
            <p className="text-xs text-muted">{REMOVE_COPY.blankNote}</p>
          </fieldset>

          {google && !fresh ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => void signIn("google", { callbackUrl: AFTER_GOOGLE })}
                className={`${BUTTON_BASE} ${BUTTON_QUIET} self-start px-4 py-2`}
                data-testid="remove-account-sign-in"
              >
                {REMOVE_COPY.signInAgain}
              </button>
              <p className="text-xs text-muted">{REMOVE_COPY.signInNote}</p>
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-sm">
              <span>{REMOVE_COPY.type(phrase)}</span>
              <input
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                className={INPUT_CLASS}
                data-testid="remove-account-confirm"
              />
            </label>
          )}

          {error !== null ? (
            <p className="text-sm text-shu" role="alert" data-testid="remove-account-error">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || !ready}
              className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4 py-2 disabled:opacity-50`}
              data-testid="remove-account-press"
            >
              {REMOVE_COPY.press}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setBlankSeats(null);
                setError(null);
              }}
              className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-2`}
            >
              {REMOVE_COPY.cancel}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
