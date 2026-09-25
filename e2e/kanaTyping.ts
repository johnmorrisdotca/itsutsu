import type { Page } from "@playwright/test";

import { isSmall, kanaBase, kanaTone } from "../src/lib/puzzles/wordDropKana/kanaMarks";

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
