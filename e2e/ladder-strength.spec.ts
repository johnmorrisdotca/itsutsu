import { expect, test } from "@playwright/test";

import { BOT_MEMBERS } from "../src/lib/bots/bots.constants";
import { playerPath } from "../src/lib/rating/playerKey";
import { BOT_TIERS } from "../src/lib/gomoku/opponent.constants";
import { ladderNeighbours } from "../src/lib/gomoku/ladderNeighbours";
import { readLadderFingerprint } from "../src/lib/gomoku/ladderFingerprint";
import { measuredLadder } from "../src/lib/gomoku/ladderStrength";
import { openOpponentLists } from "./support";

/**
 * WHAT A GRADE ACTUALLY DOES AT A GAME, SHOWN WHERE IT IS DECIDED.
 *
 * A grade's name is one claim about more than forty games. `ladderStrength`
 * measures a round robin per game and keeps the fingerprint of the code that
 * played it, so a measurement taken against a bot that has since changed says
 * nothing at all.
 *
 * THIS SPEC DECIDES WHAT TO EXPECT RATHER THAN TOLERATING EITHER ANSWER. It
 * computes the same fingerprint the server computed at build, asks the same
 * function the page asks, and then asserts exactly one outcome: the panel is
 * there with a sentence in it, or it is not there at all. A spec that accepted
 * both would pass on a page that had silently stopped showing anything, which
 * is the failure this feature is most likely to have — the table goes quiet
 * whenever anybody edits a bot file, which is exactly when nobody is looking
 * at a strength panel.
 */

const REVERSI = "reversi";
const TIER = BOT_TIERS.guoshou;

/** What the server will have concluded, from the same inputs it had. */
const measurement = measuredLadder(REVERSI, readLadderFingerprint());

test.describe("a grade's measured strength", () => {
  test("is on the computer player's own page, game by game", async ({ page }) => {
    await page.goto(playerPath(BOT_MEMBERS[TIER].name, BOT_MEMBERS[TIER].id));
    // Wait on the page itself before asserting the panel's presence OR its
    // absence: an absence asserted against an unrendered page is not a fact.
    await expect(page.getByTestId("player-profile")).toBeVisible();

    const panel = page.getByTestId("ladder-strength");
    if (measurement === null) {
      // Nothing current has been measured, so the page says nothing — which is
      // the promise, not a gap: a stale strength is worse than none.
      await expect(panel).toHaveCount(0);
      return;
    }

    await expect(panel).toBeVisible();
    const row = panel.getByTestId("ladder-strength-game").filter({ has: page.locator(`[data-variant="${REVERSI}"]`) });
    await expect(row.or(panel.locator(`[data-variant="${REVERSI}"]`)).first()).toBeVisible();

    // The sentence names the rung beside it rather than printing a rating.
    const below = ladderNeighbours(measurement, TIER).below;
    expect(below, "Guoshou has a rung below it in the measured table").not.toBeNull();
    await expect(panel).toContainText(BOT_MEMBERS[below!.tier].name);

    // And it says where the numbers came from, because a measurement with no
    // sample and no date is an assertion.
    await expect(panel.getByTestId("ladder-strength-note")).toContainText(String(measurement.gamesPerPairing));
  });

  test("is beside the opponent you are about to choose, for the game you are setting up", async ({ page }) => {
    await page.goto(`/games/${REVERSI}/new`);
    /*
     * THE PROGRAMS OPENED, because that is where this line lives and a fresh
     * game no longer arrives with the lists open: the seat posted for anyone is
     * an answer, so every run folds to a row saying how many it holds. A fold
     * keeps its children hidden rather than torn out, so the line is in the
     * page either way — and a spec that read it while the list was shut would
     * be reading something no reader can see.
     */
    await openOpponentLists(page);
    // The tiles are the presence to wait for; the measured line sits under one.
    await expect(page.locator('[data-testid="set-up-opponent"]').first()).toBeVisible();

    const measured = page.getByTestId("set-up-opponent-measured");
    if (measurement === null) {
      await expect(measured).toHaveCount(0);
      return;
    }
    // Every graded rung but the top one has a rung above to be compared with,
    // so a measured game always puts at least one of these on the screen.
    await expect(measured.first()).toBeVisible();
    await expect(measured.first()).toContainText("Measured here");
  });
});
