"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { MY_GAMES_COPY } from "./mine.constants";

/**
 * Gives a game up. The seat is proved by the cookie the request carries, so
 * nothing is passed but the id; the server checks the claim against the
 * match before it does anything.
 */
export function ResignButton({ id, onDone }: { id: string; onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function resign() {
    setBusy(true);
    try {
      const response = await fetch(`/api/games/${id}/resign`, { method: "POST" });
      if (response.ok) {
        onDone?.();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <ConfirmButton
      label={
        <>
          {MY_GAMES_COPY.resign.label}
          <span className="font-mincho opacity-70">{MY_GAMES_COPY.resign.kanji}</span>
        </>
      }
      question={MY_GAMES_COPY.resignConfirm}
      confirm={MY_GAMES_COPY.resign.label}
      onConfirm={() => void resign()}
      disabled={busy}
      className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 text-xs`}
      testId="resign"
    />
  );
}
