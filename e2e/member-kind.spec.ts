import { expect, test } from "@playwright/test";

import { seedMember } from "./members";

/** The address this deployment treats as the operator, and the one the tests sign in as. */
const OPERATOR = "john@spxis.com";

/**
 * What kind of member somebody is, and what may be done about them.
 *
 * Two things John reported together, and they belong together: the operator's
 * own row could not say it was the operator, and the one control it offered
 * that made no sense — shutting yourself — answered 200 and did nothing.
 */
test.describe("a member's row says what kind of member they are", () => {
  test("the operator is badged as the operator, on their own row", async ({ page }) => {
    // The operator has a member row in production; give the dev database one
    // too, or there is nothing on this list that is them.
    await seedMember({ email: OPERATOR, name: "John Morris" });
    await page.goto("/admin?view=members");

    const mine = page.getByTestId("admin-member").filter({ has: page.getByText(OPERATOR) });
    await expect(mine.getByTestId("member-kind")).toHaveAttribute("data-kind", "operator");
  });

  test("an ordinary member is not badged at all", async ({ page }) => {
    /*
     * A badge on every row is a badge on none — the point is that the
     * operator, the robots and the kept records stand out from the people.
     *
     * Which kind each row gets is settled in memberKind.test.ts, against every
     * combination including the two sorts of kept record. It is not asserted
     * here because the operator's list is capped at 200 rows and a development
     * database has hundreds of test members newer than Chibi and Kyokosan, so
     * looking for them on this page tests the cap rather than the badge.
     */
    const stamp = Date.now().toString(36);
    await seedMember({ email: `plain-${stamp}@example.test`, name: `Plain ${stamp}` });
    await page.goto("/admin?view=members");
    const plain = page.getByTestId("admin-member").filter({ hasText: `Plain ${stamp}` });
    await expect(plain).toBeVisible();
    await expect(plain.getByTestId("member-kind")).toHaveCount(0);
  });

  test("a badge does not change the height of the row it is on", async ({ page }) => {
    // The standing rule: a row's height belongs to the table, not to what
    // happens to be in that row.
    await seedMember({ email: OPERATOR, name: "John Morris" });
    await page.goto("/admin?view=members");
    const rows = page.getByTestId("admin-member");
    // The list arrives from the API, so wait for it rather than counting an
    // empty page and calling that a pass.
    await expect(rows.first()).toBeVisible();
    const count = Math.min(await rows.count(), 8);
    expect(count).toBeGreaterThan(1);
    const heights: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const box = await rows.nth(index).boundingBox();
      if (box !== null) heights.push(Math.round(box.height));
    }
    expect(new Set(heights).size, `heights were ${heights.join(", ")}`).toBe(1);
  });
});

/**
 * The operator cannot shut their own account.
 *
 * It used to answer 200 and do nothing, because the operator check read the
 * allowlist and never the member row. It reads the row now, which is what
 * makes shutting any other operator work — and is exactly why this one has to
 * be refused: the ban is checked on every request, and the only control that
 * could undo it lives behind the door it would have just shut.
 */
test.describe("shutting an account", () => {
  test("is not offered on the operator's own row", async ({ page }) => {
    await seedMember({ email: OPERATOR, name: "John Morris" });
    await page.goto("/admin?view=members");
    const mine = page.getByTestId("admin-member").filter({ has: page.getByText(OPERATOR) });
    await expect(mine.getByTestId("cannot-shut-yourself")).toBeVisible();
    await expect(mine.getByTestId("ban-member")).toHaveCount(0);
  });

  test("is refused by the API too, not only hidden on the page", async ({ page, request }) => {
    await seedMember({ email: OPERATOR, name: "John Morris" });
    const refused = await request.patch("/api/members", { data: { email: OPERATOR, banned: true } });
    expect(refused.status()).toBe(400);
    expect(await refused.text()).toContain("cannot shut your own account");

    // And the operator is still the operator, which is the whole point.
    const still = await page.goto("/admin?view=members");
    expect(still?.status()).toBe(200);
  });

  test("still works on somebody else, and really stops them", async ({ browser, baseURL, request }) => {
    const stamp = Date.now().toString(36);
    const them = { email: `shut-me-${stamp}@example.test`, name: `Shut Me ${stamp}` };
    await seedMember(them);

    const { memberContext } = await import("./members");
    const theirs = await memberContext(browser, baseURL!, them);
    const mine = await theirs.newPage();
    await mine.goto("/players");
    // Signed in: the site knows who they are, and says so in the corner.
    await expect(mine.getByTestId("me-link")).toContainText(them.name);

    const shut = await request.patch("/api/members", { data: { email: them.email, banned: true } });
    expect(shut.status()).toBe(200);

    /*
     * Their next request is the one that stops working. The page still
     * answers — the gate only proves somebody came in with a valid session —
     * but currentSession reads the row and refuses it, so the site no longer
     * knows them and they are nobody again.
     */
    const after = await theirs.newPage();
    await after.goto("/players");
    await expect(after.getByTestId("me-link")).toHaveCount(0);
    await theirs.close();
  });
});
