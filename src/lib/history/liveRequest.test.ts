import { describe, expect, it } from "vitest";

import { keysSaid, readCreation } from "./liveRequest";

/**
 * WHAT A CALLER ASKED FOR, AND THE HALF OF IT ZOD THROWS AWAY.
 *
 * The schema itself is exercised through the route (`route.test.ts`), which is
 * where the shapes the site actually posts are pinned. These are about the part
 * the parsed body cannot say: which fields were NAMED. A fork takes its clock,
 * its penalty and its rating from the game being forked unless the caller
 * settled one itself, and after parsing "said nothing about the clock" and
 * "asked for five minutes a move" both read as a number.
 */

describe("keysSaid", () => {
  it("names the fields a caller sent, and only those", () => {
    expect([...keysSaid({ moveTimeMs: 300_000, rated: true })].sort()).toEqual([
      "moveTimeMs",
      "rated",
    ]);
  });

  /*
   * THE CASE THE WHOLE THING EXISTS FOR. `rated: false` and no `rated` at all
   * are different answers, and a set of names is the only place that survives
   * the schema — which defaults `allowResign` to true, `open` to false and the
   * variant to freestyle for a body that said none of them.
   */
  it("tells a field said falsely from a field not said at all", () => {
    expect(keysSaid({ rated: false }).has("rated")).toBe(true);
    expect(keysSaid({}).has("rated")).toBe(false);
  });

  /*
   * A body that is not an object names no fields, which is the honest answer
   * rather than a defensive one: the schema refuses all of these a line later,
   * and "which fields did this name" has a correct answer of none.
   */
  it("names nothing for a body that is not a plain object", () => {
    expect(keysSaid(null).size).toBe(0);
    expect(keysSaid([{ rated: true }]).size).toBe(0);
    expect(keysSaid("rated").size).toBe(0);
    expect(keysSaid(7).size).toBe(0);
    expect(keysSaid(undefined).size).toBe(0);
  });
});

describe("readCreation", () => {
  it("carries the parsed body and the names beside it", () => {
    const read = readCreation({ variant: "freestyle", size: 9, open: true });

    expect("asked" in read).toBe(true);
    if (!("asked" in read)) return;
    expect(read.asked.data.size).toBe(9);
    expect(read.asked.data.allowResign, "a default the caller never sent").toBe(true);
    expect(read.asked.said.has("allowResign"), "and it is not in the names").toBe(false);
    expect(read.asked.said.has("open")).toBe(true);
  });

  /*
   * A REASON, NOT A RESPONSE. Every refusal on this path is a decision worth
   * being able to test by name, and a module that builds its own `NextResponse`
   * can only be shown what it decided rather than asked. `refusalResponse` in
   * `liveResponse.ts` is the one place that turns these into an answer.
   */
  it("refuses a game it cannot read with the status and the words, not a response", () => {
    const read = readCreation({ variant: "not-a-game" });

    expect("refused" in read).toBe(true);
    if (!("refused" in read)) return;
    expect(read.refused.status).toBe(422);
    expect(read.refused.error).toBe("That game could not be started.");
    expect(Array.isArray(read.refused.issues), "the schema's own account of what was wrong").toBe(true);
  });

  it("refuses a body that is not an object at all", () => {
    expect("refused" in readCreation("a game please")).toBe(true);
    expect("refused" in readCreation(null)).toBe(true);
  });
});
