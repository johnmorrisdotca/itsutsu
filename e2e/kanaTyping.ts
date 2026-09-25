import type { Page } from "@playwright/test";

import { isSmall, kanaBase, kanaTone } from "../src/lib/puzzles/gomojiKana/kanaMarks";

/**
 * Types a kana word on the kana keys under the grid, as a phone player does:
 * the plain kana, then 小 for a small one and ゛゜ once for ゛ or twice for ゜.
 * A browser test cannot send a key event for か the way it sends "a", and the
 * keys are what a reader taps. Shows the keys first if a computer hid them.
 */
export async function tapKana(page: Page, word: string): Promise<void> {
  const keys = page.getByTestId("word-keys-box");
  if (!(await keys.isVisible())) await page.getByTestId("word-keys-toggle").click();
  for (const kana of word) {
    await page.getByTestId(`kana-key-${kanaBase(kana)}`).click();
    if (isSmall(kana)) await page.getByTestId("kana-key-small").click();
    const tone = kanaTone(kana);
    if (tone !== "") await page.getByTestId("kana-key-mark").click();
    if (tone === "゜") await page.getByTestId("kana-key-mark").click();
  }
}

/**
 * The same, pressed where a thumb presses — at the key's place on the screen,
 * never scrolling to it first. A locator's click scrolls its element into view
 * before pressing, which a finger never does, so a spec about the page staying
 * still must not use it: it measures the tool, not the page.
 */
export async function thumbKana(page: Page, word: string): Promise<void> {
  // The dev server's own button sits at the screen's lower left, on the 小 key when the keys meet the screen's bottom, and a tap there opens its menu. The live site has none.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  const press = async (testId: string) => {
    const box = await page.getByTestId(testId).boundingBox();
    if (box === null) throw new Error(`${testId} is not on the page`);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  };
  for (const kana of word) {
    await press(`kana-key-${kanaBase(kana)}`);
    if (isSmall(kana)) await press("kana-key-small");
    const tone = kanaTone(kana);
    if (tone !== "") await press("kana-key-mark");
    if (tone === "゜") await press("kana-key-mark");
  }
}
