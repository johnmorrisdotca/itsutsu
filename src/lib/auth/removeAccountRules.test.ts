import { describe, expect, it } from "vitest";

import { REMOVE_CONFIRM_WORD, removalConfirmed, removalPhrase, sessionIssuedAt, signedInRecently } from "./removeAccountRules";
import { PLAYER_SESSION_DAYS } from "./session";

const DAY = 24 * 60 * 60;
const NOW = Date.UTC(2026, 8, 24, 12, 0, 0);
const minted = (secondsAgo: number) => Math.floor(NOW / 1000) - secondsAgo + PLAYER_SESSION_DAYS * DAY;

describe("the name typed to remove an account", () => {
  it("is the member's own name, forgiving case and spaces round it", () => {
    expect(removalConfirmed("  kiko ", "Kiko")).toBe(true);
    expect(removalConfirmed("Kik", "Kiko")).toBe(false);
    expect(removalConfirmed("", "Kiko")).toBe(false);
  });

  it("is the word when the account has no name, and only then", () => {
    expect(removalPhrase("  ")).toBe(REMOVE_CONFIRM_WORD);
    expect(removalConfirmed("Remove", "")).toBe(true);
    expect(removalConfirmed(REMOVE_CONFIRM_WORD, "Kiko")).toBe(false);
  });
});

describe("whether a session may remove its account without signing in again", () => {
  it("reads the moment of signing in off the expiry", () => {
    expect(sessionIssuedAt({ kind: "player", exp: minted(90) })).toBe(Math.floor(NOW / 1000) - 90);
  });

  it("lets an account with no address go on, since its cookie is the whole account", () => {
    expect(signedInRecently({ kind: "player", exp: minted(20 * DAY) }, NOW)).toBe(true);
  });

  it("asks a Google account to sign in again unless it did so in the last ten minutes", () => {
    expect(signedInRecently({ kind: "player", email: "a@example.test", exp: minted(5 * 60) }, NOW)).toBe(true);
    expect(signedInRecently({ kind: "player", email: "a@example.test", exp: minted(11 * 60) }, NOW)).toBe(false);
  });
});
