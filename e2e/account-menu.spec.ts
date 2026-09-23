import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { ready } from "./support";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

/**
 * THE HEADER IS THE SAME FOR EVERYBODY, AND THE ACCOUNT IS ONE MENU.
 *
 * John, 2026-09-23: "The Profile (John Morris) Inbox and SIgnout can all be one
 * menu item … that way the header is always the same regardless of role." So
 * the bar carries no Admin link, the reader's name opens a popup, and the popup
 * holds their page, inbox, language, the operator's links, the version and the
 * way out. Every case clicks the name, as a reader does, and every absence is
 * asserted inside a popup already seen open.
 */
test.describe("the account menu", () => {
  test("holds the operator's links and the version, and closes on Escape and outside", async ({ page }) => {
    await page.goto("/games");
    await ready(page, "account-menu");
    const header = page.locator("header[data-chrome]");
    // Shut: nothing of the account but the name, and no Admin in the bar.
    await expect(header.getByTestId("account-menu-button")).toBeVisible();
    await expect(header.getByTestId("admin-link")).toHaveCount(0);
    await expect(header.getByTestId("sign-out")).toHaveCount(0);

    const button = page.getByTestId("account-menu-button");
    await button.click();
    const panel = page.getByTestId("account-menu-panel");
    await expect(panel).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(panel.getByTestId("admin-link")).toBeVisible();
    await expect(panel.getByTestId("me-link")).toBeVisible();
    await expect(panel.getByTestId("menu-version")).toContainText(version);
    await expect(panel.getByTestId("menu-language-picker")).toBeVisible();
    await expect(panel.getByTestId("sign-out")).toBeVisible();

    // Escape shuts it and gives the keyboard back to the name.
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(button).toBeFocused();

    // And the way back: open again, click elsewhere on the page.
    await button.click();
    await expect(panel).toBeVisible();
    await page.locator("main").click({ position: { x: 5, y: 5 } });
    await expect(panel).toHaveCount(0);
  });

  test("follows a link and is shut on the page it lands on", async ({ page }) => {
    await page.goto("/games");
    await ready(page, "account-menu");
    await page.getByTestId("account-menu-button").click();
    await page.getByTestId("account-menu-panel").getByTestId("admin-link").click();
    await expect(page).toHaveURL(/\/admin$/);
    await ready(page, "account-menu");
    await expect(page.getByTestId("account-menu-button")).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("account-menu-panel")).toHaveCount(0);
  });

  test("a member's has their inbox and no Admin", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `menu-${stamp}@example.test`, name: `Menu ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    try {
      const page = await context.newPage();
      await page.goto("/games");
      await ready(page, "account-menu");
      await expect(page.getByTestId("account-menu-button")).toContainText(me.name);
      await page.getByTestId("account-menu-button").click();
      const panel = page.getByTestId("account-menu-panel");
      await expect(panel.getByTestId("inbox-link")).toBeVisible();
      await expect(panel.getByTestId("me-link")).toContainText(me.email);
      await expect(panel.getByTestId("admin-link")).toHaveCount(0);
      await expect(panel.getByTestId("menu-version")).toContainText(version);
    } finally {
      await context.close();
      await removeMember(me.email);
    }
  });

  test("fits a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/games");
    await ready(page, "account-menu");
    await page.getByTestId("account-menu-button").click();
    const box = await page.getByTestId("account-menu-panel").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });
});
