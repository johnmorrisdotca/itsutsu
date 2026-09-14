import { currentMemberId } from "@/lib/auth/currentSession";
import { recordRivals, seatedRivals } from "@/lib/record/rivalry";
import { fetchRivalryView } from "@/lib/record/rivalryRead";

import { RivalryBoard } from "./RivalryBoard";
import type { RivalryPanelProps } from "./rivalry.types";

/**
 * A RIVALRY SCOREBOARD, WHEREVER TWO MEMBERS MEET.
 *
 * Read on the server when the page renders — never fetched from the browser,
 * and never again on a timer. So the board before a game is the board as the
 * page was opened, and the board after one is read when the finished page is.
 *
 * It asks who is reading, because "you" is said only to one of the two: the
 * reader goes first whenever they hold a seat or are half of the pair, and
 * anybody else signed in reads both names. `currentMemberId` is cached for the
 * request, so asking it here costs a page nothing it had not already paid.
 *
 * Draws NOTHING — not an empty board — when there is no pair to read: a seat
 * with nobody's account behind it, one member on both seats, a record not
 * narrowed to two people. An empty board there would say two people had never
 * played, which is a claim about somebody who is not there.
 */
export async function RivalryPanel({ of, variant, moment, thisGameId, testId }: RivalryPanelProps) {
  const readerId = await currentMemberId();
  const pair =
    "seats" in of ? seatedRivals({ ...of.seats, readerId }) : recordRivals({ ...of.record, readerId });
  if (pair === null) return null;
  const view = await fetchRivalryView({ ...pair, readerId, variant, moment, thisGameId });
  if (view === null) return null;
  return <RivalryBoard {...view} testId={testId} />;
}
