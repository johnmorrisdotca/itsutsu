import { describe, expect, it } from "vitest";

import {
  NO_SEAT_FILTER,
  RATING_SPLIT,
  filterOpenSeats,
  openSeatQuery,
  posterOf,
  readOpenSeatFilter,
  type OpenSeatFilter,
} from "./openSeatsFilter";
import type { GameSummary } from "./gameHistory.types";

/**
 * The noticeboard's own three questions: what pace, against whom, and under
 * what penalty. Same shape as `directoryFilter.test.ts` asks of the players
 * page — an address in, a narrowed list out, nothing else touched.
 */

const seat = (over: Partial<GameSummary>): GameSummary =>
  ({
    id: "x",
    variant: "freestyle",
    size: 15,
    moveTimeMs: null,
    timeoutPenalty: "turn",
    openSeat: "white",
    blackName: "Poster",
    whiteName: "",
    blackMemberId: "poster-id",
    whiteMemberId: null,
    ...over,
  }) as GameSummary;

describe("readOpenSeatFilter", () => {
  it("is 'any' in every field when the address says nothing", () => {
    expect(readOpenSeatFilter({})).toEqual(NO_SEAT_FILTER);
  });

  it("reads a numeric pace", () => {
    expect(readOpenSeatFilter({ pace: "300000" }).pace).toBe(300_000);
  });

  it("reads the no-clock pace as null, not as absent", () => {
    expect(readOpenSeatFilter({ pace: "none" }).pace).toBeNull();
  });

  it("falls back to 'any pace' for a value no game is ever played at", () => {
    expect(readOpenSeatFilter({ pace: "12345" }).pace).toBeUndefined();
  });

  it("falls back to 'any' rating and penalty for anything unrecognised, rather than to an empty board", () => {
    expect(readOpenSeatFilter({ rating: "made-up", penalty: "made-up" })).toEqual(NO_SEAT_FILTER);
  });

  it("reads a real rating band and penalty", () => {
    expect(readOpenSeatFilter({ rating: "under", penalty: "game-strict" })).toEqual({
      pace: undefined,
      rating: "under",
      penalty: "game-strict",
    });
  });
});

describe("openSeatQuery", () => {
  it("is empty for the default filter", () => {
    expect(openSeatQuery(NO_SEAT_FILTER)).toBe("");
  });

  it("round-trips a narrowed filter through the address", () => {
    const filter: OpenSeatFilter = { pace: 300_000, rating: "over", penalty: "game" };
    expect(readOpenSeatFilter(Object.fromEntries(new URLSearchParams(openSeatQuery(filter))))).toEqual(filter);
  });

  it("writes the no-clock pace as its own word, not as an absent field", () => {
    const query = openSeatQuery({ ...NO_SEAT_FILTER, pace: null });
    expect(query).toContain("pace=none");
    expect(readOpenSeatFilter(Object.fromEntries(new URLSearchParams(query))).pace).toBeNull();
  });
});

describe("posterOf", () => {
  it("is whoever is not the seat posted open", () => {
    const game = seat({ openSeat: "white", blackName: "Ren", blackMemberId: "ren-id" });
    expect(posterOf(game)).toEqual({ name: "Ren", memberId: "ren-id" });
  });

  it("reads the other seat when black is the one posted open", () => {
    const game = seat({ openSeat: "black", whiteName: "Suzu", whiteMemberId: "suzu-id", blackName: "" });
    expect(posterOf(game)).toEqual({ name: "Suzu", memberId: "suzu-id" });
  });
});

describe("filterOpenSeats", () => {
  const noRating = () => null;

  it("passes everything through the default filter", () => {
    const seats = [seat({ id: "a" }), seat({ id: "b", moveTimeMs: 60_000 })];
    expect(filterOpenSeats(seats, NO_SEAT_FILTER, noRating)).toHaveLength(2);
  });

  it("keeps only the exact pace asked for", () => {
    const seats = [seat({ id: "fast", moveTimeMs: 60_000 }), seat({ id: "slow", moveTimeMs: 86_400_000 })];
    const shown = filterOpenSeats(seats, { ...NO_SEAT_FILTER, pace: 60_000 }, noRating);
    expect(shown.map((s) => s.id)).toEqual(["fast"]);
  });

  it("keeps the no-clock seats when 'no clock' is asked for, not every seat", () => {
    const seats = [seat({ id: "clocked", moveTimeMs: 60_000 }), seat({ id: "unclocked", moveTimeMs: null })];
    const shown = filterOpenSeats(seats, { ...NO_SEAT_FILTER, pace: null }, noRating);
    expect(shown.map((s) => s.id)).toEqual(["unclocked"]);
  });

  it("keeps only the timeout penalty asked for", () => {
    const seats = [seat({ id: "a", timeoutPenalty: "turn" }), seat({ id: "b", timeoutPenalty: "game-strict" })];
    const shown = filterOpenSeats(seats, { ...NO_SEAT_FILTER, penalty: "game-strict" }, noRating);
    expect(shown.map((s) => s.id)).toEqual(["b"]);
  });

  it("asks the rating lookup by the poster's name, not the seat that is open", () => {
    const asked: string[] = [];
    const ratingOf = (name: string) => {
      asked.push(name);
      return name === "Strong" ? 2000 : 1200;
    };
    const seats = [seat({ id: "a", openSeat: "white", blackName: "Strong" })];
    filterOpenSeats(seats, { ...NO_SEAT_FILTER, rating: "over" }, ratingOf);
    expect(asked).toEqual(["Strong"]);
  });

  it("splits under and over at the rating that starts a new member", () => {
    const ratingOf = (name: string) => (name === "weak" ? RATING_SPLIT - 1 : RATING_SPLIT);
    const seats = [seat({ id: "a", blackName: "weak" }), seat({ id: "b", blackName: "strong" })];
    expect(filterOpenSeats(seats, { ...NO_SEAT_FILTER, rating: "under" }, ratingOf).map((s) => s.id)).toEqual(["a"]);
    expect(filterOpenSeats(seats, { ...NO_SEAT_FILTER, rating: "over" }, ratingOf).map((s) => s.id)).toEqual(["b"]);
  });

  it("keeps only the posters with no settled rating at all, for 'unrated'", () => {
    const ratingOf = (name: string) => (name === "fresh" ? null : 1600);
    const seats = [seat({ id: "a", blackName: "fresh" }), seat({ id: "b", blackName: "seasoned" })];
    const shown = filterOpenSeats(seats, { ...NO_SEAT_FILTER, rating: "unrated" }, ratingOf);
    expect(shown.map((s) => s.id)).toEqual(["a"]);
  });

  it("drops an unrated poster from 'under' and 'over' rather than guessing where they belong", () => {
    const seats = [seat({ id: "a" })];
    expect(filterOpenSeats(seats, { ...NO_SEAT_FILTER, rating: "under" }, () => null)).toEqual([]);
    expect(filterOpenSeats(seats, { ...NO_SEAT_FILTER, rating: "over" }, () => null)).toEqual([]);
  });

  it("combines every narrowing asked for at once", () => {
    const seats = [
      seat({ id: "match", moveTimeMs: 60_000, timeoutPenalty: "turn", blackName: "strong" }),
      seat({ id: "wrong-pace", moveTimeMs: 300_000, timeoutPenalty: "turn", blackName: "strong" }),
      seat({ id: "wrong-rating", moveTimeMs: 60_000, timeoutPenalty: "turn", blackName: "weak" }),
    ];
    const ratingOf = (name: string) => (name === "strong" ? 2000 : 1200);
    const filter: OpenSeatFilter = { pace: 60_000, rating: "over", penalty: "turn" };
    expect(filterOpenSeats(seats, filter, ratingOf).map((s) => s.id)).toEqual(["match"]);
  });
});
