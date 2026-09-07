import { describe, expect, it } from "vitest";
import { playerKey } from "./playerKey";

describe("playerKey", () => {
  it("folds case and whitespace so one person is one player", () => {
    expect(playerKey("Aki")).toBe("aki");
    expect(playerKey("  AKI  ")).toBe("aki");
    expect(playerKey("Aki   Tanaka")).toBe("aki tanaka");
  });

  it("is empty for an anonymous seat", () => {
    expect(playerKey("")).toBe("");
    expect(playerKey("   ")).toBe("");
  });
});
