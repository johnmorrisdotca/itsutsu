import { expect, test, type Page } from "@playwright/test";

import { memberContext, removeMember } from "./members";

/*
 * THE FAMILIES TAB REMEMBERS WHICH FAMILIES ARE OPEN. John, 2026-09-26: "Games
 * page, families tab: Allow toggled families to have Memory and preserve on
 * reload." Driven the way a reader does it — pressing a family's heading, then
 * reloading — and both ways: there and back, since a remembered answer that
 * cannot be taken back is a different fault from one that is never kept.
 */

const FIRST = "five-in-a-row";
const OTHER = "drops";

const family = (page: Page, key: string) => page.locator(`[data-testid="lobby-family"][data-family="${key}"]`);

/** The page, arrived and able to answer a press: a fold pressed before it hydrates writes nothing. */
async function openGames(page: Page) {
  await page.goto("/games");
  await expect(family(page, FIRST)).toHaveAttribute("data-ready", "true");
}

async function isOpen(page: Page, key: string, open: boolean) {
  await expect(family(page, key)).toHaveJSProperty("open", open);
}

test("a member's open and shut families are kept on the account, and taken back the same way", async ({ browser, baseURL }) => {
  const stamp = Date.now().toString(36);
  const me = { email: `folds-${stamp}@example.test`, name: `Folds ${stamp}` };
  const context = await memberContext(browser, baseURL!, me);
  const page = await context.newPage();
  const writes: string[] = [];
  page.on("request", (request) => {
    // The fold's writes only: a new member's first page also keeps their device's time zone.
    const body = request.postData() ?? "";
    if (request.method() === "PATCH" && new URL(request.url()).pathname === "/api/me" && body.includes("familyOpen.")) writes.push(body);
  });
  /** Press a family's heading and wait for its one write to land. */
  const press = async (key: string) => {
    const written = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        new URL(response.url()).pathname === "/api/me" &&
        (response.request().postData() ?? "").includes(`familyOpen.${key}`),
    );
    await family(page, key).locator("summary").click();
    expect((await written).ok()).toBe(true);
  };
  try {
    // Never toggled: the first family open and the rest shut, as the page always drew them.
    await openGames(page);
    await isOpen(page, FIRST, true);
    await isOpen(page, OTHER, false);

    // Shut the first, open another, and reload: the page arrives as they were left.
    await press(FIRST);
    await press(OTHER);
    await page.reload();
    await expect(family(page, FIRST)).toHaveAttribute("data-ready", "true");
    await isOpen(page, FIRST, false);
    await isOpen(page, OTHER, true);

    // And back: open the first, shut the other, reload, and the page is as it began.
    await press(FIRST);
    await press(OTHER);
    await page.reload();
    await expect(family(page, FIRST)).toHaveAttribute("data-ready", "true");
    await isOpen(page, FIRST, true);
    await isOpen(page, OTHER, false);

    // One write a press, each naming only its own family; reading them back asked nothing.
    expect(writes).toHaveLength(4);
    expect(writes.every((body) => Object.keys(JSON.parse(body).preferences).length === 1)).toBe(true);
    expect(JSON.parse(writes[0]!).preferences).toEqual({ [`familyOpen.${FIRST}`]: "shut" });
  } finally {
    await context.close();
    await removeMember(me.email);
  }
});

test.describe("a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("keeps them in this browser, there and back", async ({ page }) => {
    await openGames(page);
    await isOpen(page, OTHER, false);

    await family(page, OTHER).locator("summary").click();
    await isOpen(page, OTHER, true);
    await page.reload();
    await expect(family(page, FIRST)).toHaveAttribute("data-ready", "true");
    await isOpen(page, OTHER, true);

    await family(page, OTHER).locator("summary").click();
    await isOpen(page, OTHER, false);
    await page.reload();
    await expect(family(page, FIRST)).toHaveAttribute("data-ready", "true");
    await isOpen(page, OTHER, false);
    // Kept in the browser, never sent anywhere.
    expect(await page.evaluate(() => window.localStorage.getItem("itsutsu.familyFolds"))).toBe(JSON.stringify({ drops: "shut" }));
  });
});
