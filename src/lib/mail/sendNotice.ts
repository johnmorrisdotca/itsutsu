import "server-only";

import { preferencesFrom } from "@/lib/preferences/preferences";
import { prisma } from "@/lib/prisma";
import { RECENCY_MINUTES } from "@/lib/social/presence";

import { gameBookOnce } from "./gameOverSummary";
import { NOTICES, SITE_ORIGIN } from "./mail.constants";
import type { AddressBook, NoticeDeps, NoticeEvent, NoticeOutcome } from "./mail.types";
import { MAIL_KINDS, STOP_API_PATH, signStopToken, stopPagePath, type StopKind } from "./mailStop";
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
 *      address, `emailNotify` off, this kind of email off (`mail.<kind>`, at
 *      its default until chosen), or its rule holding it back (a your-turn
 *      email to somebody on the site) is "no-address": nobody to write to now.
 *   3. Its way out (`mailStop.ts`): a signed link in the footer and the
 *      headers a mail program offers in its own menu. An email that cannot be
 *      given one does not go ("no-stop-link") — every email says how to stop
 *      getting it, or it is not sent.
 *   4. For a game that has finished, the game itself (`gameOverSummary.ts`):
 *      read only now, when an email is really going, so an ending nobody is
 *      told about costs nothing. Unreadable, it is left out and the email
 *      says what the event knows.
 *   5. `sendMail`, which is where the caps are. The member a notice is FOR is
 *      the member it is counted against, so the five-a-day limit protects the
 *      person receiving it rather than some notion of a system sender.
 */
export async function sendNotice(event: NoticeEvent, deps: NoticeDeps = {}): Promise<NoticeOutcome> {
  if (!NOTICES.sending) return { sent: false, refusal: "notices-off" };

  const to = await (deps.addresses ?? memberAddresses).addressOf(event.memberId, event.kind);
  if (to === null) return { sent: false, refusal: "no-address" };

  const token = await signStopToken(event.memberId, event.kind);
  if (token === null) return { sent: false, refusal: "no-stop-link" };

  const summary = event.kind === "game-over" ? await (deps.games ?? gameBookOnce()).gameOverOf(event.gameId) : null;
  const mail = noticeMail(event, to, summary, `${SITE_ORIGIN}${stopPagePath(token)}`);
  return sendMail({ ...mail, headers: stopHeaders(token) }, { memberId: event.memberId }, deps);
}

/**
 * The headers Gmail and Apple Mail read to offer their own "unsubscribe": the
 * address to post to, and that one post is enough (RFC 8058), so it takes one
 * click there and no page at all.
 */
export function stopHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${SITE_ORIGIN}${STOP_API_PATH}?token=${token}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * The address book: a member's own address, and only where they have not
 * asked to be left alone. A member who cannot be read is not written to —
 * silence is the safe answer when the question cannot be settled.
 */
export const memberAddresses: AddressBook = {
  async addressOf(memberId: string, kind: StopKind): Promise<string | null> {
    try {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { email: true, emailNotify: true, preferences: true, lastSeenAt: true },
      });
      if (member === null || !member.emailNotify) return null;
      // This kind as chosen, or at its default where nobody has (`MAIL_KINDS`).
      if (preferencesFrom(member.preferences)[MAIL_KINDS[kind].preference] === "off") return null;
      // Its rule: a kind held back while the member is on the site, where they can see it for themselves.
      if (MAIL_KINDS[kind].notWhileHere && Date.now() - member.lastSeenAt.getTime() < RECENCY_MINUTES.now * 60_000) return null;
      return member.email;
    } catch (error) {
      console.error("[mail] a member's address could not be read", error);
      return null;
    }
  },
};
