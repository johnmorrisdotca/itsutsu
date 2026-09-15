import "server-only";

/**
 * Game notices by email, as a placeholder.
 *
 * Nothing is sent. There is no address list and no outbound call: each
 * notification is a named event with the data a template would need, and
 * `sendEmail` records that it would have gone.
 *
 * THE SITE CAN SEND EMAIL NOW, and these still do not, on purpose. The real
 * sender is `lib/mail/sendMail.ts`, and it sends only on a person's own
 * action under a daily and monthly cap kept inside Resend's free plan. A
 * your-turn notice fires on every move somebody ELSE makes, so wiring these to
 * it would spend the site's day in an afternoon and refuse the invitations a
 * person actually clicked for. Connecting them is a decision about volume and
 * cost for John, not a line to add here. See docs/email.md.
 */

/*
 * A notice about a game names the member it is FOR. Who that is gets decided
 * where the seats are known — `noticeRecipient` in `gameNotices.ts` — and never
 * here: a program's seat, a typed name and a board at one screen are never
 * asked for at all, rather than asked for and found to have no address.
 */
export type EmailEvent =
  | { kind: "your-turn"; gameId: string; stone: "black" | "white"; memberId: string }
  | { kind: "game-over"; gameId: string; winner: "black" | "white" | null; stone: "black" | "white"; memberId: string }
  | { kind: "invite"; gameId: string; stone: "black" | "white" }
  | { kind: "deadline-near"; gameId: string; stone: "black" | "white"; dueAt: string };

export type EmailReceipt = {
  delivered: false;
  reason: "no-provider" | "no-address";
  event: EmailEvent;
};

/** Which provider is configured. Unset means none, which is the current state. */
export function emailProvider(): string | null {
  const provider = process.env.EMAIL_PROVIDER?.trim();
  return provider ? provider : null;
}

/**
 * Records that an email would have been sent. No address is looked up for the
 * member yet, so every event ends here with a receipt saying so. When a
 * provider and an address book exist, this is where `deliver` goes.
 */
export async function sendEmail(event: EmailEvent): Promise<EmailReceipt> {
  const reason = emailProvider() === null ? "no-provider" : "no-address";
  if (process.env.NODE_ENV !== "production") {
    console.info(`[email placeholder] ${event.kind} for game ${event.gameId}: not sent (${reason})`);
  }
  return { delivered: false, reason, event };
}
