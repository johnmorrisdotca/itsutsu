import { describe, expect, it } from "vitest";

import { BOT_TIERS, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { isMemberId } from "@/lib/auth/memberId";
import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { deadlineFor } from "@/lib/history/deadline";
import { BOT_MEMBERS, BOT_MEMBER_LIST, BOT_UNCLAIMABLE } from "./bots.constants";
import { botInSeat, botTierFor, hasBotSeat, isBotId } from "./bots";

/**
 * The three computer players as members: who they are, and the one thing the
 * rest of the site has to be able to ask about them without a database.
 */

describe("the three as members", () => {
  it("gives each a fixed id that a member id may actually be", () => {
    for (const bot of BOT_MEMBER_LIST) {
      expect(isMemberId(bot.id), `${bot.id} is not a usable member id`).toBe(true);
      expect(bot.name.length).toBeGreaterThan(1);
      expect(bot.bio.length).toBeGreaterThan(40);
    }
    expect(new Set(BOT_MEMBER_LIST.map((bot) => bot.id)).size).toBe(3);
  });

  it("has a reason of its own for never being claimable", () => {
    expect(BOT_UNCLAIMABLE).toBe(UNCLAIMABLE_REASONS.computer);
    expect(BOT_UNCLAIMABLE).not.toBe(UNCLAIMABLE_REASONS.seed);
    expect(BOT_UNCLAIMABLE).not.toBe(UNCLAIMABLE_REASONS.keptRecord);
  });

  it("answers 'is this a computer' from a constant, not a query", () => {
    for (const tier of BOT_TIER_LIST) {
      const { id } = BOT_MEMBERS[tier];
      expect(isBotId(id)).toBe(true);
      expect(botTierFor(id)).toBe(tier);
    }
    expect(isBotId("someone-else")).toBe(false);
    expect(isBotId(null)).toBe(false);
    expect(isBotId(undefined)).toBe(false);
    expect(botTierFor("someone-else")).toBeNull();
  });

  it("reads which seat a computer is sitting in", () => {
    const game = { blackMemberId: "a-person", whiteMemberId: BOT_MEMBERS.meijin.id };
    expect(botInSeat(game, "black")).toBeNull();
    expect(botInSeat(game, "white")).toBe(BOT_TIERS.meijin);
    expect(hasBotSeat(game)).toBe(true);
    expect(hasBotSeat({ blackMemberId: "a-person", whiteMemberId: "another" })).toBe(false);
    expect(hasBotSeat({})).toBe(false);
  });
});

describe("a computer is never late", () => {
  const at = new Date("2026-09-09T10:00:00.000Z");
  const clocked = { moveTimeMs: 60_000, lastMoveAt: at, openSeat: null };

  it("runs no clock while it is the computer's move", () => {
    expect(
      deadlineFor({
        ...clocked,
        blackMemberId: "a-person",
        whiteMemberId: BOT_MEMBERS.dan.id,
        toPlay: "white",
      }),
    ).toBeNull();
  });

  it("runs the person's clock normally on their own move", () => {
    /*
     * The difference from a posted seat, which stops the clock for the whole
     * game: a game against the computer must still be a game with a clock in
     * it, or the setting the players chose means nothing.
     */
    expect(
      deadlineFor({
        ...clocked,
        blackMemberId: "a-person",
        whiteMemberId: BOT_MEMBERS.dan.id,
        toPlay: "black",
      })?.toISOString(),
    ).toBe("2026-09-09T10:01:00.000Z");
  });

  it("is unchanged for a game between two people", () => {
    expect(
      deadlineFor({
        ...clocked,
        blackMemberId: "a-person",
        whiteMemberId: "another-person",
        toPlay: "white",
      })?.toISOString(),
    ).toBe("2026-09-09T10:01:00.000Z");
  });

  it("is unchanged when the caller does not say whose turn it is", () => {
    expect(
      deadlineFor({ ...clocked, whiteMemberId: BOT_MEMBERS.dan.id })?.toISOString(),
    ).toBe("2026-09-09T10:01:00.000Z");
  });
});
