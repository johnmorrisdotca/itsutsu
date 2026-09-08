"use client";

import useSWR from "swr";

import { MY_GAMES_COPY } from "./mine.constants";

const fetcher = async (url: string): Promise<{ yourMove: number } | null> => {
  const response = await fetch(url);
  // A visitor with no session gets nothing, and shows nothing.
  return response.ok ? response.json() : null;
};

/** How many games are waiting on this browser, next to "Play" in the header. */
export function YourTurnBadge() {
  const { data } = useSWR("/api/games/mine", fetcher, { refreshInterval: 30_000, revalidateOnFocus: true });
  const count = data?.yourMove ?? 0;
  if (count === 0) return null;
  return (
    <span
      className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-moss px-1.5 text-[0.65rem] font-semibold text-paper"
      title={MY_GAMES_COPY.yourTurn(count)}
      aria-label={MY_GAMES_COPY.yourTurn(count)}
      data-testid="your-turn-badge"
    >
      {count}
    </span>
  );
}
