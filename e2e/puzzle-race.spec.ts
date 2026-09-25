import { expect, test, type Browser, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { ADMIN_STATE, PLAYER_STATE, ready } from "./support";

/**
 * A race: two members, one puzzle, two clocks kept by the site.
 *
 * The host (the operator) makes the race from the set-up; the guest (the
 * suite's second identity, its own account) opens the seat link. Each
 * presses Start, solves the grid the page shows — the spec makes the same
 * puzzle from the seed the page prints — and the race page names the winner.
 * Driven through the controls a person uses; the only reads of the site's
 * own state are through the page.
 */
const KIND = "numberPlace";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

async function asIdentity(browser: Browser, state: string): Promise<Page> {
  const context = await browser.newContext({ storageState: state });
  return context.newPage();
}

async function solveShown(page: Page): Promise<void> {
  await ready(page, "puzzle-play");
  const seed = Number((await page.getByTestId("puzzle-asked").textContent())?.match(/№ (\d+)/)?.[1]);
  const size = Number(await page.getByTestId("puzzle-grid").getAttribute("data-size"));
  const level = (await page.getByTestId("puzzle-asked").textContent())?.toLowerCase().includes("easy") ? "easy" : "medium";
  const puzzle = generatePuzzle(KIND, size, level, seed);
  const givens = decodeCells(puzzle.givens, size)!;
  const solution = decodeCells(puzzle.solution, size)!;
  const cells = page.getByTestId("puzzle-cell");
  for (const [index, given] of givens.entries()) {
    if (given !== 0) continue;
    await cells.nth(index).click();
    await page.getByTestId(`puzzle-key-${solution[index]}`).click();
  }
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
}

test.describe("a race at a puzzle", () => {
  test("two members race one grid, and the faster correct solve wins", async ({ browser }) => {
    const host = await asIdentity(browser, ADMIN_STATE);
    const guest = await asIdentity(browser, PLAYER_STATE);

    // The host makes the race at the smallest size, so both solves are short.
    await host.goto(`${AT}/new`);
    await ready(host, "puzzle-set-up");
    await host.locator('[data-testid="set-up-size"][data-size="4"]').click();
    await host.getByTestId("puzzle-level-easy").click();
    // Play a friend (John, 2026-09-25: "should be Play Alone and Play a Friend").
    await host.getByTestId("puzzle-race").click();
    await expect(host).toHaveURL(new RegExp(`${AT}/match/[a-z0-9]{4}-[a-z0-9]{4}$`));
    await ready(host, "race-controls");
    await expect(host.getByTestId("race-seat-guest")).toContainText("still open");
    // The seat card every seat link is handed over in: a QR code, the whole address, Copy and Text.
    await expect(host.getByTestId("race-seat-link").getByRole("img")).toBeVisible();
    const seatLink = new URL(await host.getByTestId("race-seat-link-address").inputValue()).pathname;
    expect(seatLink).toMatch(new RegExp(`^${AT}/match/[a-z0-9-]+/seat/`));

    // The guest takes the seat by the link, and the host's page shows it after a refresh.
    await guest.goto(seatLink);
    await expect(guest).toHaveURL(new RegExp(`${AT}/match/[a-z0-9-]+$`));
    await ready(guest, "race-controls");
    await expect(guest.getByTestId("race-seat-guest")).toContainText("(you)");
    await host.getByTestId("race-refresh").click();
    await expect(host.getByTestId("race-seat-link")).toHaveCount(0);

    // Each starts their own clock and solves; the guest first, so the host's later finish still counts.
    await guest.getByTestId("race-start").click();
    await expect(guest.getByTestId("race-seat-guest")).toHaveAttribute("data-state", "solving");
    await solveShown(guest);
    await expect(guest.getByTestId("race-seat-guest")).toHaveAttribute("data-state", "finished");
    await expect(guest.getByTestId("race-outcome")).toContainText("Not over yet");

    await host.getByTestId("race-start").click();
    await expect(host.getByTestId("race-seat-host")).toHaveAttribute("data-state", "solving");
    await solveShown(host);
    await expect(host.getByTestId("race-seat-host")).toHaveAttribute("data-state", "finished");
    await expect(host.getByTestId("race-outcome")).toContainText("won");

    // The guest's page, read again, agrees; and each member's own page lists the race.
    await guest.getByTestId("race-refresh").click();
    await expect(guest.getByTestId("race-outcome")).toContainText("won");
    // THIS race, not a count: another run may have left the guest races of its own.
    const id = host.url().split("/match/")[1];
    await guest.goto(`${AT}/me`);
    await expect(guest.getByTestId("puzzle-own-race").filter({ has: guest.locator(`a[href$="/match/${id}"]`) })).toHaveCount(1);
    await expect(guest.getByTestId("puzzle-own-solve").first()).toContainText("in a race");

    await host.context().close();
    await guest.context().close();
  });

  test("a stranger is sent to join by the seat link, and nobody outside the race can hand a grid in", async ({ browser, playwright, baseURL }) => {
    const host = await asIdentity(browser, ADMIN_STATE);
    await host.goto(`${AT}/new`);
    await ready(host, "puzzle-set-up");
    await host.locator('[data-testid="set-up-size"][data-size="4"]').click();
    // Play a friend (John, 2026-09-25: "should be Play Alone and Play a Friend").
    await host.getByTestId("puzzle-race").click();
    await expect(host).toHaveURL(new RegExp(`${AT}/match/[a-z0-9-]+$`));
    const id = host.url().split("/match/")[1];
    // The seat card every seat link is handed over in: a QR code, the whole address, Copy and Text.
    await expect(host.getByTestId("race-seat-link").getByRole("img")).toBeVisible();
    const seatLink = new URL(await host.getByTestId("race-seat-link-address").inputValue()).pathname;

    // A browser with no session — said outright, because `newContext()` inherits the
    // suite's sign-in otherwise: the seat link leads to the door, with the way back in its pocket.
    const stranger = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await stranger.newPage();
    const answered = await page.goto(seatLink);
    expect(answered?.url()).toContain("/join");
    await stranger.close();

    // No session at all: the race's routes refuse anybody who is in neither seat.
    const nobody = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const refused = await nobody.post(`/api/puzzles/races/${id}/finish`, { data: { answer: "1234" } });
    expect([401, 403]).toContain(refused.status());
    const notStarted = await nobody.post(`/api/puzzles/races/${id}/start`);
    expect([401, 403]).toContain(notStarted.status());
    await nobody.dispose();
    await host.context().close();
  });
});
