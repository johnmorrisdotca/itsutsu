import { describe, expect, it } from "vitest";

import { RESULT_CARD_RETRY_MS, RESULT_CARD_SETTLE_MS } from "./gameResult.constants";
import { xpMaySettle } from "./resultCardSettling";

const ENDED = "2026-10-06T11:31:50.000Z";
const at = (afterMs: number) => new Date(Date.parse(ENDED) + afterMs);
const NO_XP = { viewerId: "member-1", xp: null, lastMoveAt: ENDED };

describe("a result card with no XP that may only be early", () => {
  it("asks again for a member whose game ended a moment ago and who has no XP yet", () => {
    expect(xpMaySettle({ ...NO_XP, now: at(300) })).toBe(true);
    expect(xpMaySettle({ ...NO_XP, now: at(RESULT_CARD_SETTLE_MS - 1) })).toBe(true);
  });

  it("does not once the payment has had longer than it takes: no XP there is no XP", () => {
    expect(xpMaySettle({ ...NO_XP, now: at(RESULT_CARD_SETTLE_MS) })).toBe(false);
    expect(xpMaySettle({ ...NO_XP, now: at(3 * 86_400_000) })).toBe(false);
  });

  it("does not when the card already has its XP", () => {
    expect(xpMaySettle({ ...NO_XP, xp: { points: 25 }, now: at(300) })).toBe(false);
  });

  it("does not for a reader with no member row to be paid into", () => {
    expect(xpMaySettle({ ...NO_XP, viewerId: null, now: at(300) })).toBe(false);
  });

  it("does not when the time of the last move cannot be read", () => {
    expect(xpMaySettle({ ...NO_XP, lastMoveAt: null, now: at(300) })).toBe(false);
    expect(xpMaySettle({ ...NO_XP, lastMoveAt: "not a time", now: at(300) })).toBe(false);
  });

  it("waits its asks out inside the time it is willing to be early for, and never asks without a wait", () => {
    expect(RESULT_CARD_RETRY_MS.length).toBeGreaterThan(0);
    expect(RESULT_CARD_RETRY_MS.every((wait) => wait >= 1_000)).toBe(true);
    expect(RESULT_CARD_RETRY_MS.reduce((total, wait) => total + wait, 0)).toBeLessThan(RESULT_CARD_SETTLE_MS);
  });
});
