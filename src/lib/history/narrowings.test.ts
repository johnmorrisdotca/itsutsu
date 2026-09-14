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
      label: "Hanako M.'s games",
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

  /*
   * `all` IS THE ABSENCE OF A NARROWING, AND IT USED TO DRAW A CHIP SAYING SO
   * IN THE ADDRESS'S OWN WORDS.
   *
   * Every one of these four fell back to the raw parameter, so `/history?pool=all`
   * printed a chip reading "all" — over a record the query had narrowed by
   * nothing, since `buildGameWhere` skips each filter whose value is `all` and
   * the filter bar DELETES the parameter when a reader chooses Any. A chip is
   * this page's promise that it can say what it was narrowed to; "all" is a
   * query string where a sentence goes, and it is announcing a filter that never
   * ran.
   */
  it("shows no chip for all, which is what this site calls no narrowing", () => {
    expect(appliedNarrowings({ ...NONE, pool: "all" })).toEqual([]);
    expect(appliedNarrowings({ ...NONE, rated: "all" })).toEqual([]);
    expect(appliedNarrowings({ ...NONE, outcome: "all" })).toEqual([]);
    const player = { name: "Alice", memberId: "id-1", removable: true };
    expect(appliedNarrowings({ ...NONE, player, outcome: "all" })).toEqual([
      { key: "player", label: "Alice's games" },
    ]);
    expect(appliedNarrowings({ ...NONE, player, verdict: "all" })).toEqual([
      { key: "player", label: "Alice's games" },
    ]);
  });

  /*
   * The same rule for a value nobody wrote. `toGameHistoryQuery` refuses these
   * outright — they are not in the enum — so the record is unfiltered and a chip
   * would be naming a narrowing that was actually REFUSED. The old fallback
   * printed them verbatim, which is a reader's own typing quoted back as though
   * the site had agreed to it.
   */
  it("shows no chip for a value this site has no word for", () => {
    expect(appliedNarrowings({ ...NONE, pool: "banana" })).toEqual([]);
    expect(appliedNarrowings({ ...NONE, rated: "maybe" })).toEqual([]);
    expect(appliedNarrowings({ ...NONE, outcome: "decided-ish" })).toEqual([]);
    const player = { name: "Alice", memberId: "id-1", removable: true };
    expect(appliedNarrowings({ ...NONE, player, verdict: "sideways" })).toEqual([
      { key: "player", label: "Alice's games" },
    ]);
  });

  /*
   * THE WAY BACK. A count's link names its player by `?member=<id>` now, so a
   * "×" that deleted `player` would leave the record exactly as narrowed as it
   * found it — a filter a reader is invited to take off and cannot.
   */
  it("clears member, not player, when the player arrived by id", () => {
    const byId = { name: "Hanako Morris", memberId: "m-1", removable: true, via: "member" as const };
    expect(appliedNarrowings({ ...NONE, player: byId })).toEqual([
      { key: "player", label: "Hanako M.'s games", clears: "member" },
    ]);
    const byName = { name: "Alice", memberId: null, removable: true };
    expect(appliedNarrowings({ ...NONE, player: byName })[0].clears).toBeUndefined();
  });

  /*
   * THE CHIP PRINTS A NAME THE WAY EVERY LIST DOES. The rows under it read
   * "Hanako M." by the 0.133.0 rule, so a chip reading "Hanako Morris's games"
   * put the whole name on display in the one place the page says who it is
   * about. It asks `shownName`, so a program keeps its whole name here too.
   */
  it("labels a player by first name and initial, as every list shows them", () => {
    const person = { name: "Hanako Morris", memberId: "m-1", removable: true };
    expect(appliedNarrowings({ ...NONE, player: person })[0].label).toBe("Hanako M.'s games");
    const single = { name: "Alice", memberId: null, removable: true };
    expect(appliedNarrowings({ ...NONE, player: single })[0].label).toBe("Alice's games");
  });

  /*
   * A pair's record. The other member gets a chip of their own, in the
   * reader's language through its phrase, and taking the player off takes the
   * pair with it — `against` with nobody on the other side would sit in the
   * address narrowing nothing.
   */
  it("says a pair the query applied, and takes it off with the player", () => {
    const player = {
      name: "Hanako Morris",
      memberId: "id-1",
      removable: true,
      via: "member" as const,
      against: { name: "Dan", memberId: "id-2" },
    };
    expect(appliedNarrowings({ ...NONE, player, outcome: "won" })).toEqual([
      { key: "player", label: "Hanako M.'s games", clears: "member", alsoClears: ["against"] },
      { key: "against", label: "against Dan", phrase: { key: "rivalry.against", vars: { name: "Dan" } } },
      { key: "outcome", label: "Won" },
    ]);
  });

  it("claims no pair where none was applied", () => {
    const player = { name: "Alice", memberId: "id-1", removable: true };
    expect(appliedNarrowings({ ...NONE, player }).map((one) => one.key)).toEqual(["player"]);
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
