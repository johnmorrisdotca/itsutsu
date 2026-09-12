/**
 * WHETHER A GAME BEING CREATED IS STORED AS ONE THAT COUNTS.
 *
 * Three sources can answer, they disagree, and the order they are asked in is
 * the whole of this module. It lived inline in `POST /api/games/live` as one
 * `??` chain with the reasoning in a comment beside it, and it grew a third
 * clause; the line-length gate objected, which was right — a route that
 * receives a request, seats two players, checks four limits and ALSO decides a
 * rating rule is a file doing one job too many. The rule has a name and a test
 * of its own now, and the route asks it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE ORDER, AND WHY EACH ONE IS WHERE IT IS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **The seats first, and they are not negotiable.** Two seats on one screen
 * share one token, and every write path checks that before it records a
 * result: `appendMove`, `settleEnded`, `claimTimeout` and `resignGame` each
 * ask `isHotSeat` before `recordResult`. A game's two tokens are written once
 * at creation and never rewritten, so a board that is one screen today is one
 * screen for as long as it exists. `rated: true` on such a row is therefore
 * not a preference the site might honour later — it is a claim about the
 * result that can never come true.
 *
 * OFFERS DID NOT MOVE THAT CASE, and it is worth saying because it looks as
 * though it might have: a fork against a known person is an OFFER now rather
 * than a binding, and neither of an offer's seats is hot seat. The route still
 * sets `hotSeat` in exactly one place — where a fork finds NOBODY to ask — and
 * that is precisely the fork that becomes a game at one screen, which is the
 * one this refuses a rating for.
 *
 * That is not a hypothetical. Twelve finished rows on production carried it,
 * and their pages showed rated results for games no ladder had ever counted
 * (see `ratedButRefused.ts`, which corrects them). Ten of the twelve had two
 * ordinary, different names, so nothing about the row looked wrong. The write
 * path stopped DEFAULTING a hot-seat game to rated in 0.145.2; a fork went on
 * INHERITING it from the game it was taken out of, which is how one bad row
 * could make another.
 *
 * **Then what the game this one came out of said.** A rematch is the same
 * game and a fork continues a position, so what they carry beats what the
 * caller sends — that ordering is why a clock travels with a fork at all,
 * after a three-day-a-move game once forked into a five-minute one. A fork
 * whose caller has settled the pace for itself arrives here with nothing
 * carried, because `FORK_PACE_SETTINGS` has already taken it out.
 *
 * **Then the request.** Said outright, honoured outright.
 *
 * **And silence means yes.** That is what a posted seat and a challenge have
 * always meant by saying nothing — `StartGame` and `ChallengeButton` send
 * neither `rated` nor `hotSeat` — so the default belongs here rather than in
 * the schema, where the next reader would not think to look for it.
 *
 * UNDEFINED RATHER THAN FALSE for both of the first two. "Nobody said" and
 * "somebody said no" are different answers, and a boolean that means both is
 * the fault this codebase calls a report that cannot answer: it is exactly how
 * an absent `rated` used to become a rated game.
 */
export function ratedAtCreation(asked: {
  /** What the request said, or undefined where it said nothing at all. */
  requested: boolean | undefined;
  /** What the forked or rematched game said, or undefined where there is none. */
  carried: boolean | undefined;
  /** Two seats, one screen, one token — see `isHotSeat`. */
  hotSeat: boolean;
}): boolean {
  if (asked.hotSeat) return false;
  return asked.carried ?? asked.requested ?? true;
}
