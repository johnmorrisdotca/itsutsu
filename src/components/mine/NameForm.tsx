"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BUTTON_BASE, BUTTON_STRONG, INPUT_CLASS } from "@/components/ui/ui.constants";

/** The one thing a new member is asked: the name other players will see. */
export function NameForm({ initial, next }: { initial: string; next: string | null }) {
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
      setError(payload?.error ?? "That name could not be saved.");
      return;
    }
    setSaved(true);
    router.refresh();
    if (next !== null) router.push(next);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" data-testid="name-form">
      <label className="text-sm font-medium" htmlFor="display-name">
        Your name here <span className="font-mincho text-xs font-normal opacity-70">名前</span>
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
          {next !== null ? "Save and continue" : "Save"}
        </button>
      </div>
      <p className="text-xs text-muted">
        What other players see in their lists and on the players page; your record is kept under it. Two to forty
        characters, and nobody else here may have it.
      </p>
      {error !== null ? <p className="text-xs text-shu" data-testid="name-error">{error}</p> : null}
      {saved && next === null ? <p className="text-xs text-moss">Saved.</p> : null}
    </form>
  );
}
