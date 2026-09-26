"use client";

import { type ReactNode, useId, useState } from "react";
import useSWR from "swr";

import { PanelFrame, PanelGroup, PanelRow, PanelState } from "@/components/admin/ControlPanel";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Button } from "@/components/ui/Controls";
import { INPUT_CLASS, TONE_CLASS } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import {
  SITE_PANEL_GROUPS,
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
export function AdminSite({ modes = null }: { /** Server-rendered rows for the Modes group: Test mode (`TestModeControl`). */ modes?: ReactNode }) {
  const { data, error, mutate } = useSWR<Loaded>("/api/site", json);
  const [busy, setBusy] = useState<SiteSettingKey | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const hydrated = useHydrated();
  /*
   * The settings live on Sumilabu, and a panel that could not read them must
   * not draw its controls at their defaults: "invite code needed, nobody has
   * changed this" would read as a fact about the site when it is a fact about
   * a failed request. So it says so, and draws no control until it can read.
   */
  const unreadable = error !== undefined && data === undefined;

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

  /** One setting as a row of the panel: its name and line on the left, its control on the right. */
  const row = (key: SiteSettingKey) => {
    const spec = SITE_SETTING_SPECS[key];
    const copy = SITE_SETTING_COPY[key];
    const state = states.get(key);
    const chosen = spec.kind === "choice" ? String(state?.value ?? spec.fallback) : null;
    return (
      <PanelRow
        key={key}
        label={copy.label}
        kanji={copy.kanji}
        busy={busy === key}
        testId={`site-setting-${key}`}
        blurb={
          chosen === null ? (
            copy.blurb
          ) : (
            // The line under a choice says what the one in force does; the setting's own sentence is its title.
            <span title={copy.blurb}>{copy.options[chosen]?.blurb ?? copy.blurb}</span>
          )
        }
        note={<Provenance state={state} />}
        control={
          spec.kind === "choice" ? (
            <ChoiceRow
              options={spec.options}
              copy={copy.options}
              chosen={chosen ?? spec.fallback}
              busy={busy === key}
              onPick={(value) => void save(key, value)}
              testId={key}
            />
          ) : spec.kind === "seconds" ? (
            <SecondsRow
              // Keyed by what is stored, so a saved value (or the default coming back) resets the box to it.
              key={`${key}-${String(state?.value ?? spec.fallback)}`}
              label={copy.fieldLabel ?? copy.label}
              value={Number(state?.value ?? spec.fallback)}
              chosen={state?.chosen ?? false}
              fallback={spec.fallback}
              min={spec.min}
              max={spec.max}
              busy={busy === key}
              onSave={(value) => void save(key, value)}
              testId={key}
            />
          ) : (
            <NoteRow
              label={copy.fieldLabel ?? copy.label}
              value={String(state?.value ?? "")}
              maxLength={spec.maxLength}
              placeholder={copy.placeholder ?? ""}
              busy={busy === key}
              onSave={(value) => void save(key, value)}
              testId={key}
            />
          )
        }
      />
    );
  };

  return (
    <section
      className="flex flex-col gap-3"
      data-testid="admin-site"
      {...readyMark(hydrated && (data !== undefined || unreadable))}
    >
      <p className="text-xs text-muted">
        How this site behaves for everybody. Nothing here touches a member
        already signed up, or a code already handed out.
      </p>

      {problem !== null ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.alarm}`} role="alert" data-testid="site-problem">
          {problem}
        </p>
      ) : null}

      {unreadable ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${TONE_CLASS.alarm}`} role="alert" data-testid="site-unreadable">
          The settings could not be read from Sumilabu just now, so none of them is shown. Until they can be,
          signing up asks for an invite code and the door shows no notice.
        </p>
      ) : null}

      {/*
        ONE PANEL, GROUPED, A LINE A CONTROL. John, 2026-09-25: "We need vertical
        and more condensed control panel type of look", after WazaDB's settings.
        The settings come from the registry, each in the group its copy names;
        the modes group holds the shutter, and Test mode joins it.
      */}
      <PanelFrame testId="site-panel">
        {SITE_PANEL_GROUPS.map((group) => {
          const keys = unreadable ? [] : SITE_SETTING_KEYS.filter((key) => SITE_SETTING_COPY[key].group === group.key);
          const shutter = group.key === "modes" ? <Shutter maintenance={data?.maintenance} /> : null;
          const extra = group.key === "modes" ? modes : null;
          if (keys.length === 0 && shutter === null && extra === null) return null;
          return (
            <PanelGroup key={group.key} label={group.label} kanji={group.kanji} testId={`site-group-${group.key}`}>
              {keys.map(row)}
              {shutter}
              {extra}
            </PanelGroup>
          );
        })}
      </PanelFrame>
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
  // Every option one segment of one bar; the one in force filled, the others each a button that asks where it must.
  // Stacked on a phone, one bar from a small tablet up.
  const segment = "block w-full px-2.5 py-1.5 text-left text-xs font-semibold whitespace-nowrap sm:py-1 sm:text-center";
  return (
    <ul className="flex w-full flex-col overflow-hidden rounded-lg border border-rule-strong/70 sm:w-auto sm:flex-row" role="list">
      {options.map((option) => {
        const words = copy[option];
        const isChosen = option === chosen;
        const label = words?.label ?? option;
        return (
          <li
            key={option}
            className="border-rule-strong/70 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-t-0 sm:[&:not(:first-child)]:border-l"
            data-testid={`${testId}-${option}`}
            data-chosen={isChosen ? "true" : "false"}
            title={words?.blurb}
          >
            {isChosen ? (
              <span className={`${segment} bg-ink text-paper`} aria-current="true">
                {label}
                <span className="sr-only"> (in force)</span>
              </span>
            ) : words?.confirm !== undefined ? (
              <ConfirmButton
                label={label}
                question={words.confirm}
                confirm={words.label}
                onConfirm={() => onPick(option)}
                disabled={busy}
                className={`${segment} bg-ivory text-ink-soft transition-colors hover:bg-rule/60`}
                testId={`${testId}-${option}-use`}
              />
            ) : (
              <button
                type="button"
                onClick={() => onPick(option)}
                disabled={busy}
                className={`${segment} bg-ivory text-ink-soft transition-colors hover:bg-rule/60`}
                data-testid={`${testId}-${option}-use`}
              >
                {label}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A line of copy the operator types. Emptying it forgets it, which the API does.
 *
 * Named by a visible label pointing at the box by id. The fieldset's legend
 * names the setting, not the box, so before this the box's only name was its
 * placeholder — which Chromium falls back to and which vanishes as soon as
 * somebody types. The label does not wrap the row, so Save is not part of the
 * name.
 */
function NoteRow({
  label,
  value,
  maxLength,
  placeholder,
  busy,
  onSave,
  testId,
}: {
  label: string;
  value: string;
  maxLength: number;
  placeholder: string;
  busy: boolean;
  onSave: (value: string) => void;
  testId: string;
}) {
  const [draft, setDraft] = useState(value);
  const inputId = useId();
  return (
    <div className="flex w-full flex-col gap-1 md:w-[26rem]">
      <label htmlFor={inputId} className="text-xs text-ink-soft">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
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
 * A number of seconds, typed and saved. The box refuses nothing by itself — the
 * route answers a value out of bounds with the reason, shown above the panel —
 * but Save stays off until the box holds a whole number that differs from what
 * is stored. Once somebody has chosen, "Back to N s" forgets it, which puts the
 * site back on the default rather than pinning today's number.
 */
function SecondsRow({
  label,
  value,
  chosen,
  fallback,
  min,
  max,
  busy,
  onSave,
  testId,
}: {
  label: string;
  value: number;
  chosen: boolean;
  fallback: number;
  min: number;
  max: number;
  busy: boolean;
  onSave: (value: string | null) => void;
  testId: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const inputId = useId();
  const whole = /^\d+$/.test(draft.trim());
  return (
    <div className="flex w-full flex-col gap-1 md:w-[16rem]">
      <label htmlFor={inputId} className="text-xs text-ink-soft">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          className={INPUT_CLASS}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          data-testid={`${testId}-input`}
        />
        <Button
          onClick={() => onSave(draft.trim())}
          disabled={busy || !whole || Number(draft) === value}
          strong
          data-testid={`${testId}-save`}
        >
          Save
        </Button>
      </div>
      {chosen ? (
        <button
          type="button"
          onClick={() => onSave(null)}
          disabled={busy}
          className="self-start text-xs text-muted underline underline-offset-4"
          data-testid={`${testId}-clear`}
        >
          Back to {fallback} s, the default
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
    <PanelRow
      label="Being worked on"
      kanji="整備"
      tone={on ? "alarm" : "plain"}
      testId="site-maintenance"
      data={{ "data-maintenance": on ? "on" : "off" }}
      blurb={
        on
          ? "The site is shut. Everybody but you is being shown a notice, and nobody new can get in. You are seeing the site normally, which is how you take it back out."
          : "The site is up. Nothing is being held back from anybody."
      }
      note={
        <>
          A deployment setting, not a switch: the gate reads it on every request, even while the database is the thing
          being worked on. To stop new members without shutting the site, use “Nobody new” above.
        </>
      }
      control={
        <>
          <PanelState tone={on ? "alarm" : "plain"}>{on ? "On" : "Off"}</PanelState>
          <code className="rounded-md bg-ink/5 px-2 py-1 font-mono text-[0.7rem]">
            {on ? `${variable}=off` : `${variable}=on`}
          </code>
        </>
      }
    />
  );
}
