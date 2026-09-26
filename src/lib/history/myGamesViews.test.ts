import { describe, expect, it } from "vitest";

import { MY_GAMES_VIEWS, VIEW_GROUPS, myGamesView, viewHref, viewOfGroup } from "./myGamesViews";
import { MY_GAME_GROUPS } from "./myGames";

const TABS = MY_GAMES_VIEWS.map((key) => ({ key, label: key }));

describe("My games views", () => {
  it("puts every group of the queue in exactly one view", () => {
    for (const group of MY_GAME_GROUPS) {
      expect(MY_GAMES_VIEWS.filter((view) => VIEW_GROUPS[view].includes(group)), group).toHaveLength(1);
    }
  });

  it("keeps finished games and hot-seat games off Going", () => {
    expect(VIEW_GROUPS.going).not.toContain("finished");
    expect(VIEW_GROUPS.going).not.toContain("hotSeat");
    expect(viewOfGroup("finished")).toBe("completed");
    expect(viewOfGroup("hotSeat")).toBe("pass-and-play");
  });

  it("opens the view a ?all= group lives in, so old Show all links still land", () => {
    expect(myGamesView(TABS, undefined, "finished")).toBe("completed");
    expect(myGamesView(TABS, "going", "hotSeat")).toBe("pass-and-play");
    expect(myGamesView(TABS, undefined, "yourMove")).toBe("going");
  });

  it("reads ?view=, and falls back to Going for anything else", () => {
    expect(myGamesView(TABS, "completed", null)).toBe("completed");
    // The Puzzles tab is gone: its puzzles are under Going and Completed now, and its old address opens Going.
    expect(myGamesView(TABS, "puzzles", null)).toBe("going");
    expect(myGamesView(TABS, "nonsense", null)).toBe("going");
    expect(myGamesView(TABS, undefined, "seated")).toBe("going");
  });

  it("gives Going the plain address", () => {
    expect(viewHref("going")).toBe("/play");
    expect(viewHref("completed")).toBe("/play?view=completed");
  });
});
