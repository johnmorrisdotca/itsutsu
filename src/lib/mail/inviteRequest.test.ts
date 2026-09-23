import { describe, expect, it } from "vitest";

import { INVITE_REQUEST_FIELDS } from "@/components/auth/askForInvite.constants";
import { CONTACT_ADDRESS, MAIL_CAPS } from "./mail.constants";
import type { MailCounter, OutgoingMail } from "./mail.types";
import { inviteRequestLimits, mailLimits } from "./mailLimits";
import { INVITE_REQUEST, inviteRequestMail, readInviteRequest, sendInviteRequest } from "./inviteRequest";

/*
 * John, asking for this form: "Request an invite sends me an email using the
 * email service." And straight after: "Also prevent spam bots making requests
 * and breaking my limits." Every case below is one of those two sentences.
 */

const NOW = new Date("2026-09-22T12:00:00Z");
const SECRET = "a-test-secret-that-is-long-enough-to-sign-with";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

/** The real counting rule, in memory, as `sendMail.test.ts` has it. */
function memoryCounter() {
  const counts = new Map<string, number>();
  const counter: MailCounter = {
    async reserve(limits) {
      const full = limits.find((limit) => (counts.get(limit.key) ?? 0) >= limit.cap);
      if (full !== undefined) return full.refusal;
      for (const limit of limits) counts.set(limit.key, (counts.get(limit.key) ?? 0) + 1);
      return null;
    },
  };
  return { counter, counts };
}

function transportInto(sent: OutgoingMail[]) {
  return async (mail: OutgoingMail) => {
    sent.push(mail);
    return { ok: true as const, id: `id-${sent.length}` };
  };
}

describe("reading an invite request", () => {
  it("takes an address, a name and a sentence", () => {
    expect(readInviteRequest(form({ email: " Ana@Example.com ", name: "Ana", about: "I played on itsyourturn.com for years." }))).toEqual({
      kind: "request",
      request: { email: "ana@example.com", name: "Ana", about: "I played on itsyourturn.com for years." },
    });
  });

  it("treats the hidden field filled in as a script, whatever else it sent", () => {
    expect(readInviteRequest(form({ email: "bot@example.com", [INVITE_REQUEST.trap]: "http://spam.example" }))).toEqual({ kind: "bot" });
  });

  it("asks for an address it can answer, and refuses a link, saying why", () => {
    expect(readInviteRequest(form({ email: "not-an-address" })).kind).toBe("problem");
    expect(readInviteRequest(form({ email: "" })).kind).toBe("problem");
    for (const about of ["see https://cheap.example", "visit www.cheap.example today"]) {
      expect(readInviteRequest(form({ email: "a@example.com", about }))).toMatchObject({ kind: "problem" });
    }
  });

  it("refuses more than the boxes allow, so a script cannot send an essay the form never would", () => {
    const long = "x".repeat(INVITE_REQUEST.aboutLength + 1);
    expect(readInviteRequest(form({ email: "a@example.com", about: long })).kind).toBe("problem");
  });

  it("draws the same limits in the form as it checks", () => {
    expect(INVITE_REQUEST_FIELDS).toEqual(INVITE_REQUEST);
  });
});

describe("the email John receives", () => {
  it("goes to the site's own address, and a reply goes to the visitor", () => {
    const mail = inviteRequestMail({ email: "ana@example.com", name: "Ana", about: "Hello." });
    expect(mail.to).toBe(CONTACT_ADDRESS);
    expect(mail.replyTo).toBe("ana@example.com");
    expect(mail.subject).toBe("Invite request from Ana");
    expect(mail.text).toContain("Hello.");
  });

  it("keeps a name to one line, so it cannot write headers or a second subject", () => {
    const read = readInviteRequest(form({ email: "a@example.com", name: "Ana\r\nBcc: everyone@example.com" }));
    expect(read.kind).toBe("request");
    if (read.kind === "request") expect(inviteRequestMail(read.request).subject).not.toMatch(/[\r\n]/);
  });
});

describe("a flood cannot spend the site's email", () => {
  const request = { email: "ana@example.com", name: "Ana", about: "" };

  it("counts a request under caps of its own, ahead of the site's day and month", () => {
    const limits = inviteRequestLimits({ from: "f", address: "a" }, NOW);
    const [, siteDay, siteMonth] = mailLimits("anyone", NOW);
    expect(limits.map((limit) => limit.cap)).toEqual([1, MAIL_CAPS.requestFromDay, MAIL_CAPS.requestSiteDay, siteDay.cap, siteMonth.cap]);
    expect(limits.slice(-2)).toEqual([siteDay, siteMonth]);
    // The worst a flood can do, said as a number.
    expect(MAIL_CAPS.requestSiteDay).toBeLessThanOrEqual(MAIL_CAPS.siteDay / 10);
  });

  it("sends one request for an address a day, however many times it is pressed", async () => {
    const { counter } = memoryCounter();
    const sent: OutgoingMail[] = [];
    const deps = { counter, transport: transportInto(sent), now: NOW, secret: SECRET };
    expect((await sendInviteRequest(request, "203.0.113.9", deps)).sent).toBe(true);
    expect(await sendInviteRequest(request, "203.0.113.9", deps)).toEqual({ sent: false, refusal: "request-repeat-cap" });
    expect(sent).toHaveLength(1);
  });

  it("stops the whole site at five a day, from however many places a flood comes", async () => {
    const { counter } = memoryCounter();
    const sent: OutgoingMail[] = [];
    const deps = { counter, transport: transportInto(sent), now: NOW, secret: SECRET };
    const outcomes = [];
    for (let at = 0; at < 20; at += 1) {
      outcomes.push(await sendInviteRequest({ ...request, email: `bot${at}@example.com` }, `198.51.100.${at}`, deps));
    }
    expect(sent).toHaveLength(MAIL_CAPS.requestSiteDay);
    expect(outcomes.filter((outcome) => !outcome.sent)).toHaveLength(20 - MAIL_CAPS.requestSiteDay);
    expect(outcomes.at(-1)).toEqual({ sent: false, refusal: "request-day-cap" });
  });

  it("writes neither the visitor's address nor their email into the counter", async () => {
    const { counter, counts } = memoryCounter();
    await sendInviteRequest(request, "203.0.113.9", { counter, transport: transportInto([]), now: NOW, secret: SECRET });
    const keys = [...counts.keys()].join(" ");
    expect(keys).not.toContain("203.0.113.9");
    expect(keys).not.toContain("ana@example.com");
  });
});
