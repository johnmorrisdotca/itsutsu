import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, STONES } from "@/lib/gomoku/gomoku.constants";
import { createMatchRequest } from "./useMatchMirror";

/**
 * A board played at one screen is a real game the moment somebody keeps it,
 * but it is not a game either side asked to be rated: nobody chose it, and
 * two ordinary names typed into the boxes here do not refuse each other the
 * way a blank or a repeated one does. `rated: false` has to be said here,
 * explicitly, rather than left to whatever the route defaults an absent
 * field to — see AGENTS.md, "A board you were only trying out creates a
 * rated game".
 */
describe("createMatchRequest", () => {
  it("asks for the match unrated", () => {
    const request = createMatchRequest(DEFAULT_SETTINGS, 1, "freestyle", STONES.black, "Alice", "Bob");

    expect(request.rated).toBe(false);
  });

  it("still names the hot-seat game it is starting", () => {
    const request = createMatchRequest(DEFAULT_SETTINGS, 7, "freestyle", STONES.black, "Alice", "Bob");

    expect(request).toMatchObject({
      hotSeat: true,
      seed: 7,
      variant: "freestyle",
      opener: STONES.black,
      blackName: "Alice",
      whiteName: "Bob",
      allowResign: false,
      open: false,
      rated: false,
    });
  });
});
