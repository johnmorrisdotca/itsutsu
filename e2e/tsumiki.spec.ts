import { expect, test, type Page } from "@playwright/test";
import { applyAction, createGame, createLevel, legalActions, levelManifest, tutorialManifest } from "@johnmorrisdotca/houseki/tsumiki";

import { housekiQuery } from "../src/lib/houseki/housekiAddress";
import { housekiPlayPath } from "../src/lib/gomoku/slugs";
import { ready } from "./support";

/**
 * TSUMIKI 積み木: three shapes laid on an eight by eight board, and every full row and column clears. Played by pressing a
 * shape and then a square, and by dragging a shape onto the board, as a reader does. Its own: a shape goes only where it fits,
 * full lines clear together, and three more come when the tray is empty.
 */
const AT = "/games/tsumiki";

const slot = (page: Page, at: number) => page.locator(`[data-testid="tsumiki-slot"][data-slot="${at}"]`);
const square = (page: Page, cell: number) => page.locator(`[data-testid="houseki-well"] [data-cell="${cell}"]`);
const full = (page: Page) => page.getByTestId("houseki-full");

async function openLevel(page: Page, number: number) {
  await page.goto(housekiPlayPath("tsumiki", housekiQuery({ kind: "level", campaign: "classic", number })));
  await ready(page, "houseki-game");
  await expect(page.getByTestId("tsumiki-tray")).toBeVisible();
}

async function playStep(page: Page, [at, row, column]: readonly number[], moves: number) {
  await slot(page, at!).click();
  await square(page, row! * 8 + column!).click();
  await expect(full(page)).toHaveAttribute("data-progress", String(moves));
}

test.describe("Tsumiki, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, at home in Houseki, on its package", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText("Tsumiki");
    await page.goto(`${AT}/rules`);
    await expect(page.locator("main")).toContainText("When a row or a column is full, it clears");
    await expect(page.getByTestId("open-source")).toContainText("Houseki");
  });
});

test.describe("Tsumiki", () => {
  test("a level, set up on its page, played by pressing shape then square, wins on its goal", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "houseki-set-up");
    await page.locator('[data-testid="houseki-level"][data-level="1"]').click();
    await page.getByTestId("houseki-start").click();
    await ready(page, "houseki-game");
    const level = levelManifest[0]!;
    await expect(page.getByTestId("houseki-goal")).toHaveAttribute("data-total", String(level.goal.kind === "clear-stones" ? level.stones.length : level.goal.target));
    let moves = 0;
    for (const step of level.witness) {
      moves += 1;
      await playStep(page, step, moves);
    }
    await expect(page.locator('[data-testid="houseki-result"][data-result="won"]')).toBeVisible();
    await expect(full(page)).toHaveAttribute("data-phase", "won");
  });

  test("a shape goes only where it fits, the status says so, and a shape can be chosen again or dragged", async ({ page }) => {
    // Tall enough to hold the board and the tray at once, because a drag crosses from one to the other.
    await page.setViewportSize({ width: 1280, height: 1200 });
    await openLevel(page, 2);
    const game = createLevel(2);
    const action = legalActions(game).find((each) => each.slot === 0)!;
    const piece = game.tray[0]!;
    const widest = Math.max(...piece.cells.map(([, column]) => column));
    const tallest = Math.max(...piece.cells.map(([row]) => row));
    // Choose it, and again to let it go.
    await slot(page, 0).click();
    await expect(slot(page, 0)).toHaveAttribute("data-chosen", "true");
    await slot(page, 0).click();
    await expect(slot(page, 0)).toHaveAttribute("data-chosen", "false");
    await slot(page, 0).click();
    // Off the edge: refused, nothing moves. A shape of one square fits anywhere, so this holds only where the piece is bigger than that.
    if (widest > 0 || tallest > 0) {
      await square(page, 63).click();
      await expect(full(page)).toHaveAttribute("data-progress", "0");
    }
    // Where it fits, it is laid, and the tray's place is empty.
    await square(page, action.row * 8 + action.column).click();
    await expect(full(page)).toHaveAttribute("data-progress", "1");
    await expect(slot(page, 0)).toBeDisabled();
    await expect(page.getByTestId("houseki-score")).toContainText(String(piece.cells.length));
    // The next by dragging: from the tray, across the page, onto a square.
    const after = applyAction(game, action).state;
    const next = legalActions(after).find((each) => each.slot === 1)!;
    const from = (await slot(page, 1).boundingBox())!;
    const to = (await square(page, next.row * 8 + next.column).boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect(full(page)).toHaveAttribute("data-progress", "2");
  });

  test("three shapes laid bring three more, and a full line clears and is counted", async ({ page }) => {
    await openLevel(page, 1);
    const level = levelManifest[0]!;
    // Every recorded step but the last: the tray empties and fills on the way, and lines clear on the way to a goal of lines.
    let moves = 0;
    for (const step of level.witness.slice(0, 3)) {
      moves += 1;
      await playStep(page, step, moves);
    }
    await expect(slot(page, 0)).toBeEnabled();
    await expect(slot(page, 1)).toBeEnabled();
    await expect(slot(page, 2)).toBeEnabled();
    for (const step of level.witness.slice(3)) {
      moves += 1;
      await playStep(page, step, moves);
    }
    await expect(page.getByTestId("houseki-lines")).toContainText(String(level.goal.kind === "lines" ? level.goal.target : 0));
  });

  test("a lesson says what it teaches, and a free game keeps going until nothing fits", async ({ page }) => {
    await page.goto(housekiPlayPath("tsumiki", housekiQuery({ kind: "lesson", number: 1 })));
    await ready(page, "houseki-game");
    await expect(page.getByTestId("houseki-lesson")).toContainText(tutorialManifest[0]!.steps[0]!.instruction.en);
    await page.goto(housekiPlayPath("tsumiki", housekiQuery({ kind: "free", size: "8x8", colours: 6, arcade: false })));
    await ready(page, "houseki-game");
    await expect(page.getByTestId("tsumiki-tray")).toBeVisible();
    await expect(page.getByTestId("houseki-goal")).toHaveCount(0);
  });

  test("left half way it waits in My games and opens where it was left", async ({ page }) => {
    await openLevel(page, 4);
    const level = levelManifest[3]!;
    await playStep(page, level.witness[0]!, 1);
    await playStep(page, level.witness[1]!, 2);
    // Where a game kept in the browser waits: the games played round this device, a tab of My games.
    await page.goto("/play/pass-and-play");
    const card = page.locator('[data-testid="houseki-card"][data-kind="tsumiki"]');
    await expect(card).toBeVisible();
    await card.getByTestId("houseki-card-continue").click();
    await ready(page, "houseki-game");
    await expect(full(page)).toHaveAttribute("data-progress", "2");
  });

  test("today's game opens from the front door and is the day's for everybody", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "houseki-set-up");
    await page.goto(housekiPlayPath("tsumiki", housekiQuery({ kind: "daily" })));
    await ready(page, "houseki-game");
    const day = createGame({ mode: "daily", dailyDate: new Date().toISOString().slice(0, 10) });
    await expect(slot(page, 0)).toHaveAttribute("data-shape", day.tray[0]!.shape);
    await expect(slot(page, 2)).toHaveAttribute("data-shape", day.tray[2]!.shape);
  });
});
