import { expect, test, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * SOMEBODY WHO KNOWS NOBODY HERE CAN ASK TO BE LET IN — AND A SCRIPT CANNOT
 * USE THAT TO SPEND THE SITE'S EMAIL.
 *
 * John, 2026-09-22: "Request an invite sends me an email using the email
 * service." / "Also prevent spam bots making requests and breaking my limits."
 *
 * As a visitor with no session, which is who this is for. The dev server never
 * sends mail (`mailRefusalFor`), and that is what makes the real path provable
 * here: a person's request reaches the sender and is told email is off, while
 * a script's is told "Sent" and never reaches it at all. The two answers being
 * different is the whole claim.
 */
test.use({ storageState: { cookies: [], origins: [] } });

/** The person's pace: the stamp refuses anything sent within three seconds of the form being drawn. */
const A_PERSON_READING = 3_500;

async function openTheForm(page: Page) {
  await page.goto("/join");
  await ready(page, "join-form");
  await page.getByTestId("ask-for-invite-open").click();
  await expect(page.getByTestId("ask-for-invite-form")).toBeVisible();
}

test.describe("asking for an invite", () => {
  test("is offered where a visitor is told they need one, and opens straight onto the form", async ({ page }) => {
    await page.goto("/games");
    await page.getByTestId("games-ask-for-invite").click();
    await page.waitForURL(/\/join\?ask=1/);
    // Open on arrival: the visitor asked to ask, and does not have to find the form again.
    await expect(page.getByTestId("ask-for-invite-form")).toBeVisible();
  });

  test("a person's request reaches the sender", async ({ page }) => {
    await openTheForm(page);
    await page.getByTestId("ask-for-invite-email").fill(`someone-${Date.now()}@example.test`);
    await page.getByTestId("ask-for-invite-about").fill("I played five in a row on itsyourturn.com for years.");
    await page.waitForTimeout(A_PERSON_READING);
    await page.getByTestId("ask-for-invite-send").click();
    // The sender answered — here, that email is off. Only a request that got past every check reaches it.
    await expect(page.getByTestId("ask-for-invite-problem")).toHaveText("Email is not switched on here, so nothing was sent.");
  });

  test("a form sent faster than anybody reads it is told it was sent, and never reaches the sender", async ({ page }) => {
    await openTheForm(page);
    await page.getByTestId("ask-for-invite-email").fill("quick@example.test");
    await page.getByTestId("ask-for-invite-send").click();
    await expect(page.getByTestId("ask-for-invite-sent")).toContainText("Sent.");
  });

  test("the field nobody sees, filled in, is a script", async ({ page }) => {
    await openTheForm(page);
    await page.getByTestId("ask-for-invite-email").fill("trap@example.test");
    await page.locator('input[name="website"]').fill("http://spam.example", { force: true });
    await page.waitForTimeout(A_PERSON_READING);
    await page.getByTestId("ask-for-invite-send").click();
    await expect(page.getByTestId("ask-for-invite-sent")).toContainText("Sent.");
  });

  test("a link is refused, and the person is told why", async ({ page }) => {
    await openTheForm(page);
    await page.getByTestId("ask-for-invite-email").fill("links@example.test");
    await page.getByTestId("ask-for-invite-about").fill("see https://cheap.example");
    await page.waitForTimeout(A_PERSON_READING);
    await page.getByTestId("ask-for-invite-send").click();
    await expect(page.getByTestId("ask-for-invite-problem")).toContainText("leave links out");
  });
});
