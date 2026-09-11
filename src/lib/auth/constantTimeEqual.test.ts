import { describe, expect, it } from "vitest";

import { constantTimeEqual } from "./constantTimeEqual";

describe("constantTimeEqual", () => {
  it("is true for identical strings, including two empty ones", () => {
    expect(constantTimeEqual("a-secret", "a-secret")).toBe(true);
    expect(constantTimeEqual("", "")).toBe(true);
  });

  it("is false for strings that differ anywhere, first character or last", () => {
    expect(constantTimeEqual("a-secret", "b-secret")).toBe(false);
    expect(constantTimeEqual("a-secret", "a-secreu")).toBe(false);
  });

  it("is false for different lengths, shorter or longer", () => {
    expect(constantTimeEqual("a-secret", "a-secre")).toBe(false);
    expect(constantTimeEqual("a-secret", "a-secrets")).toBe(false);
    expect(constantTimeEqual("", "x")).toBe(false);
  });
});
