import { expect, test } from "@playwright/test";

import { memberContext, memberIdFor, seedMember } from "./members";

/**
 * Shutting an account. A ban that waits for somebody to sign out is not a
 * ban, so it takes effect on their next request; and the record of the games
 * they played stays, because their opponents played those games too.
 *
 * The operator names the account BY ID. `/api/members` took an address, and a
 * member who came in with an invite code has none, so they could be neither
 * shut out nor let back in; the route takes the member's id now, as the members
 * list hands it to the operator's own controls.
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
    const id = await memberIdFor(email);
    const page = await context.newPage();

    // They are in, and the site knows them.
    await page.goto("/me");
    await expect(page.getByTestId("name-form")).toBeVisible();

    // The operator shuts the account.
    const shut = await request.patch("/api/members", { data: { id, banned: true, note: "e2e" } });
    expect(shut.status()).toBe(200);
    expect(((await shut.json()) as { bannedAt: string | null }).bannedAt).not.toBeNull();

    // Their very next request is the one that stops working.
    await page.goto("/me");
    await expect(page).toHaveURL(/\/join/);

    // The operator can see the state, and open it again.
    const listed = await request.get("/api/members");
    expect(listed.status()).toBe(200);
    const items = ((await listed.json()) as { items: { id: string; bannedAt: string | null }[] }).items;
    expect(items.find((one) => one.id === id)?.bannedAt).not.toBeNull();

    const opened = await request.patch("/api/members", { data: { id, banned: false } });
    expect(opened.status()).toBe(200);
    await page.goto("/me");
    await expect(page.getByTestId("name-form")).toBeVisible();

    await context.close();
  });

  test("the members list belongs to the operator alone", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const email = `nosy-${stamp}@example.test`;
    await seedMember({ email, name: `Nosy ${stamp}` });
    const context = await memberContext(browser, baseURL!, { email, name: `Nosy ${stamp}` });
    const id = await memberIdFor(email);
    // A member is not an operator: the route says it does not exist.
    expect((await context.request.get("/api/members")).status()).toBe(404);
    expect((await context.request.patch("/api/members", { data: { id, banned: true } })).status()).toBe(404);
    await context.close();
  });
});
