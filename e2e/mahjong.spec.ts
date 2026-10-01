import { expect, test, type Locator, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeMoves } from "@johnmorrisdotca/jarajara";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * MAHJONG SOLITAIRE 牌合わせ: take matching pairs of free tiles off a stacked
 * layout until none are left, alone against the clock or two to four in turns
 * round one device. Every pair here is taken as a reader takes one — a tap and
 * a tap, a drag from one tile onto the other, or a double-tap — and a blocked
 * tile is pressed to see it refused. The solo game is played on the square of
 * eight the tests keep (size 4, never offered), cleared in four pairs.
 */
const KIND = "mahjong";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

function board(page: Page): Locator {
  return page.getByTestId("mahjong-board");
}

function tile(page: Page, slot: number): Locator {
  return board(page).locator(`[data-slot="${slot}"]`);
}

/** The pairs the page says are free now, as it says them on the play root. */
async function freePairs(page: Page, root = "puzzle-play"): Promise<[number, number][]> {
  const text = (await page.getByTestId(root).getAttribute("data-pairs")) ?? "";
  return text === "" ? [] : text.split(" ").map((pair) => pair.split("-").map(Number) as [number, number]);
}

async function drag(page: Page, from: number, to: number) {
  const a = (await tile(page, from).boundingBox())!;
  const b = (await tile(page, to).boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await expect(page.getByTestId("mahjong-ghost")).toBeVisible();
  await page.mouse.up();
}

test.describe("Mahjong, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, in the Mahjong family, with the rules of matching", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("game-family")).toContainText("Mahjong");
    await page.getByTestId("game-rules-link").click();
    await expect(page).toHaveURL(new RegExp(`${AT}/rules$`));
    await expect(page.locator("main")).toContainText("Any flower matches any flower");
    await expect(page.locator("main")).toContainText("Turtle");
  });
});

test.describe("Mahjong Solitaire", () => {
  test("cleared by a tap and a tap, a drag and a double-tap; a blocked tile refuses; Undo gives a pair back", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 4, "easy", seed);
    const [first] = decodeMoves(puzzle.solution, puzzle.givens.length)!;
    await page.goto(`${AT}/play?size=4&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(board(page)).toHaveAttribute("data-cells", puzzle.givens);
    const play = page.getByTestId("puzzle-play");
    await expect(play).toHaveAttribute("data-left", "8");

    // The bottom row is covered by the row on it: pressed, it refuses and the line under the board says why.
    // Pressed on its uncovered left half, as a finger would find it.
    await expect(tile(page, 0)).toHaveAttribute("data-free", "false");
    const covered = (await tile(page, 0).boundingBox())!;
    await page.mouse.click(covered.x + covered.width * 0.2, covered.y + covered.height * 0.6);
    await expect(page.getByTestId("mahjong-said")).toContainText("not free");
    // Shuffle is for when no pair is left, and one is.
    await expect(page.getByTestId("mahjong-shuffle")).toBeDisabled();

    // Tap and tap.
    if (!("pair" in first!)) throw new Error("a deal's first move is a pair");
    await tile(page, first.pair[0]).click();
    await expect(tile(page, first.pair[0])).toHaveAttribute("data-chosen", "true");
    await tile(page, first.pair[1]).click();
    await expect(play).toHaveAttribute("data-left", "6");
    // Undo puts it back, and it is taken again.
    await page.getByTestId("mahjong-undo").click();
    await expect(play).toHaveAttribute("data-left", "8");
    await tile(page, first.pair[0]).click();
    await tile(page, first.pair[1]).click();
    await expect(play).toHaveAttribute("data-left", "6");

    // A drag from one free tile onto its match.
    const [dragged] = await freePairs(page);
    await drag(page, dragged![0], dragged![1]);
    await expect(play).toHaveAttribute("data-left", "4");

    // A double-tap takes a tile with its free match.
    const [doubled] = await freePairs(page);
    await tile(page, doubled![0]).dblclick();
    await expect(play).toHaveAttribute("data-left", "2");

    // The last pair, or a shuffle first if the table has run out of pairs.
    if ((await freePairs(page)).length === 0) await page.getByTestId("mahjong-shuffle").click();
    const [last] = await freePairs(page);
    await tile(page, last![0]).click();
    await tile(page, last![1]).click();
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
  });

  test("with hints chosen, Hint lights a free pair and counts it; without them it cannot be pressed", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=8&level=easy&seed=${seed}&hints=1`);
    await ready(page, "puzzle-play");
    const hint = page.getByTestId("puzzle-hint");
    await expect(hint).toHaveAttribute("data-allowed", "true");
    await hint.click();
    await expect(hint).toContainText("1 used");
    const lit = board(page).locator('[data-hinted="true"]');
    await expect(lit).toHaveCount(2);
    const pairs = (await freePairs(page)).map((pair) => pair.join("-"));
    const slots = await lit.evaluateAll((all) => all.map((one) => Number(one.getAttribute("data-slot"))));
    expect(pairs).toContain(slots.sort((a, b) => a - b).join("-"));
    // Taken, and the light goes with them.
    await tile(page, slots[0]!).click();
    await tile(page, slots[1]!).click();
    await expect(lit).toHaveCount(0);

    await page.goto(`${AT}/play?size=8&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-hint")).toBeDisabled();
    // No Check and no Show: nothing on a Mahjong table can be wrong.
    await expect(page.getByTestId("mahjong-undo")).toBeVisible();
    await expect(page.getByTestId("puzzle-check")).toHaveCount(0);
    await expect(page.getByTestId("puzzle-show")).toHaveCount(0);
  });

  test("left half way, it waits in My games and opens where it was left", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=8&level=medium&seed=${seed}`);
    await ready(page, "puzzle-play");
    const [pair] = await freePairs(page);
    await tile(page, pair![0]).click();
    await tile(page, pair![1]).click();
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-left", "62");
    const moves = await page.getByTestId("puzzle-play").getAttribute("data-moves");
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="${KIND}"][data-seed="${seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-moves", moves!);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-left", "62");
  });

  test("set up with its own choices, the Turtle zooms on a phone and fits back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="15"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "15");
    await page.getByTestId("mahjong-bonus-same").click();
    await expect(page.getByTestId("mahjong-bonus-blurb")).toContainText("identical pairs");
    await page.getByTestId("mahjong-free-off").click();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/size=15/);
    await ready(page, "puzzle-play");
    // The Identical rule is carried by the seed, and the free tiles are drawn alike now.
    await expect(board(page)).toHaveAttribute("data-show-free", "false");
    await page.getByTestId("mahjong-free-on").click();
    await expect(board(page)).toHaveAttribute("data-show-free", "true");
    const view = page.getByTestId("mahjong-viewport");
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("mahjong-arrows").click();
    await page.getByTestId("mahjong-pad-in").click();
    await expect(view).not.toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("mahjong-fit").click();
    await expect(view).toHaveAttribute("data-zoom", "1.00");
    await page.getByTestId("mahjong-arrows").click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("two at a table: a person and a computer take turns, scored, kept and waiting in My games", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="8"]').click();
    await page.getByTestId("mahjong-players-2").click();
    await expect(page.getByTestId("puzzle-race")).toBeDisabled();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/players=2/);
    await ready(page, "mahjong-table");
    // The second seat is a computer unless it is changed; the first is ours.
    await page.getByTestId("mahjong-table-name").first().fill("Aiko");
    await page.getByTestId("mahjong-table-begin").click();
    const table = page.getByTestId("mahjong-table");
    await expect(table).toHaveAttribute("data-stage", "playing");
    await expect(table).toHaveAttribute("data-turn", "0");

    // A plain pair, not a flower or season (which would give Aiko another turn): then the computer answers.
    const faceOf = async (slot: number) => (await tile(page, slot).getAttribute("data-face")) ?? "";
    let pair: [number, number] | undefined;
    for (const each of await freePairs(page, "mahjong-table")) if (!"IJKLMNOP".includes(await faceOf(each[0]))) pair ??= each;
    await tile(page, pair![0]).click();
    await tile(page, pair![1]).click();
    await expect(page.locator('[data-testid="mahjong-score"][data-at="0"]')).not.toHaveAttribute("data-points", "0");
    // The computer takes its pair where everybody can watch — two or more, if it takes a flower or season — and the turn comes back.
    await expect
      .poll(async () => (await table.getAttribute("data-turn")) === "0" && Number(await table.getAttribute("data-left")) <= 60)
      .toBe(true);
    await expect(page.getByTestId("mahjong-table-last")).toContainText("Computer 1 took");
    const left = (await table.getAttribute("data-left"))!;

    // Kept in this browser: a reload opens the same table, and My games offers it on Pass and play.
    await page.reload();
    await ready(page, "mahjong-table");
    await expect(table).toHaveAttribute("data-left", left);
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await expect(page.getByTestId("mahjong-table-continue")).toBeVisible();
    await page.goto("/play/pass-and-play");
    await expect(page.getByTestId("local-mahjong-table")).toContainText("Aiko to take a pair");
    await page.getByTestId("local-mahjong-table-continue").click();
    await ready(page, "mahjong-table");
    await page.getByTestId("mahjong-table-end").click();
    await page.getByTestId("mahjong-table-end-yes").click();
    await expect(table).toHaveAttribute("data-stage", "names");
  });

  test("its family has a page, a tile on the set-up screen, and a place on the list of every game", async ({ page }) => {
    await page.goto(`${AT}/family`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Mahjong");
    await expect(page.locator('[data-testid="family-mark"][data-family="Mahjong"]').first()).toBeVisible();
    await page.goto("/games/new");
    await ready(page, "set-up-game");
    const family = page.getByTestId("set-up-family").filter({ has: page.locator('[data-family="Mahjong"]') });
    await family.click();
    await expect(page.getByTestId("set-up-puzzle").first()).toHaveAttribute("data-kind", KIND);
    await page.goto("/games");
    await expect(page.locator("main")).toContainText(NAME);
  });
});
