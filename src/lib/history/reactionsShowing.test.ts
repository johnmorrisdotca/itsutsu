import { describe, expect, it } from "vitest";

import type { GameReaction } from "./gameHistory.types";
import { REACTION_SHOW_MS } from "./reactions.constants";
import { reactionsShowing } from "./reactionsShowing";

const SENT = Date.parse("2026-09-13T12:00:00.000Z");

const reaction = (id: string, at: number): GameReaction => ({
  id,
  stone: "black",
  emoji: "\u{1F44F}",
  text: null,
  moveNumber: 1,
  createdAt: new Date(at).toISOString(),
});

describe("reactionsShowing", () => {
  /*
   * THE FIRST DRAWING MUST NOT DEPEND ON THE CLOCK. The server and the browser
   * each drew this with their own `Date.now()`, so a reaction expiring in the
   * instant a page loaded was a bubble in one and nothing in the other. Until
   * the browser has the page there is no "now", and no "now" shows nothing —
   * even a reaction sent this very millisecond.
   */
  it("shows nothing before there is a now, however fresh the reaction", () => {
    expect(reactionsShowing([reaction("a", SENT)], null)).toEqual([]);
  });

  it("shows a reaction for its few seconds and lets it go after", () => {
    const one = reaction("a", SENT);
    expect(reactionsShowing([one], SENT)).toEqual([one]);
    expect(reactionsShowing([one], SENT + REACTION_SHOW_MS - 1)).toEqual([one]);
    expect(reactionsShowing([one], SENT + REACTION_SHOW_MS)).toEqual([]);
  });

  it("keeps the fresh ones and drops the old ones from one list, in order", () => {
    const old = reaction("old", SENT - REACTION_SHOW_MS - 1);
    const recent = reaction("recent", SENT - 1_000);
    const newest = reaction("newest", SENT);
    expect(reactionsShowing([old, recent, newest], SENT).map((one) => one.id)).toEqual(["recent", "newest"]);
  });
});
