import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OutgoingMail, SendOutcome } from "@/lib/mail/mail.types";

/**
 * A member's invitation, with and without the email.
 *
 * The session, the store and the sender are faked: what is under test is the
 * route's own decisions — that an address is checked before anything is made,
 * that the email carries the code that was made, and that a refused email
 * still hands the member the link along with the reason.
 */
let member: { id: string; name: string } | null = { id: "m-1", name: "Kenji" };
let outcome: SendOutcome = { sent: true, id: "e-1" };

const mintInviteCode = vi.fn(async () => ({ code: "hoshi-kuma-nami" }));
const sendMail = vi.fn(async (mail: OutgoingMail, sender: { memberId: string }) => {
  void mail;
  void sender;
  return outcome;
});

vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: { createGame: {} } }));
vi.mock("@/lib/auth/currentSession", () => ({
  currentMemberRow: async () => member,
  currentEmail: async () => null,
}));
vi.mock("@/lib/invite/inviteStore", () => ({ mintInviteCode: () => mintInviteCode() }));
vi.mock("@/lib/mail/sendMail", () => ({
  sendMail: (mail: OutgoingMail, sender: { memberId: string }) => sendMail(mail, sender),
}));

const { POST } = await import("./route");

function post(body?: unknown): Request {
  return new Request("http://localhost/api/invites/mine", {
    method: "POST",
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  member = { id: "m-1", name: "Kenji" };
  outcome = { sent: true, id: "e-1" };
  mintInviteCode.mockClear();
  sendMail.mockClear();
});

describe("POST /api/invites/mine", () => {
  it("with no address, makes a code and sends nothing", async () => {
    const response = await POST(post());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ code: "hoshi-kuma-nami" });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("with an address, emails that code to it, as the member's own action", async () => {
    const response = await POST(post({ sendTo: " friend@example.com " }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ code: "hoshi-kuma-nami", emailed: true, notice: null });

    expect(sendMail).toHaveBeenCalledTimes(1);
    const [mail, sender] = sendMail.mock.calls[0]!;
    expect(mail.to).toBe("friend@example.com");
    expect(mail.text).toContain("https://itsutsu.com/join?code=hoshi-kuma-nami");
    expect(mail.subject).toContain("Kenji");
    expect(sender).toEqual({ memberId: "m-1" });
  });

  it("refused by a cap, still hands back the link, with the reason in words", async () => {
    outcome = { sent: false, refusal: "site-day-cap" };
    const response = await POST(post({ sendTo: "friend@example.com" }));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.code).toBe("hoshi-kuma-nami");
    expect(body.emailed).toBe(false);
    expect(body.notice).toMatch(/today, so this one was not sent/);
  });

  it("refuses something that is not an address before making anything", async () => {
    const response = await POST(post({ sendTo: "not an address" }));
    expect(response.status).toBe(400);
    expect(mintInviteCode).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("refuses somebody signed out before making or sending anything", async () => {
    member = null;
    const response = await POST(post({ sendTo: "friend@example.com" }));
    expect(response.status).toBe(401);
    expect(mintInviteCode).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
