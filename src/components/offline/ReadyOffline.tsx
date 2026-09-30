"use client";

import Link from "@/components/ui/Link";
import { RAISED_LINK } from "@/components/ui/ui.constants";
import type { GameKey } from "@/lib/catalogue/gameKeys";
import { gamePath } from "@/lib/gomoku/slugs";

import { useKeptGames } from "./keptGames";

/**
 * "Ready offline" beside a game this device holds, leading straight to where
 * it is played: the practice board, the table or the solve last opened here.
 * Drawn only once the browser has read what it holds, so the server's page and
 * the first render agree, and nothing for a game it does not hold.
 *
 * A link raised above a card's stretched one (`RAISED_LINK`), since the card's
 * own leads to the game's page, which may not be kept.
 */
export function ReadyOffline({ game }: { game: GameKey }) {
  const kept = useKeptGames();
  const href = kept?.get(gamePath(game));
  if (href === undefined) return null;
  return (
    <Link
      href={href}
      data-testid="ready-offline"
      data-game={game}
      title="Opened on this device before, so it plays with no connection"
      className={`${RAISED_LINK} inline-flex w-fit items-center gap-1 rounded-full bg-moss-soft px-2 py-0.5 text-[0.7rem] font-medium text-moss`}
    >
      <span aria-hidden="true">✓</span> Ready offline
    </Link>
  );
}
