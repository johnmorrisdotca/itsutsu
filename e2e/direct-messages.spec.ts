import { expect, test, type BrowserContext } from "@playwright/test";

import { memberContext, memberIdFor, removeMember } from "./members";
import { ready } from "./support";

/**
 * MESSAGES BETWEEN MEMBERS, off the board (John, 2026-09-08), with the ignore
 * list in full. Driven as members would: from the other player's page, Write;
 * the message reaches their inbox and their side of the thread; and once they
 * ignore the writer, the writer is refused and nothing more from them shows.
 *
 * IT BRINGS ITS OWN WORLD: two members nobody else has met.
 */
test.describe("direct messages", () => {
  const stamp = Date.now().toString(36);
  const WRITER = { email: `dm-writer-${stamp}@example.test`, name: `Writer${stamp} Dm` };
  const READER = { email: `dm-reader-${stamp}@example.test`, name: `Reader${stamp} Dm` };
  let writer: BrowserContext;
  let reader: BrowserContext;

  test.beforeAll(async ({ browser, baseURL }) => {
    writer = await memberContext(browser, baseURL!, WRITER);
    reader = await memberContext(browser, baseURL!, READER);
  });

  test.afterAll(async () => {
    await writer?.close();
    await reader?.close();
    await removeMember(WRITER.email);
    await removeMember(READER.email);
  });

  test("goes from a player's page to their inbox, and the ignore list closes it", async () => {
    const readerId = await memberIdFor(READER.email);
    const writerId = await memberIdFor(WRITER.email);

    // From the reader's own page: Write, and send.
    const page = await writer.newPage();
    await page.goto(`/players/${readerId}`);
    await page.getByTestId("message-link").click();
    await expect(page).toHaveURL(new RegExp(`/messages/${readerId}$`));
    await ready(page, "message-form");
    await expect(page.getByTestId("messages-empty")).toBeVisible();
    await page.getByTestId("message-text").fill("Fancy a game of renju?");
    await page.getByTestId("message-send").click();
    await expect(page.getByTestId("message-mine")).toContainText("Fancy a game of renju?");

    // The reader: in the inbox, and on their side of the thread with the way back.
    const theirs = await reader.newPage();
    await theirs.goto("/inbox");
    const item = theirs.getByTestId("inbox-item").and(theirs.locator('[data-kind="message"]'));
    await expect(item).toContainText("Fancy a game of renju?");
    await item.getByTestId("inbox-open").click();
    await expect(theirs).toHaveURL(new RegExp(`/messages/${writerId}$`));
    await expect(theirs.getByTestId("message-theirs")).toContainText("Fancy a game of renju?");

    // The reader ignores the writer, by the button a member uses.
    await theirs.goto(`/players/${writerId}`);
    await ready(theirs, "ignore-toggle");
    await theirs.getByTestId("ignore-toggle").click();
    await expect(theirs.getByTestId("ignore-toggle")).toHaveAttribute("aria-pressed", "true");

    // The writer is refused, in words that say no more than that.
    await page.reload();
    await ready(page, "message-form");
    await page.getByTestId("message-text").fill("Hello?");
    await page.getByTestId("message-send").click();
    await expect(page.getByTestId("message-trouble")).toContainText("not taking messages");

    // And nothing from the writer shows on the reader's side any more.
    await theirs.goto(`/messages/${writerId}`);
    await expect(theirs.getByTestId("messages-ignored")).toBeVisible();
    await expect(theirs.getByTestId("message-theirs")).toHaveCount(0);
    await expect(theirs.getByTestId("message-form")).toHaveCount(0);
  });
});
