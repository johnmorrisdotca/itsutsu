import "server-only";

import { prisma } from "@/lib/prisma";
import { generateInviteCode, isWellFormedCode, normaliseInviteCode } from "./inviteCode";

export type InviteSummary = {
  code: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number;
  uses: number;
  revoked: boolean;
  note: string;
  lastUsedAt: string | null;
  /** Whether it would be accepted right now. */
  active: boolean;
};

export type RedeemResult =
  | { ok: true; code: string }
  | { ok: false; reason: "malformed" | "unknown" | "revoked" | "expired" | "used-up" };

/** How many times minting retries before admitting the wordlist is crowded. */
const MINT_ATTEMPTS = 12;

function toSummary(row: {
  code: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date | null;
  maxUses: number;
  uses: number;
  revoked: boolean;
  note: string;
  lastUsedAt: Date | null;
}): InviteSummary {
  const spent = row.maxUses > 0 && row.uses >= row.maxUses;
  const expired = row.expiresAt !== null && row.expiresAt.getTime() <= Date.now();

  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    active: !row.revoked && !expired && !spent,
  };
}

/**
 * Mints a new code, retrying on the rare collision with one already issued.
 *
 * The code is the primary key, so a collision is a unique-constraint failure
 * rather than a silent overwrite — two people can never be handed the same
 * phrase pointing at different invitations.
 */
export async function mintInviteCode(
  createdBy: string,
  options: { note?: string; maxUses?: number; expiresInDays?: number } = {},
): Promise<InviteSummary> {
  for (let attempt = 0; attempt < MINT_ATTEMPTS; attempt += 1) {
    const code = generateInviteCode();
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (existing !== null) continue;

    const expiresAt =
      options.expiresInDays !== undefined && options.expiresInDays > 0
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    return toSummary(
      await prisma.inviteCode.create({
        data: {
          code,
          createdBy,
          note: options.note?.trim() ?? "",
          maxUses: Math.max(0, options.maxUses ?? 0),
          expiresAt,
        },
      }),
    );
  }
  throw new Error("Could not mint an unused invite code.");
}

/**
 * Spends one use of a code.
 *
 * The shape is deliberate: a malformed code never reaches the database, and
 * every failure past that point is reported the same way to the caller, so a
 * guesser learns nothing about which of their three words was right.
 */
export async function redeemInviteCode(input: string): Promise<RedeemResult> {
  if (!isWellFormedCode(input)) return { ok: false, reason: "malformed" };

  const code = normaliseInviteCode(input);
  const row = await prisma.inviteCode.findUnique({ where: { code } });
  if (row === null) return { ok: false, reason: "unknown" };
  if (row.revoked) return { ok: false, reason: "revoked" };
  if (row.expiresAt !== null && row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  /*
   * The use count is incremented conditionally rather than read-then-written,
   * so two people redeeming the last use of a code at the same moment cannot
   * both succeed.
   */
  const claimed = await prisma.inviteCode.updateMany({
    where: {
      code,
      revoked: false,
      ...(row.maxUses > 0 ? { uses: { lt: row.maxUses } } : {}),
    },
    data: { uses: { increment: 1 }, lastUsedAt: new Date() },
  });

  if (claimed.count === 0) return { ok: false, reason: "used-up" };
  return { ok: true, code };
}

export async function listInviteCodes(limit = 50): Promise<InviteSummary[]> {
  const rows = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toSummary);
}

/** Revoking is immediate and beats expiry and use count alike. */
export async function revokeInviteCode(input: string): Promise<boolean> {
  const code = normaliseInviteCode(input);
  const updated = await prisma.inviteCode.updateMany({
    where: { code, revoked: false },
    data: { revoked: true },
  });
  return updated.count > 0;
}
