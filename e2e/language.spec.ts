import { expect, test } from "@playwright/test";

import { keptPreferences, memberContext, removeMember } from "./members";
import { PLAYER_STATE } from "./support";

/** The language the picker says the page was rendered in. */
const current = (page: import("@playwright/test").Page) =>
  page.getByTestId("language-picker").locator('[data-current="true"]');

/** Clicks a language in the colophon, the way a reader does. */
async function choose(page: import("@playwright/test").Page, locale: string) {
  await page.getByTestId("language-picker").locator(`[data-locale="${locale}"]`).click();
}

/**
 * Choosing a language, and choosing back.
 *
 * John, on 0.126.0 in production: "BUG: Can't change back to ENG from JP."
 *
 * WHY IT SURVIVED A CAREFUL REVIEW, which is the part worth keeping. The i18n
 * work was verified thoroughly and in ONE DIRECTION: `?lang=es` sets the
 * cookie, `Accept-Language: ja` renders Japanese, `lang=de` falls back, a POST
 * is never redirected. Going TO a language, every time. Coming BACK from one,
 * never. And none of it drove the picker in a browser at all — the control a
 * reader actually uses was the one thing not exercised, so a bug that lived
 * entirely in the click survived every check made of the logic under it.
 *
 * So: every case here CLICKS, and none of them reloads. A reload was what hid
 * this — the cookie was always right and a fresh document always rendered the
 * chosen language, which is why reasoning about the code kept saying it worked.
 * What was broken was the App Router serving its cached, pre-switch payload
 * for the address the proxy redirected to. A test that reloads passes while a
 * reader is stuck.
 */
test.describe("the language a reader chooses", () => {
  /*
   * AS AN INVITED BROWSER, NOT AS THE OPERATOR, and that is a fixture
   * decision rather than tidiness.
   *
   * These four cases are about the DEVICE half: a cookie set by the gate and
   * read back by the next render. That is all they were ever about, and while
   * a language lived only in a cookie the identity behind them could not
   * matter — the browser context was thrown away and took the cookie with it.
   *
   * A language now lands on the ACCOUNT of whoever is signed in, and the
   * suite is signed in as the operator, which on a developer's machine is
   * John's own row. Left as they were, cases three and four end on Japanese —
   * so the run would have written Japanese onto his account, every spec after
   * these would have rendered in a language he does not read, and so would
   * his own site. AGENTS.md says it in one line: a spec must not assert
   * anything about a row it did not create, and it must not edit one either.
   *
   * An invite-only browser holds a session and no address, so
   * `currentEmail()` answers null and there is no account for any of this to
   * reach. The account half has its own cases below, with a member of their
   * own.
   */
  test.use({ storageState: PLAYER_STATE });

  test("goes to Japanese and back to English, by clicking and nothing else", async ({ page }) => {
    await page.goto("/about");
    await expect(current(page)).toHaveAttribute("data-locale", "en");

    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(current(page), "choosing 日本語 did nothing").toHaveAttribute("data-locale", "ja");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");

    /*
     * THE ASSERTION THIS FILE EXISTS FOR. Everything above it was already
     * true when John reported the bug.
     */
    await page.getByTestId("language-picker").locator('[data-locale="en"]').click();
    await expect(current(page), "a reader who chose Japanese could not choose back").toHaveAttribute(
      "data-locale",
      "en",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("can be changed back from a page reached while the other language was on", async ({ page }) => {
    /*
     * The worse half of the live bug, and the reason it read as permanent.
     * Once the site was Japanese, every page the reader touched went into the
     * client cache in Japanese — so choosing English back appeared to do
     * nothing on page after page, not just on the one where it was chosen.
     */
    await page.goto("/about");
    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(current(page)).toHaveAttribute("data-locale", "ja");

    /*
     * By address, not by name: the navigation is translated, so looking for a
     * link called "Games" while the site is in Japanese finds nothing — which
     * is a test failing at the one moment its subject is working.
     */
    await page.getByRole("navigation").locator('a[href="/games"]').first().click();
    await expect(page).toHaveURL(/\/games$/);
    await expect(current(page), "the choice did not follow the reader").toHaveAttribute(
      "data-locale",
      "ja",
    );

    await page.getByTestId("language-picker").locator('[data-locale="en"]').click();
    await expect(current(page), "still stuck, one page along").toHaveAttribute("data-locale", "en");
  });

  test("is remembered rather than carried in the address", async ({ page }) => {
    /*
     * The language is not part of what a page IS. An address with `?lang=` on
     * it would be copied, shared and bookmarked, and would then overrule the
     * language of whoever opened it — so the proxy takes it back out.
     */
    await page.goto("/about");
    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(current(page)).toHaveAttribute("data-locale", "ja");
    expect(page.url(), "the address kept the language on it").not.toContain("lang=");
  });

  test("does not un-narrow a page that was narrowed", async ({ page }) => {
    // The whole query is carried across the switch. A filter dropped by a link
    // is the same fault as a count that leads to the wrong set of games.
    await page.goto("/history?result=white");
    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(current(page)).toHaveAttribute("data-locale", "ja");
    await expect(page).toHaveURL(/result=white/);
    await expect(page.getByTestId("history-result")).toHaveValue("white");
  });
});

/**
 * A member chooses their language once, and every device they sign in on
 * speaks it. John: "I think language is another cross device thing."
 *
 * EVERY CASE BRINGS ITS OWN MEMBER, and every "other device" is a browser
 * context of its own with its own sign-in, no language cookie and no `?lang=`
 * in the address — which is the only way to tell "the account decided this"
 * from "this browser was already told". A second page in the same context
 * would share the cookie jar and would pass whether or not the account had
 * anything to do with it.
 *
 * AND EVERY CASE CLICKS, for the reason the file above it exists: the way a
 * reader reaches this is the picker, and the last time this feature was
 * verified by driving the mechanism instead of the control, it was broken in
 * production while every test said otherwise.
 */
test.describe("a member's language, on every device they sign in on", () => {
  /*
   * ONE MEMBER PER CASE, and it is not tidiness. These cases change the thing
   * they are about, so a member shared between them would arrive at the
   * second case already speaking Japanese — and "click 日本語" on a page
   * already in Japanese clicks the label of the language you are in, which is
   * a span rather than a link. It does nothing, the assertion after it passes
   * anyway, and the case would be green without ever having chosen anything.
   */
  const made: string[] = [];

  function freshMember() {
    const tag = Math.random().toString(36).slice(2, 8);
    const member = { email: `lang-${tag}@example.test`, name: `Lang ${tag}` };
    made.push(member.email);
    return member;
  }

  test.afterAll(async () => {
    for (const email of made) await removeMember(email);
  });

  /** A device of its own: a fresh context, signed in as that member, nothing else. */
  async function device(
    browser: import("@playwright/test").Browser,
    baseURL: string,
    member: { email: string; name: string },
    options?: Parameters<typeof memberContext>[3],
  ) {
    const context = await memberContext(browser, baseURL, member, options);
    return { context, page: await context.newPage() };
  }

  test("follows them to a device that has never been told anything", async ({ browser, baseURL }) => {
    const member = freshMember();
    const here = await device(browser, baseURL ?? "", member);
    await here.page.goto("/about");
    await expect(current(here.page)).toHaveAttribute("data-locale", "en");
    await choose(here.page, "ja");
    await expect(current(here.page), "choosing 日本語 did nothing").toHaveAttribute("data-locale", "ja");

    /*
     * Kept on the account, read from the row this spec made. The device
     * assertion below would also fail if the write had never landed, but it
     * could fail for half a dozen other reasons; this one says which.
     */
    expect(keptOn(await keptPreferences(member.email)), "nothing reached the account").toBe("ja");

    /*
     * THE CASE THE TICKET IS FOR. Another device, signed in as the same
     * member: its own context, its own cookie jar with no language in it, no
     * `?lang=` in the address, and a browser that asks for English. Japanese
     * can only have come from the account.
     */
    const there = await device(browser, baseURL ?? "", member);
    await there.page.goto("/about");
    await expect(
      current(there.page),
      "a second device did not speak the language the member chose",
    ).toHaveAttribute("data-locale", "ja");
    await expect(there.page.locator("html")).toHaveAttribute("lang", "ja");
    expect(there.page.url(), "the second device asked for a language").not.toContain("lang=");

    await here.context.close();
    await there.context.close();
  });

  test("comes back with them, so a choice is not one-way", async ({ browser, baseURL }) => {
    /*
     * TEST THE WAY BACK, NOT JUST THE WAY THERE — the rule this feature's own
     * history wrote. Going to Japanese everywhere and never coming back is
     * how 0.126.0 shipped, and an account makes that worse rather than
     * better: a language that reached every device and could be changed from
     * none of them would be the same trap with more doors.
     *
     * THE SECOND DEVICE ASKS FOR JAPANESE, which is what makes the assertion
     * mean anything, and it was VACUOUS UNTIL IT DID. English is also what
     * this site falls back to, so a plain browser rendering English proves
     * nothing — it is the answer for "the account said English" and for "the
     * account said nothing at all" alike. Breaking the account read on
     * purpose left this case green, which is how that was found; a browser
     * sending `Accept-Language: ja` is answered in Japanese by every path
     * except the one under test, so now only the account can produce English.
     *
     * Through the context's `locale` rather than an extra header: Chromium
     * sends its own `Accept-Language` from the locale, and
     * `setExtraHTTPHeaders` never reaches the server. See `memberContext`.
     */
    const member = freshMember();
    const here = await device(browser, baseURL ?? "", member);
    await here.page.goto("/about");
    await choose(here.page, "ja");
    await expect(current(here.page)).toHaveAttribute("data-locale", "ja");

    await choose(here.page, "en");
    await expect(current(here.page), "could not choose back").toHaveAttribute("data-locale", "en");
    expect(keptOn(await keptPreferences(member.email)), "the way back reached nothing").toBe("en");

    const there = await device(browser, baseURL ?? "", member, { locale: "ja-JP" });
    await there.page.goto("/about");
    await expect(
      current(there.page),
      "a device asking for Japanese was not brought back by the account",
    ).toHaveAttribute("data-locale", "en");
    await expect(there.page.locator("html")).toHaveAttribute("lang", "en");

    await here.context.close();
    await there.context.close();
  });

  test("overrules a device that was told something else, since the account is where it lives", async ({
    browser,
    baseURL,
  }) => {
    /*
     * The precedence, driven rather than only asserted by value. The language
     * cookie lasts a year, so a laptop told English last winter is an
     * ordinary state for a member to be in — and if that cookie outranked the
     * account, "chooses once" would mean "chooses once per browser", and one
     * stale device would be enough to make the whole feature look broken.
     */
    const member = freshMember();
    const here = await device(browser, baseURL ?? "", member);
    await here.page.goto("/about");
    await choose(here.page, "ja");
    await expect(current(here.page)).toHaveAttribute("data-locale", "ja");

    const stale = await device(browser, baseURL ?? "", member);
    await stale.context.addCookies([
      { name: "lang", value: "en", url: baseURL ?? "", httpOnly: true, sameSite: "Lax" },
    ]);
    await stale.page.goto("/about");
    await expect(
      current(stale.page),
      "a year-old cookie beat the language the member chose",
    ).toHaveAttribute("data-locale", "ja");

    await here.context.close();
    await stale.context.close();
  });

  test("is one member's, not the site's", async ({ browser, baseURL }) => {
    /*
     * An account preference is not global state, and a browser with nobody
     * signed in has no account to read. /about is open to a stranger, so this
     * is a page a signed-out reader really does see.
     */
    const member = freshMember();
    const here = await device(browser, baseURL ?? "", member);
    await here.page.goto("/about");
    await choose(here.page, "ja");
    await expect(current(here.page)).toHaveAttribute("data-locale", "ja");

    const stranger = await browser.newContext({ baseURL: baseURL ?? "" });
    const page = await stranger.newPage();
    await page.goto("/about");
    await expect(
      current(page),
      "a member's language reached a browser that is not theirs",
    ).toHaveAttribute("data-locale", "en");

    await here.context.close();
    await stranger.close();
  });
});

/**
 * The language kept in a member's preferences column, or null.
 *
 * Read raw rather than through the registry, for the reason
 * `keptPreferences` is: the registry fills in its fallback, and this
 * preference's fallback is English — so a resolved read cannot tell "chose
 * English" from "never chose", which is the one distinction these cases are
 * about.
 */
function keptOn(preferences: unknown): string | null {
  if (preferences === null || typeof preferences !== "object" || Array.isArray(preferences)) return null;
  const value = (preferences as Record<string, unknown>).language;
  return typeof value === "string" ? value : null;
}
