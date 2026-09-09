import { describe, expect, it } from "vitest";

import { turnedFor } from "./turned";

describe("turnedFor", () => {
  it("follows the account when this game has said nothing", () => {
    expect(turnedFor(null, false)).toBe(false);
    expect(turnedFor(null, true)).toBe(true);
  });

  it("lets one game go its own way, in both directions", () => {
    // The direction that is easy to forget: a reader who likes every board
    // turned round still has to be able to leave one of them alone.
    expect(turnedFor(true, false)).toBe(true);
    expect(turnedFor(false, true)).toBe(false);
  });
});
