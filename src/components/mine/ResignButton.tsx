"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BUTTON_BASE, BUTTON_QUIET } from "@/components/ui/ui.constants";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { MY_GAMES_COPY } from "./mine.constants";

/**
 * Gives a game up — or calls it off, when there is nothing to give up.
 *
 * John found the wrong word: a game with no moves in it offered "Resign" as
 * its only action, and resigning means giving up something under way. Before
 * the first stone nothing is. So the same button says Cancel instead, and it
 * is a different door on the server rather than a flag on the same one:
 * calling off costs nobody anything, and the thing that costs nothing must
 * not be reachable by accident from the thing that does.
 *
 * The seat is proved by the cookie the request carries, so nothing is passed
 * but the id; the server checks the claim, and checks the emptiness for
 * itself against the record rather than trusting this count.
 */
export function ResignButton({
  id,
  moves = 1,
  onDone,
}: {
  id: string;
  /**
   * How many moves have been played. Defaults to "some", so a caller that has
   * not thought about it gets the careful word rather than the cheap one.
   */
  moves?: number;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const nothingPlayed = moves === 0;
  const copy = nothingPlayed ? MY_GAMES_COPY.cancel : MY_GAMES_COPY.resign;
  async function resign() {
    setBusy(true);
    try {
      const response = await fetch(`/api/games/${id}/${nothingPlayed ? "cancel" : "resign"}`, {
        method: "POST",
      });
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
          {copy.label}
          <span className="font-mincho opacity-70">{copy.kanji}</span>
        </>
      }
      question={nothingPlayed ? MY_GAMES_COPY.cancelConfirm : MY_GAMES_COPY.resignConfirm}
      confirm={copy.label}
      onConfirm={() => void resign()}
      disabled={busy}
      className={`${BUTTON_BASE} ${BUTTON_QUIET} px-2 py-1 text-xs`}
      testId={nothingPlayed ? "cancel" : "resign"}
    />
  );
}
