import { expect, test } from "@playwright/test";


/**
 * Nothing destructive happens on one click.
 *
 * The point of this file is the audit rather than any one button: whatever
 * ends a game, closes an account or kills a code has to ask first, in the
 * site's own words, and saying no has to leave everything exactly as it was.
 * The second half is the half worth testing — a confirmation that cannot be
 * refused is not a confirmation.
 */
test.describe("asking before something cannot be undone", () => {
  test("resigning asks, and says no leaves the game alone", async ({ browser, request }) => {
    const started = await request.post("/api/games/live", {
      data: { blackName: "Careful", whiteName: "Rash", size: 9 },
    });
    expect(started.status()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };
    await request.post(`/api/games/${game.id}/moves`, {
      data: { token: game.blackToken, row: 4, col: 4 },
    });

    // Resigning is proved by holding a seat, so the seat link is followed
    // first — that is what puts this browser in the chair.
    const context = await browser.newContext({ storageState: ".auth/admin.json" });
    const page = await context.newPage();
    await page.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);
    await page.goto("/games");

    const row = page.locator(`[data-testid="my-game"][data-id="${game.id}"]`);
    await row.getByTestId("resign").click();

    // It asks, in the site's own words rather than the browser's.
    await expect(row.getByTestId("resign-confirm")).toBeVisible();
    await expect(row.getByTestId("resign-confirm")).toContainText("The other side wins");

    // Saying no really does nothing: the game is still going.
    await row.getByTestId("resign-no").click();
    await expect(row.getByTestId("resign-confirm")).toHaveCount(0);
    expect((await (await request.get(`/api/games/${game.id}`)).json()).status).toBe("active");

    // And saying yes ends it.
    await row.getByTestId("resign").click();
    await row.getByTestId("resign-yes").click();
    await expect
      .poll(async () => (await (await request.get(`/api/games/${game.id}`)).json()).status)
      .toBe("finished");

    await context.close();
  });

  test("no button on the site opens the browser's own dialog", async ({ page }) => {
    /*
     * A native confirm looks like the operating system rather than the site,
     * and a test that dismisses one silently hides whatever it was guarding.
     * If one ever comes back, this fails.
     */
    let opened = "";
    page.on("dialog", (dialog) => {
      opened = dialog.message();
      void dialog.dismiss();
    });
    await page.goto("/games/gomoku");
    await page.getByRole("button", { name: /^H8, empty$/ }).click();
    await page.waitForTimeout(200);
    expect(opened, "a native dialog was opened").toBe("");
  });
});
