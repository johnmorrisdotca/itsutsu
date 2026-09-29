import { expect, test, type Page } from "@playwright/test";

import { TRAIN_PHASES, playTrain, startTrain } from "../src/lib/party/mexicanTrain/mexicanTrain";
import { encodeTrain } from "../src/lib/party/mexicanTrain/trainCodec";
import { computerMove } from "../src/lib/party/mexicanTrain/trainComputer";
import { ready } from "./support";

/**
 * MEXICAN TRAIN, ROUND ONE DEVICE: a party game (`PartyKind` "mexicanTrain")
 * at home in the Dominoes family, for two to eight with a computer in any seat.
 *
 * Driven as a table drives it: set up from the game's own page, then tiles
 * laid by a tap and a tap, by a drag onto a train, and by a double-tap where a
 * tile fits one train alone. Hands are secret, so a table of two people passes
 * a cover between turns. A round's end is reached from a known position made
 * by the same rules the page plays and kept where the table keeps a game. The
 * game lives in this browser only; nothing here writes to the database.
 */
const KEPT = "itsutsu.mexicanTrain";
const AT = "/games/mexican-train";

async function clearKept(page: Page) {
  await page.goto(AT);
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
}

/** A tile in the hand that goes on exactly `trains` trains now (`data-targets`). */
function handTile(page: Page, trains: number | "any") {
  const hand = page.getByTestId("train-hand");
  return trains === "any" ? hand.locator('[data-testid="train-hand-tile"][data-targets]:not([data-targets="0"])').first() : hand.locator(`[data-testid="train-hand-tile"][data-targets="${trains}"]`).first();
}

/** Wait until it is the person in seat 0's turn again, the computers done. */
async function backToSeatOne(page: Page) {
  const table = page.getByTestId("train-game");
  await expect(table).toHaveAttribute("data-to-play", "0", { timeout: 30_000 });
}

test.describe("Mexican Train, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door, rules and family open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Mexican Train/ }).first()).toBeVisible();
    await expect(page.getByTestId("game-family")).toContainText("Dominoes");
    await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/dominoes");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/mexican-train\/rules$/);
    await expect(page.getByTestId("rules-page")).toContainText("marker");

    await page.goto("/games/dominoes");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dominoes");
    await expect(page.locator('[data-testid="family-mark"][data-family="Dominoes"]').first()).toBeVisible();
    await expect(page.locator("main")).toContainText("Mexican Train");

    await page.goto(AT);
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/join/);
  });
});

test.describe("Mexican Train, pass and play", () => {
  test("one person and a computer: a tap and a tap, a drag, a double-tap; the computer answers; kept, and waiting on My games", async ({ page }) => {
    await clearKept(page);
    await page.goto(AT);
    await ready(page, "party-kind-offer");
    await page.getByTestId("game-set-up").click();
    await expect(page).toHaveURL(/\/games\/mexican-train\/pass-and-play$/);
    await ready(page, "train-set-up");
    await page.locator('[data-testid="train-count"][data-count="2"]').click();
    await page.getByTestId("train-name").first().fill("Ann");
    // The second seat opens as a computer.
    await expect(page.getByTestId("train-computer").nth(1)).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("train-start").click();

    await ready(page, "train-game");
    const table = page.getByTestId("train-game");
    await expect(table).toHaveAttribute("data-state", "playing");
    // One person at the table: their hand is face up, with no cover.
    await expect(page.getByTestId("train-cover")).toHaveCount(0);
    await expect(page.getByTestId("train-hand")).toHaveAttribute("data-active", "true");

    let laid = 0;
    const tilesLeft = async () => page.locator('[data-testid="train-hand"] [data-testid="train-hand-tile"]').count();
    for (const way of ["tap", "drag", "double"] as const) {
      await backToSeatOne(page);
      const before = await tilesLeft();
      const tile = handTile(page, way === "double" ? 1 : "any");
      if ((await tile.count()) === 0) {
        // Nothing to lay this turn: the rules ask for a draw, or a pass, and the next turn is tried.
        if (await page.getByTestId("train-draw").isEnabled()) await page.getByTestId("train-draw").click();
        else await page.getByTestId("train-pass").click();
        continue;
      }
      if (way === "tap") {
        await tile.click();
        await expect(tile).toHaveAttribute("data-chosen", "true");
        await page.locator('[data-testid="train-row"][data-target="true"]').first().click();
      } else if (way === "drag") {
        const box = (await tile.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 20, box.y - 40, { steps: 4 });
        const row = page.locator('[data-testid="train-row"][data-target="true"]').first();
        const target = (await row.boundingBox())!;
        await expect(page.getByTestId("train-dragging")).toBeVisible();
        await page.mouse.move(target.x + target.width * 0.6, target.y + target.height / 2, { steps: 8 });
        await page.mouse.up();
      } else {
        await tile.dblclick();
      }
      await expect.poll(tilesLeft).toBe(before - 1);
      laid += 1;
    }
    expect(laid).toBeGreaterThan(0);
    // The computer has played in between: its train or the Mexican Train has tiles, or it drew.
    await expect(page.getByTestId("train-last")).not.toHaveText("");

    // Kept in this browser: a reload opens the same table, and My games lists it.
    const turn = await table.getAttribute("data-turn");
    await page.reload();
    await ready(page, "train-game");
    await expect(table).toHaveAttribute("data-turn", turn!);
    await page.goto("/play/pass-and-play");
    await expect(page.locator('[data-testid="party-game"][data-variant="mexicanTrain"]')).toContainText("Double-twelve");
    await page.locator('[data-testid="party-game"][data-variant="mexicanTrain"]').getByTestId("party-game-continue").click();
    await ready(page, "train-game");
    await page.getByTestId("train-new").click();
    await page.getByTestId("train-new-yes").click();
    await ready(page, "train-set-up");
  });

  test("two people: the hand waits under a cover naming who to pass to, and is covered again for the next", async ({ page }) => {
    await clearKept(page);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "train-set-up");
    await page.locator('[data-testid="train-count"][data-count="2"]').click();
    await page.getByTestId("train-computer").nth(1).click();
    await page.getByTestId("train-name").nth(0).fill("Ann");
    await page.getByTestId("train-name").nth(1).fill("Ben");
    await page.getByTestId("train-start").click();
    await ready(page, "train-game");

    const cover = page.getByTestId("train-cover");
    await expect(cover).toContainText("Pass the device to Ann");
    await expect(page.getByTestId("train-hand")).toHaveCount(0);
    await page.getByTestId("train-reveal").click();
    await expect(page.getByTestId("train-hand")).toHaveAttribute("data-seat", "0");

    const tile = handTile(page, "any");
    if ((await tile.count()) > 0) {
      await tile.click();
      await page.locator('[data-testid="train-row"][data-target="true"]').first().click();
    } else {
      await page.getByTestId("train-draw").click();
      if (await page.getByTestId("train-pass").isEnabled()) await page.getByTestId("train-pass").click();
    }
    // Ben's turn, unless Ann laid a double and must cover it: either way, whoever is next is behind the cover or Ann is still laying.
    const toPlay = await page.getByTestId("train-game").getAttribute("data-to-play");
    if (toPlay === "1") {
      await expect(cover).toContainText("Pass the device to Ben");
      await expect(page.getByTestId("train-hand")).toHaveCount(0);
    }
  });

  test("a round's end counts the pips, and the next round is dealt round the next double", async ({ page }) => {
    let game = startTrain(9, ["Ann", "Ben"], 20260929, undefined, [false, false])!;
    while (game.phase === TRAIN_PHASES.playing) game = playTrain(game, computerMove(game))!;
    await page.goto(AT);
    await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [KEPT, encodeTrain(game)] as const);
    await page.goto(`${AT}/pass-and-play`);
    await ready(page, "train-game");
    const over = page.getByTestId("train-round-over");
    await expect(over).toHaveAttribute("data-round", "1");
    await expect(page.getByTestId("train-round-row")).toHaveCount(2);
    await expect(page.getByTestId("train-table")).toHaveAttribute("data-engine", "9");
    await page.getByTestId("train-next-round").click();
    await expect(page.getByTestId("train-table")).toHaveAttribute("data-engine", "8");
    await expect(page.getByTestId("train-table")).toHaveAttribute("data-round", "1");
  });
});
