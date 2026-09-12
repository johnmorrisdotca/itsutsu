import "server-only";

/**
 * The names a person may tap at a seat.
 *
 * NOBODY TYPES ANYTHING. John, on how somebody claims their own seat at the
 * kitchen table: "let them find their name. Once they find their name, the four
 * words will match up with them. And everyone doesn't have to type anything when
 * finding their name."
 *
 * That is not only a convenience. This feature exists so his twelve-year-old can
 * take her own seat on his iPad, and the word picker was built with no text box
 * on purpose — she taps words rather than typing a password. Asking her to type a
 * name first was a keyboard in the middle of a design that had removed one.
 *
 * AND IT DISSOLVES THE UNIQUENESS PROBLEM RATHER THAN SOLVING IT. Claiming used
 * to hand the server a typed string and ask which account it meant, which a
 * display name cannot answer: names here are not unique and there is no index on
 * the column. A tap carries the member's id, so there is no string to resolve and
 * nothing that needs to be unique.
 *
 * **WHICH IS WHY THERE IS NO UNIQUE INDEX ON `Member.name` ANYWHERE IN THIS
 * SCHEMA, and why none is coming.** It was very nearly built — a folded-name
 * constraint, a fix to the sign-up path, and a decided answer for "Google handed
 * a new member a name that is taken", all of which had to land together. Every
 * bit of that existed only to make a typed name resolvable. Ask the person who
 * they are instead and the requirement disappears, along with having to tell a
 * newcomer that their own name is spoken for. If a future change finds itself
 * wanting names to be unique, the question to ask first is which code is turning
 * a name into an account, and whether it could be handed an id instead.
 *
 * NOT A SEARCH BOX AND NOT A FILTER. A list, in order, tapped. If it ever grows
 * past what a person can scan, the answer is grouping or paging — never a
 * keyboard, which is the one thing this removes.
 *
 * NOTHING NEW IS DISCLOSED BY PRINTING IT. `/players` already lists every member
 * to any reader — reading this site is open, playing is gated — and every link to
 * a person on it is already `/players/<id>`, so both halves of a row here are
 * public already. What stays secret is the words, and those are checked by
 * `claimOrVerifyPhraseFor` under the guessing limit exactly as before.
 */
import { prisma } from "@/lib/prisma";
import { shownName } from "@/lib/rating/shownName";

import type { SeatPickMember } from "./seatPick.types";

/**
 * Every member who could possibly claim a seat with four words.
 *
 * THE LIST IS THE REFUSALS, READ FORWARDS. `claimOrVerifyPhraseFor` turns away a
 * banned member, a row marked unclaimable — a kept record or a seed, a history
 * nobody may climb inside — and a computer player, which is a program with
 * nobody to be it. Every one of those is left out here for the same reason it is
 * refused there: a name that can never work is a name that must never be offered.
 * The two lists are the same list, and if a refusal is ever added there it
 * belongs here in the same commit.
 *
 * A blank name is left out too. A seat carries the name its rating is filed
 * under, so `seatStandIn` refuses a blank one — and a row with nothing to print
 * is not something a person can recognise and tap in any case.
 */
export async function seatPickList(): Promise<SeatPickMember[]> {
  const rows = await prisma.member.findMany({
    where: { bannedAt: null, unclaimableBecause: null, botTier: null },
    select: { id: true, name: true },
  });

  return rows
    .filter((row) => row.name.trim() !== "")
    .map((row) => ({ id: row.id, shown: shownName(row.name) }))
    /*
     * Sorted on what is PRINTED, not on the column. The column holds the full
     * name and the screen shows a first name and an initial, so ordering by the
     * one would leave the other looking unordered — and a list nobody can scan
     * is the one failure this whole approach is trying to avoid.
     */
    .sort((one, two) => one.shown.localeCompare(two.shown));
}
