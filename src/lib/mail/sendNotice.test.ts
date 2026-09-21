import { describe, expect, it, vi } from "vitest";

import type { AddressBook, NoticeEvent, OutgoingMail } from "./mail.types";

/**
 * THE DOOR A GAME NOTICE LEAVES BY, tested on both sides of its switch.
 *
 * The switch is off in the tree and a gate holds it there
 * (`oneSender.coverage.test.ts`), so the interesting half — that a notice
 * which DOES go is counted like every other email — can only be reached by
 * mocking the constant. That is worth doing rather than leaving untested: the
 * whole point of the change is that when somebody turns notices on, the caps
 * are already on the path, and a promise nobody has exercised is not one.
 */

vi.mock("@/lib/prisma", () => ({ prisma: { member: { findUnique: async () => null } } }));

const ON = { NOTICES: { sending: true } };

const yourTurn: NoticeEvent = { kind: "your-turn", gameId: "g1", stone: "black", memberId: "m1" };

/** An address book that answers without a database. */
function book(address: string | null): AddressBook {
  return { addressOf: async () => address };
}

describe("sending a game notice", () => {
  it("sends nothing at all while notices are switched off", async () => {
    const { sendNotice } = await import("./sendNotice");
    const transport = vi.fn(async () => ({ ok: true as const, id: "x" }));

    const outcome = await sendNotice(yourTurn, { transport, addresses: book("player@example.test") });

    expect(outcome).toEqual({ sent: false, refusal: "notices-off" });
    // Not merely unsent: nothing was read and nothing was counted either.
    expect(transport).not.toHaveBeenCalled();
  });

  it("writes to nobody when there is no address to write to", async () => {
    vi.doMock("./mail.constants", async (original) => ({
      ...(await original<typeof import("./mail.constants")>()),
      ...ON,
    }));
    vi.resetModules();
    const { sendNotice } = await import("./sendNotice");
    const transport = vi.fn(async () => ({ ok: true as const, id: "x" }));

    const outcome = await sendNotice(yourTurn, { transport, addresses: book(null) });

    expect(outcome).toEqual({ sent: false, refusal: "no-address" });
    expect(transport).not.toHaveBeenCalled();
    vi.doUnmock("./mail.constants");
    vi.resetModules();
  });

  it("goes out through the one sender, counted against the member it is for", async () => {
    vi.doMock("./mail.constants", async (original) => ({
      ...(await original<typeof import("./mail.constants")>()),
      ...ON,
    }));
    vi.resetModules();
    const { sendNotice } = await import("./sendNotice");

    const sent: OutgoingMail[] = [];
    const transport = async (mail: OutgoingMail) => {
      sent.push(mail);
      return { ok: true as const, id: "sent-1" };
    };
    /*
     * The counter is what makes this the SAME send as an invitation. The
     * limits it is handed name the member the notice is FOR, so the five-a-day
     * cap protects the person receiving it — there is no system sender whose
     * quota this could come out of instead.
     */
    const asked: string[] = [];
    const counter = {
      reserve: async (limits: readonly { key: string }[]) => {
        asked.push(...limits.map((limit) => limit.key));
        return null;
      },
    };

    const outcome = await sendNotice(yourTurn, { transport, counter, addresses: book("player@example.test") });

    expect(outcome).toEqual({ sent: true, id: "sent-1" });
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("player@example.test");
    expect(sent[0].subject).toContain("your turn");
    expect(asked.some((key) => key.includes("m1")), "the notice was not counted against its own member").toBe(true);

    vi.doUnmock("./mail.constants");
    vi.resetModules();
  });

  it("is refused by a full cap exactly as an invitation would be", async () => {
    vi.doMock("./mail.constants", async (original) => ({
      ...(await original<typeof import("./mail.constants")>()),
      ...ON,
    }));
    vi.resetModules();
    const { sendNotice } = await import("./sendNotice");
    const transport = vi.fn(async () => ({ ok: true as const, id: "x" }));

    const outcome = await sendNotice(yourTurn, {
      transport,
      counter: { reserve: async () => "site-day-cap" as const },
      addresses: book("player@example.test"),
    });

    expect(outcome).toEqual({ sent: false, refusal: "site-day-cap" });
    expect(transport).not.toHaveBeenCalled();
    vi.doUnmock("./mail.constants");
    vi.resetModules();
  });
});
