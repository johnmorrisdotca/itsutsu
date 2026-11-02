import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/**
 * A REFUSAL IS READ IN THE REFUSED READER'S OWN LANGUAGE (ENJA-13).
 *
 * The site's API used to answer "no" with an English sentence that the page
 * drew as it was, so a reader of Japanese was told off in English. A refusal is
 * a key and its values now, and the page says the key through the speaker.
 *
 * The control is driven, not the address: a member types a name the schema
 * refuses and presses Save, as a person would, once in Tokyo reading Japanese
 * and once in Vancouver reading English. The status is the same for both, and
 * the words are each reader's own. The way back is tested too: the English
 * reader still gets the sentence the API has always sent.
 */

const READERS = [
  { where: "Tokyo, reading Japanese", locale: "ja-JP", zone: "Asia/Tokyo", says: "使えるのは、文字、数字、1つずつの空白です。" },
  { where: "Vancouver, reading English", locale: "en-US", zone: "America/Vancouver", says: "Letters, numbers and single spaces." },
] as const;

test.describe("a refusal in the reader's language", () => {
  for (const reader of READERS) {
    test(`a name the schema refuses, as a reader in ${reader.where} is told`, async ({ browser, baseURL }) => {
      const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      const email = `refused-${stamp}@example.test`;
      const context = await memberContext(browser, baseURL!, { email, name: `Refused ${stamp}` }, { locale: reader.locale, timezoneId: reader.zone });
      const page = await context.newPage();
      try {
        await page.goto("/me");
        await ready(page, "name-form");

        // A slash is not a letter, a number or a space: the server says no, with its key.
        // Other things PATCH this address on the way in (the device's zone), so this is the one that carries the name.
        const refused = page.waitForResponse((response) => response.url().endsWith("/api/me") && response.request().method() === "PATCH" && (response.request().postData() ?? "").includes(stamp));
        await page.getByTestId("display-name").fill(`a/${stamp}`);
        await page.getByTestId("name-form").locator('button[type="submit"]').click();
        const answer = await refused;
        expect(answer.status()).toBe(400);
        expect(((await answer.json()) as { code?: string; error?: string }).code).toBe("err.name.letters");
        expect(((await answer.json()) as { error?: string }).error).toBe("Letters, numbers and single spaces.");

        await expect(page.getByTestId("name-error")).toHaveText(reader.says);
      } finally {
        await context.close();
        await removeMember(email);
      }
    });
  }
});
