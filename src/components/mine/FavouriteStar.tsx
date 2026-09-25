"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * THE STAR ON A GAME YOU PLAYED. John, 2026-09-25: "ability to favourite your
 * game, it moves to the top". Pressed, the game is starred and listed first on
 * the Completed tab (`favourites.ts`); pressed again, the star comes off.
 *
 * The star changes at once and the write follows; a refused write puts it
 * back. Where the lists are on the page (`regroup`), the page is drawn again
 * after the write, so the game moves to the top, or back, in front of the
 * reader. One write per press and nothing else.
 */
export function FavouriteStar({
  gameId,
  starred,
  regroup = false,
  labelled = false,
}: {
  gameId: string;
  starred: boolean;
  /** Draw the page again after the write, where the lists it reorders are on it. */
  regroup?: boolean;
  /** Say it in words beside the star, where it stands alone rather than in a row of them. */
  labelled?: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(starred);
  const [busy, setBusy] = useState(false);
  const press = async () => {
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      const response = await fetch(`/api/games/${encodeURIComponent(gameId)}/favourite`, { method: next ? "PUT" : "DELETE" });
      if (!response.ok) setOn(!next);
      else if (regroup) router.refresh();
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={() => void press()}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? "Starred: take the star off" : "Star this game"}
      title={on ? "Starred, listed first in your finished games" : "Star it, to list it first in your finished games"}
      className={`relative z-10 inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-moss ${
        labelled ? "self-start px-1 text-sm" : "w-8 text-lg"
      } ${on ? "text-ochre" : "text-muted hover:text-ink"}`}
      data-testid="favourite-star"
      data-starred={on}
    >
      <span aria-hidden="true" className={labelled ? "text-lg" : undefined}>
        {on ? "★" : "☆"}
      </span>
      {labelled ? <span aria-hidden="true">{on ? "Starred" : "Star"}</span> : null}
    </button>
  );
}
