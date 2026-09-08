import "server-only";

import { prisma } from "@/lib/prisma";

export type Member = { email: string; name: string; picture: string };

/** Emails are compared folded; Google gives them in whatever case the user typed once. */
export function foldEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The member for an address, or null when the address has not been let in. */
export async function findMember(email: string): Promise<Member | null> {
  const row = await prisma.member.findUnique({
    where: { email: foldEmail(email) },
    select: { email: true, name: true, picture: true },
  });
  return row;
}

/**
 * Lets an address in. The first sign-in is the registration: there is no
 * form, no password, no confirmation mail — Google has already proved the
 * address, and the invite code (or the operator) says it is welcome. Signing
 * in again refreshes the name and picture, which people change.
 */
export async function admitMember(input: Member & { invitedWith?: string }): Promise<Member> {
  const email = foldEmail(input.email);
  const row = await prisma.member.upsert({
    where: { email },
    create: { email, name: input.name, picture: input.picture, invitedWith: input.invitedWith ?? "" },
    update: { name: input.name, picture: input.picture, lastSeenAt: new Date() },
    select: { email: true, name: true, picture: true },
  });
  return row;
}
