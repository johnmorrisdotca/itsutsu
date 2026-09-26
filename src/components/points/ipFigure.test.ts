import { describe, expect, it } from "vitest";

import { gamesHref } from "@/components/games/GameCount";
import { buildGameWhere, toGameHistoryQuery } from "@/lib/history/gameHistoryQuery";
import { appliedNarrowings } from "@/lib/history/narrowings";

import { ipHref } from "./IpFigure";

/** A scope of several games and a puzzle, as the site's board is. */
const SITE_SCOPE = { variants: ["freestyle", "reversi"] as const, puzzles: ["hiddenStones"] as const };

/*
 * An IP figure is a sum somebody already ran, so it leads to exactly what it
 * summed — or, where no one page lists that set, nowhere, said so on hover.
 */
describe("where an IP figure leads", () => {
  it("one game's board: that game's record, the member's games that paid IP, in the month when it was this month's", () => {
    expect(ipHref({ variants: ["freestyle"], puzzles: [] }, "m-ann", null)).toBe("/games/gomoku/history?member=m-ann&ip=paid");
    expect(ipHref({ variants: ["freestyle"], puzzles: [] }, "m-ann", "2026-09")).toBe("/games/gomoku/history?member=m-ann&ip=paid&month=2026-09");
  });

  it("one puzzle's board: that puzzle's record, narrowed to the member", () => {
    expect(ipHref({ variants: [], puzzles: ["hiddenStones"] }, "m-ann", "2026-09")).toBe("/games/hidden-stones/history?member=m-ann&month=2026-09");
  });

  it("a family's board or the site's: no one page, so no link", () => {
    expect(ipHref({ variants: ["freestyle", "renju"], puzzles: [] }, "m-ann", null)).toBeNull();
    expect(ipHref(SITE_SCOPE, "m-ann", null)).toBeNull();
  });
});

describe("the record's ip and month filters", () => {
  it("gamesHref carries them only when asked", () => {
    expect(gamesHref({ memberId: "m-ann" })).toBe("/history?member=m-ann");
    expect(gamesHref({ memberId: "m-ann", ip: "paid", month: "2026-09" })).toBe("/history?member=m-ann&ip=paid&month=2026-09");
  });

  it("narrow to the games that paid the player, finished in that month", () => {
    const query = toGameHistoryQuery(new URL("https://x/history?player=Ann&ip=paid&month=2026-09"));
    if ("error" in query) throw new Error(query.error);
    expect(query.ip).toBe("paid");
    expect(query.month).toBe("2026-09");
    const where = JSON.stringify(buildGameWhere(query));
    expect(where).toContain('"blackPoints":{"gt":0}');
    expect(where).toContain('"whitePoints":{"gt":0}');
    expect(where).toContain('"lastMoveAt":{"gte":"2026-09-01T00:00:00.000Z","lt":"2026-10-01T00:00:00.000Z"}');
  });

  it("drop a month that is not one, rather than refusing the page", () => {
    const query = toGameHistoryQuery(new URL("https://x/history?month=2026-13"));
    if ("error" in query) throw new Error(query.error);
    expect(query.month).toBeNull();
  });

  it("say themselves as chips that can be taken off", () => {
    const none = { player: null, outcome: "", pool: "", rated: "", verdict: "" };
    expect(appliedNarrowings({ ...none, ip: "paid", month: "2026-09" })).toEqual([
      { key: "ip", label: "Paid IP" },
      { key: "month", label: "Finished in September 2026" },
    ]);
    expect(appliedNarrowings({ ...none, ip: "all", month: "nonsense" })).toEqual([]);
  });
});
