import { useId } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Toggle } from "@/components/ui/Controls";
import { INPUT_CLASS } from "@/components/ui/ui.constants";
import { KEEP_FINISHED_DAYS, KEEP_FINISHED_DISPLAY } from "@/lib/history/retention";

import { MailChoices } from "./MailChoices";
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
export function ProfileSends({ fields, set, child = false, mailSending = false }: ProfileSectionProps) {
  /** The id the retention select is described by — see where it is used. */
  const keepHint = useId();
  const say = useSpeaker();

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
        {child ? (
          <p className="text-sm text-muted" data-testid="child-settings-note">
            {say.say("mine.sendsChild")}
          </p>
        ) : (
          <>
            <Toggle
              label={say.say("mine.showOnline")}
              checked={fields.showOnline}
              onChange={(next) => set({ showOnline: next })}
              hint={say.say("mine.showOnlineHint")}
            />
            <MailChoices
              all={fields.emailNotify}
              kinds={fields.mailKinds}
              onAll={(next) => set({ emailNotify: next })}
              onKind={(kind, next) => set({ mailKinds: { ...fields.mailKinds, [kind]: next } })}
              sending={mailSending}
            />
          </>
        )}
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
            <span className="text-sm">{say.say("mine.keepFinished")}</span>
            <select
              className={`${INPUT_CLASS} ${PROFILE_WIDTH.keep}`}
              value={fields.keepFinishedDays}
              onChange={(event) => set({ keepFinishedDays: Number(event.target.value) })}
              aria-describedby={keepHint}
              data-testid="keep-finished-days"
            >
              {KEEP_FINISHED_DAYS.map((days) => (
                <option key={days} value={days}>
                  {say.pairName(KEEP_FINISHED_DISPLAY[days].label, KEEP_FINISHED_DISPLAY[days].kanji).text}
                </option>
              ))}
            </select>
          </label>
          <span id={keepHint} className="text-xs text-muted">
            {say.say("mine.keepNote")}
          </span>
        </div>
      </div>
    </>
  );
}
