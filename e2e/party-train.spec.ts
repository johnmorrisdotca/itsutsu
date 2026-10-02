import { expect, test, type Page } from "@playwright/test";

import { TRAIN_DEFAULT_OPTIONS, TRAIN_PHASES, computerMove, encodeTrain, isDouble, legalPlays, playTrain, startTrain } from "@johnmorrisdotca/domino";
import type { TrainGame } from "@johnmorrisdotca/domino";
import { ready } from "./support";

/**
 * MEXICAN TRAIN, ROUND ONE DEVICE: a party game (`PartyKind` "mexicanTrain")
 * at home in the Tiles family, for two to eight with a computer in any seat.
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

/** A tile in the hand that goes on a train now (`data-targets`). */
function handTile(page: Page) {
  return page.getByTestId("train-hand").locator('[data-testid="train-hand-tile"][data-targets]:not([data-targets="0"])').first();
}

/** Wait until it is the person in seat 0's turn again, the computers done. */
async function backToSeatOne(page: Page) {
  const table = page.getByTestId("train-game");
  await expect(table).toHaveAttribute("data-to-play", "0", { timeout: 30_000 });
}

const WAYS = ["tap", "drag", "double"] as const;
type Lay = { way: (typeof WAYS)[number]; tile: number; train: number; targets: number };

/** The computers' turns played out, as the page plays them (`useTrainComputer`): null if the round ends first. */
function afterComputers(game: TrainGame): TrainGame | null {
  let now = game;
  while (now.phase === TRAIN_PHASES.playing && now.computers[now.toPlay] === true) now = playTrain(now, computerMove(now))!;
  return now.phase === TRAIN_PHASES.playing ? now : null;
}

/**
 * A TABLE OF ONE PERSON AND A COMPUTER WHOSE FIRST THREE TURNS ARE KNOWN: a
 * deal on which the person has a tile to lay on each of their first three
 * turns, and on the third one that goes on one train alone, which is what a
 * double-tap lays. Worked out here by the rules the page plays and the
 * computer's own judgement, so the spec names the tile and the train each
 * turn and never has to hope the deal offers one: a deal taken as it came
 * gave, often enough, three turns with nothing to lay. No double is laid, so
 * each lay ends the turn.
 */
function knownTable(from: number): { start: TrainGame; lays: Lay[]; end: TrainGame } {
  for (let seed = from; seed < from + 5_000; seed += 1) {
    const start = startTrain(12, ["Ann", ""], seed, TRAIN_DEFAULT_OPTIONS, [false, true])!;
    let game: TrainGame | null = afterComputers(start);
    const lays: Lay[] = [];
    for (const way of WAYS) {
      if (game === null || game.toPlay !== 0) break;
      const plays = legalPlays(game);
      const targets = (tile: number) => plays.filter((play) => play.tile === tile).length;
      const play = plays.find((one) => !isDouble(one.tile) && (way !== "double" || targets(one.tile) === 1));
      if (play === undefined) break;
      lays.push({ way, tile: play.tile, train: play.train, targets: targets(play.tile) });
      const laid = playTrain(game, { kind: "play", tile: play.tile, train: play.train });
      game = laid === null ? null : afterComputers(laid);
    }
    if (lays.length === WAYS.length && game !== null && game.toPlay === 0) return { start, lays, end: game };
  }
  throw new Error("No deal in five thousand gives seat one a tile to lay on each of its first three turns.");
}

test.describe("Mexican Train, read by anybody", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door, rules and family open with no session, and Play asks a stranger to join", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door")).toHaveAttribute("data-kind", "party");
    await expect(page.getByRole("heading", { name: /Mexican Train/ }).first()).toBeVisible();
    await expect(page.getByTestId("game-family")).toContainText("Tiles");
    await expect(page.getByTestId("facet-family")).toHaveAttribute("href", "/games/mahjong/family");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(/\/games\/mexican-train\/rules$/);
    await expect(page.getByTestId("rules-page")).toContainText("marker");

    await page.goto(AT);
    await page.getByTestId("facet-family").click();
    await expect(page).toHaveURL(/\/games\/mahjong\/family$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Tiles");
    await expect(page.locator('[data-testid="family-mark"][data-family="Tiles"]').first()).toBeVisible();
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

    // The same table on a deal this spec knows (`knownTable`), kept where the page keeps a game, and opened as a kept game is.
    const known = knownTable(20260930);
    await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [KEPT, encodeTrain(known.start)] as const);
    await page.reload();
    await ready(page, "train-game");
    await expect(table).toHaveAttribute("data-state", "playing");
    await expect(page.getByTestId("train-cover")).toHaveCount(0);

    const hand = page.getByTestId("train-hand");
    const tilesLeft = async () => hand.getByTestId("train-hand-tile").count();
    for (const lay of known.lays) {
      await backToSeatOne(page);
      await expect(hand).toHaveAttribute("data-active", "true");
      const before = await tilesLeft();
      const tile = hand.locator(`[data-testid="train-hand-tile"][data-tile="${lay.tile}"]`);
      await expect(tile).toHaveAttribute("data-targets", String(lay.targets));
      const row = page.locator(`[data-testid="train-row"][data-train="${lay.train}"]`);
      if (lay.way === "tap") {
        await tile.click();
        await expect(tile).toHaveAttribute("data-chosen", "true");
        await expect(row).toHaveAttribute("data-target", "true");
        await row.click();
      } else if (lay.way === "drag") {
        // A drag is made of places on the screen, so the tile and the train it goes to are both on it first.
        await tile.scrollIntoViewIfNeeded();
        await expect(tile).toBeInViewport();
        await expect(row).toBeInViewport();
        const box = (await tile.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 20, box.y - 40, { steps: 4 });
        await expect(page.getByTestId("train-dragging")).toBeVisible();
        await expect(row).toHaveAttribute("data-target", "true");
        const target = (await row.boundingBox())!;
        await page.mouse.move(target.x + target.width * 0.6, target.y + target.height / 2, { steps: 8 });
        await page.mouse.up();
      } else {
        // It goes on one train alone, so tapping it twice lays it there.
        await tile.dblclick();
      }
      await expect.poll(tilesLeft).toBe(before - 1);
      await expect(tile).toHaveCount(0);
    }
    // The computer has answered each time, and the table is where the rules say three turns each leave it.
    await backToSeatOne(page);
    await expect(table).toHaveAttribute("data-turn", String(known.end.turn));
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

    const tile = handTile(page);
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
