import "server-only";

/**
 * Email, as a placeholder.
 *
 * Nothing is sent. There is no address list, no provider and no outbound
 * call: each notification is a named event with the data a template would
 * need, and `sendEmail` records that it would have gone. Wiring a provider is
 * a deliberate later decision — set `EMAIL_PROVIDER` and implement
 * `deliver` — and until then this is the whole seam, so the call sites are in
 * place and the day it is switched on nothing else has to change.
 */

export type EmailEvent =
  | { kind: "your-turn"; gameId: string; stone: "black" | "white" }
  | { kind: "game-over"; gameId: string; winner: "black" | "white" | null }
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
 * Records that an email would have been sent. Addresses do not exist yet —
 * there are no accounts — so every event ends here with a receipt saying so.
 * When a provider and an address book exist, this is where `deliver` goes.
 */
export async function sendEmail(event: EmailEvent): Promise<EmailReceipt> {
  const reason = emailProvider() === null ? "no-provider" : "no-address";
  if (process.env.NODE_ENV !== "production") {
    console.info(`[email placeholder] ${event.kind} for game ${event.gameId}: not sent (${reason})`);
  }
  return { delivered: false, reason, event };
}
