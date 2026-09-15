import "server-only";

import { prisma } from "@/lib/prisma";

import { OPERATOR_ACTIONS, OPERATOR_DETAIL_MAX } from "./operatorLog.constants";
import type { OperatorActionEntry, OperatorActionInput, OperatorActionName, OperatorActor } from "./operatorLog.types";

/**
 * What the operator did TO SOMEBODY ELSE'S ACCOUNT: a line in the deployment's
 * log, and a row the operator can read back.
 *
 * It was the console line alone, said plainly at the time: "this site has
 * nowhere better yet". Shutting an account recorded nothing, and setting a
 * member's four words recorded a line gone with the log retention. The row is
 * `OperatorAction`, listed newest first on the Admin page's log tab, and written
 * in the same transaction as the change wherever the change is a single write —
 * see `setBanned` and `setPhrase`, which take the act and write both at once.
 *
 * WHAT MAY GO IN ONE. Who acted, what they did, which member it was done to,
 * and a short line of fact the writer states itself. Never a credential and
 * never the material of one: the four words a member picks are a password, they
 * are never stored, and a log is exactly the place they must not appear. Nothing
 * here reads a request body, a ticket or a phrase, and `detail` is capped and
 * flattened so it cannot carry a message.
 */

/** The console line, kept beside the row: the deployment's own log is still worth having. */
export function logOperatorAction(who: string | null | undefined, what: string): void {
  const actor = (who ?? "").trim();
  /*
   * The bare word for an unnamed operator, which is honest rather than tidy:
   * the operator is authorised by ADMIN_EMAILS and a session may carry no
   * address at all. An empty pair of brackets would read as a lost field.
   */
  console.info(`[operator${actor === "" ? "" : ` ${actor}`}] ${what}`);
}

/**
 * The operator as their session knows them. NULL WHERE IT DOES NOT SAY, not an
 * empty string: an operator signed in by token has an address and may have no
 * member row, and "" in a column reads as a value somebody chose.
 */
export function operatorActor(session: { memberId?: string; email?: string } | null | undefined): OperatorActor {
  const memberId = session?.memberId?.trim() ?? "";
  const email = session?.email?.trim() ?? "";
  return { memberId: memberId === "" ? null : memberId, email: email === "" ? null : email };
}

/** A line of fact, flattened to one line and capped, so it can never become a message. */
export function operatorDetail(text: string | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, OPERATOR_DETAIL_MAX);
}

/**
 * The row an act becomes: these fields and no others, so nothing a caller holds
 * can ride along into the table. A blank subject is refused rather than written,
 * because a record of an act done to nobody is not a record of anything.
 */
export function operatorActionData(input: OperatorActionInput) {
  const subjectId = input.subjectId.trim();
  if (subjectId === "") throw new Error("An operator action names the member it was done to.");
  return {
    actorMemberId: input.actor.memberId,
    actorEmail: input.actor.email,
    action: input.action,
    subjectId,
    detail: operatorDetail(input.detail),
  };
}

/**
 * The write, NOT YET RUN — for a caller that puts it in the same
 * `prisma.$transaction([...])` as the change it records.
 */
export function operatorActionWrite(input: OperatorActionInput) {
  return prisma.operatorAction.create({ data: operatorActionData(input) });
}

/**
 * The write, run on its own, for an act that changes no row — opening a
 * four-word pick writes nothing to the member, so there is no change to share a
 * transaction with.
 */
export async function recordOperatorAction(input: OperatorActionInput): Promise<void> {
  await operatorActionWrite(input);
}

function knownAction(value: string): value is OperatorActionName {
  return Object.hasOwn(OPERATOR_ACTIONS, value);
}

/**
 * The most recent acts, newest first, with each member's name as it is now.
 *
 * One query for the acts and one for the names, however many rows. A member row
 * that has gone leaves the act standing with a null name rather than dropping it:
 * the log exists to outlive exactly that. An action this version does not know —
 * written by a newer deployment mid-release — is listed under its own word rather
 * than hidden.
 */
export async function listOperatorActions(limit: number): Promise<OperatorActionEntry[]> {
  const rows = await prisma.operatorAction.findMany({ orderBy: [{ at: "desc" }, { id: "desc" }], take: limit });
  const ids = [...new Set(rows.map((row) => row.subjectId))];
  const members =
    ids.length === 0 ? [] : await prisma.member.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const names = new Map(members.map((member) => [member.id, member.name]));
  return rows.map((row) => ({
    id: row.id,
    at: row.at,
    actor: { memberId: row.actorMemberId, email: row.actorEmail },
    action: row.action,
    known: knownAction(row.action),
    subjectId: row.subjectId,
    subjectName: names.get(row.subjectId) ?? null,
    detail: row.detail,
  }));
}
