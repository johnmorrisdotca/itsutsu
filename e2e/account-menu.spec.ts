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

  /*
   * A PAGE VIEW DOES NOT ASK WHO IS HERE AGAIN. The page's own render already
   * read the session and marked the member seen (`currentSession` →
   * `touchMember`); the menu asking `/api/session` as it arrived was a second
   * paid request per page view that told it nothing new. The one session it
   * still asks for is one from before accounts, which that request makes a
   * member — `invite-player.spec.ts` holds that half. The menu being ready,
   * and a press on it working, is the presence the absence is measured after.
   */
  test("asks the server nothing about who is here as a page arrives", async ({ page }) => {
    const asked: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/session") asked.push(request.method());
    });
    await page.goto("/games");
    await ready(page, "account-menu");
    await page.getByTestId("account-menu-button").click();
    await expect(page.getByTestId("account-menu-panel")).toBeVisible();
    expect(asked, "the menu asked who is here on a page that had just said").toEqual([]);
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

  /*
   * A language chosen in the menu leaves the menu where it is, in the new
   * language, and choosing back leaves it there too. Both directions, because
   * "I can't get out of it" is its own fault (LanguagePicker.tsx, 0.126.0).
   * The words asserted are ones the panel itself draws through the dictionary,
   * so the change is seen where it was made; then a real link is followed, to
   * prove the next page is in the new language too and not served from a
   * cache full of the old one.
   */
  test("keeps the menu open when a language is chosen, and when it is chosen back", async ({ page }) => {
    await page.goto("/games");
    await ready(page, "account-menu");
    await page.getByTestId("account-menu-button").click();
    const panel = page.getByTestId("account-menu-panel");
    const picker = panel.getByTestId("menu-language-picker");
    await expect(picker.locator("[data-current=true]")).toHaveAttribute("data-locale", "en");
    await picker.locator("[data-locale=ja]").click();
    await expect(picker.locator("[data-current=true]")).toHaveAttribute("data-locale", "ja");
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId("admin-link")).toHaveText("管理");
    await expect(page).toHaveURL(/\/games$/);
    await panel.getByTestId("about-link").click();
    await expect(page).toHaveURL(/\/about$/);
    await ready(page, "account-menu");
    await page.getByTestId("account-menu-button").click();
    // The page reached by a real link was rendered in the chosen language, not from a cache of the old one.
    await expect(page.getByTestId("account-menu-panel").getByTestId("admin-link")).toHaveText("管理");
    const again = page.getByTestId("account-menu-panel").getByTestId("menu-language-picker");
    await again.locator("[data-locale=en]").click();
    await expect(again.locator("[data-current=true]")).toHaveAttribute("data-locale", "en");
    await expect(page.getByTestId("account-menu-panel")).toBeVisible();
    await expect(page.getByTestId("account-menu-panel").getByTestId("admin-link")).toHaveText("Admin");
  });

  test("offers About, the Profile tab and the Settings tab, and points at its trigger", async ({ page }) => {
    await page.goto("/games");
    await ready(page, "account-menu");
    await page.getByTestId("account-menu-button").click();
    const panel = page.getByTestId("account-menu-panel");
    await expect(panel.getByTestId("account-menu-caret")).toBeVisible();
    await expect(panel.getByTestId("profile-link")).toHaveAttribute("href", "/me?view=profile");
    // Profile is who you are; Settings, right after it, is how the site behaves for you.
    await expect(panel.getByTestId("settings-link")).toHaveAttribute("href", "/me?view=settings");
    await expect(panel.getByTestId("about-link")).toHaveAttribute("href", "/about");
    await panel.getByTestId("about-link").click();
    await expect(page).toHaveURL(/\/about$/);
    await ready(page, "account-menu");
    await expect(page.getByTestId("account-menu-panel")).toHaveCount(0);
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
