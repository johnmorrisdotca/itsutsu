import { expect, test } from "@playwright/test";

/**
 * A long request shows its opening and offers the rest.
 *
 * John: "where is the simple ticket about showing only part of the text and
 * click to expand???" There was no ticket — he had asked and it lived in a
 * chat window — and the need is plain on the page: a detail here is a summary
 * of a conversation nobody else was in, the gate requires it to say more than
 * its title, and the good ones run to several paragraphs. Thirty of those in a
 * column is a board you scroll past rather than read.
 */
test.describe("a long request on the board", () => {
  test("shows its opening, and the whole of it when asked", async ({ page }) => {
    await page.goto("/admin?view=work");
    const toggle = page.getByTestId("backlog-detail-toggle").first();
    // Every board this suite runs against has at least one long request on it;
    // if that ever stops being true this says so rather than passing quietly.
    await expect(toggle, "no request on the board was long enough to fold").toBeVisible();

    const row = page.locator("li", { has: toggle }).first();
    const short = await row.getByTestId("backlog-detail-short").innerText();
    expect(short.endsWith("…"), `"${short}" should end in an ellipsis`).toBe(true);

    await toggle.click();
    const full = await row.getByTestId("backlog-detail-full").innerText();
    expect(full.length, "opening it showed no more than the fold did").toBeGreaterThan(short.length);

    /*
     * The fold is a prefix of the real thing, cut at a word. Checking that the
     * next character in the full text is a space is what "cut at a word"
     * actually means — an ellipsis after a letter is fine and expected, which
     * is what my first attempt at this got wrong.
     */
    const shown = short.replace(/…$/, "");
    expect(full.startsWith(shown), "the fold is not the opening of this request").toBe(true);
    expect(full.slice(shown.length, shown.length + 1), "the fold cut a word in half").toMatch(/\s|^$/);

    // It closes again, so the page can be put back the way it was.
    await toggle.click();
    await expect(row.getByTestId("backlog-detail-short")).toBeVisible();
  });

  test("says whether it is open, for somebody not using a mouse", async ({ page }) => {
    await page.goto("/admin?view=work");
    const toggle = page.getByTestId("backlog-detail-toggle").first();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
