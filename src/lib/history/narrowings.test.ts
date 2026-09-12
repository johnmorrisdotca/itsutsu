import { describe, expect, it } from "vitest";

import { appliedNarrowings } from "./narrowings";

const NONE = { player: null, outcome: "", pool: "", rated: "", verdict: "" };

describe("appliedNarrowings", () => {
  it("shows nothing when nothing was applied", () => {
    expect(appliedNarrowings(NONE)).toEqual([]);
  });

  /*
   * The finding, made concrete: /history?outcome=won with no player. The
   * query drops the outcome clause entirely (`outcomeWhere` returns null
   * without a name to read "won" against), so a chip reading "Won" over the
   * whole record would be claiming a narrowing nothing applied.
   */
  it("does not claim an outcome the query could not apply without a player", () => {
    const narrowings = appliedNarrowings({ ...NONE, outcome: "won" });
    expect(narrowings).toEqual([]);
  });

  it("does the same for lost, the outcome's other player-only half", () => {
    expect(appliedNarrowings({ ...NONE, outcome: "lost" })).toEqual([]);
  });

  it("shows decided and drawn even with no player — they are not about anybody's side", () => {
    expect(appliedNarrowings({ ...NONE, outcome: "decided" })).toEqual([
      { key: "outcome", label: "Won, lost or drawn" },
    ]);
    expect(appliedNarrowings({ ...NONE, outcome: "drawn" })).toEqual([
      { key: "outcome", label: "Drawn" },
    ]);
  });

  it("shows won/lost once a player is applied", () => {
    const player = { name: "Alice", memberId: "id-1", removable: true };
    expect(appliedNarrowings({ ...NONE, player, outcome: "won" })).toEqual([
      { key: "player", label: "Alice's games" },
      { key: "outcome", label: "Won" },
    ]);
  });

  it("never claims a verdict without a player — verdict has no player-free reading at all", () => {
    expect(appliedNarrowings({ ...NONE, verdict: "up" })).toEqual([]);
    expect(appliedNarrowings({ ...NONE, verdict: "judged" })).toEqual([]);
  });

  it("shows a verdict once a player is applied", () => {
    const player = { name: "Alice", memberId: "id-1", removable: true };
    expect(appliedNarrowings({ ...NONE, player, verdict: "up" })).toEqual([
      { key: "player", label: "Alice's games" },
      { key: "verdict", label: "Played well" },
    ]);
  });

  it("gives a removable player chip no href — its own '×' takes it off", () => {
    const player = { name: "Alice", memberId: "id-1", removable: true };
    const [chip] = appliedNarrowings({ ...NONE, player });
    expect(chip).toEqual({ key: "player", label: "Alice's games" });
    expect(chip.href).toBeUndefined();
  });

  /*
   * /games/<slug>/me: the filter is the address, not something a chip can
   * remove, so it leads to the player's own page instead — built from their
   * id, never their name, the same rule playerPath enforces everywhere else.
   */
  it("gives a non-removable player chip a link to the player's own page, by id", () => {
    const player = { name: "Hanako Morris", memberId: "member-id-1", removable: false };
    const [chip] = appliedNarrowings({ ...NONE, player });
    expect(chip).toEqual({
      key: "player",
      label: "Hanako Morris's games",
      href: "/players/member-id-1",
    });
  });

  it("falls back to a name-based address when a non-removable player has no member id", () => {
    const player = { name: "Someone Typed In", memberId: null, removable: false };
    const [chip] = appliedNarrowings({ ...NONE, player });
    expect(chip.href).toBe("/players/someone-typed-in");
  });

  it("still shows pool and rated with no player, unaffected by any of this", () => {
    expect(appliedNarrowings({ ...NONE, pool: "computer" })).toEqual([
      { key: "pool", label: "Against the computer" },
    ]);
    expect(appliedNarrowings({ ...NONE, rated: "yes" })).toEqual([{ key: "rated", label: "Rated" }]);
  });

  it("orders chips player, outcome, pool, rated, verdict", () => {
    const player = { name: "Alice", memberId: "id-1", removable: true };
    const narrowings = appliedNarrowings({
      player,
      outcome: "won",
      pool: "people",
      rated: "yes",
      verdict: "up",
    });
    expect(narrowings.map((one) => one.key)).toEqual(["player", "outcome", "pool", "rated", "verdict"]);
  });
});
