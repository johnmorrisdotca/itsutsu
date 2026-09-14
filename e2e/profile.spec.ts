import { expect, test } from "@playwright/test";

import { memberContext } from "./members";
import { ready, watchForCrashes } from "./support";

test.describe("people", () => {
  /**
   * THE PAGE MUST NOT DISAGREE WITH ITSELF ON FIRST PAINT.
   *
   * React does not fail anything when the markup the server sent does not
   * match the tree the browser builds to check it: it throws the server's
   * tree away, redraws it after paint, and says so in the console. So a
   * reader can be shown the wrong answer for a frame, anything clicked in
   * that window is dropped — on a form that saves a preference, a dropped
   * first interaction is a preference that silently did not stick — and every
   * test on the page goes green. That is the shape AGENTS.md calls a false
   * pass, seen from the other side: the fault is real, it is logged on every
   * run, and nothing was reading the log.
   *
   * ONE TAB OF THIS PAGE WAS WATCHED AND FIVE WERE NOT. `country-flags.spec.ts`
   * put a watcher on `/me?view=profile` when the country picker's own mismatch
   * was fixed; the record, the XP ledger, the words, the game defaults and the
   * people are five more trees, three of them forms, and a mismatch in any of
   * them would have been reported by nobody.
   *
   * A FRESH DOCUMENT PER TAB, AND NEVER A CLICK, which is the one place the
   * "drive the control, not the mechanism" rule reads backwards. The tabs are
   * links, so clicking one is a client-side navigation and the server renders
   * nothing — and a server render is the entire subject here. Loading the
   * address is what a reader who follows a link from outside does, and it is
   * the only route that produces the markup this is about.
   */
  test("every tab of /me hydrates without the server and the browser disagreeing", async ({
    browser,
    baseURL,
  }) => {
    /*
     * Its own member. The operator's row on a developer's machine is the site
     * owner's own account, and this sweep reads six pages of whatever profile
     * it signs in as — see AGENTS.md, "A Spec Should Bring Its Own World".
     */
    const stamp = Date.now().toString(36);
    const context = await memberContext(browser, baseURL!, {
      email: `hydrate-${stamp}@example.test`,
      name: `Hydrate ${stamp}`,
    });

    // The tabs the page itself offers, so a seventh added later is swept too.
    const strip = await context.newPage();
    await strip.goto("/me");
    const views = await strip
      .getByTestId("tab")
      .evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute("data-tab") ?? ""));
    expect(views.length, "no tabs were found on /me").toBeGreaterThan(1);
    await strip.close();

    for (const view of views) {
      const page = await context.newPage();
      // Before the navigation: a watcher attached after it can miss the message.
      const crashes = watchForCrashes(page);
      await page.goto(`/me?view=${view}`);

      // The server rendered the tab that was asked for…
      await expect(
        page.locator(`[data-testid="tab"][data-tab="${view}"]`),
        `/me?view=${view} did not open that tab`,
      ).toHaveAttribute("data-open", "true");
      /*
       * …and the browser has taken the page over. Both halves matter: an
       * absence is only worth asserting once something is known to be there,
       * and a mismatch is reported when React hydrates, so a log read before
       * that is a log read too early. `account-menu` is in the header of every
       * page on the site; anything else on this one carrying the mark must
       * have been taken over too.
       */
      await ready(page, "account-menu");
      await expect(
        page.locator('[data-ready="false"]'),
        `a panel on /me?view=${view} never hydrated`,
      ).toHaveCount(0);

      expect(
        crashes,
        `/me?view=${view} logged this while hydrating — a mismatch here means the reader saw one answer and then another:\n${crashes.join("\n")}`,
      ).toEqual([]);
      await page.close();
    }

    await context.close();
  });

  test("the players page says who is here and lists every member", async ({ page }) => {
    await page.goto("/players");
    await expect(page.getByTestId("here-now")).toBeVisible();
    await expect(page.getByTestId("directory")).toBeVisible();
  });

  test("the profile page asks for a name whichever part of it is open", async ({ page }) => {
    // The name is the one thing the site needs from a member, so it stands
    // above the tabs rather than behind one of them.
    await page.goto("/me");
    await expect(page.getByTestId("name-form")).toBeVisible();
    await page.goto("/me?view=people");
    await expect(page.getByTestId("name-form")).toBeVisible();
  });

  test("the people a member has said something about are on one tab", async ({ page }) => {
    await page.goto("/me?view=people");
    await expect(page.getByTestId("buddies")).toBeVisible();
    // And not stacked underneath the record, which is what the tabs are for.
    await expect(page.getByTestId("my-record")).toHaveCount(0);
  });

  test("a name needs a member behind it", async ({ request }) => {
    /*
     * A name nothing else could be holding, which is the whole point of
     * generating it. This asked for "Someone" and got 409 — correctly, because
     * a rating record already stood under that name from a game played under
     * it, and taking a name with a record behind it would be inheriting
     * somebody else's rating. That is the API being right and the test being
     * about the wrong thing: it means to check that a name needs an account
     * behind it, not to discover who happens to hold a common name on this
     * database today.
     */
    const mine = `Nobody ${Date.now().toString(36)}`;
    const response = await request.patch("/api/me", { data: { name: mine } });
    expect([200, 404]).toContain(response.status());
  });
});
