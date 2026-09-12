"use client";

import { useState } from "react";
import useSWR from "swr";

import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { INPUT_CLASS, TONE_CLASS } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import {
  SITE_SETTING_COPY,
  SITE_SETTING_KEYS,
  SITE_SETTING_SPECS,
} from "@/lib/site/site.constants";
import type { SiteSettingKey, SiteSettingState } from "@/lib/site/site.types";

type Loaded = {
  settings: SiteSettingState[];
  maintenance: { on: boolean; variable: string };
};

const json = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<T>;
};

/**
 * How this site behaves: who may sign up, what the door says, and whether the
 * site is shut.
 *
 * Built from `SITE_SETTING_COPY` rather than from a hand-written control per
 * setting, so a row added to the registry grows a control here for free and no
 * control can invent a label the registry does not have. UmaKuma drives its
 * signup panel from a definition list for the same reason.
 *
 * EVERY ANSWER COMES BACK FROM THE SERVER. Nothing here is optimistic, and
 * UmaKuma's own source says why better than a paraphrase would: believing the
 * door is shut when it is open is the failure that matters here. A write
 * returns the settings as they now stand and the panel re-renders from those,
 * so what is shown is what the site will do.
 */
export function AdminSite() {
  const { data, mutate } = useSWR<Loaded>("/api/site", json);
  const [busy, setBusy] = useState<SiteSettingKey | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const hydrated = useHydrated();

  async function save(key: SiteSettingKey, value: string | null) {
    setBusy(key);
    setProblem(null);
    try {
      const response = await fetch("/api/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setProblem(body?.error ?? "That was not saved.");
        return;
      }
      await mutate();
    } finally {
      setBusy(null);
    }
  }

  const states = new Map((data?.settings ?? []).map((state) => [state.key, state]));

  return (
    <section
      className="flex flex-col gap-5"
      data-testid="admin-site"
      {...readyMark(hydrated && data !== undefined)}
    >
      <SectionTitle kanji="設定">The site</SectionTitle>
      <p className="text-xs text-muted">
        How this site behaves for everybody. Nothing here touches a member
        already signed up, or a code already handed out.
      </p>

      {problem !== null ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.alarm}`} role="alert" data-testid="site-problem">
          {problem}
        </p>
      ) : null}

      {SITE_SETTING_KEYS.map((key) => {
        const spec = SITE_SETTING_SPECS[key];
        const copy = SITE_SETTING_COPY[key];
        const state = states.get(key);
        return (
          <fieldset
            key={key}
            className={`flex flex-col gap-2 ${busy === key ? "opacity-60" : ""}`}
            data-testid={`site-setting-${key}`}
          >
            <legend className="flex items-baseline gap-2 text-sm font-semibold">
              {copy.label}
              <span className="font-mincho text-xs font-normal opacity-70">{copy.kanji}</span>
            </legend>
            <p className="text-xs text-muted">{copy.blurb}</p>

            {spec.kind === "choice" ? (
              <ChoiceRow
                options={spec.options}
                copy={copy.options}
                chosen={state?.value ?? spec.fallback}
                busy={busy === key}
                onPick={(value) => void save(key, value)}
                testId={key}
              />
            ) : (
              <NoteRow
                value={state?.value ?? ""}
                maxLength={spec.maxLength}
                placeholder={copy.placeholder ?? ""}
                busy={busy === key}
                onSave={(value) => void save(key, value)}
                testId={key}
              />
            )}

            <Provenance state={state} />
          </fieldset>
        );
      })}

      <Shutter maintenance={data?.maintenance} />
    </section>
  );
}

/**
 * One setting's options, the chosen one marked.
 *
 * An option carrying `confirm` asks before it takes effect, which is every
 * option that changes who can get in. The one that is already chosen is not a
 * button at all — pressing it would be a write that does nothing, and a
 * confirmation dialogue for no change is how a person learns to dismiss them
 * without reading.
 */
function ChoiceRow({
  options,
  copy,
  chosen,
  busy,
  onPick,
  testId,
}: {
  options: readonly string[];
  copy: Record<string, { label: string; blurb: string; confirm?: string }>;
  chosen: string;
  busy: boolean;
  onPick: (value: string) => void;
  testId: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {options.map((option) => {
        const words = copy[option];
        const isChosen = option === chosen;
        return (
          <li
            key={option}
            className={`flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 ${isChosen ? TONE_CLASS.great : TONE_CLASS.calm}`}
            data-testid={`${testId}-${option}`}
            data-chosen={isChosen ? "true" : "false"}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{words?.label ?? option}</span>
              {isChosen ? (
                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  In force
                </span>
              ) : words?.confirm !== undefined ? (
                <ConfirmButton
                  label="Use this"
                  question={words.confirm}
                  confirm={words.label}
                  onConfirm={() => onPick(option)}
                  disabled={busy}
                  testId={`${testId}-${option}-use`}
                />
              ) : (
                <Button
                  onClick={() => onPick(option)}
                  disabled={busy}
                  data-testid={`${testId}-${option}-use`}
                >
                  Use this
                </Button>
              )}
            </div>
            <p className="text-xs opacity-80">{words?.blurb ?? ""}</p>
          </li>
        );
      })}
    </ul>
  );
}

/** A line of copy the operator types. Emptying it forgets it, which the API does. */
function NoteRow({
  value,
  maxLength,
  placeholder,
  busy,
  onSave,
  testId,
}: {
  value: string;
  maxLength: number;
  placeholder: string;
  busy: boolean;
  onSave: (value: string) => void;
  testId: string;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          className={INPUT_CLASS}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          data-testid={`${testId}-input`}
        />
        <Button
          onClick={() => onSave(draft)}
          disabled={busy || draft === value}
          strong
          data-testid={`${testId}-save`}
        >
          Save
        </Button>
      </div>
      {value !== "" ? (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            onSave("");
          }}
          className="self-start text-xs text-muted underline underline-offset-4"
          data-testid={`${testId}-clear`}
        >
          Take it down
        </button>
      ) : null}
    </div>
  );
}

/**
 * Whether anybody has actually chosen this, or it is simply the default.
 *
 * Worth a line of its own: a panel that showed the same thing for "the
 * operator set this to invite-only in March" and "nobody has ever touched
 * this" leaves them no way to tell a decision from an absence.
 */
function Provenance({ state }: { state: SiteSettingState | undefined }) {
  if (state === undefined) return null;
  if (!state.chosen) {
    return (
      <p className="text-xs text-muted" data-testid={`provenance-${state.key}`}>
        Nobody has changed this — it is how the site behaves out of the box.
      </p>
    );
  }
  return (
    <p className="text-xs text-muted" data-testid={`provenance-${state.key}`}>
      Set by {state.updatedBy || "the operator"}
      {state.updatedAt !== null ? ` on ${state.updatedAt.slice(0, 10)}` : ""}.
    </p>
  );
}

/**
 * The shutter: shown, explained, and deliberately not switchable here.
 *
 * It is an environment variable because the gate reads it on every request and
 * must be able to answer while the database is the thing being worked on — see
 * `MAINTENANCE_ENV`. So this panel reports it and gives the two commands,
 * rather than offering a switch that would look identical to the ones above and
 * do nothing. A control that cannot act must say so; three of WazaDB's look
 * exactly like this one and quietly change nothing.
 */
function Shutter({ maintenance }: { maintenance: Loaded["maintenance"] | undefined }) {
  if (maintenance === undefined) return null;
  const { on, variable } = maintenance;
  return (
    <section
      className={`flex flex-col gap-2 rounded-xl border px-3 py-2.5 ${on ? TONE_CLASS.alarm : TONE_CLASS.calm}`}
      data-testid="site-maintenance"
      data-maintenance={on ? "on" : "off"}
    >
      <h3 className="flex items-baseline gap-2 text-sm font-semibold">
        Being worked on
        <span className="font-mincho text-xs font-normal opacity-70">整備</span>
      </h3>
      <p className="text-xs opacity-85">
        {on
          ? "The site is shut. Everybody but you is being shown a notice, and nobody new can get in. You are seeing the site normally, which is how you take it back out."
          : "The site is up. Nothing is being held back from anybody."}
      </p>
      <p className="text-xs opacity-85">
        This one is a deployment setting rather than a switch, because the gate
        reads it on every single request and has to be able to answer even when
        the database is the thing being worked on.
      </p>
      <pre className="overflow-x-auto rounded-lg bg-ink/5 px-2.5 py-2 font-mono text-xs">
        {on ? `${variable}=off  # or remove it entirely` : `${variable}=on`}
      </pre>
      <p className="text-xs opacity-70">
        To stop new members without shutting the site, use “Nobody new” above —
        that takes effect at once.
      </p>
    </section>
  );
}
