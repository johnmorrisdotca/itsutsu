import { useId } from "react";

import { Toggle } from "@/components/ui/Controls";
import { INPUT_CLASS } from "@/components/ui/ui.constants";
import { KEEP_FINISHED_DAYS, KEEP_FINISHED_DISPLAY } from "@/lib/history/retention";

import { PROFILE_WIDTH } from "./mine.constants";
import type { ProfileSectionProps } from "./profileForm.types";

/**
 * WHAT THE SITE SENDS YOU, AND WHAT IT KEEPS: being shown as here, mail on your
 * move, and how long a finished game stays in your own list.
 *
 * Split out of `ProfileForm.tsx` when it reached the file-size gate — see that
 * file for why the form reads as three groups. The fields are the form's, and
 * this section changes them only through `set`, exactly as it did inline.
 */
export function ProfileSends({ fields, set }: ProfileSectionProps) {
  /** The id the retention select is described by — see where it is used. */
  const keepHint = useId();

  return (
    <>
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
        {/*
          The note is the select's DESCRIPTION and not part of its name — the
          same rule `Field` and `Toggle` keep, kept here by hand because this
          one is a column rather than a row and does not use `Field`. Inside
          the label, a screen reader read the whole paragraph out as the name
          of the control and a voice-control user had to say it.
        */}
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Keep finished games in my list for</span>
            <select
              className={`${INPUT_CLASS} ${PROFILE_WIDTH.keep}`}
              value={fields.keepFinishedDays}
              onChange={(event) => set({ keepFinishedDays: Number(event.target.value) })}
              aria-describedby={keepHint}
              data-testid="keep-finished-days"
            >
              {KEEP_FINISHED_DAYS.map((days) => (
                <option key={days} value={days}>
                  {KEEP_FINISHED_DISPLAY[days].label} {KEEP_FINISHED_DISPLAY[days].kanji}
                </option>
              ))}
            </select>
          </label>
          <span id={keepHint} className="text-xs text-muted">
            The record keeps every game whatever this says, and each one stays at its own address. This is only
            about how long they sit in your queue.
          </span>
        </div>
      </div>
    </>
  );
}
