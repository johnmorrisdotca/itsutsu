import { describe, expect, it, vi } from "vitest";

import type { AddressBook, GameBook, GameOverSummary, NoticeEvent, OutgoingMail } from "./mail.types";

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

const gameOver: NoticeEvent = { kind: "game-over", gameId: "g1", winner: "black", stone: "black", memberId: "m1" };

const summary: GameOverSummary = {
  gameId: "g1",
  variant: "freestyle",
  facts: { outcome: "decided", winner: "black", reason: "line", score: null },
  names: { black: "Hanako Morris", white: "Kuro Tanaka" },
  moveCount: 31,
  startedAt: new Date("2026-09-21T10:00:00Z"),
  endedAt: new Date("2026-09-21T10:20:00Z"),
  ratingChange: null,
};

/** A game book that counts how often it was asked. */
function games(asked: string[]): GameBook {
  return {
    gameOverOf: async (gameId) => {
      asked.push(gameId);
      return summary;
    },
  };
}

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

  it("reads a finished game for nobody while notices are off, or where there is nobody to write to", async () => {
    const { sendNotice } = await import("./sendNotice");
    const asked: string[] = [];
    await sendNotice(gameOver, { transport: vi.fn(), addresses: book("player@example.test"), games: games(asked) });
    expect(asked).toEqual([]);

    vi.doMock("./mail.constants", async (original) => ({
      ...(await original<typeof import("./mail.constants")>()),
      ...ON,
    }));
    vi.resetModules();
    const on = await import("./sendNotice");
    await on.sendNotice(gameOver, { transport: vi.fn(), addresses: book(null), games: games(asked) });
    expect(asked, "a game was read for an email that could not go").toEqual([]);
    vi.doUnmock("./mail.constants");
    vi.resetModules();
  });

  it("says the finished game in the email that does go: who won, why and how to play again", async () => {
    vi.doMock("./mail.constants", async (original) => ({
      ...(await original<typeof import("./mail.constants")>()),
      ...ON,
    }));
    vi.resetModules();
    const { sendNotice } = await import("./sendNotice");
    const sent: OutgoingMail[] = [];
    const transport = async (mail: OutgoingMail) => {
      sent.push(mail);
      return { ok: true as const, id: "sent-2" };
    };
    const asked: string[] = [];

    const outcome = await sendNotice(gameOver, { transport, counter: { reserve: async () => null }, addresses: book("hanako@example.test"), games: games(asked) });

    expect(outcome).toEqual({ sent: true, id: "sent-2" });
    expect(asked).toEqual(["g1"]);
    expect(sent[0].subject).toBe("You won at Gomoku against Kuro T.");
    expect(sent[0].text).toContain("You completed a winning line.");
    expect(sent[0].text).toContain("It took 31 moves in 20 minutes.");
    expect(sent[0].text).toContain("/games/gomoku/match/g1");
    expect(sent[0].text).toContain("rematch=g1");
    vi.doUnmock("./mail.constants");
    vi.resetModules();
  });

  it("reads a game once for both of its seats", async () => {
    const { gameBookOnce } = await import("./gameOverSummary");
    const asked: string[] = [];
    const once = gameBookOnce(async (gameId) => {
      asked.push(gameId);
      return summary;
    });
    const [black, white] = await Promise.all([once.gameOverOf("g1"), once.gameOverOf("g1")]);
    expect(black).toBe(white);
    expect(asked).toEqual(["g1"]);
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
