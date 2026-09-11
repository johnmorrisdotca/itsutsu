"use client";

import { Paired } from "@/components/i18n/Paired";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { MY_GAMES_COPY } from "./mine.constants";

/** Takes an open seat and goes to the board. A seat gone in the meantime says so. */
export function SitButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  async function sit() {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch(`/api/games/${id}/sit`, { method: "POST" });
      if (response.ok) {
        const { path } = (await response.json()) as { path: string };
        router.push(path);
        return;
      }
      setNote(MY_GAMES_COPY.sitTaken);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="flex items-center gap-2">
      {note !== null ? <span className="text-xs text-shu">{note}</span> : null}
      <button type="button" onClick={sit} disabled={busy} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-2 py-1 text-xs`} data-testid="sit">
        <Paired en={MY_GAMES_COPY.sit.label} kanji={MY_GAMES_COPY.sit.kanji} kanjiClassName="opacity-80" />
      </button>
    </span>
  );
}
