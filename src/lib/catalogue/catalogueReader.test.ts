import { describe, expect, it } from "vitest";

import type { CatalogueStats } from "./catalogue.types";
import { forReader } from "./catalogueReader";

const DAN = {
  name: "Dan Tanaka",
  memberId: "m-dan",
  pool: "people" as const,
  wins: 12,
  losses: 0,
  draws: 1,
  level: 14,
};

const STATS: CatalogueStats = {
  games: {
    ninuki: {
      variant: "ninuki",
      played: 13,
      last: { since: { unit: "days", count: 3 }, gameId: "k3m9-p2qx" },
      top: DAN,
    },
    sannuki: { variant: "sannuki", played: 0, last: null, top: null },
  },
  families: {
    captures: { played: 13, gamesPlayed: 1, games: 2, crowns: { kind: "held", holder: DAN, games: ["ninuki"] } },
  },
};

describe("what a reader is shown of the catalogue's figures", () => {
  it("is everything, for a member", () => {
    expect(forReader(STATS, true)).toBe(STATS);
  });

  describe("for a reader with no session", () => {
    const stranger = forReader(STATS, false);

    it("keeps every figure", () => {
      expect(stranger.games.ninuki).toMatchObject({ played: 13, last: { since: { unit: "days", count: 3 } } });
      expect(stranger.games.ninuki.top).toMatchObject({ wins: 12, losses: 0, draws: 1, pool: "people" });
      expect(stranger.families.captures).toMatchObject({ played: 13, gamesPlayed: 1, games: 2 });
      expect(stranger.games.sannuki).toEqual(STATS.games.sannuki);
    });

    it("keeps the opaque id a record's links ask by", () => {
      expect(stranger.games.ninuki.top?.memberId).toBe("m-dan");
    });

    it("names nobody, on a game or on a family", () => {
      expect(stranger.games.ninuki.top).toMatchObject({ name: null, level: null });
      const crowns = stranger.families.captures.crowns;
      expect(crowns?.kind === "held" ? crowns.holder.name : "not held").toBeNull();
      expect(JSON.stringify(stranger)).not.toContain("Dan");
    });

    it("does not hand over a match it cannot open", () => {
      expect(stranger.games.ninuki.last?.gameId).toBeNull();
    });

    it("leaves the member's figures untouched", () => {
      expect(STATS.games.ninuki.top?.name).toBe("Dan Tanaka");
    });
  });
});
