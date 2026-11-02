"use client";

import type { ReactNode } from "react";

import { GoingCard } from "@/components/mine/GoingCard";
import type { GameKey } from "@/lib/catalogue/gameKeys";

/**
 * A TABLE ROUND ONE DEVICE, WAITING IN MY GAMES: the card every party game draws for a game going, on the frame every
 * card of that kind shares (`GoingCard`). Each game still decides whether it has one going and what its line says
 * (that is the children); the heading, the wrapping row the line runs in and the Resume button are this.
 */
export function PartyTableCard({
  thumb,
  heading,
  href,
  resume,
  testId = "party-game",
  continueTestId = "party-game-continue",
  dataVariant,
  flow = true,
  children,
}: {
  /** The game the picture is of. */
  thumb: GameKey;
  /** The small heading over the line ("Game going"). */
  heading: string;
  /** Where the button goes: the table's own page. */
  href: string;
  /** The button's words, without its arrow. */
  resume: string;
  /** The card's test id, and the button's: a few tables keep their own. */
  testId?: string;
  continueTestId?: string;
  /** The game's key, where the card says it (`data-variant`). */
  dataVariant?: string;
  /** Whether the line's parts sit in a wrapping row (most) or run as one line of text. */
  flow?: boolean;
  /** The line: the game's name and how far it has got. */
  children: ReactNode;
}) {
  return (
    <GoingCard thumb={thumb} heading={heading} href={href} action={`${resume} →`} testId={testId} continueTestId={continueTestId} dataVariant={dataVariant}>
      <span className={flow ? "flex flex-wrap items-center gap-x-1.5 text-sm font-medium" : "text-sm font-medium"}>{children}</span>
    </GoingCard>
  );
}
