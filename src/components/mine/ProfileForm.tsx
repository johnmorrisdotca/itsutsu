"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Toggle } from "@/components/ui/Controls";
import { BUTTON_BASE, BUTTON_STRONG, INPUT_CLASS } from "@/components/ui/ui.constants";
import { KEEP_FINISHED_DAYS, KEEP_FINISHED_DISPLAY } from "@/lib/history/retention";
import { MOST_DAYS_OFF, WEEKDAYS, WEEKDAY_DISPLAY } from "@/lib/social/daysOff";
import { resolveCountry, type MemberCountry } from "@/lib/social/countries";

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

/*
 * A FIELD IS AS WIDE AS WHAT GOES IN IT.
 *
 * John, with the form in front of him: "The Away to date stuff is so ugly.
 * Just these large full page width date inputs… BAD! They should at least be
 * on the same row. Time zone doesn't need to be full width either! Heck, City
 * and Country need to be that wide???"
 *
 * He is right, and the cause is one line of CSS repeated nine times:
 * `INPUT_CLASS` is `w-full`, and the panel this form sits in is a thousand
 * pixels across on a laptop. So a ten-character date got a box wide enough
 * for a paragraph, which is what a form looks like when nobody has looked at
 * it. Each control is capped here at what its own longest value needs, and
 * only the bio — which really is a paragraph — keeps the width.
 *
 * TWO THINGS TO KEEP RIGHT WHEN CHANGING THESE.
 *
 * They are caps (`max-w-*`) and never widths (`w-*`). Partly so a phone
 * narrows every one of them to the column it actually has — 390px of screen
 * is about 326px of panel, narrower than most of the caps below — and partly
 * because `w-*` here would be a coin toss: `INPUT_CLASS` already sets
 * `w-full`, and Tailwind settles two utilities for one property by their
 * order in the stylesheet rather than in the attribute. `max-width` is a
 * different property, so it composes instead of competing.
 *
 * And a narrower field is not a shorter one. Nothing here touches the padding
 * or the text size that make these comfortable to tap.
 */
const WIDTH = {
  /** "Charlottetown", "Sault Ste. Marie" — a couple of words at most. */
  city: "sm:max-w-[11rem]",
  /** "🇬🇧 United Kingdom", and the longest of the 249 run half again as long. */
  country: "sm:max-w-[17rem]",
  /** Measured: "America/Argentina/Buenos_Aires", the longest there is, wants 313px. */
  zone: "max-w-[20rem]",
  /*
   * A date is ten characters, a picker icon, and nothing else — 136px, which
   * is what one needs to render whole.
   *
   * The second half is arithmetic and not taste. A screen 360px wide leaves
   * this form a 294px column, and two whole dates with the word between them
   * want 294px exactly; anything narrower cannot have both at this text size,
   * whatever the padding does. Below that the TEXT gives way rather than the
   * row, because "they should at least be on the same row" is the thing being
   * asked for and a smaller date is still a date. Measured at 320px: at the
   * ordinary size the boxes come out 113px and Chrome eats the leading digit,
   * so every year read 026.
   */
  date: "max-w-[8.5rem] max-[359px]:text-xs",
  /** "Three months 三月" is the longest thing this select ever says. */
  keep: "max-w-[13rem]",
} as const;

/**
 * The rest of the profile, all optional: where you are and what time it is
 * there, a line about yourself, when your deadlines wait, and what the site
 * sends you.
 *
 * IT READS AS THREE SHORT GROUPS RATHER THAN NINE STACKED ROWS, said with
 * spacing and not with headings — `gap-7` between the groups against `gap-3`
 * inside them. Where you are; when your games wait for you (the holiday and
 * the standing days off, which are the same question asked twice); and what
 * the site sends you and how long it keeps things. A heading apiece would
 * have made a settings page out of nine optional fields.
 *
 * EVERY LABEL IS ONE WEIGHT, which is the other half of reading as groups.
 * Two of the nine were `font-medium` and seven were not, which says a
 * difference in kind that is not there — "Days I do not play" is not a
 * heading over the ones below it, it is the seventh question of nine.
 *
 * `countries` and `timeZones` come in as props, computed once on the server
 * by `MePage`, rather than this component asking `Intl` for either itself.
 * This is a client component, so its render function runs again in the
 * browser during hydration — and `Intl.DisplayNames`/`Intl.supportedValuesOf`
 * do not promise the same answer in every engine. See `resolveCountry` in
 * `@/lib/social/countries` for the four country codes where that has already
 * been caught disagreeing between Node and Chromium.
 */
export function ProfileForm({
  initial,
  countries,
  timeZones,
}: {
  initial: ProfileFields;
  countries: MemberCountry[];
  timeZones: string[];
}) {
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
   *
   * Resolved with `resolveCountry` against the `countries` prop, not
   * `countryFrom`/`allCountries()` directly — see the comment above the
   * component for why this component must not ask its own `Intl` anything.
   */
  const known = resolveCountry(fields.country, countries);
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

  const away = fields.awayFrom !== "" || fields.awayUntil !== "";

  /*
   * ONE COLUMN, AND THE CITY-AND-COUNTRY ROW SETS ITS WIDTH: 11rem + 17rem
   * with a gap between them, which is 29rem, which is where every field in
   * here stops. The panel around it is a thousand pixels wide on a laptop and
   * the form used to fill it, so nothing lined up with anything and every
   * short answer sat in a long box.
   *
   * A column narrower than its panel is what makes the difference read as a
   * decision. It also hands the prose a measure somebody can read — the bio
   * and the notes under each field ran to a hundred and forty characters a
   * line at the panel's full width, which is roughly twice a comfortable one.
   */
  return (
    <form onSubmit={submit} className="flex max-w-[29rem] flex-col gap-7" data-testid="profile-form">
      {/* WHERE YOU ARE, AND A LINE ABOUT YOU. */}
      <div className="flex flex-col gap-3">
        {/*
          Two fields, one row, each the size of its own answer — and one per
          row on a phone, where there is room for neither beside the other.
          Country is the wider of the two because a country name is.
        */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <label className={`flex flex-1 flex-col gap-1 text-sm ${WIDTH.city}`}>
            City <span className="sr-only">optional</span>
            <input value={fields.city} onChange={(e) => set({ city: e.target.value })} maxLength={60} className={INPUT_CLASS} data-testid="profile-city" />
          </label>
          <label className={`flex flex-1 flex-col gap-1 text-sm ${WIDTH.country}`}>
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
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {/*
          The label names the field and the shortcut is a button, so the button
          is a sibling of the box rather than something inside its label — and
          it sits BESIDE the box it fills, not floated to the far side of a row
          that is otherwise empty. On a phone it wraps underneath, which is the
          one thing in this form allowed to.
        */}
        <div className="flex flex-col gap-1">
          {/*
            Mono, and the same height as every other box in here. It was a
            size smaller than its neighbours, which made one field of the nine
            a shorter thing to tap for no reason a reader could see; the cap
            above is set to the longest zone name at this size rather than the
            text being shrunk to fit a cap.
          */}
          <label htmlFor="profile-zone" className="text-sm">
            Time zone
          </label>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <input
              id="profile-zone"
              value={fields.timeZone}
              onChange={(e) => set({ timeZone: e.target.value })}
              list="time-zones"
              placeholder="America/Vancouver"
              className={`${INPUT_CLASS} ${WIDTH.zone} min-w-0 font-mono`}
              data-testid="profile-zone"
            />
            <button type="button" onClick={guessZone} className="shrink-0 text-xs text-muted underline underline-offset-4">
              use this device&apos;s
            </button>
            <datalist id="time-zones">
              {timeZones.map((zone) => (
                <option key={zone} value={zone} />
              ))}
            </datalist>
          </div>
        </div>
        {/* The one field that is a paragraph, and the only one that keeps the width. */}
        <label className="flex flex-col gap-1 text-sm">
          About you
          <textarea value={fields.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={500} rows={3} className={INPUT_CLASS} />
        </label>
      </div>

      {/*
        WHEN YOUR DEADLINES WAIT. One holiday out of a small yearly allowance,
        and the days of the week that hold every week for ever — the same
        question asked twice, which is why they are one group and why the
        second one's note says what it does not cost.
      */}
      <div className="flex flex-col gap-4">
        <fieldset className="flex min-w-0 flex-col gap-1">
          <legend className="text-sm">
            Away <span className="font-mincho text-xs opacity-70">休暇</span>
          </legend>
          {/*
            Two dates and the word between them on ONE row, each sized to a
            date. The pair is a `w-full` block with a cap on it so the row can
            never break in the middle and leave "to" stranded on a line of its
            own, which is what it did; "clear" is outside the pair and may wrap
            under it, because a third control is not part of the range.

            `min-w-0` — on the fieldset, on the pair — and `flex-1` on each
            date are what make that promise hold on a small phone rather than
            only on a laptop. Nothing shrinks below its own content unless it
            is told it may, and a FIELDSET is the worst offender: browsers give
            it `min-inline-size: min-content`, which Tailwind's reset leaves
            alone, so it will not narrow for anything. Measured at 320px wide:
            the fieldset stood at 299px inside a 254px column and pushed the
            whole PAGE sideways, which turned "the dates are on one row" into a
            horizontal scrollbar. With these the two dates divide whatever the
            column has, up to the cap.

            The dates are labelled for a screen reader rather than by the words
            on screen — "to" between two boxes is a picture of a range, not a
            name for either end of it, so it is spoken by neither.
          */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex w-full min-w-0 max-w-[20rem] items-center gap-2">
              <label htmlFor="away-from" className="sr-only">
                Away from
              </label>
              <input
                id="away-from"
                type="date"
                value={fields.awayFrom}
                onChange={(e) => set({ awayFrom: e.target.value })}
                className={`${INPUT_CLASS} ${WIDTH.date} min-w-0 flex-1`}
                data-testid="away-from"
              />
              <span aria-hidden="true" className="shrink-0 text-xs text-muted">
                to
              </span>
              <label htmlFor="away-until" className="sr-only">
                Away until
              </label>
              <input
                id="away-until"
                type="date"
                value={fields.awayUntil}
                onChange={(e) => set({ awayUntil: e.target.value })}
                className={`${INPUT_CLASS} ${WIDTH.date} min-w-0 flex-1`}
                data-testid="away-until"
              />
            </span>
            {away ? (
              <button type="button" onClick={() => set({ awayFrom: "", awayUntil: "" })} className="text-xs text-muted underline underline-offset-4">
                clear
              </button>
            ) : null}
          </div>
          <span className="text-xs text-muted">
            While you are away, deadlines in your games wait, except in games set up to ignore vacation days. Three days a
            year, whole days.
          </span>
        </fieldset>
        {/*
          Standing, unlike the away range above it: these cost nothing from the
          yearly allowance and hold every week, for ever.
        */}
        <fieldset className="flex min-w-0 flex-col gap-1">
          <legend className="text-sm">Days I do not play</legend>
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
      </div>

      {/*
        WHAT THE SITE SENDS YOU, AND WHAT IT KEEPS. `Toggle` sets its box
        against the right-hand edge of whatever it is given, so these two get
        their sanity from the column being 29rem rather than a thousand pixels:
        a switch that far from its own words is a switch nobody can tell which
        words belong to. Nothing in `Toggle` itself is touched — it is shared
        with the game defaults, and this form is not the place to restyle it.
      */}
      <div className="flex flex-col gap-3">
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
          <span className="text-sm">Keep finished games in my list for</span>
          <select
            className={`${INPUT_CLASS} ${WIDTH.keep}`}
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
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4`}>
            Save profile
          </button>
          {saved ? <span className="text-xs text-moss">Saved.</span> : null}
          {error !== null ? <span className="text-xs text-shu">{error}</span> : null}
        </div>
        <p className="max-w-prose text-xs text-muted">
          Your country shows as a flag beside your name wherever the site lists players; your city and the time
          where you are show on your own page. Everything is optional, and your address is never shown.
        </p>
      </div>
    </form>
  );
}
