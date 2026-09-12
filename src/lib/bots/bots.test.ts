import { describe, expect, it } from "vitest";

import {
  BOT_ALL_TIERS,
  BOT_SPECIALIST_LIST,
  BOT_TIERS,
  BOT_TIER_LIST,
} from "@/lib/gomoku/opponent.constants";
import { RULE_VARIANTS, RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { isMemberId } from "@/lib/auth/memberId";
import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";
import { deadlineFor } from "@/lib/history/deadline";
import {
  BOT_MEMBERS,
  BOT_MEMBER_LIST,
  BOT_UNCLAIMABLE,
  botRowFields,
  botsFor,
  gamesPlayedBy,
} from "./bots.constants";
import { botInSeat, botTierFor, hasBotSeat, isBotId } from "./bots";

/**
 * The computer players as members: who they are, and the one thing the
 * rest of the site has to be able to ask about them without a database.
 */

describe("the ladder as members", () => {
  it("gives each a fixed id that a member id may actually be", () => {
    for (const bot of BOT_MEMBER_LIST) {
      expect(isMemberId(bot.id), `${bot.id} is not a usable member id`).toBe(true);
      expect(bot.name.length).toBeGreaterThan(1);
      expect(bot.bio.length).toBeGreaterThan(40);
    }
    expect(new Set(BOT_MEMBER_LIST.map((bot) => bot.id)).size).toBe(BOT_MEMBER_LIST.length);
  });

  it("describes a row the same way whether it is being made or kept up to date", () => {
    /*
     * The upsert writes this object into both halves, so the check is on what
     * it decides rather than on the two halves matching — they cannot drift.
     *
     * showOnline is the one worth naming. The column defaults to true and
     * "here now" is showOnline plus a stamp inside the last half hour; a
     * computer player's stamp never moves after its row is written, so a row
     * that kept the default would stand in the "who is here" list for half an
     * hour and then quietly leave.
     */
    for (const bot of BOT_MEMBER_LIST) {
      const fields = botRowFields(bot);
      expect(fields.showOnline).toBe(false);
      expect(fields.emailNotify).toBe(false);
      expect(fields.unclaimableBecause).toBe(BOT_UNCLAIMABLE);
      expect(fields.botTier).toBe(bot.tier);
      expect(fields.country).toBe(bot.country);
      // Identity is not a description: rewriting it on every sweep would be a
      // worse thing than letting a description go stale.
      expect(fields).not.toHaveProperty("id");
      expect(fields).not.toHaveProperty("email");
    }
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

  it("knows every one of them, specialists included", () => {
    /*
     * The list the rows are written from and `isBotId` is built out of has to
     * hold everybody, not only the graded ladder. A player missing from it is
     * a player the clock does not know is a program — so it would run a
     * timeout against a computer, and somebody would win a game on a flag
     * that never should have been ticking.
     */
    expect(BOT_MEMBER_LIST.map((bot) => bot.tier)).toEqual([...BOT_ALL_TIERS]);
    for (const tier of BOT_SPECIALIST_LIST) {
      const bot = BOT_MEMBERS[tier];
      expect(isBotId(bot.id)).toBe(true);
      expect(botTierFor(bot.id)).toBe(tier);
      expect(bot.country.length).toBeGreaterThan(1);
      // A specialist's page has to say what it plays and where the name comes from.
      expect(bot.bio.length).toBeGreaterThan(120);
    }
  });

  it("offers a specialist as an opponent at its own game and nowhere else", () => {
    const atReversi = botsFor(RULE_VARIANTS.reversi).map((bot) => bot.tier);
    const atFive = botsFor(RULE_VARIANTS.freestyle).map((bot) => bot.tier);
    const atHalma = botsFor(RULE_VARIANTS.halma).map((bot) => bot.tier);
    expect(atReversi).toContain(BOT_TIERS.tamenoki);
    expect(atReversi).not.toContain(BOT_TIERS.meritalu);
    expect(atFive).toContain(BOT_TIERS.meritalu);
    expect(atFive).not.toContain(BOT_TIERS.tamenoki);
    expect(atHalma).toEqual([...BOT_TIER_LIST]);
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

/**
 * WHICH GAMES ONE OF THEM PLAYS — `botsFor` read the other way round.
 *
 * For the setup screen, which can arrive knowing WHO and not WHAT: a Play button
 * on a computer player's row names the program and nothing else. The graded five
 * need no help. A specialist plays one game, and a screen that opened at the
 * site's default would show it as the chosen opponent while the list of players
 * offered at that game did not hold it — so pressing Start would have posted a
 * seat for anyone instead of playing the program somebody pressed Play on.
 */
describe("the games one computer player will sit down to", () => {
  it("is every game, for each of the graded ladder", () => {
    for (const tier of BOT_TIER_LIST) {
      const games = gamesPlayedBy(BOT_MEMBERS[tier].id);
      expect(games.length, `${tier} plays anything on this board`).toBe(RULE_VARIANT_LIST.length);
    }
  });

  it("is a game each, for the specialists", () => {
    for (const tier of BOT_SPECIALIST_LIST) {
      const games = gamesPlayedBy(BOT_MEMBERS[tier].id);
      /*
       * At least one, or the setup screen would have nowhere to open — and the
       * specialist would be a player that cannot be played. Fewer than all of
       * them, or it is not a specialist.
       */
      expect(games.length, `${tier} has a game of its own`).toBeGreaterThan(0);
      expect(games.length, `${tier} does not play everything`).toBeLessThan(RULE_VARIANT_LIST.length);
    }
  });

  /* The two directions have to agree, or one of them is a second opinion. */
  it("agrees with the list of players offered at each of those games", () => {
    for (const tier of BOT_ALL_TIERS) {
      const id = BOT_MEMBERS[tier].id;
      for (const variant of gamesPlayedBy(id)) {
        expect(botsFor(variant).some((bot) => bot.id === id), `${tier} at ${variant}`).toBe(true);
      }
    }
  });

  it("says nothing about somebody who is not a computer player", () => {
    expect(gamesPlayedBy("not-a-program")).toEqual([]);
  });
});
