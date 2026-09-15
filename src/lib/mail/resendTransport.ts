import "server-only";

import { CONTACT_ADDRESS, MAIL_FROM, MAIL_TIMEOUT_MS, RESEND_EMAILS_URL } from "./mail.constants";
import type { MailTransport } from "./mail.types";

/**
 * Resend, over its HTTP API with `fetch`: one POST per email, no SDK, no
 * retry, no queue. A retry would be a second send the counter never saw.
 *
 * The key goes in the header and nowhere else — never into a result, a log
 * line or an error — and a failure reports only the status Resend answered.
 */
export function resendTransport(apiKey: string, fetchImpl: typeof fetch = fetch): MailTransport {
  return async (mail) => {
    let response: Response;
    try {
      response = await fetchImpl(RESEND_EMAILS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: MAIL_FROM,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
          reply_to: CONTACT_ADDRESS,
        }),
        signal: AbortSignal.timeout(MAIL_TIMEOUT_MS),
      });
    } catch (error) {
      return { ok: false, detail: `request failed: ${error instanceof Error ? error.name : "unknown"}` };
    }
    if (!response.ok) return { ok: false, detail: `Resend answered ${response.status}` };

    const body: unknown = await response.json().catch(() => null);
    const id =
      typeof body === "object" && body !== null && "id" in body && typeof body.id === "string" ? body.id : null;
    return { ok: true, id };
  };
}
