import { expect, test } from "@playwright/test";

import { memberContext, removeMember } from "./members";
import { ready } from "./support";

/*
 * THE AGE QUESTION, ASKED FIRST.
 *
 * A new member is asked their age band before the name question, and a
 * member under 13 cannot go on until a parent or guardian has consented, by
 * name, on the same form. Both are driven the way a reader meets them: the
 * welcome page, the tiles, the consent fields, the Save. Each case brings its
 * own member and takes it away again; the consent row goes with the member.
 *
 * The absence of the name form is asserted only after the age form has
 * rendered, so it is a statement about the page and not about the speed of
 * the request.
 */
test.describe("age band", () => {
  test("a new member under 13 needs a parent before anything else, and the answer shows on their profile", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `age-${stamp}@example.test`, name: `Age ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    try {
      const page = await context.newPage();
      await page.goto("/me?welcome=1");
      await ready(page, "age-band-form");
      await expect(page.getByTestId("name-form")).toHaveCount(0);

      await page.locator('[data-testid="age-band-option"][data-band="under_13"]').click();
      await page.getByTestId("age-band-save").click();
      await expect(page.getByTestId("age-band-error")).toContainText("parent or guardian");
      await expect(page.getByTestId("name-form")).toHaveCount(0);

      await page.getByTestId("age-consent-name").fill("Pat Example");
      await page.getByTestId("age-consent-relationship").selectOption("guardian");
      await page.getByTestId("age-consent-agree").click();
      await page.getByTestId("age-band-save").click();

      await expect(page.getByTestId("name-form")).toBeVisible();
      await expect(page.getByTestId("age-band-form")).toHaveCount(0);

      await page.goto("/me?view=profile");
      await ready(page, "age-band-form");
      await expect(page.getByTestId("age-band-shown")).toContainText("Under 13");
      await expect(page.getByTestId("age-band-shown")).toContainText("consent recorded");
    } finally {
      await context.close();
      await removeMember(me.email);
    }
  });

  test("the API refuses under 13 with nobody consenting, and takes 18 or over at once", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const me = { email: `adult-${stamp}@example.test`, name: `Adult ${stamp}` };
    const context = await memberContext(browser, baseURL!, me);
    try {
      const refused = await context.request.patch("/api/me", { data: { ageBand: "under_13" } });
      expect(refused.status()).toBe(422);
      expect(((await refused.json()) as { needsParent?: boolean }).needsParent).toBe(true);

      const consentAlone = await context.request.patch("/api/me", {
        data: { consent: { name: "Pat", relationship: "parent", agreed: true } },
      });
      expect(consentAlone.status()).toBe(400);

      const adultWithConsent = await context.request.patch("/api/me", {
        data: { ageBand: "18_plus", consent: { name: "Pat", relationship: "parent", agreed: true } },
      });
      expect(adultWithConsent.status()).toBe(422);

      const taken = await context.request.patch("/api/me", { data: { ageBand: "18_plus" } });
      expect(taken.ok()).toBe(true);

      const page = await context.newPage();
      await page.goto("/me?welcome=1");
      // The name form is server-rendered; once it is on the page, the age question's absence means something.
      await expect(page.getByTestId("name-form")).toBeVisible();
      await expect(page.getByTestId("age-band-form")).toHaveCount(0);

      await page.goto("/me?view=profile");
      await ready(page, "age-band-form");
      await expect(page.getByTestId("age-band-shown")).toContainText("18 or over");
      await page.getByTestId("age-band-change").click();
      await page.locator('[data-testid="age-band-option"][data-band="13_17"]').click();
      await page.getByTestId("age-band-save").click();
      await expect(page.getByTestId("age-band-shown")).toContainText("13 to 17");
    } finally {
      await context.close();
      await removeMember(me.email);
    }
  });
});
