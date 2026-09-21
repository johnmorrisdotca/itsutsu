import { expect, test, type Page } from "@playwright/test";

import { memberContext } from "./members";
import { aComputerOpponent, chooseOpponent, openChoice, ready } from "./support";

/**
 * A SETTLED CHOICE IS FOLDED DOWN TO WHAT IT IS, AND ONE TAP FROM BEING CHANGED.
 *
 * John, 2026-09-18, setting up a game he had mostly already settled: "we see a
 * lot of options again which we have to scroll through. We should actually
 * collapse certain sections, so that the user sees what was selected, and if
 * they want to change it, they tap it… Pro is selected… I wouldn't change it…
 * Same goes for The computer. Keep it closed to Guoshou."
 *
 * THE FOLD THIS SCREEN USED TO HAVE WAS THROWN OUT FOR BEING UNREADABLE — one
 * grey line and a small ›, and John's words then were "where are the options to
 * change other settings? … so very hard to see". So the promise being kept here
 * is narrow and worth checking by eye rather than by structure:
 *
 *  1. The closed row SAYS THE ANSWER. Not a heading, not a chevron: the name of
 *     the thing that is chosen, on screen, without opening anything.
 *  2. The way to change it is NAMED and one press away.
 *  3. A question nobody has answered is never folded away.
 *
 * Driven the way a reader drives it: the row is pressed, the tiles are used,
 * and the row is read again afterwards.
 */
async function setUpPage(browser: Parameters<typeof memberContext>[0], baseURL: string, tag: string, address: string) {
  const stamp = Date.now().toString(36);
  const context = await memberContext(browser, baseURL, {
    email: `${tag}-${stamp}@example.test`,
    name: `Folds ${stamp}`,
  });
  const page = await context.newPage();
  await page.goto(address);
  await ready(page, "set-up-game");
  return { context, page };
}

/** The one row a choice folds down to, by the fold's own test id. */
function fold(page: Page, testId: string, group?: string) {
  return group === undefined
    ? page.getByTestId(testId)
    : page.locator(`[data-testid="${testId}"][data-group="${group}"]`);
}

test.describe("the set-up screen folds a choice it already has", () => {
  test("shows the opening it is set to, and opens onto the three rules on a press", async ({ browser, baseURL }) => {
    const { context, page } = await setUpPage(browser, baseURL!, "fold-opening", "/games/gomoku/new");

    const opening = fold(page, "set-up-opening-fold");
    // THE ANSWER, ON THE CLOSED ROW — the whole of what makes this fold honest.
    await expect(opening).toHaveAttribute("data-open", "false");
    await expect(opening).toContainText("Free");

    /*
     * The tiles are IN the page while it is folded, and not reachable: hidden
     * rather than torn out, so what is chosen can still be read — by a screen
     * reader as much as by this spec — and cannot be pressed by accident.
     */
    const pro = page.locator('[data-testid="set-up-opening"][data-opening="pro"]');
    await expect(pro).toHaveCount(1);
    await expect(pro).not.toBeVisible();

    await openChoice(page, "set-up-opening-fold");
    await expect(pro).toBeVisible();
    await pro.click();

    /*
     * AND THE ROW FOLLOWS THE CHOICE WHILE IT IS OPEN. It does not shut itself:
     * a radio group is walked with the arrow keys, and a fold that closed on
     * the first press would take the keyboard's focus with it.
     */
    await expect(opening).toContainText("Pro");
    await expect(opening).toHaveAttribute("data-open", "true");
    await expect(page.getByTestId("set-up-rules-words")).toContainText("Pro opening");

    await context.close();
  });

  test("keeps the computer it was given closed, with its name and what it is like", async ({ browser, baseURL }) => {
    const { context, page } = await setUpPage(
      browser,
      baseURL!,
      "fold-computer",
      "/games/gomoku/new?against=guoshou",
    );

    /*
     * Arrived at with the opponent already chosen — a Play pressed on a
     * program's row, and the same shape a rematch arrives in. Every list is
     * folded, and the one holding the chosen program says who they are.
     */
    const computers = fold(page, "set-up-opponent-fold", "computer");
    await expect(computers).toHaveAttribute("data-open", "false");
    await expect(computers).toContainText("Guoshou");
    /*
     * And the one line that says what they are like, which is worth reading
     * before you press Continue. The PARAGRAPH about them stays under the list
     * — a summary row is one line, and a folded row eight lines tall is the
     * scrolling this whole thing exists to end.
     */
    await expect(page.getByTestId("set-up-opponent-strength")).toBeVisible();
    await expect(page.getByTestId("set-up-opponent-hint")).not.toBeVisible();

    // The other lists say how many are in them — a count, never a name they
    // could not honestly claim is chosen.
    const people = fold(page, "set-up-opponent-fold", "here");
    if ((await people.count()) > 0) {
      await expect(people).toHaveAttribute("data-open", "false");
      await expect(people).not.toContainText("Guoshou");
    }

    // One press, and the programs are there to choose between.
    const other = await aComputerOpponent(page, 0);
    await expect(computers).toHaveAttribute("data-open", "true");
    await chooseOpponent(page, other);
    await expect(page.getByTestId("set-up-seating")).toContainText("Against");

    await context.close();
  });

  test("folds nothing away while nobody is chosen to play", async ({ browser, baseURL }) => {
    const { context, page } = await setUpPage(browser, baseURL!, "fold-fresh", "/games/gomoku/new");

    /*
     * THE HALF THAT KEEPS THIS FROM BEING THE FOLD JOHN THREW OUT. A screen
     * where nobody has been chosen is a screen full of questions, and a question
     * is not folded behind a summary of nothing: every list of people and
     * programs is open before anything else happens.
     *
     * Asserted after a presence — the tiles of the first list — so this is a
     * statement about a rendered page and not about how fast it was asked.
     */
    await expect(page.locator('[data-testid="set-up-opponent"]').first()).toBeVisible();
    const lists = page.getByTestId("set-up-opponent-fold");
    for (let at = 0; at < (await lists.count()); at += 1) {
      await expect(lists.nth(at), "a list nobody has answered is folded away").toHaveAttribute("data-open", "true");
    }

    await context.close();
  });
});
