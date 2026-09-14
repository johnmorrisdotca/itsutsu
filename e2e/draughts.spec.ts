import { expect, test, type Page } from "@playwright/test";

/**
 * The draughts games beside Checkers, at the board: each game opened at its
 * own address, the first move where its rulebook puts it, and one sequence
 * played that shows a rule the English Checkers beside it does not have — a
 * man taking backward, the longest capture being the only one offered, or,
 * in Russian and pool, any capture being allowed.
 *
 * Every sequence starts from the real opening position and was checked
 * against the engine before it was written here. The practice board is
 * rendered on the client alone, so its squares and their handlers arrive
 * together and there is no hydration to wait on.
 */

async function openBoard(page: Page, slug: string) {
  await page.goto(`/games/${slug}/play`);
  await page.evaluate(() => window.localStorage.clear());
  await page.goto(`/games/${slug}/play`);
}

function piece(page: Page, square: string, colour: "Black" | "White") {
  return page.getByRole("button", { name: `${square}, ${colour} stone` });
}

function empty(page: Page, square: string) {
  return page.getByRole("button", { name: new RegExp(`^${square}, empty$`) });
}

async function move(page: Page, colour: "Black" | "White", from: string, to: string) {
  await piece(page, from, colour).click();
  await empty(page, to).click();
  await expect(piece(page, to, colour)).toBeVisible();
}

test.describe("the draughts games beside Checkers", () => {
  test("International Draughts: White opens, and only the capture taking the most is offered", async ({ page }) => {
    await openBoard(page, "international-draughts");
    // Twenty men a side on 10×10: Black's four rows at the top, White's at the bottom, and White to move.
    await expect(piece(page, "A7", "Black")).toBeVisible();
    await expect(piece(page, "J1", "White")).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");

    await move(page, "White", "H4", "G5");
    await move(page, "Black", "G7", "H6");
    await move(page, "White", "D4", "E5");
    await move(page, "Black", "E7", "F6");
    await expect(page.getByTestId("to-play")).toContainText("White");

    // G5 could take F6 on its own and land on E7 — but E5 can take two, so G5 is offered nothing.
    await piece(page, "G5", "White").click();
    await expect(empty(page, "E7")).toBeDisabled();

    // E5 takes F6, landing on G7, and the capture is not over: still White's move.
    await move(page, "White", "E5", "G7");
    await expect(page.getByTestId("to-play")).toContainText("White");
    // From G7 it goes on backward, over H6 to J5 — a man taking backward, which an English man never may.
    await move(page, "White", "G7", "J5");
    await expect(empty(page, "F6")).toBeVisible();
    await expect(empty(page, "H6")).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });

  test("Brazilian Draughts: a man captures forward and then backward in one move", async ({ page }) => {
    await openBoard(page, "brazilian-draughts");
    await expect(page.getByTestId("to-play")).toContainText("White");

    await move(page, "White", "E3", "D4");
    await move(page, "Black", "B6", "A5");
    await move(page, "White", "C3", "B4");

    // Black must take: A5 over B4 to C3…
    await move(page, "Black", "A5", "C3");
    await expect(page.getByTestId("to-play")).toContainText("Black");
    // …and on, backward, over D4 to E5.
    await move(page, "Black", "C3", "E5");
    await expect(empty(page, "B4")).toBeVisible();
    await expect(empty(page, "D4")).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");
  });

  test("Canadian Checkers: on 12×12, a single capture gives way to a double", async ({ page }) => {
    await openBoard(page, "canadian-checkers");
    // Thirty men a side in five rows each.
    await expect(piece(page, "B8", "Black")).toBeVisible();
    await expect(piece(page, "L1", "White")).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("White");

    await move(page, "White", "L5", "K6");
    await move(page, "Black", "F8", "G7");
    await move(page, "White", "G5", "H6");
    await move(page, "Black", "H8", "J7");

    // H6 could take G7 and land on F8, but K6 takes two, so H6 is offered nothing.
    await piece(page, "H6", "White").click();
    await expect(empty(page, "F8")).toBeDisabled();

    await move(page, "White", "K6", "H8");
    await expect(page.getByTestId("to-play")).toContainText("White");
    await move(page, "White", "H8", "F6");
    await expect(empty(page, "J7")).toBeVisible();
    await expect(empty(page, "G7")).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });

  test("Russian Draughts: the shorter capture may be chosen where a longer one is on the board", async ({ page }) => {
    await openBoard(page, "russian-draughts");
    await expect(page.getByTestId("to-play")).toContainText("White");

    await move(page, "White", "A3", "B4");
    await move(page, "Black", "F6", "E5");
    await move(page, "White", "E3", "D4");
    await move(page, "Black", "D6", "C5");

    // B4 could take two — C5, then back over E5 — but D4 takes E5 alone, and in Russian draughts that is allowed.
    // Brazilian or international draughts would offer D4 nothing here.
    await move(page, "White", "D4", "F6");
    await expect(empty(page, "E5")).toBeVisible();
    await expect(piece(page, "B4", "White")).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });

  test("Pool Checkers: Black opens, and a man captures on through the far row without stopping", async ({ page }) => {
    await openBoard(page, "pool-checkers");
    // APCA rule 7: Black moves first.
    await expect(page.getByTestId("to-play")).toContainText("Black");

    await move(page, "Black", "F6", "G5");
    await move(page, "White", "G3", "H4");
    await move(page, "Black", "B6", "C5");
    await move(page, "White", "H4", "F6");
    await move(page, "Black", "E7", "G5");
    await move(page, "White", "C3", "D4");
    await move(page, "Black", "D8", "E7");

    /*
     * Four in one move. The man lands on D8, Black's back row, with more to
     * take, so it goes on (APCA rule 22) — back over E7 and G5 to H4. A king is
     * drawn only as a ring on the stone, so what is asserted is that the capture
     * never stopped on the far row.
     */
    await move(page, "White", "D4", "B6");
    await move(page, "White", "B6", "D8");
    await expect(page.getByTestId("to-play")).toContainText("White");
    await move(page, "White", "D8", "F6");
    await expect(page.getByTestId("to-play")).toContainText("White");
    await move(page, "White", "F6", "H4");
    for (const square of ["C5", "C7", "E7", "G5"]) await expect(empty(page, square)).toBeVisible();
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });
});
