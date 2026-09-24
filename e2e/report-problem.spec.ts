import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * "REPORT A PROBLEM", FROM THE FOOT OF ANY PAGE, AND WHERE IT ARRIVES.
 *
 * The reports live on Sumilabu, and a test run has no reports token unless a
 * developer has put the dev one in their `.env`. So the window's answer is one
 * of two, and both are listed: "paused" with nothing to type into (no token,
 * or the service down), or a form to write in. What it must never do is stay
 * on "One moment" — that would mean the Server Function never answered, which
 * for a stranger is the gate refusing it.
 */
async function openReport(page: Page) {
  await ready(page, "report-problem");
  await page.getByTestId("report-problem").click();
  const dialog = page.getByTestId("report-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toHaveAttribute("data-phase", "checking");
  const phase = await dialog.getAttribute("data-phase");
  expect(["paused", "writing"]).toContain(phase);
  return { dialog, phase };
}

test.describe("reporting a problem", () => {
  test("a member opens it from the footer, and it either takes words or says it is paused", async ({ page }) => {
    await page.goto("/games");
    const { dialog, phase } = await openReport(page);
    if (phase === "paused") {
      await expect(dialog.getByTestId("report-paused")).toBeVisible();
      await expect(dialog.getByTestId("report-body")).toHaveCount(0);
    } else {
      await expect(dialog.getByTestId("report-body")).toBeVisible();
      await expect(dialog.getByTestId("report-send")).toBeDisabled();
      // What goes with it is said before it is sent: the page, without its query, and the date.
      await expect(dialog.getByTestId("report-page")).toHaveText("/games");
      await expect(dialog.getByTestId("report-date")).not.toBeEmpty();
    }
    // And the way back out.
    await dialog.getByTestId("report-close").click();
    await expect(dialog).toBeHidden();
  });

  test("a visitor with no invite can open it too", async ({ browser }) => {
    const stranger = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await stranger.newPage();
    await page.goto("/games");
    await openReport(page);
    await stranger.close();
  });

  test("the operator has a Reports tab, which shows the reports or says why it cannot", async ({ page }) => {
    await page.goto("/admin?view=reports");
    const panel = page.getByTestId("admin-reports");
    await expect(panel).toBeVisible();
    const shown = panel.getByTestId("reports-unreadable").or(panel.getByTestId("reports-empty")).or(panel.getByTestId("reports-list"));
    await expect(shown).toBeVisible();
  });
});
