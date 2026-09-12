import { describe, expect, it } from "vitest";

import { appliedNarrowings } from "./narrowings";

const NONE = { player: null, outcome: "", pool: "", rated: "", verdict: "" };

describe("appliedNarrowings", () => {
  it("shows nothing when nothing was applied", () => {
    expect(appliedNarrowings(NONE)).toEqual([]);
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

  it("shows pool and rated the same way it always has", () => {
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
