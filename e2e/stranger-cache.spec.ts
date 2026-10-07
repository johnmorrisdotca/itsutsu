import { expect, test, type Browser } from "@playwright/test";

import { ASK_FOR_KEPT_COPY } from "../src/lib/stranger/strangerPath";
import { ADMIN_STATE, ready, watchForCrashes } from "./support";

/**
 * THE OPEN PAGES ARE KEPT FOR A READER WITH NO SESSION — AND FOR NOBODY ELSE.
 *
 * A crawler or a passer-by asking for the front page, the door, the catalogue
 * or a game's pages used to cost a server render, a cold start and a few
 * queries every time, for a page that had not changed since the last visit.
 * They are answered from a copy drawn at most once an hour now
 * (`src/lib/stranger/strangerRewrite.ts`). This file holds what that must not
 * change: the page is the page, a member's is still live, and a reader of
 * Japanese is never handed the English copy.
 *
 * THE HEADERS ARE THE PRODUCTION BUILD'S. A dev server keeps no copy of
 * anything, so `s-maxage` appears only on `next start`; the suite runs against
 * that build in CI (`E2E_SERVER=start`), and the cases that read the header say
 * so and skip on a dev server rather than pass over nothing. What a reader
 * SEES is asserted on both.
 */
const PRODUCTION = process.env.E2E_SERVER === "start";
const KEPT = /s-maxage=\d+/;

const OPEN_PAGES = ["/", "/join", "/about", "/learn", "/games", "/games/gomoku", "/games/gomoku/rules", "/games/gomoku/background", "/games/gomoku/family"] as const;

/*
 * The suite's own server answers every open page live unless a request asks for
 * the copy (`ASK_FOR_KEPT_COPY`): its other specs seed a game and read the page
 * as a stranger in the same minute. This file is the one that asks, in every
 * context it opens, so that what it reads is what the live site would send.
 */
const ASKS = { [ASK_FOR_KEPT_COPY]: "1" };

test.use({ storageState: { cookies: [], origins: [] }, extraHTTPHeaders: ASKS });

/** A reader of Japanese, by what their browser says and nothing else. */
async function japaneseReader(browser: Browser) {
  return browser.newContext({ locale: "ja-JP", extraHTTPHeaders: { ...ASKS, "Accept-Language": "ja-JP,ja;q=0.9" } });
}

test.describe("what a stranger is handed", () => {
  test.skip(!PRODUCTION, "a dev server keeps no copy of anything, so there is no header to read; the production build in CI runs this");

  test("every open page is a copy kept for an hour, and the second visit is the same copy", async ({ request }) => {
    for (const path of OPEN_PAGES) {
      const first = await request.get(path);
      expect(first.status(), path).toBe(200);
      expect(first.headers()["cache-control"], `${path} was drawn for this visit alone`).toMatch(KEPT);
      expect(first.headers()["cache-control"], `${path} is kept but marked private`).not.toMatch(/private|no-store/);
      const second = await request.get(path);
      expect(second.headers()["x-nextjs-cache"], `${path} was drawn again for the second visit`).toBe("HIT");
    }
  });

  test("a visit to a page that reads its query, with a query, is not a copy of the page without one", async ({ request }) => {
    for (const path of ["/games?letter=A", "/join?code=abc", "/join?error=Callback", "/join?ask=1", "/join?operator=1"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()["cache-control"], `${path} was answered from the page without its query`).toMatch(/private|no-store/);
    }
  });

  test("an address that is no page is not found, and is not kept", async ({ request }) => {
    for (const path of ["/games/not-a-game", "/games/not-a-game/rules", "/about/not-a-chapter", "/learn/not-a-guide"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
      expect(response.headers()["cache-control"] ?? "", path).not.toMatch(KEPT);
    }
  });

  test("the door's copy is the same copy whatever the stranger asks to do next", async ({ request }) => {
    const plain = await request.get("/join");
    const sent = await request.get("/join?next=%2Fplayers");
    expect(plain.headers()["cache-control"]).toMatch(KEPT);
    expect(sent.headers()["cache-control"]).toMatch(KEPT);
  });

  test("a reader of Japanese is answered live, in Japanese, and the English copy is not touched", async ({ browser, request }) => {
    const ja = await japaneseReader(browser);
    const japanese = await ja.request.get("/games/gomoku/rules");
    expect(japanese.headers()["cache-control"], "a reader of Japanese was handed a kept copy").toMatch(/private|no-store/);
    expect(await japanese.text()).toContain('<html lang="ja"');
    await ja.close();

    // And English, right after: the copy is the English one still, and says so.
    const english = await request.get("/games/gomoku/rules");
    expect(english.headers()["cache-control"]).toMatch(KEPT);
    expect(await english.text()).toContain('<html lang="en"');
  });

  test("a stranger with a session cookie, even a wrong one, is answered live", async ({ request }) => {
    const response = await request.get("/games/gomoku", { headers: { ...ASKS, cookie: "itsutsu_session=not-a-session" } });
    expect(response.headers()["cache-control"]).toMatch(/private|no-store/);
  });
});

test.describe("what a reader sees does not depend on which route drew it", () => {
  test("a stranger and a member each get their own header from the same address, in either order", async ({ browser }) => {
    const asMember = async () => {
      const context = await browser.newContext({ storageState: ADMIN_STATE, extraHTTPHeaders: ASKS });
      const page = await context.newPage();
      await page.goto("/games/gomoku/rules");
      await ready(page, "account-menu");
      await expect(page.getByTestId("account-menu-button"), "a member was shown the stranger's header").toBeVisible();
      await expect(page.getByTestId("sign-in")).toHaveCount(0);
      await context.close();
    };
    const asStranger = async () => {
      const context = await browser.newContext({ extraHTTPHeaders: ASKS });
      const page = await context.newPage();
      await page.goto("/games/gomoku/rules");
      await expect(page.getByTestId("sign-in"), "a stranger was shown a member's header").toBeVisible();
      await expect(page.getByTestId("account-menu-button")).toHaveCount(0);
      await context.close();
    };
    await asMember();
    await asStranger();
    await asMember();
  });

  test("a member is handed a page drawn for them, never a kept one", async ({ browser }) => {
    test.skip(!PRODUCTION, "a dev server keeps no copy of anything, so there is no header to read");
    const context = await browser.newContext({ storageState: ADMIN_STATE, extraHTTPHeaders: ASKS });
    for (const path of ["/", "/games", "/games/gomoku", "/games/gomoku/rules"]) {
      const response = await context.request.get(path);
      expect(response.headers()["cache-control"], `${path} was kept for a member`).toMatch(/private|no-store/);
    }
    await context.close();
  });

  test("every kept page hydrates cleanly, and its menu marks the page it is on", async ({ page }) => {
    const crashes = watchForCrashes(page);
    for (const path of OPEN_PAGES) {
      await page.goto(path);
      await expect(page.locator("main, [data-testid]").first()).toBeVisible();
    }
    // The bar names the section the address is in: the server drew it at /stranger/…, the browser reads /games/….
    await page.goto("/games/gomoku");
    await expect(page.locator('[data-site-nav] [aria-current="page"]').first()).toHaveAttribute("href", "/games");
    expect(crashes, "a kept page disagreed with itself at hydration").toEqual([]);
  });

  test("the door's copy reads where to go from the address once it is hydrated", async ({ page }) => {
    const crashes = watchForCrashes(page);
    await page.goto("/join?next=%2Fhistory");
    await ready(page, "join-form");
    expect(await page.getByTestId("google-signin").getAttribute("data-next")).toBe("/history");
    // Off-site and protocol-relative destinations are the plain one, as the live door makes them.
    await page.goto("/join?next=%2F%2Fevil.test");
    await ready(page, "join-form");
    expect(await page.getByTestId("google-signin").getAttribute("data-next")).toBe("/games");
    await page.goto("/join");
    await ready(page, "join-form");
    expect(await page.getByTestId("google-signin").getAttribute("data-next")).toBe("/games");
    expect(crashes).toEqual([]);
  });

  test("the invite request's stamp is asked for when the form is opened, not baked into the copy", async ({ page }) => {
    await page.goto("/join");
    await ready(page, "join-form");
    const stamp = page.locator('[data-testid="ask-for-invite"] input[name="stamp"]');
    await expect(stamp, "the copy carried a stamp from whenever it was drawn").toHaveValue("");
    await page.getByTestId("ask-for-invite-open").click();
    await expect(stamp).not.toHaveValue("");
    await expect(page.getByTestId("ask-for-invite-send")).toBeEnabled();
  });

  test("an invite request sent from the kept door reaches the sender as a person's", async ({ page }) => {
    await page.goto("/join");
    await ready(page, "join-form");
    await page.getByTestId("ask-for-invite-open").click();
    await expect(page.getByTestId("ask-for-invite-send")).toBeEnabled();
    await page.getByTestId("ask-for-invite-email").fill(`kept-${Date.now()}@example.test`);
    // The person's pace: the stamp refuses anything sent within three seconds of the form being drawn.
    await page.waitForTimeout(3_500);
    await page.getByTestId("ask-for-invite-send").click();
    // Past every check, the sender answers; here that email is off, which is the only answer a script is never given.
    await expect(page.getByTestId("ask-for-invite-problem")).toBeVisible();
    await expect(page.getByTestId("ask-for-invite-sent")).toHaveCount(0);
  });

  test("a stranger can change language by clicking, and back, from a kept page", async ({ page }) => {
    await page.goto("/join");
    await ready(page, "join-form");
    const picker = page.getByTestId("join-language").getByTestId("language-picker");
    await picker.locator('[data-locale="ja"]').click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await page.getByTestId("join-language").getByTestId("language-picker").locator('[data-locale="en"]').click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByTestId("google-signin")).toBeVisible();
  });
});
