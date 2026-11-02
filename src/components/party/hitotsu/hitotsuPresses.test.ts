import { HITOTSU_CLASSIC, startHitotsu, type HitotsuGame } from "@johnmorrisdotca/hitotsu";
import { describe, expect, it } from "vitest";

import { speaker } from "@/lib/i18n/i18n";

import { hitotsuPresses } from "./hitotsuPresses";

/** A table in a known position: Ann holds these cards, a red five is on top, and it is her turn. */
function position(hand: string[], finishOnNumber: boolean): HitotsuGame {
  const base = startHitotsu(1, ["Ann", "Ben"], 3, { ...HITOTSU_CLASSIC, finishOnNumber }, [false, true])!;
  return { ...base, hands: [hand, ["G20", "G30"]], discard: ["R50"], colour: "R", toPlay: 0, drawn: null, pending: 0 };
}

const name = (seat: number) => ["Ann", "Ben"][seat]!;
const playPress = (game: HitotsuGame, card: string, say = speaker("en")) => hitotsuPresses(game, 0, card, false, name, say).find((press) => press.testId === "hitotsu-play")!;

describe("the Play press when the table plays finish on a number card", () => {
  it("says why a last action card cannot go, and offers no move for it", () => {
    const press = playPress(position(["RS0"], true), "RS0");
    expect(press.move).toBeNull();
    expect(press.why).toBe(speaker("en").say("party.hitotsu.finish.last"));
    expect(playPress(position(["RS0"], true), "RS0", speaker("ja")).why).toBe(speaker("ja").say("party.hitotsu.finish.last"));
  });

  it("lets a last number card go, and an action card go from a hand of two", () => {
    expect(playPress(position(["R20"], true), "R20").move).not.toBeNull();
    expect(playPress(position(["RS0", "R20"], true), "RS0").move).not.toBeNull();
  });

  it("lets a last action card go where the published rules are played, and keeps the usual reason for a card that does not match", () => {
    expect(playPress(position(["RS0"], false), "RS0").move).not.toBeNull();
    expect(playPress(position(["GS0"], true), "GS0").why).toBe(playPress(position(["GS0"], false), "GS0").why);
  });
});
