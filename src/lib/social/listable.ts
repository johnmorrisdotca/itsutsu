import { canBeClaimed } from "@/lib/auth/memberId";

/**
 * Whether somebody is a PERSON WITH AN ACCOUNT: a member who can be asked for a
 * game, kept as a buddy, or ignored — not a program, and not a record kept for
 * somebody who never held an account here.
 *
 * It used to be "has an address". That kept programs and kept records off the
 * lists, and a member who came in with an invite code with them, since they have
 * no address either. The row's own markers say the first two exactly — a program
 * has a tier, a kept record carries its reason — and say nothing against the
 * third, which is the point.
 *
 * Pure, so the lists, the challenge route and the chooser all ask it the same
 * way, and so a client component can ask it of a row it was handed.
 */
export function listable(member: { botTier: string | null; unclaimableBecause: string | null } | null): boolean {
  return member !== null && member.botTier === null && canBeClaimed(member.unclaimableBecause);
}
