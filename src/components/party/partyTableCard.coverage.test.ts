import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ONE FRAME FOR EVERYTHING GOING ON MY GAMES (`GoingCard`, and `PartyTableCard` for a table round one device).
 * Twenty-one components drew the same card by hand, and a fix to its layout had to be made in each. A game decides
 * whether it has one going and what its line says; the picture, the heading, the wrapping row and the button are
 * the frame's, and a new game draws them there.
 */
const FILES = execFileSync("git", ["ls-files", "src/components"], { encoding: "utf8" })
  .split("\n")
  .filter((path) => /\.tsx$/.test(path) && !path.endsWith("PartyTableCard.tsx") && !path.endsWith("GoingCard.tsx"));

describe("the card of a party game going", () => {
  it("is drawn by PartyTableCard and by no component of its own", () => {
    const drawnByHand = FILES.filter((path) => {
      const source = readFileSync(path, "utf8");
      return source.includes('data-testid="party-game"') || source.includes("party-game-continue") || source.includes("flex-[1_1_11rem]");
    });
    expect(drawnByHand, "these draw their own copy of the My games card for a table").toEqual([]);
  });

  it("is used by every table that keeps a game in this browser", () => {
    const users = FILES.filter((path) => path.startsWith("src/components/party/") && readFileSync(path, "utf8").includes("<PartyTableCard"));
    expect(users.length).toBeGreaterThanOrEqual(16);
  });
});
