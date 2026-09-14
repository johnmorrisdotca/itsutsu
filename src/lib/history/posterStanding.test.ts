import { describe, expect, it } from "vitest";

import type { PlayerProfile } from "@/lib/rating/players";
import { xpForLevel } from "@/lib/xp/xpCurve";

import { posterKeyOf, posterRow, standingOf } from "./posterStanding";

/**
 * WHAT THE WAITING ROOM SHOWS BESIDE SOMEBODY WAITING: their rating, from the
 * right pool and with its tier, and their XP level.
 */

function profile(over: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    key: "kuro",
    name: "Kuro",
    memberId: "m-kuro",
    rating: 1712,
    ratedGames: 25,
    tier: "established",
    wins: 15,
    losses: 10,
    draws: 0,
    computer: { rating: 1500, ratedGames: 0, wins: 0, losses: 0, draws: 0, streak: null },
    streak: null,
    ratedStreak: null,
    ...over,
  };
}

const row = (key: string, memberId: string | null, updatedAt = new Date("2026-09-01")) => ({ key, memberId, updatedAt });

describe("which rating row is the poster's", () => {
  it("finds a member by id, even after they renamed away from the name the row was earned under", () => {
    const rows = [row("hanako-morris", "m-hanako"), row("somebody", "m-other")];
    expect(posterRow({ name: "Hanachan", memberId: "m-hanako" }, rows)?.key).toBe("hanako-morris");
  });

  it("finds a name typed at one screen by its folded name, where nobody is behind it", () => {
    const rows = [row("guest", null)];
    expect(posterRow({ name: "Guest", memberId: null }, rows)?.key).toBe("guest");
  });

  it("is nothing for a poster with no row at all, rather than somebody else's", () => {
    expect(posterRow({ name: "New", memberId: "m-new" }, [row("someone", "m-someone")])).toBeNull();
  });

  it("keys a member by id and a typed name by its folded name", () => {
    expect(posterKeyOf({ name: "Kuro", memberId: "m-kuro" })).toBe("member:m-kuro");
    expect(posterKeyOf({ name: "Guest One", memberId: null })).not.toBe(posterKeyOf({ name: "Guest Two", memberId: null }));
  });
});

describe("what a poster's line shows", () => {
  it("shows the ladder rating with its tier, and the level their total stands on", () => {
    const standing = standingOf({ profile: profile(), member: { xp: xpForLevel(7), country: "JP" } });
    expect(standing).toEqual({ rating: { rating: 1712, pool: "people", tier: "established" }, level: 7, xp: xpForLevel(7), country: "JP" });
  });

  /*
   * The right pool, and marked: somebody who has only played the computer
   * players has no place on the ladder of people, and an unlabelled figure
   * beside their name would read as one.
   */
  it("shows a computer-pool rating, as such, where nothing is settled among the people", () => {
    const standing = standingOf({
      profile: profile({ ratedGames: 0, tier: "unrated", computer: { rating: 1639, ratedGames: 6, wins: 4, losses: 2, draws: 0, streak: null } }),
      member: { xp: 0, country: "" },
    });
    expect(standing.rating).toEqual({ rating: 1639, pool: "computer", tier: "provisional" });
    // Nought is level 1, and an empty country is no flag rather than a blank one.
    expect(standing.level).toBe(1);
    expect(standing.country).toBeNull();
  });

  it("shows no rating for a poster with no settled rating in either pool, rather than a starting figure", () => {
    expect(standingOf({ profile: profile({ ratedGames: 2, tier: "unrated" }), member: { xp: 50, country: "" } }).rating).toBeNull();
    expect(standingOf({ profile: null, member: { xp: 50, country: "" } }).rating).toBeNull();
  });

  it("shows no level for a name with no member behind it, who has no total to stand on", () => {
    expect(standingOf({ profile: profile({ memberId: null }), member: null }).level).toBeNull();
  });
});
