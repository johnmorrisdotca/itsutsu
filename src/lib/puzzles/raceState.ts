/**
 * What a race is at a moment: each seat's state and, once both are settled,
 * who won. Pure, so the page, the routes and the tests read one answer.
 *
 * A seat is WAITING until its Start, SOLVING from then, FINISHED when a
 * right answer was handed in, and GIVEN UP when a sitting has run out with no
 * finish — decided when the race is read, never by a timer (John: "no server
 * calculations"). One sitting is `RACE_SITTING_MS`: John asked for a solve
 * "in one sitting", and two hours is longer than any puzzle here takes and
 * shorter than a race left open for a day.
 *
 * The winner is the faster correct solve. One finish against a seat given up
 * is a win; two given up is nothing; a seat still waiting or solving means
 * the race is not over.
 */
export const RACE_SITTING_MS = 2 * 60 * 60 * 1000;

export type RaceSeat = "host" | "guest";
export const RACE_SEATS: readonly RaceSeat[] = ["host", "guest"];

export type SeatStamps = { startedAt: Date | null; finishedAt: Date | null };

export type SeatState =
  | { state: "waiting" }
  | { state: "solving"; since: Date }
  | { state: "finished"; elapsedMs: number }
  | { state: "gaveUp" };

export function seatState(stamps: SeatStamps, now: Date): SeatState {
  if (stamps.startedAt === null) return { state: "waiting" };
  if (stamps.finishedAt !== null) return { state: "finished", elapsedMs: stamps.finishedAt.getTime() - stamps.startedAt.getTime() };
  if (now.getTime() - stamps.startedAt.getTime() > RACE_SITTING_MS) return { state: "gaveUp" };
  return { state: "solving", since: stamps.startedAt };
}

export type RaceOutcome = { over: false } | { over: true; winner: RaceSeat | null };

/** Over once neither seat can still finish; the winner is the faster finish, or the only one. */
export function raceOutcome(host: SeatState, guest: SeatState): RaceOutcome {
  const settled = (seat: SeatState) => seat.state === "finished" || seat.state === "gaveUp";
  if (!settled(host) || !settled(guest)) return { over: false };
  if (host.state === "finished" && guest.state === "finished") {
    if (host.elapsedMs === guest.elapsedMs) return { over: true, winner: null };
    return { over: true, winner: host.elapsedMs < guest.elapsedMs ? "host" : "guest" };
  }
  if (host.state === "finished") return { over: true, winner: "host" };
  if (guest.state === "finished") return { over: true, winner: "guest" };
  return { over: true, winner: null };
}

/** Whether a seat may still press Start: not started, and the other seat has not finished so long ago that a start is pointless is NOT a rule — a late start still counts, and loses on time. */
export function canStart(seat: SeatState): boolean {
  return seat.state === "waiting";
}

/** Whether a seat may hand an answer in: started, inside its sitting, not yet finished. */
export function canFinish(seat: SeatState): boolean {
  return seat.state === "solving";
}
