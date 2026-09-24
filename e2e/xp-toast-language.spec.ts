import { expect, test } from "@playwright/test";

import { ready } from "./support";
import { removeVisitors, seedVisitor, setVisitorStanding, visitorContext, type Visitor } from "./xpLedger";
import { xpLevelName } from "../src/lib/xp/levelNames";
import { XP_EVENT_SPECS } from "../src/lib/xp/xp.constants";
import { xpForLevel } from "../src/lib/xp/xpCurve";

/**
 * The XP toast, in the reader's language.
 *
 * It shipped in 0.158.4 with five fixed English strings — "XP", "Level up",
 * "Next level:", "Dismiss", "Points earned" — beside a site that already had
 * a dictionary, so a reader who had chosen Japanese was paid in their own
 * language and told about it in somebody else's. Nothing drove the toast in a
 * browser at all, in either language.
 *
 * Each case does what a reader does. The visitor chooses Japanese by clicking
 * the picker, never by an address or a cookie; then their clock is wound back
 * a day and their total placed just under a level, so the site they open the
 * next day pays a visit that crosses it; and the toast is read as it arrives
 * on that page — no reload anywhere, because a reload throws away exactly the
 * client state a toast lives in. The English case is the way back: the same
 * arrival for a reader who chose nothing.
 *
 * Every row is this file's own: `seedVisitor` makes the member, and the
 * language click writes onto that row and no other.
 */

const made: Visitor[] = [];

test.afterAll(async () => {
  await removeVisitors(made);
  made.length = 0;
});

/** The daily visit is what an arrival pays; its size decides where the total is placed. */
const VISIT = XP_EVENT_SPECS.dailyVisit.points;

/** Opens the site as a visitor seen today, so the first page pays nothing and shows no toast. */
async function arrive(browser: Parameters<typeof visitorContext>[0], baseURL: string, label: string) {
  const visitor = await seedVisitor(label, 0);
  made.push(visitor);
  const context = await visitorContext(browser, baseURL, visitor);
  const page = await context.newPage();
  await page.goto("/about");
  await ready(page, "account-menu");
  return { visitor, context, page };
}

/**
 * The next day's arrival, and the page after it.
 *
 * The reader opens the site afresh — not a click on a link already on
 * yesterday's page, which `next/link` fetched while nothing was yet owed. The
 * page that greets them pays the visit, but cannot show it: the visit is paid
 * by `touchMember` inside the same request, after the member's row was read
 * for that render, so the flash it writes is read by the NEXT page the reader
 * opens — which `SiteHeader` says is the whole of the mechanism. So the reader
 * then goes somewhere, by clicking, and the toast arrives there. No reload:
 * neither page was on screen before.
 */
async function nextDay(page: import("@playwright/test").Page) {
  await page.goto("/games");
  await ready(page, "account-menu");
  await page.getByRole("navigation").locator('a[href="/players"]').first().click();
  await ready(page, "xp-toast-host");
}

test.describe("the XP toast speaks the reader's language", () => {
  test("a level reached, to a reader who chose Japanese by clicking", async ({ browser, baseURL }) => {
    const { visitor, context, page } = await arrive(browser, baseURL!, "ja-level");

    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");

    // One visit short of the second rung: the next arrival crosses it.
    await setVisitorStanding(visitor, { daysAgo: 1, xp: xpForLevel(2) - VISIT });
    await nextDay(page);

    const toast = page.getByTestId("xp-toast");
    await expect(toast).toBeVisible();
    /*
     * READ ONCE, AS IT FIRST APPEARS. In this case, and only in this one, the
     * visit's toast also shows on the arrival page: choosing a language saves
     * it to the account, which reads the member row after the visit was paid.
     * On /players the same toast is drawn again from a flash still being
     * cleared, and is then taken back — so it can be gone 0.7 seconds after it
     * arrives, which failed the checks below when they were made one after
     * another (deploy runs, 2026-09-24). A reader has seen it by then, on the
     * page before. So everything it says is read in one go, the moment it is
     * on screen, and checked afterwards.
     */
    const seen = await page.evaluate(() => {
      const text = (id: string) => document.querySelector(`[data-testid="${id}"]`)?.textContent ?? "";
      return {
        toast: text("xp-toast"),
        points: text("xp-toast-points"),
        level: text("xp-toast-level"),
        announcer: text("xp-toast-announcer"),
        hostLabel: document.querySelector('[data-testid="xp-toast-host"]')?.getAttribute("aria-label") ?? "",
        closeLabel: document.querySelector('[data-testid="xp-toast-dismiss"]')?.getAttribute("aria-label") ?? "",
      };
    });
    expect(seen.points.trim()).toBe(`+${VISIT}`);
    // 経験値, experience points: the unit, no longer two English letters.
    expect(seen.toast).toContain("経験値");
    // 昇級, promotion — the heading's own kanji, standing alone for this reader — and the rung's name.
    expect(seen.level).toContain("昇級");
    expect(seen.level).toContain(xpLevelName(2));
    // What a screen reader is told: the stack's name, and the announcement.
    expect(seen.hostLabel).toBe("獲得ポイント");
    expect(seen.announcer).toContain("経験値");
    expect(seen.announcer).toContain("昇級");
    // And none of the five in English.
    expect(seen.toast).not.toContain("XP");
    expect(seen.toast).not.toContain("Level up");
    expect(seen.hostLabel).not.toBe("Points earned");
    // 閉じる, close: the button's name. Pressing it is the English case's, where the toast stays put.
    expect(seen.closeLabel).toBe("閉じる");

    await context.close();
  });

  test("a level approached, to the same reader", async ({ browser, baseURL }) => {
    const { visitor, context, page } = await arrive(browser, baseURL!, "ja-next");

    await page.getByTestId("language-picker").locator('[data-locale="ja"]').click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");

    // One point short of the second rung after the visit is paid: the quiet "next level" line.
    await setVisitorStanding(visitor, { daysAgo: 1, xp: xpForLevel(2) - VISIT - 1 });
    await nextDay(page);

    const level = page.getByTestId("xp-toast").getByTestId("xp-toast-level");
    // 次のレベル：{name}, "next level: {name}", with the name filled in.
    await expect(level).toHaveText(`次のレベル：${xpLevelName(2)}`);
    await expect(level).not.toContainText("Next level");

    await context.close();
  });

  test("the same arrival, in English, for a reader who chose nothing", async ({ browser, baseURL }) => {
    const { visitor, context, page } = await arrive(browser, baseURL!, "en-level");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await setVisitorStanding(visitor, { daysAgo: 1, xp: xpForLevel(2) - VISIT });
    await nextDay(page);

    const toast = page.getByTestId("xp-toast");
    await expect(toast).toBeVisible();
    await toast.getByTestId("xp-toast-dismiss").hover();
    await expect(toast).toContainText("XP");
    // The heading keeps its kanji beside the English, as every heading on the site does.
    await expect(toast.getByTestId("xp-toast-level")).toContainText("Level up");
    await expect(toast.getByTestId("xp-toast-level")).toContainText("昇級");
    await expect(page.getByTestId("xp-toast-host")).toHaveAttribute("aria-label", "Points earned");
    await toast.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.getByTestId("xp-toast")).toHaveCount(0);

    await context.close();
  });
});
