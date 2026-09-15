import { describe, expect, it } from "vitest";

import { inviteMail } from "./inviteMail";
import { CONTACT_ADDRESS } from "./mail.constants";

const JOIN = "https://itsutsu.com/join?code=hoshi-kuma-nami";

describe("inviteMail", () => {
  it("names the inviter, carries the link and says how long it lasts", () => {
    const mail = inviteMail({ to: "friend@example.com", inviterName: "Kenji", joinUrl: JOIN, days: 30 });
    expect(mail.to).toBe("friend@example.com");
    expect(mail.subject).toBe("Kenji has invited you to play on Itsutsu");
    expect(mail.text).toContain(JOIN);
    expect(mail.text).toContain("30 days");
    expect(mail.text).toContain(CONTACT_ADDRESS);
    expect(mail.text).toContain("has not saved your address");
  });

  it("keeps a typed name on one line, so it can never add a header", () => {
    const mail = inviteMail({
      to: "friend@example.com",
      inviterName: `Kenji${String.fromCharCode(13, 10)}Bcc: everyone@example.com`,
      joinUrl: JOIN,
      days: 30,
    });
    expect(mail.subject).toBe("Kenji Bcc: everyone@example.com has invited you to play on Itsutsu");
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it("falls back to a friend for a blank name, and trims a long one", () => {
    expect(inviteMail({ to: "a@example.com", inviterName: "  ", joinUrl: JOIN, days: 30 }).subject).toBe(
      "A friend has invited you to play on Itsutsu",
    );
    const long = inviteMail({ to: "a@example.com", inviterName: "x".repeat(200), joinUrl: JOIN, days: 30 });
    expect(long.subject.startsWith(`${"x".repeat(60)} has`)).toBe(true);
  });
});
