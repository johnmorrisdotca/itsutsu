"use client";

import { useState } from "react";

import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { adopterFor } from "./keptStores";
import { KEPT_COPY } from "./kept.constants";

/**
 * THE PRESS THAT OPENS A GAME FROM THE HISTORY ON THIS DEVICE: the game, as
 * the site keeps it, made this browser's game of its kind under the record it
 * already has (`keptInBrowser`'s `adopt`), and then its table. Carried on with
 * where it is still going; the table as it ended where it is over. Works on any
 * device the member is signed in on, not only the one it was played on.
 */
export function KeptOpen({ game, id, state, over, table }: { game: string; id: string; state: string; over: boolean; table: string }) {
  const hydrated = useHydrated();
  const [status, setStatus] = useState<"ready" | "opening" | "unreadable">("ready");
  const open = async () => {
    setStatus("opening");
    const adopt = await adopterFor(game);
    if (adopt === null || !adopt(state, id)) {
      setStatus("unreadable");
      return;
    }
    window.location.assign(table);
  };
  return (
    <div className="flex flex-col gap-2" {...readyMark(hydrated)} data-testid="kept-open">
      <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG} self-start`} onClick={() => void open()} disabled={status === "opening"} data-testid="kept-open-button">
        {status === "opening" ? KEPT_COPY.opening : over ? KEPT_COPY.look : KEPT_COPY.carryOn}
      </button>
      {status === "unreadable" ? (
        <p className="text-sm text-shu" role="alert" data-testid="kept-unreadable">
          {KEPT_COPY.unreadable}
        </p>
      ) : (
        <p className="text-xs text-muted">{KEPT_COPY.replaces}</p>
      )}
    </div>
  );
}
