"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";

/** Hides a finished game from your own public list, or shows it again. It still counts. */
export function HideGameButton({ id, hidden }: { id: string; hidden: boolean }) {
  const say = useSpeaker();
  const router = useRouter();
  const [state, setState] = useState(hidden);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const response = await fetch(`/api/games/${id}/hide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !state }),
    });
    setBusy(false);
    if (response.ok) {
      setState(!state);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3 py-1 text-xs`}
      title={say.say("replay.hideGameHint")}
      data-testid="hide-game"
    >
      {say.say(state ? "replay.showOnList" : "replay.hideFromList")}
    </button>
  );
}
