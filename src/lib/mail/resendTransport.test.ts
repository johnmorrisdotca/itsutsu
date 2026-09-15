import { describe, expect, it, vi } from "vitest";

import { CONTACT_ADDRESS, MAIL_FROM, RESEND_EMAILS_URL } from "./mail.constants";
import { resendTransport } from "./resendTransport";

/** The transport's request, against a fetch this file writes. Nothing reaches Resend. */
const MAIL = { to: "friend@example.com", subject: "Hello", text: "Come and play." };
const KEY = "re_test_not_a_real_key";

describe("resendTransport", () => {
  it("makes one POST with the key in the header and the mail in the body", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({ id: "abc-123" }));

    const result = await resendTransport(KEY, fetchImpl)(MAIL);

    expect(result).toEqual({ ok: true, id: "abc-123" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(RESEND_EMAILS_URL);
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    expect(JSON.parse(String(init?.body))).toEqual({
      from: MAIL_FROM,
      to: [MAIL.to],
      subject: MAIL.subject,
      text: MAIL.text,
      reply_to: CONTACT_ADDRESS,
    });
  });

  it("reports a refusal by status alone, without the key", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({ message: `bad key ${KEY}` }, { status: 403 }));

    const result = await resendTransport(KEY, fetchImpl)(MAIL);

    expect(result).toEqual({ ok: false, detail: "Resend answered 403" });
  });

  it("reports a request that never answered, and does not retry", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new DOMException("timed out", "TimeoutError");
    });

    const result = await resendTransport(KEY, fetchImpl)(MAIL);

    expect(result).toEqual({ ok: false, detail: "request failed: TimeoutError" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
