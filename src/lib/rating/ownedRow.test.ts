import { describe, expect, it } from "vitest";

import { ownedRow } from "./ownedRow";

/*
 * ONE MEMBER, TWO `Player` ROWS — the "same person, two rows" hazard.
 *
 * `findFirst({ where: { memberId } })` with no order let the database pick, so
 * the player page and the link under its counts could each resolve a different
 * row for one person. These cases fail against any "first row returned" rule,
 * because each puts the row that should win SECOND.
 */
describe("ownedRow", () => {
  const older = { key: "hanachan", name: "Hanako", updatedAt: new Date("2026-08-01T10:00:00Z") };
  const newer = { key: "hanako", name: "Hanako", updatedAt: new Date("2026-09-10T10:00:00Z") };

  it("takes the row keyed by the member's current name, wherever it sits", () => {
    expect(ownedRow([older, newer], "Hanako")).toBe(newer);
    expect(ownedRow([newer, older], "  HANACHAN ")).toBe(older);
  });

  it("otherwise takes the row touched most recently — the name last played under", () => {
    expect(ownedRow([older, newer], "Somebody Else Now")).toBe(newer);
  });

  it("breaks a tie in time by key, so two loads give one answer", () => {
    const at = new Date("2026-09-10T10:00:00Z");
    const b = { key: "b-name", name: "B", updatedAt: at };
    const a = { key: "a-name", name: "A", updatedAt: at };
    expect(ownedRow([b, a], "neither")).toBe(a);
    expect(ownedRow([a, b], "neither")).toBe(a);
  });

  it("answers null when the member owns no row", () => {
    expect(ownedRow([], "Hanako")).toBeNull();
  });
});
