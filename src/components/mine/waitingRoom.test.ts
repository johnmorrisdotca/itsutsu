import { describe, expect, it } from "vitest";

import { readSetUpAsked } from "@/components/live/setUpAsked";
import { queryRecord } from "@/components/live/setUpKept";
import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { beginPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { GameSummary } from "@/lib/history/gameHistory.types";

import { byGameName, sitDownHref, waitingRoomSays } from "./waitingRoom";

/**
 * THE WAITING ROOM'S THREE DECISIONS: the order the seats come in, where Sit down
 * leads, and what an empty table says.
 */

const seat = (over: Partial<GameSummary>): GameSummary =>
  ({
    id: "g1",
    variant: "freestyle",
    size: 15,
    obstacles: "none",
    opening: "free",
    handicap: NO_HANDICAP,
    moveTimeMs: 86_400_000,
    clockMode: "move",
    timeoutPenalty: "turn",
    allowResign: true,
    rated: true,
    openSeat: "white",
    blackName: "Poster",
    whiteName: "",
    blackMemberId: "poster-id",
    whiteMemberId: null,
    ...over,
  }) as GameSummary;

const label = (variant: string) => RULE_VARIANT_DISPLAY[variant as RuleVariant].label;

describe("the order of the seats", () => {
  it("is by game name, so one game's seats sit together", () => {
    const seats = [seat({ id: "r", variant: "reversi" }), seat({ id: "c", variant: "checkers" }), seat({ id: "g", variant: "freestyle" })];
    const names = byGameName(seats).map((one) => label(one.variant));
    expect(names).toEqual([...names].sort((one, two) => one.localeCompare(two, "en")));
  });

  it("keeps the newest first among several people waiting at one game", () => {
    const seats = [seat({ id: "newest", variant: "reversi" }), seat({ id: "other", variant: "checkers" }), seat({ id: "older", variant: "reversi" })];
    const reversi = byGameName(seats).filter((one) => one.variant === "reversi").map((one) => one.id);
    expect(reversi).toEqual(["newest", "older"]);
  });
});

describe("where Sit down leads", () => {
  it("is the doorstep for that seat, carrying the seat's own rules and its id", () => {
    const posted = seat({ id: "seat-9", variant: "reversi", size: 8, moveTimeMs: null, clockMode: "move", rated: false, allowResign: false });
    const address = new URL(sitDownHref(posted), "https://itsutsu.test");
    expect(address.pathname).toBe(beginPath("reversi"));

    const asked = readSetUpAsked(queryRecord(address.searchParams));
    expect(asked.sit).toBe("seat-9");
    // The rules read back are the seat's, so the doorstep's seat-match check finds this row.
    expect(asked.board).toBe(8);
    expect(asked.pace).toEqual({ ms: null });
    expect(asked.rules).toMatchObject({ variant: "reversi", rated: false, allowResign: false, clockMode: "move", opening: "free" });
  });
});

describe("what the empty table says", () => {
  it("invites the first seat when nobody is waiting at all", () => {
    expect(waitingRoomSays({ total: 0, shown: 0 })).toBe("nobody-waiting");
  });

  it("says the filter left nothing when seats are posted and none matches", () => {
    expect(waitingRoomSays({ total: 3, shown: 0 })).toBe("nothing-matches");
  });

  it("draws the rows otherwise", () => {
    expect(waitingRoomSays({ total: 3, shown: 2 })).toBe("seats");
  });
});
