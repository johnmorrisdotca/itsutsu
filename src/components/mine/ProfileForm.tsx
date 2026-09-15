"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BUTTON_BASE, BUTTON_STRONG, INPUT_CLASS } from "@/components/ui/ui.constants";
import { resolveCountry } from "@/lib/social/countries";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { PROFILE_WIDTH } from "./mine.constants";
import { ProfileAway } from "./ProfileAway";
import { ProfileSends } from "./ProfileSends";
import type { ProfileFields, ProfileFormProps } from "./profileForm.types";

/*
 * The fields' type, the width each control is capped at (`PROFILE_WIDTH` in
 * `mine.constants.ts`, with the argument for every cap) and two of the form's
 * three groups (`ProfileAway`, `ProfileSends`) live beside this file since it
 * reached the file-size gate. `ProfileFields` is re-exported, so its import
 * path is unchanged.
 */
export type { ProfileFields } from "./profileForm.types";

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
}: ProfileFormProps) {
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
   * WHETHER THE MEMBER HAS TOUCHED THEIR TIME ZONE, and only then is it sent.
   * The server records any zone this form sends as the member's own choice, and
   * nothing automatic writes over a choice — so sending the field on every save
   * would turn a guess from their country into a "choice" the moment they saved
   * a new bio. Typing in the box or pressing "use this device's" is touching it,
   * including when the value it lands on is the one already there: that is
   * exactly the member who chose the zone we had guessed.
   */
  const [zoneTouched, setZoneTouched] = useState(false);
  const setZone = (timeZone: string) => {
    setZoneTouched(true);
    set({ timeZone });
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
      // An untouched zone is left out — `undefined` is dropped by JSON — so it is not sent as a choice.
      body: JSON.stringify(zoneTouched ? fields : { ...fields, timeZone: undefined }),
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
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      // Leave it blank.
    }
  };

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
    <form onSubmit={submit} className="flex max-w-[29rem] flex-col gap-7" data-testid="profile-form" {...readyMark(useHydrated())}>
      {/* WHERE YOU ARE, AND A LINE ABOUT YOU. */}
      <div className="flex flex-col gap-3">
        {/*
          Two fields, one row, each the size of its own answer — and one per
          row on a phone, where there is room for neither beside the other.
          Country is the wider of the two because a country name is.
        */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <label className={`flex flex-1 flex-col gap-1 text-sm ${PROFILE_WIDTH.city}`}>
            City <span className="sr-only">optional</span>
            <input value={fields.city} onChange={(e) => set({ city: e.target.value })} maxLength={60} className={INPUT_CLASS} data-testid="profile-city" />
          </label>
          <label className={`flex flex-1 flex-col gap-1 text-sm ${PROFILE_WIDTH.country}`}>
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
              onChange={(e) => setZone(e.target.value)}
              list="time-zones"
              placeholder="America/Vancouver"
              className={`${INPUT_CLASS} ${PROFILE_WIDTH.zone} min-w-0 font-mono`}
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

      {/* When your deadlines wait: the holiday and the standing days off — see `ProfileAway`. */}
      <ProfileAway fields={fields} set={set} />

      {/* What the site sends you, and how long it keeps a finished game in your list — see `ProfileSends`. */}
      <ProfileSends fields={fields} set={set} />

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
