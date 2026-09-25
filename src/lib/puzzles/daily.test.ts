import { describe, expect, it } from "vitest";

import { dailySeed } from "./daily";
import { isSeed } from "./random";

describe("today's puzzle", () => {
  it("is the UTC date as a number, a real seed", () => {
    const seed = dailySeed(new Date("2026-09-25T23:59:00Z"));
    expect(seed).toBe(20260925);
    expect(isSeed(seed)).toBe(true);
  });

  it("is the same all day in UTC and changes at midnight UTC", () => {
    expect(dailySeed(new Date("2026-09-25T00:00:00Z"))).toBe(dailySeed(new Date("2026-09-25T23:59:59Z")));
    expect(dailySeed(new Date("2026-09-26T00:00:00Z"))).toBe(20260926);
  });
});
