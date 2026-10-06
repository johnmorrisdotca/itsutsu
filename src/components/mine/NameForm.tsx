"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_STRONG, INPUT_CLASS } from "@/components/ui/ui.constants";

/** The one thing a new member is asked: the name other players will see. */
export function NameForm({ initial, next }: { initial: string; next: string | null }) {
  const say = useSpeaker();
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? say.say("mine.nameFailed"));
      return;
    }
    setSaved(true);
    router.refresh();
    if (next !== null) router.push(next);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" data-testid="name-form">
      <label className="text-sm font-medium" htmlFor="display-name">
        <Paired en={say.say("mine.nameLabel")} kanji="名前" kanjiClassName="text-xs font-normal opacity-70" inReadersLanguage />
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          autoComplete="nickname"
          className={`${INPUT_CLASS} max-w-xs`}
          data-testid="display-name"
        />
        <button type="submit" disabled={busy || name.trim().length < 2} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4`}>
          {say.say(next !== null ? "mine.nameSaveNext" : "mine.nameSave")}
        </button>
      </div>
      <p className="text-xs text-muted">
        {say.say("mine.nameHint")}
      </p>
      {error !== null ? <p className="text-xs text-shu" data-testid="name-error">{error}</p> : null}
      {saved && next === null ? <p className="text-xs text-moss">{say.say("mine.saved")}</p> : null}
    </form>
  );
}
