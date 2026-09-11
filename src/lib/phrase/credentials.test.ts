import { describe, expect, it } from "vitest";

import {
  CREDENTIALS,
  credentialsHeld,
  isLastCredential,
  mayRemove,
  removalRefusal,
} from "./credentials";

describe("credentialsHeld", () => {
  it("counts an address and a phrase as two independent credentials", () => {
    expect(credentialsHeld({ email: "a@b.c", phraseHash: "scrypt$x" })).toEqual([
      CREDENTIALS.email,
      CREDENTIALS.phrase,
    ]);
  });

  it("reads a blank address as no address, not as one", () => {
    expect(credentialsHeld({ email: "", phraseHash: null })).toEqual([]);
    expect(credentialsHeld({ email: "   ", phraseHash: null })).toEqual([]);
    expect(credentialsHeld({ email: null, phraseHash: null })).toEqual([]);
  });

  it("reads a blank hash as no phrase", () => {
    expect(credentialsHeld({ email: null, phraseHash: "" })).toEqual([]);
  });

  it("lets an account hold only a phrase — the whole point of the feature", () => {
    expect(credentialsHeld({ email: null, phraseHash: "scrypt$x" })).toEqual([CREDENTIALS.phrase]);
  });
});

describe("mayRemove", () => {
  it("allows removing a phrase when an address is still there", () => {
    expect(mayRemove(CREDENTIALS.phrase, { email: "a@b.c", phraseHash: "scrypt$x" })).toBe(true);
  });

  it("refuses removing the last one", () => {
    expect(mayRemove(CREDENTIALS.phrase, { email: null, phraseHash: "scrypt$x" })).toBe(false);
    expect(mayRemove(CREDENTIALS.email, { email: "a@b.c", phraseHash: null })).toBe(false);
  });

  it("refuses removing something that is not there, rather than saying yes", () => {
    expect(mayRemove(CREDENTIALS.phrase, { email: "a@b.c", phraseHash: null })).toBe(false);
  });

  it("refuses when nothing is held at all", () => {
    expect(mayRemove(CREDENTIALS.phrase, { email: null, phraseHash: null })).toBe(false);
  });
});

describe("isLastCredential", () => {
  it("is the question the refusal is worded from", () => {
    expect(isLastCredential(CREDENTIALS.phrase, { email: null, phraseHash: "scrypt$x" })).toBe(true);
    expect(isLastCredential(CREDENTIALS.phrase, { email: "a@b.c", phraseHash: "scrypt$x" })).toBe(false);
  });
});

describe("removalRefusal", () => {
  it("says what to do about it, not just that it was refused", () => {
    const said = removalRefusal(CREDENTIALS.phrase);
    expect(said).toMatch(/email|address/i);
    expect(said.length).toBeGreaterThan(20);
  });
});
