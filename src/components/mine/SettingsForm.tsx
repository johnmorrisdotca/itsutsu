"use client";

import { useState, type FormEvent } from "react";

import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { ProfileAway } from "./ProfileAway";
import { ProfileSends } from "./ProfileSends";
import type { ProfileFields } from "./profileForm.types";
import { useSaveMe } from "./useSaveMe";

/**
 * HOW THE SITE BEHAVES FOR YOU, on the Settings tab: when your games wait
 * (a holiday, the days you never play), what the site sends you and shows of
 * you, and how long a finished game stays in your list.
 *
 * The account menu both sites share (see the privacy plan's menu contract)
 * has Profile — who you are and what others see — and Settings, how the site
 * behaves for you. These were the bottom half of the Profile form; they are
 * the same sections (`ProfileAway`, `ProfileSends`), saved on their own.
 */
export function SettingsForm({ initial, child = false }: { initial: ProfileFields; child?: boolean }) {
  const [fields, setFields] = useState(initial);
  const { busy, saved, error, save, changed } = useSaveMe();
  const set = (patch: Partial<ProfileFields>) => {
    setFields((current) => ({ ...current, ...patch }));
    changed();
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    await save({
      awayFrom: fields.awayFrom,
      awayUntil: fields.awayUntil,
      daysOff: fields.daysOff,
      showOnline: fields.showOnline,
      emailNotify: fields.emailNotify,
      keepFinishedDays: fields.keepFinishedDays,
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-[29rem] flex-col gap-7" data-testid="settings-form" {...readyMark(useHydrated())}>
      <ProfileAway fields={fields} set={set} />
      <ProfileSends fields={fields} set={set} child={child} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4`}>
          Save settings
        </button>
        {saved ? <span className="text-xs text-moss">Saved.</span> : null}
        {error !== null ? <span className="text-xs text-shu">{error}</span> : null}
      </div>
    </form>
  );
}
