import { expect, test } from "@playwright/test";

import { memberContext, seedMember } from "./members";

/**
 * Shutting an account. A ban that waits for somebody to sign out is not a
 * ban, so it takes effect on their next request; and the record of the games
 * they played stays, because their opponents played those games too.
 */
test.describe("a member the operator has shut out", () => {
  test("is signed out at once, cannot come back with a code, and keeps their record", async ({
    browser,
    baseURL,
    request,
  }) => {
    const stamp = Date.now().toString(36);
    const email = `banned-${stamp}@example.test`;
    const name = `Banned ${stamp}`;
    const context = await memberContext(browser, baseURL!, { email, name });
    const page = await context.newPage();

    // They are in, and the site knows them.
    await page.goto("/me");
    await expect(page.getByTestId("name-form")).toBeVisible();

    // The operator shuts the account.
    const shut = await request.patch("/api/members", { data: { email, banned: true, note: "e2e" } });
    expect(shut.status()).toBe(200);
    expect(((await shut.json()) as { bannedAt: string | null }).bannedAt).not.toBeNull();

    // Their very next request is the one that stops working.
    await page.goto("/me");
    await expect(page).toHaveURL(/\/join/);

    // The operator can see the state, and open it again.
    const listed = await request.get("/api/members");
    expect(listed.status()).toBe(200);
    const items = ((await listed.json()) as { items: { email: string; bannedAt: string | null }[] }).items;
    expect(items.find((one) => one.email === email)?.bannedAt).not.toBeNull();

    const opened = await request.patch("/api/members", { data: { email, banned: false } });
    expect(opened.status()).toBe(200);
    await page.goto("/me");
    await expect(page.getByTestId("name-form")).toBeVisible();

    await context.close();
  });

  test("the members list belongs to the operator alone", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    await seedMember({ email: `nosy-${stamp}@example.test`, name: `Nosy ${stamp}` });
    const context = await memberContext(browser, baseURL!, { email: `nosy-${stamp}@example.test`, name: `Nosy ${stamp}` });
    // A member is not an operator: the route says it does not exist.
    expect((await context.request.get("/api/members")).status()).toBe(404);
    expect(
      (await context.request.patch("/api/members", { data: { email: `nosy-${stamp}@example.test`, banned: true } })).status(),
    ).toBe(404);
    await context.close();
  });
});
