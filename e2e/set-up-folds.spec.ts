import { expect, test, type Page } from "@playwright/test";

import { memberContext } from "./members";
import { aComputerOpponent, chooseOpponent, openChoice, openRulesGroup, ready } from "./support";

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
  /*
   * THE GROUP FIRST, THEN THE CHOICES INSIDE IT. This screen folds twice over
   * now: the rules and the handicap are folded rows of their own, and the
   * opening, the ratings and the restrictions are folds inside them. A fold
   * keeps its children in the page and hidden, so a spec reaching for an inner
   * row while the outer one is shut is looking at something nobody can see.
   * A reader opens the group; so does this.
   */
  await openRulesGroup(page);
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

  test("hides no answer, on a screen where every group is folded", async ({ browser, baseURL }) => {
    const { context, page } = await setUpPage(browser, baseURL!, "fold-fresh", "/games/gomoku/new");

    /*
     * THE HALF THAT KEEPS THIS FROM BEING THE FOLD JOHN THREW OUT, and it is
     * no longer "nothing folds".
     *
     * It used to be: a screen where nobody had been chosen was a screen full of
     * questions, so every list of people and programs opened. But a fresh game
     * is NOT a screen with no answer — "post the seat for anyone" is chosen,
     * and drawn, chosen, above those lists. Reading that as nobody meant
     * thirteen full-width tiles under an answer nobody had to change, which is
     * four phone-fulls of scrolling to reach Begin (John, 2026-09-21).
     *
     * So the rule this case holds is the real one: NO FOLD ON THIS SCREEN HAS
     * AN EMPTY SUMMARY. A closed row that says nothing is the fold that was
     * thrown out; a closed row that prints its answer is the one that stayed.
     */
    const chosen = page.locator('[data-testid="set-up-opponent"][data-chosen="true"]');
    await expect(chosen, "the answer is drawn, and not behind any of this").toBeVisible();
    await expect(chosen).toHaveAttribute("data-opponent", "anyone");

    const rows = page.getByTestId("set-up-opponent-fold");
    const many = await rows.count();
    expect(many, "no lists at all on this screen").toBeGreaterThan(0);
    for (let at = 0; at < many; at += 1) {
      const row = rows.nth(at);
      await expect(row, "a list with the answer above it need not be open").toHaveAttribute("data-open", "false");
      // And it says how many it holds, which is what a list nobody has answered can honestly say.
      await expect(row.getByTestId("set-up-opponent-fold-change")).toContainText(/\d+ to choose from/);
    }

    // The same of the two groups of rules: shut, and each printing what it holds.
    await expect(page.getByTestId("set-up-rules-words")).toContainText("Free opening");
    await expect(page.getByTestId("set-up-handicap-words")).not.toBeEmpty();

    await context.close();
  });
});
