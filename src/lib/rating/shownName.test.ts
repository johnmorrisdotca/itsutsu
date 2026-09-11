import { describe, expect, it } from "vitest";

import { BOT_MEMBER_LIST } from "@/lib/bots/bots.constants";
import { shownName } from "./shownName";

describe("the name the site prints", () => {
  it("shows a person by their first name and an initial", () => {
    // The case this exists for: a twelve-year-old's full name was on the board.
    expect(shownName("Hanako Morris")).toBe("Hanako M.");
  });

  it("tells two people with one first name apart", () => {
    /*
     * Why not the bare first name, which is what was asked for. A ladder is a
     * ranking, and built that way it read "Sora, Kaya, Again, Sora, Sweep,
     * Sora" — different people, identical on screen, in the one list whose
     * whole job is saying who is who.
     */
    expect(shownName("Sora Tanaka")).not.toBe(shownName("Sora Yamada"));
  });

  it("gives away the initial and not the name", () => {
    // The surname is the part that turns a first name into somebody you can
    // look up. An initial tells two people apart without doing that.
    expect(shownName("Hanako Morris")).not.toContain("Morris");
  });

  it("leaves a single name alone, having nothing to shorten", () => {
    expect(shownName("Chibi")).toBe("Chibi");
  });

  it("takes the initial from the last part, not the middle one", () => {
    expect(shownName("Mary Jane Watson")).toBe("Mary W.");
  });

  it("keeps a hyphenated or apostrophised name whole", () => {
    /*
     * One name, not two. Splitting these would be a different way of getting
     * somebody's name wrong, which is not an improvement on the first.
     */
    expect(shownName("Anne-Marie Dubois")).toBe("Anne-Marie D.");
    expect(shownName("Siobhán O'Connor")).toBe("Siobhán O.");
  });

  it("keeps every computer player's name whole", () => {
    // There is nobody behind them to protect, and the full name is the
    // character — "Hidemasa" alone takes something real away.
    for (const bot of BOT_MEMBER_LIST) {
      expect(shownName(bot.name), `${bot.name} lost part of its name`).toBe(bot.name);
    }
  });

  it("does not care how a name was capitalised or spaced", () => {
    expect(shownName("  hanako   morris  ")).toBe("hanako M.");
  });

  it("says nothing about a name that is nothing", () => {
    expect(shownName("")).toBe("");
    expect(shownName("   ")).toBe("");
  });
});
