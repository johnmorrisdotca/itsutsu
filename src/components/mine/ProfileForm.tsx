"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Toggle } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_STRONG, INPUT_CLASS } from "@/components/ui/ui.constants";
import { KEEP_FINISHED_DAYS, KEEP_FINISHED_DISPLAY } from "@/lib/history/retention";

export type ProfileFields = {
  awayFrom: string;
  awayUntil: string;
  city: string;
  country: string;
  timeZone: string;
  bio: string;
  showOnline: boolean;
  emailNotify: boolean;
  /** Days a finished game stays in your own list; 0 keeps them all. */
  keepFinishedDays: number;
};

/** The time zones this browser knows, for the picker; the server checks the choice again. */
function zones(): string[] {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    return supported ? supported("timeZone") : [];
  } catch {
    return [];
  }
}

/**
 * The rest of the profile, all optional: where you are and what time it is
 * there, a line about yourself, and two switches — whether you are listed
 * among who is here, and whether the site may mail you when it is your move.
 */
export function ProfileForm({ initial }: { initial: ProfileFields }) {
  const router = useRouter();
  const [fields, setFields] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<ProfileFields>) => {
    setFields((current) => ({ ...current, ...patch }));
    setSaved(false);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "That could not be saved.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const guessZone = () => {
    try {
      set({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    } catch {
      // Leave it blank.
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" data-testid="profile-form">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          City <span className="sr-only">optional</span>
          <input value={fields.city} onChange={(e) => set({ city: e.target.value })} maxLength={60} className={INPUT_CLASS} data-testid="profile-city" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Country
          <input value={fields.country} onChange={(e) => set({ country: e.target.value })} maxLength={60} className={INPUT_CLASS} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="flex items-baseline justify-between">
          Time zone
          <button type="button" onClick={guessZone} className="text-xs text-muted underline underline-offset-4">
            use this device&apos;s
          </button>
        </span>
        <input
          value={fields.timeZone}
          onChange={(e) => set({ timeZone: e.target.value })}
          list="time-zones"
          placeholder="America/Vancouver"
          className={`${INPUT_CLASS} font-mono text-xs`}
          data-testid="profile-zone"
        />
        <datalist id="time-zones">
          {zones().map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        About you
        <textarea value={fields.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={500} rows={3} className={INPUT_CLASS} />
      </label>
      <div className="flex flex-col gap-1 text-sm">
        <span>Away <span className="font-mincho text-xs opacity-70">休暇</span></span>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={fields.awayFrom} onChange={(e) => set({ awayFrom: e.target.value })} className={`${INPUT_CLASS} text-xs`} data-testid="away-from" />
          <span className="text-xs text-muted">to</span>
          <input type="date" value={fields.awayUntil} onChange={(e) => set({ awayUntil: e.target.value })} className={`${INPUT_CLASS} text-xs`} data-testid="away-until" />
          {fields.awayFrom !== "" || fields.awayUntil !== "" ? (
            <button type="button" onClick={() => set({ awayFrom: "", awayUntil: "" })} className="text-xs text-muted underline underline-offset-4">
              clear
            </button>
          ) : null}
        </div>
        <span className="text-xs text-muted">
          While you are away, deadlines in your games wait, except in games set up to ignore vacation days. Three days a
          year, whole days.
        </span>
      </div>
      <Toggle
        label="Show when I am here"
        checked={fields.showOnline}
        onChange={(next) => set({ showOnline: next })}
        hint="Listed on the players page while you are on the site. Off, and nobody sees you come and go."
      />
      <Toggle
        label="Email me when it is my move"
        checked={fields.emailNotify}
        onChange={(next) => set({ emailNotify: next })}
        hint="One mail per turn, once mail is set up. Off, and the site never writes to you."
      />
      {/*
        Your own list is a working list: the games waiting on you, and the
        ones just over. This says how long "just over" lasts. It hides them
        from that list and from nowhere else.
      */}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Keep finished games in my list for</span>
        <select
          className={INPUT_CLASS}
          value={fields.keepFinishedDays}
          onChange={(event) => set({ keepFinishedDays: Number(event.target.value) })}
          data-testid="keep-finished-days"
        >
          {KEEP_FINISHED_DAYS.map((days) => (
            <option key={days} value={days}>
              {KEEP_FINISHED_DISPLAY[days].label} {KEEP_FINISHED_DISPLAY[days].kanji}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">
          The record keeps every game whatever this says, and each one stays at its own address. This is only
          about how long they sit in your queue.
        </span>
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4`}>
          Save profile
        </button>
        {saved ? <span className="text-xs text-moss">Saved.</span> : null}
        {error !== null ? <span className="text-xs text-shu">{error}</span> : null}
      </div>
      <p className="text-xs text-muted">
        City, country and the time where you are show beside your name on the players page. Everything is optional,
        and your address is never shown.
      </p>
    </form>
  );
}
