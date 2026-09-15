import type { ClaimRefusal } from "./claimRecord.types";

/**
 * What the operator is told for each refusal: the reason in a sentence, and what
 * would have to be true for the claim to go through where anything could be.
 *
 * Never a name. The operator typed the name and can see it; a sentence that
 * repeats it is a sentence that can end up in a log.
 */
export const CLAIM_REFUSAL_COPY: Record<ClaimRefusal, string> = {
  "no-name": "Say the name the games were played under.",
  "no-member": "No such member.",
  "member-unclaimable":
    "That row is a kept record, a seeded row or a computer player. It stands as it is, so nothing is attached to it.",
  "member-nameless":
    "That member has no name yet. A claimed rating is shown under the member's name, so give them one first.",
  "record-unclaimable":
    "That name belongs to a kept record, a seeded row or a computer player, and a row marked that way can never be claimed by anybody.",
  "name-held":
    "Another member goes by that name now, so the site already counts its results as theirs. It is not an unclaimed record.",
  "already-claimed": "Some of what stands under that name already belongs to a member, so it is not an unclaimed record.",
  "nothing-to-claim":
    "Nothing under that name is left to attach: no rating, per-game standing or finished game that belongs to nobody.",
  "has-standing":
    "This member already has a rating where that record has one. Two ratings cannot be added together, and one person stands on a ladder once, so this is not attached.",
};

/**
 * The detail line the operator log keeps for a claim: counts, and nothing a
 * person typed. See `ClaimPlan`.
 */
export function claimDetail(plan: { games: number; seats: number; rating: boolean; standings: number }): string {
  const games = `${plan.games} finished game${plan.games === 1 ? "" : "s"}`;
  const seats = `${plan.seats} seat${plan.seats === 1 ? "" : "s"} bound`;
  const rating = plan.rating ? "a rating" : "no rating";
  const standings = `${plan.standings} per-game standing${plan.standings === 1 ? "" : "s"}`;
  return `attached a record: ${games}, ${seats}, ${rating}, ${standings}`;
}
