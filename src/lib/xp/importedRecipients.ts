import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { legaciesForName } from "@/lib/legacy/legacyPlayers.data";
import type { LegacyPlayer } from "@/lib/legacy/legacyPlayers.types";

import { importedPlayedOn, importedXpEligible } from "./importedXp";
import type { ImportedFacts } from "./importedNote";

/**
 * What a justification line says about one member's imported credit, or null
 * where there is none to justify. The sites and games are read from the kept
 * records the site attaches to this name — what was PLAYED — and the amount
 * from the member row — what was PAID.
 */
export function importedFactsFor(name: string, imported: number): ImportedFacts | null {
  if (!(imported > 0)) return null;
  const played = importedPlayedOn(legaciesForName(name).filter(importedXpEligible));
  return { xp: imported, games: played.games > 0 ? played.games : null, sites: played.sites };
}

/**
 * WHICH MEMBER EACH KEPT RECORD PAYS, AND THE CHECK THAT SAYS A RUN LANDED.
 *
 * Pure, so both can be checked without a database.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A RECORD PAYS THE MEMBER THE SITE ALREADY SHOWS IT BESIDE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * By `legaciesForName`, which is how the players page and the directory attach a
 * kept record to a member row today — so imported XP lands on exactly the row
 * whose record already reaches back to that site. Two refusals, both saying why:
 *
 * - **A name more than one member answers to.** The development database holds
 *   two John Morris rows, and a record paid to both would be one man's games
 *   paid twice; paid to one, a guess. Neither is paid, and the dry run names it.
 * - **The wrong kind of row.** A "remembered" or "honorary" record IS the person
 *   and belongs on the kept-record row made for them; an "elsewhere" record is
 *   the earlier chapter of a live account and never belongs on a kept-record
 *   row. A mismatch means a name collided with a record, not that a record was
 *   found.
 *
 * Programs have no kept records and are never asked about.
 */

/** A member row, as much of one as deciding this needs. */
export type ImportedCandidate = {
  id: string;
  name: string;
  botTier: string | null;
  unclaimableBecause: string | null;
};

export type ImportedRecipient = { memberId: string; name: string; legacies: LegacyPlayer[] };

export type ImportedRefusal = { legacy: string; memberIds: string[]; why: string };

export function recipientsOf(members: readonly ImportedCandidate[]): {
  recipients: ImportedRecipient[];
  refused: ImportedRefusal[];
} {
  const claims = new Map<string, { legacy: LegacyPlayer; members: ImportedCandidate[] }>();
  const refused: ImportedRefusal[] = [];

  for (const member of members) {
    if (member.botTier !== null) continue;
    for (const legacy of legaciesForName(member.name)) {
      if (!importedXpEligible(legacy)) continue;
      const keptRow = member.unclaimableBecause === UNCLAIMABLE_REASONS.keptRecord;
      const belongs = legacy.kind === "elsewhere" ? !keptRow : keptRow;
      if (!belongs) {
        refused.push({
          legacy: legacy.slug,
          memberIds: [member.id],
          why:
            legacy.kind === "elsewhere"
              ? `"${legacy.name}" is the earlier chapter of a live account, and this row is a kept record`
              : `"${legacy.name}" is a ${legacy.kind} record, and this row is not the kept-record row made for it`,
        });
        continue;
      }
      const held = claims.get(legacy.slug) ?? { legacy, members: [] };
      held.members.push(member);
      claims.set(legacy.slug, held);
    }
  }

  const byMember = new Map<string, ImportedRecipient>();
  for (const { legacy, members: claimants } of claims.values()) {
    if (claimants.length > 1) {
      refused.push({
        legacy: legacy.slug,
        memberIds: claimants.map((one) => one.id),
        why: `${claimants.length} member rows answer to the name "${legacy.name}"; paying one would be a guess and paying all would pay one record twice`,
      });
      continue;
    }
    const [only] = claimants;
    const recipient = byMember.get(only.id) ?? { memberId: only.id, name: only.name, legacies: [] };
    recipient.legacies.push(legacy);
    byMember.set(only.id, recipient);
  }

  return { recipients: [...byMember.values()], refused };
}

/** A member's three totals, with a name for a report. */
export type TotalsRow = { id: string; name: string; xp: number; xpImported: number; xpEverywhere: number };

/**
 * Every member whose totals do not agree with their ledger or with each other.
 *
 * The backfill's one check — `Member.xp` equals the sum of its rows — made three:
 * `xp` against the Itsutsu rows, `xpImported` against the imported rows, and
 * `xpEverywhere` against the two added up. A member with no rows reads as nought
 * rather than missing, because a total over an empty ledger is exactly the
 * disagreement being looked for.
 */
export function totalsDisagreements(
  members: readonly TotalsRow[],
  itsutsu: ReadonlyMap<string, number>,
  imported: ReadonlyMap<string, number>,
): string[] {
  return members.flatMap((member) => {
    const here = itsutsu.get(member.id) ?? 0;
    const elsewhere = imported.get(member.id) ?? 0;
    const who = member.name || member.id;
    const problems: string[] = [];
    if (member.xp !== here) problems.push(`${who}: xp ${member.xp}, Itsutsu ledger ${here}`);
    if (member.xpImported !== elsewhere) problems.push(`${who}: xpImported ${member.xpImported}, imported ledger ${elsewhere}`);
    if (member.xpEverywhere !== member.xp + member.xpImported) {
      problems.push(`${who}: xpEverywhere ${member.xpEverywhere}, xp + xpImported ${member.xp + member.xpImported}`);
    }
    return problems;
  });
}
