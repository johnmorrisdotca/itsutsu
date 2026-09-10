"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Toggle } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_STRONG, INPUT_CLASS } from "@/components/ui/ui.constants";
import { KEEP_FINISHED_DAYS, KEEP_FINISHED_DISPLAY } from "@/lib/history/retention";
import { MOST_DAYS_OFF, WEEKDAYS, WEEKDAY_DISPLAY } from "@/lib/social/daysOff";
import { allCountries, countryFrom } from "@/lib/social/countries";

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
  /** Days of the week you do not play, 0 for Sunday. */
  daysOff: number[];
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

  /*
   * What the country select should be showing.
   *
   * The stored field is free text and has been since before there was a list,
   * so it holds whatever people typed — a name, a code, or something this site
   * cannot resolve at all. A resolvable value is shown as its country; an
   * unresolvable one is kept as an option of its own words, so choosing
   * nothing in particular never rewrites what somebody already said.
   */
  const known = countryFrom(fields.country);
  const chosenCountry = known?.code ?? fields.country;
  const unlisted = known === null && fields.country.trim() !== "" ? fields.country : null;

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
          {/*
            A list rather than a box, now that there is a list to offer. It was
            free text because the flag was read from whatever people wrote, and
            reading what they wrote is still what happens to every row already
            stored — but asking somebody to type a country when the site holds
            all 249 of them is asking them to guess our spelling.

            WHAT SOMEBODY ALREADY WROTE IS KEPT, even when it names no country
            this list knows. A select that silently drops a value it cannot
            represent would quietly edit somebody's profile for them the next
            time they saved anything else on this form.
          */}
          <select
            value={chosenCountry}
            onChange={(e) => set({ country: e.target.value })}
            className={INPUT_CLASS}
            data-testid="profile-country"
          >
            <option value="">Not saying</option>
            {unlisted === null ? null : <option value={unlisted}>{unlisted}</option>}
            {allCountries().map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
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
      {/*
        Standing, unlike the away range above it: these cost nothing from the
        yearly allowance and hold every week, for ever.
      */}
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Days I do not play</legend>
        <div className="mt-1 flex flex-wrap gap-1.5" data-testid="days-off">
          {WEEKDAYS.map((day) => {
            const chosen = fields.daysOff.includes(day);
            const full = !chosen && fields.daysOff.length >= MOST_DAYS_OFF;
            return (
              <button
                key={day}
                type="button"
                disabled={full}
                aria-pressed={chosen}
                title={WEEKDAY_DISPLAY[day].label}
                data-testid={`day-off-${day}`}
                onClick={() =>
                  set({
                    daysOff: chosen
                      ? fields.daysOff.filter((other) => other !== day)
                      : [...fields.daysOff, day].sort((a, b) => a - b),
                  })
                }
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  chosen ? "border-moss bg-moss-soft text-ink" : "border-rule hover:bg-shade"
                }`}
              >
                {WEEKDAY_DISPLAY[day].short}{" "}
                <span className="font-mincho opacity-70">{WEEKDAY_DISPLAY[day].kanji}</span>
              </button>
            );
          })}
        </div>
        <span className="text-xs text-muted">
          Deadlines in games that honour vacation step over these every week, and they cost nothing from your
          away days. Somebody has to play on some day, so six is the most you can take.
        </span>
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4`}>
          Save profile
        </button>
        {saved ? <span className="text-xs text-moss">Saved.</span> : null}
        {error !== null ? <span className="text-xs text-shu">{error}</span> : null}
      </div>
      <p className="text-xs text-muted">
        Your country shows as a flag beside your name wherever the site lists players; your city and the time
        where you are show on your own page. Everything is optional, and your address is never shown.
      </p>
    </form>
  );
}
