import { describe, expect, it } from "vitest";

import { describeRules, describeSettings } from "./rulesSummary";
import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";

/**
 * The line above a board describes that board.
 *
 * John opened a game of Halma against Meijin and read "Halma ハルマ · 9×9
 * Mini" over a board sixteen columns wide. Both halves were doing what they
 * were told: the engine snaps a size the variant does not offer as it builds
 * the state, so the board was right, and the label was reading the number in
 * the row, which was 9.
 *
 * Rows written since the size is settled on the way in cannot say 9 for a
 * game of Halma. Two in production still do, because they were written
 * before that, and rather than trust that no such row will ever exist again
 * the label snaps the same way the board does.
 */
const plain = { obstacles: "none", opening: "free", handicap: NO_HANDICAP };

describe("describeRules", () => {
  it("names the board a game is actually played on, not the number in the row", () => {
    // The case John found: stored 9, drawn 16.
    const line = describeRules({ ...plain, variant: "halma", size: 9 });
    expect(line, "the label repeated a size Halma does not have").toContain("16×16");
    expect(line).not.toContain("9×9");
  });

  it("does the same for the size that started all this", () => {
    // A Reversi game stored at 19×19 is still a game of Reversi on 8×8.
    expect(describeRules({ ...plain, variant: "reversi", size: 19 })).toContain("8×8");
  });

  it("leaves a size the game does offer exactly alone", () => {
    expect(describeRules({ ...plain, variant: "halma", size: 10 })).toContain("10×10");
    expect(describeRules({ ...plain, variant: "freestyle", size: 15 })).toContain("15×15");
    expect(describeRules({ ...plain, variant: "go", size: 13 })).toContain("13×13");
  });

  it("still says what the game is, and adds the board's own name", () => {
    const line = describeRules({ ...plain, variant: "halma", size: 9 });
    expect(line).toContain("Halma");
    // 16 is "Sixteen 十六路" in the size table; 9 is "Mini", which is what
    // John saw and what made the two halves visibly disagree.
    expect(line).toContain("Sixteen");
    expect(line).not.toContain("Mini");
  });

  it("says nothing clever about a variant it does not know", () => {
    // An unknown name has no sizes to snap to, so the row's number stands.
    expect(describeRules({ ...plain, variant: "not-a-game", size: 12 })).toContain("12×12");
  });
});

/**
 * The line that stands in for the folded controls.
 *
 * It exists because the set-up screen's pictures pushed the Start button off
 * the bottom of an iPad, so five controls moved behind a disclosure — and a
 * disclosure is only honest if the line above it says what is inside. The one
 * thing it must never do is describe a game other than the one the button
 * would start, so what is checked here is that every word tracks the value it
 * came from.
 */
const settings = {
  opening: "free",
  allowResign: true,
  moveTimeMs: null as number | null,
  clockMode: "move",
  rated: true,
};
const words = (over: Partial<typeof settings> = {}) =>
  describeSettings({ ...settings, ...over }).map((word) => word.text);
const notable = (over: Partial<typeof settings> = {}) =>
  describeSettings({ ...settings, ...over })
    .filter((word) => word.notable)
    .map((word) => word.text);

describe("describeSettings", () => {
  it("says all four settings, in the order the controls appear inside", () => {
    expect(words()).toEqual(["Free opening", "Resigning allowed", "No clock", "Rated"]);
  });

  it("marks nothing notable when everything is the ordinary setting", () => {
    // A line where every word shouts is a line where none of them does.
    expect(notable()).toEqual([]);
  });

  it("tracks the clock, which is the case the disclosure was argued over", () => {
    // "A rematch that arrived with a 5-minute clock should not read the same
    // as one with none." It does not.
    expect(words({ moveTimeMs: 5 * 60_000 })).toContain("5 minutes a move");
    expect(notable({ moveTimeMs: 5 * 60_000 })).toEqual(["5 minutes a move"]);
    expect(words()).toContain("No clock");
  });

  it("folds the clock's mode into the clock's own words", () => {
    // Two controls, one word: the phrase says which mode without naming it.
    expect(words({ moveTimeMs: 20 * 60_000, clockMode: "game" })).toContain(
      "20 minutes each for the whole game",
    );
    expect(words({ moveTimeMs: 20 * 60_000, clockMode: "move" })).toContain("20 minutes a move");
  });

  it("tracks resigning, the ratings and the opening", () => {
    expect(notable({ allowResign: false })).toEqual(["No resigning"]);
    expect(words({ allowResign: false })).toContain("No resigning");
    expect(notable({ rated: false })).toEqual(["Friendly"]);
    expect(words({ rated: false })).toContain("Friendly");
    expect(notable({ opening: "swap" })).toEqual(["Swap opening"]);
  });

  it("marks every one of them at once, so no word is left unwired", () => {
    // The failure this guards is a word that always reads ordinary because
    // nothing ever sets its flag, which looks exactly like a calm line.
    const all = describeSettings({
      opening: "swap",
      allowResign: false,
      moveTimeMs: 60_000,
      clockMode: "move",
      rated: false,
    });
    expect(
      all.every((word) => word.notable),
      all.map((word) => word.text).join(" / "),
    ).toBe(true);
  });

  it("says an opening it does not recognise rather than dropping it", () => {
    // Silence about a setting is the one thing a summary cannot afford.
    expect(words({ opening: "not-an-opening" })).toContain("not-an-opening opening");
  });
});
