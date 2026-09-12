import { expect, test, type Browser, type Page } from "@playwright/test";

import { ready } from "./support";

/**
 * The operator's site-level controls, driven the way the operator drives them.
 *
 * WHAT THIS FILE IS FOR, since the unit tests already cover a great deal. The
 * registry, the two doors' decision and the gate's shutter are all decided by
 * pure functions with their own tests — `src/lib/site/site.test.ts`,
 * `src/app/api/session/signup.test.ts`, `src/proxy.test.ts`. None of those can
 * tell you whether the PANEL is wired to them. The bug this file is here to
 * catch is the one both siblings have shipped: a control that looks exactly
 * like the working ones and changes nothing. WazaDB has three of those, one of
 * them a `maintenanceMode` field that both of its admin pages write and nothing
 * anywhere reads.
 *
 * So every assertion below starts with a click on /admin and ends somewhere a
 * reader would notice — the door's own copy. Nothing here sets a setting
 * through the API and then checks the API agrees, which would be a test about
 * the API.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It never completes a Google sign-in,
 * because a spec cannot: `getServerSession` reads a cookie only a live OAuth
 * round trip sets, so "a throwaway Google identity becomes a member with no
 * code" is unreachable from a browser here and is covered in
 * `signup.test.ts` instead, with Google mocked. Reaching for a shortcut — a
 * hand-forged next-auth cookie, say — would be a test taking a route no reader
 * takes, which is this repository's own name for a test that proves nothing.
 *
 * IT PUTS THE SITE BACK. These are the only settings on this site that are not
 * scoped to one member, so a run that left `registration` on `closed` would
 * change the world every other spec runs in. Restoring is part of the test, not
 * tidiness, and it is done in `afterEach` so a failure mid-way still restores.
 */

/** Site-wide state: these must not interleave with each other. */
test.describe.configure({ mode: "serial" });

const SETTINGS = "/api/site";

test.afterEach(async ({ request }) => {
  // Null, not "invite-only": back to nobody having said anything, which is the
  // state this file found the site in and the one a fresh database is in.
  for (const key of ["registration", "joinNotice"]) {
    const put = await request.put(SETTINGS, { data: { key, value: null } });
    expect(put.ok(), `could not put ${key} back`).toBe(true);
  }
});

/** The panel, hydrated — never an element the server also renders. */
async function openThePanel(page: Page) {
  await page.goto("/admin?view=site");
  await ready(page, "admin-site");
}

/**
 * The door, as a STRANGER sees it — which is the only way to see it at all.
 *
 * `/join` redirects anybody already holding a session straight back out
 * (`currentSession() !== null` → `redirect(next)`), and this file's own context
 * is signed in as the operator. **A new page in that context inherits the
 * cookie**, so the first version of this spec was asserting the door's copy on
 * the front page, having been bounced there — the assertion failed on "element
 * not found", which reads as a broken feature and was a broken test.
 *
 * A clean context is also the honest subject: every line of copy these tests
 * check exists for somebody who is not signed in, so testing it while signed in
 * would be testing it on the one visitor who never sees it. `baseURL` has to be
 * passed explicitly, because `use` options are not applied to a context made by
 * hand.
 */
async function openTheDoor(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const door = await context.newPage();
  await door.goto("/join");
  return { door, context };
}

test("the operator opens the site to anyone, and the door says so", async ({ page, browser, baseURL }) => {
  await openThePanel(page);

  // Where it starts: asking for a code, and nobody has changed it.
  await expect(page.getByTestId("registration-invite-only")).toHaveAttribute("data-chosen", "true");

  /*
   * The control asks before it takes effect, because this one lets strangers
   * in. Driving the confirmation rather than the underlying write is the point:
   * a ConfirmButton whose "yes" was never wired would pass any test that
   * called the API itself.
   */
  await page.getByTestId("registration-open-use").click();
  await expect(page.getByTestId("registration-open-use-confirm")).toBeVisible();
  await page.getByTestId("registration-open-use-yes").click();

  await expect(page.getByTestId("registration-open")).toHaveAttribute("data-chosen", "true");
  await expect(page.getByTestId("registration-invite-only")).toHaveAttribute("data-chosen", "false");
  // And it now says somebody chose it, rather than that it is the default.
  await expect(page.getByTestId("provenance-registration")).toContainText("Set by");

  /*
   * The consequence a reader sees. A separate visitor, not a reload of this
   * page — the door is a different address, read by somebody who is not the
   * operator, and this is the only way to learn whether anything outside
   * /admin reads the setting at all.
   */
  const { door, context } = await openTheDoor(browser, baseURL);
  await expect(door.getByRole("paragraph").filter({ hasText: "no code needed" })).toBeVisible();
  await context.close();
});

/*
 * THE WAY BACK, which is a test of its own because a one-directional test finds
 * one-directional bugs. Setting a mode, changing it, and clearing it are three
 * different things, and "I cannot get out of it" is a whole class of fault that
 * only the return trip sees.
 */
test("and shuts it again, which is the trip the other test does not make", async ({ page, browser, baseURL }) => {
  await openThePanel(page);
  await page.getByTestId("registration-open-use").click();
  await page.getByTestId("registration-open-use-yes").click();
  await expect(page.getByTestId("registration-open")).toHaveAttribute("data-chosen", "true");

  // Back to asking for a code. The default needs no confirming — it is how the
  // site already behaves, so there is nothing to warn anybody about.
  await page.getByTestId("registration-invite-only-use").click();
  await expect(page.getByTestId("registration-invite-only")).toHaveAttribute("data-chosen", "true");

  const { door, context } = await openTheDoor(browser, baseURL);
  /*
   * Wait for the form before asserting what is not in it. `toContainText` on an
   * absence passes the instant it is asked, and would pass on a page that had
   * not answered yet — which is every page for a moment.
   */
  await expect(door.getByTestId("join-submit").or(door.getByTestId("google-signin"))).toBeVisible();
  await expect(door.locator("body")).not.toContainText("no code needed");
  await context.close();
});

test("stops new members without shutting the site, and the door says that too", async ({ page, browser, baseURL }) => {
  await openThePanel(page);
  await page.getByTestId("registration-closed-use").click();
  await expect(page.getByTestId("registration-closed-use-confirm")).toBeVisible();
  await page.getByTestId("registration-closed-use-yes").click();
  await expect(page.getByTestId("registration-closed")).toHaveAttribute("data-chosen", "true");

  const { door, context } = await openTheDoor(browser, baseURL);
  await expect(door.getByRole("paragraph").filter({ hasText: "not taking new members" })).toBeVisible();
  /*
   * And the code field is gone, because a door that takes an answer it will
   * refuse is worse than one that says it is shut. Asserted after waiting for
   * the Google button, which IS on the page — an absence means nothing until a
   * presence beside it has been waited for.
   */
  await expect(door.getByTestId("google-signin")).toBeVisible();
  await expect(door.getByTestId("invite-code")).toHaveCount(0);
  await context.close();
});

test("puts a line on the door, and takes it down again", async ({ page, browser, baseURL }) => {
  const notice = `Beta — ask John for a code (${Date.now()})`;
  await openThePanel(page);

  await page.getByTestId("joinNotice-input").fill(notice);
  await page.getByTestId("joinNotice-save").click();
  await expect(page.getByTestId("provenance-joinNotice")).toContainText("Set by");

  const { door, context } = await openTheDoor(browser, baseURL);
  await expect(door.getByTestId("join-notice")).toHaveText(notice);

  // Down again, on the same panel, and gone from the door.
  await page.getByTestId("joinNotice-clear").click();
  await expect(page.getByTestId("provenance-joinNotice")).toContainText("Nobody has changed this");

  /*
   * A second visit to the door, which is NOT the reload this repository warns
   * against. That rule is about throwing away client state to make an
   * assertion pass — the state the bug lives in. The notice is server-rendered
   * copy on a page this visitor has no client state on at all, and it was taken
   * down on a different page in a different context, so a fresh visit is the
   * only way anybody could observe the change. The assertion below would not
   * pass on a stale render; it would find the notice still there.
   */
  await door.goto("/join");
  await expect(door.getByTestId("google-signin")).toBeVisible();
  await expect(door.getByTestId("join-notice")).toHaveCount(0);
  await context.close();
});

/**
 * The shutter is reported, not switchable, and that is the thing to protect.
 *
 * It is an environment variable because the gate reads it on every request and
 * has to answer while the database is being worked on — see `MAINTENANCE_ENV`.
 * A later change that gave this panel a switch for it would be giving the
 * operator a control that cannot act, which is the exact fault this file exists
 * to catch. `src/proxy.test.ts` is where the shutter's behaviour is proven,
 * since it is a pure function of a request and one variable; what a browser can
 * check is that the panel tells the operator the truth about it.
 */
test("says plainly how the site is shut, rather than offering a switch that would not work", async ({ page }) => {
  await openThePanel(page);
  const shutter = page.getByTestId("site-maintenance");
  await expect(shutter).toBeVisible();
  // The suite's own server is up, so this is the state it must report.
  await expect(shutter).toHaveAttribute("data-maintenance", "off");
  await expect(shutter).toContainText("The site is up");
  // The variable, so the operator knows what to set, and the other control, so
  // they do not shut the whole site when they meant to close the door.
  await expect(shutter).toContainText("SITE_MAINTENANCE=on");
  await expect(shutter).toContainText("Nobody new");
});

/**
 * The API refuses what the panel would never send. The panel's controls are
 * built from the registry, so they cannot offer a bad value — which is exactly
 * why this has to be asked of the API directly: the check that matters is the
 * one that holds when something other than the panel is calling.
 */
test("refuses a mode this site does not offer, and a setting it has never heard of", async ({ request }) => {
  const badValue = await request.put(SETTINGS, {
    data: { key: "registration", value: "approval" },
  });
  expect(badValue.status()).toBe(422);

  const badKey = await request.put(SETTINGS, { data: { key: "maintenance", value: "on" } });
  expect(badKey.status()).toBe(422);

  // And the door is untouched by either refusal.
  const after = await request.get(SETTINGS);
  expect(after.ok()).toBe(true);
  const { settings } = (await after.json()) as {
    settings: { key: string; value: string; chosen: boolean }[];
  };
  const registration = settings.find((one) => one.key === "registration");
  expect(registration?.value).toBe("invite-only");
  expect(registration?.chosen).toBe(false);
});
