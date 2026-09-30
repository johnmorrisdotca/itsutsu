import { devices, expect, test } from "@playwright/test";

import { ready } from "./support";

/**
 * Itsutsu as a home-screen app: the manifest a phone installs from, the tags
 * iOS reads instead, and the hint that offers it — on a phone that has not
 * added it, never on a desk, never inside the app, and not again once waved
 * away.
 *
 * A phone is a user agent and a touch screen here. What each phone then does
 * with the page is the phone's business and no browser test can see it; what
 * the page tells it is this spec's.
 */

const IPHONE = devices["iPhone 15"];

test("the manifest installs standalone, on the games list, with every icon it names", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const app = await response.json();
  expect(app.display).toBe("standalone");
  expect(app.start_url).toBe("/games");
  for (const icon of app.icons as { src: string }[]) {
    const picture = await request.get(icon.src);
    expect(picture.ok(), icon.src).toBe(true);
    expect(picture.headers()["content-type"]).toBe("image/png");
  }
});

test("every page tells iOS its name, its status bar and its launch screens", async ({ page, request }) => {
  await page.goto("/games");
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", "Itsutsu");
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute("content", "default");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
  const launch = page.locator('link[rel="apple-touch-startup-image"]');
  expect(await launch.count()).toBeGreaterThan(20);
  const first = await launch.first().getAttribute("href");
  expect((await request.get(first ?? "")).ok()).toBe(true);
});

test("an iPhone is shown Share, then Add to Home Screen, until it says not now", async ({ browser }) => {
  const context = await browser.newContext({
    userAgent: IPHONE.userAgent,
    viewport: IPHONE.viewport,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/games");
  await ready(page, "install-hint-slot");
  const hint = page.getByTestId("install-hint");
  await expect(hint).toHaveAttribute("data-platform", "ios");
  await expect(hint).toContainText("Add to Home Screen");

  await page.getByTestId("install-hint-dismiss").click();
  await expect(hint).toHaveCount(0);
  // The subject here IS what survives a fresh load: a dismissal is remembered.
  await page.goto("/games");
  await ready(page, "install-hint-slot");
  await expect(hint).toHaveCount(0);
  await context.close();
});

test("the app opened from the home screen offers nothing", async ({ browser }) => {
  const context = await browser.newContext({ userAgent: IPHONE.userAgent, hasTouch: true, isMobile: true });
  await context.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
  const page = await context.newPage();
  await page.goto("/games");
  await ready(page, "install-hint-slot");
  await expect(page.getByTestId("install-hint")).toHaveCount(0);
  await context.close();
});

test("a desk is offered nothing", async ({ page }) => {
  await page.goto("/games");
  await ready(page, "install-hint-slot");
  await expect(page.getByTestId("install-hint")).toHaveCount(0);
});
