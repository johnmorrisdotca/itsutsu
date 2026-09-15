import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAIL_CAPS, MAIL_REFUSAL_TEXT, RESEND_FREE_PLAN } from "./mail.constants";
import type { MailCounter, MailRefusal, MailTransport, OutgoingMail } from "./mail.types";
import { mailLimits } from "./mailLimits";
import { mailRefusalFor } from "./mailSwitch";
import { sendMail } from "./sendMail";

/**
 * The one sending module, with its one seam faked.
 *
 * Nothing here reaches Resend or a database: the transport is a function this
 * file writes, and the counter is an in-memory copy of the real counter's
 * rule — every limit moves or none does, and a full one moves nothing. The
 * real counter's SQL is proven against Postgres in `mailCounter.play.test.ts`.
 */
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const NOW = new Date("2026-09-15T12:00:00Z");
const MEMBER = "m-inviter";
const MAIL: OutgoingMail = { to: "friend@example.com", subject: "Hello", text: "Come and play." };

/** The real rule, in memory: check every limit, then move all of them, in one turn of the event loop. */
function memoryCounter(start: Record<string, number> = {}) {
  const counts = new Map<string, number>(Object.entries(start));
  const counter: MailCounter = {
    async reserve(limits) {
      // Yield first, so two sends started together genuinely interleave here.
      await Promise.resolve();
      const full = limits.find((limit) => (counts.get(limit.key) ?? 0) >= limit.cap);
      if (full !== undefined) return full.refusal;
      for (const limit of limits) counts.set(limit.key, (counts.get(limit.key) ?? 0) + 1);
      return null;
    },
  };
  return { counter, counts };
}

const [memberDayKey, siteDayKey, siteMonthKey] = mailLimits(MEMBER, NOW).map((limit) => limit.key);

function fakeTransport(result: Awaited<ReturnType<MailTransport>> = { ok: true, id: "email-1" }) {
  return vi.fn<MailTransport>(async () => result);
}

let warn: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  error = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("sendMail", () => {
  it("sends once through the transport and counts the member, the day and the month", async () => {
    const { counter, counts } = memoryCounter();
    const transport = fakeTransport();

    const outcome = await sendMail(MAIL, { memberId: MEMBER }, { transport, counter, now: NOW });

    expect(outcome).toEqual({ sent: true, id: "email-1" });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledWith(MAIL);
    expect(counts.get(memberDayKey)).toBe(1);
    expect(counts.get(siteDayKey)).toBe(1);
    expect(counts.get(siteMonthKey)).toBe(1);
  });

  it("keys the counters by UTC day and month", () => {
    expect(mailLimits(MEMBER, NOW).map((limit) => limit.key)).toEqual([
      `member:${MEMBER}:day:2026-09-15`,
      "site:day:2026-09-15",
      "site:month:2026-09",
    ]);
  });

  describe("refuses past a cap, sends nothing, and says so", () => {
    const cases: [string, Record<string, number>, MailRefusal][] = [
      ["the site's day", { [siteDayKey]: MAIL_CAPS.siteDay }, "site-day-cap"],
      ["the site's month", { [siteMonthKey]: MAIL_CAPS.siteMonth }, "site-month-cap"],
      ["one member's day", { [memberDayKey]: MAIL_CAPS.memberDay }, "member-day-cap"],
    ];
    for (const [name, start, refusal] of cases) {
      it(`at ${name}`, async () => {
        const { counter, counts } = memoryCounter(start);
        const transport = fakeTransport();

        const outcome = await sendMail(MAIL, { memberId: MEMBER }, { transport, counter, now: NOW });

        expect(outcome).toEqual({ sent: false, refusal });
        expect(transport).not.toHaveBeenCalled();
        expect(MAIL_REFUSAL_TEXT[refusal]).toMatch(/not sent/);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(refusal));
        // Nothing else was counted for an email that did not go.
        for (const key of [memberDayKey, siteDayKey, siteMonthKey]) {
          expect(counts.get(key) ?? 0).toBe(start[key] ?? 0);
        }
      });
    }
  });

  it("lets exactly one of two simultaneous sends take the day's last place", async () => {
    const { counter, counts } = memoryCounter({ [siteDayKey]: MAIL_CAPS.siteDay - 1 });
    const transport = fakeTransport();

    const outcomes = await Promise.all([
      sendMail(MAIL, { memberId: MEMBER }, { transport, counter, now: NOW }),
      sendMail(MAIL, { memberId: "m-somebody-else" }, { transport, counter, now: NOW }),
    ]);

    expect(outcomes.filter((outcome) => outcome.sent)).toHaveLength(1);
    expect(outcomes.filter((outcome) => !outcome.sent && outcome.refusal === "site-day-cap")).toHaveLength(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(counts.get(siteDayKey)).toBe(MAIL_CAPS.siteDay);
  });

  it("sends only after the count has moved", async () => {
    const order: string[] = [];
    const counter: MailCounter = {
      async reserve() {
        order.push("counted");
        return null;
      },
    };
    const transport = vi.fn<MailTransport>(async () => {
      order.push("sent");
      return { ok: true, id: null };
    });

    await sendMail(MAIL, { memberId: MEMBER }, { transport, counter, now: NOW });
    expect(order).toEqual(["counted", "sent"]);
  });

  it("with no key in production, counts nothing, calls nothing and says it did not send", async () => {
    const counter = { reserve: vi.fn<MailCounter["reserve"]>() };
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const outcome = await sendMail(MAIL, { memberId: MEMBER }, { counter, env: { NODE_ENV: "production" } });

    expect(outcome).toEqual({ sent: false, refusal: "no-key" });
    expect(counter.reserve).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no-key"));
  });

  it("outside production sends nothing even with a key, unless a test hands in a transport", async () => {
    const counter = { reserve: vi.fn<MailCounter["reserve"]>() };
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    for (const env of [
      { NODE_ENV: "test", RESEND_API_KEY: "re_not_real" },
      { NODE_ENV: "development", RESEND_API_KEY: "re_not_real" },
      { NODE_ENV: "production", VERCEL_ENV: "preview", RESEND_API_KEY: "re_not_real" },
    ]) {
      expect(await sendMail(MAIL, { memberId: MEMBER }, { counter, env })).toEqual({ sent: false, refusal: "not-production" });
    }
    expect(counter.reserve).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never falls back to the real environment's key in a test", () => {
    expect(mailRefusalFor(process.env)).toBe("not-production");
  });

  it("reports a transport error as not sent, and keeps the count", async () => {
    const { counter, counts } = memoryCounter();

    const refused = await sendMail(MAIL, { memberId: MEMBER }, {
      transport: fakeTransport({ ok: false, detail: "Resend answered 500" }),
      counter,
      now: NOW,
    });
    const threw = await sendMail(MAIL, { memberId: MEMBER }, {
      transport: vi.fn<MailTransport>(async () => {
        throw new TypeError("network down");
      }),
      counter,
      now: NOW,
    });

    expect(refused).toEqual({ sent: false, refusal: "transport-error" });
    expect(threw).toEqual({ sent: false, refusal: "transport-error" });
    // Both may have reached the provider, so both still count against the caps.
    expect(counts.get(siteDayKey)).toBe(2);
  });

  it("sends nothing when the count cannot be read", async () => {
    const transport = fakeTransport();
    const counter: MailCounter = {
      async reserve() {
        throw new Error("database unreachable");
      },
    };

    const outcome = await sendMail(MAIL, { memberId: MEMBER }, { transport, counter, now: NOW });

    expect(outcome).toEqual({ sent: false, refusal: "count-unavailable" });
    expect(transport).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });

  it("never logs the address it was sending to", async () => {
    const { counter } = memoryCounter({ [siteDayKey]: MAIL_CAPS.siteDay });
    await sendMail(MAIL, { memberId: MEMBER }, { transport: fakeTransport(), counter, now: NOW });
    for (const call of warn.mock.calls) expect(String(call[0])).not.toContain(MAIL.to);
  });
});

describe("the caps stay inside Resend's free plan", () => {
  it(`are at or below the plan read on ${RESEND_FREE_PLAN.readOn}`, () => {
    expect(MAIL_CAPS.siteDay).toBeLessThanOrEqual(RESEND_FREE_PLAN.perDay);
    expect(MAIL_CAPS.siteMonth).toBeLessThanOrEqual(RESEND_FREE_PLAN.perMonth);
    expect(MAIL_CAPS.memberDay).toBeLessThanOrEqual(MAIL_CAPS.siteDay);
  });

  it("stay under the plan even when two of our periods overlap one of Resend's", () => {
    expect(MAIL_CAPS.siteDay * 2).toBeLessThanOrEqual(RESEND_FREE_PLAN.perDay);
    expect(MAIL_CAPS.siteMonth * 2).toBeLessThanOrEqual(RESEND_FREE_PLAN.perMonth);
  });

  it("have words for every refusal", () => {
    for (const text of Object.values(MAIL_REFUSAL_TEXT)) expect(text.trim()).not.toBe("");
  });
});
