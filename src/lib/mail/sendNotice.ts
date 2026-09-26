import "server-only";

import { prisma } from "@/lib/prisma";

import { gameBookOnce } from "./gameOverSummary";
import { NOTICES } from "./mail.constants";
import type { AddressBook, NoticeDeps, NoticeEvent, NoticeOutcome } from "./mail.types";
import { noticeMail } from "./noticeMail";
import { sendMail } from "./sendMail";

/**
 * THE ONE DOOR A GAME NOTICE CAN LEAVE BY, and it opens onto `sendMail`.
 *
 * This replaces `lib/notify/email.ts`, which was a second sender: it answered
 * "not sent" for everything, read an `EMAIL_PROVIDER` variable set nowhere,
 * and had a refusal vocabulary of its own. Nothing was wrong with what it did
 * — it did nothing — but it was the wrong SHAPE. Every notification ticket on
 * the board routes through here, and the smaller diff for each of them was
 * always to give this file a transport of its own, which is a second way out
 * of the site that the caps in `mailCounter.ts` never see. Resend then stops
 * the account at a hundred and the invitations people actually clicked for
 * stop with it.
 *
 * So there is no transport here and there never will be one:
 * `oneSender.coverage.test.ts` fails the build if a second module reaches for
 * `resendTransport` or posts to a provider itself.
 *
 * In order:
 *
 *   1. Are notices switched on? They are not — see `NOTICES` for why a
 *      your-turn email on every move would spend the site's day before lunch.
 *      Nothing is read and nothing is counted while that is false.
 *   2. Is there an address, and does this member want to hear? No row, no
 *      address, or `emailNotify` off is "no-address": nobody to write to.
 *   3. For a game that has finished, the game itself (`gameOverSummary.ts`):
 *      read only now, when an email is really going, so an ending nobody is
 *      told about costs nothing. Unreadable, it is left out and the email
 *      says what the event knows.
 *   4. `sendMail`, which is where the caps are. The member a notice is FOR is
 *      the member it is counted against, so the five-a-day limit protects the
 *      person receiving it rather than some notion of a system sender.
 */
export async function sendNotice(event: NoticeEvent, deps: NoticeDeps = {}): Promise<NoticeOutcome> {
  if (!NOTICES.sending) return { sent: false, refusal: "notices-off" };

  const to = await (deps.addresses ?? memberAddresses).addressOf(event.memberId);
  if (to === null) return { sent: false, refusal: "no-address" };

  const summary = event.kind === "game-over" ? await (deps.games ?? gameBookOnce()).gameOverOf(event.gameId) : null;
  return sendMail(noticeMail(event, to, summary), { memberId: event.memberId }, deps);
}

/**
 * The address book: a member's own address, and only where they have not
 * asked to be left alone. A member who cannot be read is not written to —
 * silence is the safe answer when the question cannot be settled.
 */
export const memberAddresses: AddressBook = {
  async addressOf(memberId: string): Promise<string | null> {
    try {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { email: true, emailNotify: true },
      });
      if (member === null || !member.emailNotify) return null;
      return member.email;
    } catch (error) {
      console.error("[mail] a member's address could not be read", error);
      return null;
    }
  },
};
