import { AGE_BANDS } from "@/lib/social/ageBand.constants";

import type { FeedSeatStanding } from "./feed.types";

/**
 * WHETHER A FINISHED GAME MAY BE SHOWN ON THE EVERYONE TAB.
 *
 * A HARD RULE, NOT A SETTING. John, 2026-09-25, on a feed of games everybody
 * can read: "Whatever falls under safe to post. So no 13 year olds then." The
 * stricter reading, which is this site's standing answer for children
 * (`childRules.ts`): a game is shown only when EVERY seat is either a program
 * or a member who has said they are 18 or over.
 *
 * - A member under 13 or aged 13 to 17: not shown.
 * - A member who has never been asked (`ageBand` null): not shown. Null is not
 *   a band, and nothing here reads it as "adult" — see `ageBand.constants.ts`.
 * - A seat nobody is behind (a name typed at one screen, an anonymous link):
 *   not shown, because nobody can say how old whoever sat there is.
 * - A program (`botTier` set): fine, it has no age.
 * - Two programs and no person: not shown either. That is a bot series, not
 *   somebody's game, and a ladder-filling batch would bury every real one.
 *
 * Asked of every row the Everyone read returns, after the read and before
 * anything is drawn, so nothing about a member under 18 is ever on that tab.
 */
export function everyoneMayShow(seats: readonly FeedSeatStanding[]): boolean {
  if (seats.length === 0) return false;
  let person = false;
  for (const seat of seats) {
    if (seat === null) return false;
    if (seat.botTier !== null && seat.botTier !== "") continue;
    if (seat.ageBand !== AGE_BANDS.adult) return false;
    person = true;
  }
  return person;
}
