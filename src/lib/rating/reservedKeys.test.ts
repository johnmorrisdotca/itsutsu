import { describe, expect, it } from "vitest";

import { isReservedKey, RESERVED_PLAYER_KEYS } from "./reservedKeys";

describe("reserved player keys", () => {
  it("reserves every legacy player's slug", () => {
    expect(RESERVED_PLAYER_KEYS.has("chibi")).toBe(true);
  });

  it("is case- and whitespace-insensitive, like playerKey", () => {
    expect(isReservedKey("chibi")).toBe(true);
  });

  it("leaves an ordinary name unreserved", () => {
    expect(isReservedKey("aki")).toBe(false);
  });
});
