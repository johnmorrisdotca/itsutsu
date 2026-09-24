"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Paired } from "@/components/i18n/Paired";
import { Select, Toggle } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, INPUT_CLASS, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { needsConsent } from "@/lib/social/ageBand";
import {
  AGE_BAND_DISPLAY,
  AGE_BAND_LIST,
  CONSENT_LIMITS,
  PARENT_RELATIONSHIPS,
  PARENT_RELATIONSHIP_DISPLAY,
  PARENT_RELATIONSHIP_LIST,
  type AgeBand,
} from "@/lib/social/ageBand.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import type { AgeBandFormProps } from "./ageBandForm.types";
import { AGE_COPY } from "./mine.constants";

/**
 * The age question: three tiles, and under 13 the parent's or guardian's
 * consent on the same form, sent in the same request. The server is the rule
 * (`PATCH /api/me`, `ageBandStore.ts`); this form asks the way the rule
 * answers, and shows what it says when it says no.
 *
 * On the welcome page it is the only question until answered; the page hides
 * the name form behind it. On the Profile tab it shows the answer as a line
 * with Change, and the tiles only when asked for.
 */
export function AgeBandForm({ band, consented, place }: AgeBandFormProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [editing, setEditing] = useState(band === null);
  const [chosen, setChosen] = useState<AgeBand | null>(band);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<string>(PARENT_RELATIONSHIPS.parent);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const asksParent = chosen !== null && needsConsent(chosen) && !consented;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (chosen === null) return;
    setBusy(true);
    setError(null);
    const body = asksParent ? { ageBand: chosen, consent: { name, relationship, agreed } } : { ageBand: chosen };
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "That could not be saved.");
      return;
    }
    setSaved(true);
    setEditing(false);
    router.refresh();
  }

  const shown = band === null ? null : AGE_BAND_DISPLAY[band];

  if (!editing && place === "profile") {
    return (
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm" data-testid="age-band-form" {...readyMark(hydrated)}>
        <span data-testid="age-band-shown">
          {AGE_COPY.shown}:{" "}
          <span className="font-medium">
            {shown === null ? AGE_COPY.unsaid : <Paired en={shown.label} kanji={shown.kanji} kanjiClassName="opacity-70" />}
          </span>
          {consented ? <span className="text-muted"> · {AGE_COPY.consented}</span> : null}
          {saved ? <span className="text-moss"> · {AGE_COPY.saved}</span> : null}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1 text-xs`}
          data-testid="age-band-change"
        >
          {AGE_COPY.change}
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" data-testid="age-band-form" {...readyMark(hydrated)}>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">
          <Paired en={AGE_COPY.question} kanji={AGE_COPY.questionKanji} kanjiClassName="text-xs font-normal opacity-70" />
        </legend>
        <div className="flex flex-wrap gap-2">
          {AGE_BAND_LIST.map((option) => {
            const on = chosen === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setChosen(option);
                  setError(null);
                }}
                className={`${BUTTON_BASE} ${on ? BUTTON_STRONG : BUTTON_QUIET} px-4 py-2 ${TAP_HEIGHT}`}
                data-testid="age-band-option"
                data-band={option}
              >
                <Paired en={AGE_BAND_DISPLAY[option].label} kanji={AGE_BAND_DISPLAY[option].kanji} kanjiClassName="text-xs opacity-70" />
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">{AGE_COPY.why}</p>
      </fieldset>

      {asksParent ? (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-rule bg-ivory/60 p-4" data-testid="age-consent">
          <p className="text-sm text-ink-soft">{AGE_COPY.consentLead}</p>
          <label className="flex flex-col gap-1 text-sm">
            <span>{AGE_COPY.consentName}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={CONSENT_LIMITS.name}
              autoComplete="off"
              className={INPUT_CLASS}
              data-testid="age-consent-name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{AGE_COPY.consentRelationship}</span>
            <Select value={relationship} onChange={(event) => setRelationship(event.target.value)} data-testid="age-consent-relationship">
              {PARENT_RELATIONSHIP_LIST.map((option) => (
                <option key={option} value={option}>
                  {PARENT_RELATIONSHIP_DISPLAY[option]}
                </option>
              ))}
            </Select>
          </label>
          <div data-testid="age-consent-agree">
            <Toggle label={AGE_COPY.agree} checked={agreed} onChange={setAgreed} />
          </div>
        </fieldset>
      ) : null}

      {error !== null ? (
        <p className="text-sm text-shu" role="alert" data-testid="age-band-error">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || chosen === null}
          className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4 py-2 disabled:opacity-50`}
          data-testid="age-band-save"
        >
          {AGE_COPY.save}
        </button>
        {place === "profile" && band !== null ? (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setChosen(band);
              setError(null);
            }}
            className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-2`}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
