"use client";

import { BuddyButton } from "@/components/mine/BuddyButton";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { RowMenu } from "@/components/ui/RowMenu";

import type { RowMoreProps } from "./recordTable.types";

/**
 * A ROW'S LESSER ACTIONS, BEHIND ONE SMALL BUTTON: buddy, and ignore.
 *
 * The members list put all three controls — ☆ Buddy, Ignore, Challenge — at the
 * end of every row, and the row could not hold them: at 1280 the table wanted
 * 1,199 pixels in a box of 1,118, so "Challenge" ran 81 pixels past the edge of
 * every line and read "Challe…" (768: 529 past; 400: 865). Every earlier answer
 * found the room somewhere else — a narrower JOINED, a wider page — and each was
 * spent by the next column or the next long name.
 *
 * So a row does what a games site's list of players does: the offer of a game
 * stays in plain sight, because it is what a reader came to the list for, and the
 * rest sit behind "⋯" beside it (`RowMenu`, the one such menu, which My games
 * uses for Resign). Both are still one press and a press away; the row asks for
 * half the width, and the whole table fits at 1280 again.
 *
 * The same `BuddyButton` and `IgnoreButton` as everywhere else, so what a buddy is
 * called cannot drift. A buddy is still marked on the row itself — a star on the
 * button — because who is your buddy is a fact about the row, not an action.
 */
export function RowMore({ memberId, name, isBuddy, ignoring, ignorable = true }: RowMoreProps) {
  const state = `${isBuddy ? ", your buddy" : ""}${ignoring ? ", ignored" : ""}`;
  return (
    <RowMenu
      label={`More for ${name}${state}`}
      title={ignorable ? `Buddy or ignore ${name}` : `Buddy ${name}`}
      className={ignoring ? "text-shu" : ""}
      face={
        <>
          {isBuddy ? <span aria-hidden="true">★</span> : null}
          <span aria-hidden="true">⋯</span>
        </>
      }
    >
      <BuddyButton memberId={memberId} isBuddy={isBuddy} />
      {ignorable ? <IgnoreButton memberId={memberId} ignoring={ignoring} /> : null}
    </RowMenu>
  );
}
