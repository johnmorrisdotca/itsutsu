"use client";

import type { ReactNode } from "react";

import { GameThumb } from "@/components/games/GameThumb";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS } from "@/components/ui/ui.constants";
import type { GameKey } from "@/lib/catalogue/gameKeys";

/**
 * THE FRAME OF EVERY CARD ON MY GAMES FOR SOMETHING KEPT IN THIS BROWSER AND GOING: a game at one screen, a table
 * round one device, a Kumimoji party, a Mahjong table, a casual game, a Houseki level. "Anything a person plays is kept
 * until it is finished, and waits in My games" (AGENTS.md); the picture, the small heading, the words and the button
 * back to it are this frame, so a fix to its layout is made once. It was written out by hand in twenty-one
 * components, and the fix that keeps the words 11rem wide, so that a long button (Japanese: 回し遊びのゲームを続ける)
 * drops under them at a phone's width instead of leaving them a few characters wide, had to be made in each.
 *
 * What is in the column under the heading, and what the button says and where it goes, is the card's own.
 */
export function GoingCard({
  thumb,
  heading,
  href,
  action,
  testId,
  continueTestId,
  dataVariant,
  dataKind,
  children,
}: {
  /** The game the picture is of. */
  thumb: GameKey;
  /** The small heading over the words. */
  heading: ReactNode;
  /** Where the button goes: back to the game. */
  href: string;
  /** The button's words. */
  action: ReactNode;
  testId: string;
  continueTestId?: string;
  dataVariant?: string;
  dataKind?: string;
  /** The words under the heading. */
  children: ReactNode;
}) {
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid={testId} data-variant={dataVariant} data-kind={dataKind}>
      <GameThumb variant={thumb} size="small" />
      {/* A text column that will not be squeezed under 11rem, so a long button drops under it rather than leaving the words a few characters wide. */}
      <div className="flex min-w-0 flex-[1_1_11rem] flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">{heading}</span>
        {children}
      </div>
      <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`} data-testid={continueTestId}>
        {action}
      </Link>
    </div>
  );
}
