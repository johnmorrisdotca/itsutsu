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
export async function admitMember(
  input: Member & { invitedWith?: string },
): Promise<Member & { created: boolean }> {
  const email = foldEmail(input.email);
  const existing = await prisma.member.findUnique({ where: { email }, select: { email: true } });
  if (existing === null) {
    const row = await prisma.member.create({
      data: { email, name: input.name, picture: input.picture, invitedWith: input.invitedWith ?? "" },
      select: { email: true, name: true, picture: true },
    });
    return { ...row, created: true };
  }
  // The name is the member's to choose; Google's is only the first suggestion.
  const row = await prisma.member.update({
    where: { email },
    data: { picture: input.picture, lastSeenAt: new Date() },
    select: { email: true, name: true, picture: true },
  });
  return { ...row, created: false };
}

/** Changes a member's display name. Null when the name is taken by another member. */
export async function renameMember(email: string, name: string): Promise<Member | null> {
  const clash = await prisma.member.findFirst({
    where: { email: { not: foldEmail(email) }, name: { equals: name, mode: "insensitive" } },
    select: { email: true },
  });
  if (clash !== null) return null;
  return prisma.member.update({
    where: { email: foldEmail(email) },
    data: { name },
    select: { email: true, name: true, picture: true },
  });
}
