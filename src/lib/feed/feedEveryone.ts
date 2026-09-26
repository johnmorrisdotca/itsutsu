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
  return seats.length > 0 && seats.every(mayBeNamed) && seats.some((seat) => !isProgram(seat));
}

function isProgram(seat: FeedSeatStanding): boolean {
  return seat !== null && seat.botTier !== null && seat.botTier !== "";
}

/**
 * WHETHER ONE MEMBER MAY BE NAMED ON THE EVERYONE TAB: a program, or a member
 * who has said they are 18 or over — the same rule as a game's seats above,
 * asked of one person. Every line of the site's news that names somebody asks
 * it of each person it names (`feedNews.ts`), so the news cannot name a child
 * the games list would have left out.
 *
 * Null — nobody behind the name, or a member the read could not find — is not
 * named: nobody can say how old they are.
 */
export function mayBeNamed(seat: FeedSeatStanding): boolean {
  if (seat === null) return false;
  return isProgram(seat) || seat.ageBand === AGE_BANDS.adult;
}
