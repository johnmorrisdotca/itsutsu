import { expect, test } from "@playwright/test";

/**
 * The gate, exercised with no session at all.
 *
 * This is the spec that would notice if the site quietly became public again,
 * which is exactly what happened once already on the production alias.
 */
test.describe("a visitor with no invite", () => {
  test("is sent to the door instead of the board", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/join/);
    await expect(page.getByTestId("invite-code")).toBeVisible();
  });

  test("is sent back to where they were heading, after joining", async ({ page }) => {
    await page.goto("/history");
    await expect(page).toHaveURL(/\/join\?next=%2Fhistory/);
  });

  test("cannot read the game history", async ({ request }) => {
    const response = await request.get("/api/games");
    expect(response.status()).toBe(401);
  });

  test("cannot write a game record", async ({ request }) => {
    const response = await request.post("/api/games", {
      data: {
        size: 15, winLength: 5, variant: "freestyle", opener: "black",
        result: "draw", winner: null, moves: [],
      },
    });
    // This is the endpoint that was open on production.
    expect(response.status()).toBe(401);
  });

  test("cannot start a shared game", async ({ request }) => {
    expect((await request.post("/api/games/live", { data: { size: 9 } })).status())
      .toBe(401);
  });

  test("cannot read player names", async ({ request }) => {
    expect((await request.get("/api/players?q=a")).status()).toBe(401);
  });

  test("is refused a wrong invite code", async ({ request }) => {
    const response = await request.post("/api/session", {
      data: { kind: "invite", code: "hoshi-kuma-nami" },
    });
    // 401 or 429 — either way, not in.
    expect([401, 429]).toContain(response.status());
  });

  test("is refused the operator token with the wrong email", async ({ request }) => {
    const response = await request.post("/api/session", {
      data: { kind: "admin", email: "nobody@example.com", token: "local-operator-token" },
    });
    expect([401, 429]).toContain(response.status());
  });

  test("is throttled when guessing codes", async ({ request }) => {
    const codes = Array.from({ length: 8 }, (_, i) => `hoshi-kuma-${i}`);
    const statuses: number[] = [];
    for (const code of codes) {
      statuses.push(
        (await request.post("/api/session", { data: { kind: "invite", code } })).status(),
      );
    }
    expect(statuses, "guessing should hit a 429").toContain(429);
  });

  test("keeps the query when sending someone to the door", async ({ page }) => {
    // A link like /?game=connect6 means "this game". Dropping the query would
    // land the visitor on a different one from the one they clicked.
    await page.goto("/?game=connect6");
    await expect(page).toHaveURL(/\/join\?next=%2F%3Fgame%3Dconnect6/);
  });
});

test.describe("the pages that stay open", () => {
  test("rules and learning are readable without an invite", async ({ page }) => {
    for (const path of ["/rules", "/learn"]) {
      await page.goto(path);
      await expect(page, `${path} should not send you to the door`).not.toHaveURL(
        /\/join/,
      );
    }
  });

  test("a variant's rules page is readable too", async ({ request }) => {
    expect((await request.get("/rules/connect6")).status()).toBe(200);
  });

  test("the screenshots those pages load are readable", async ({ request }) => {
    // public/ is not exempted by the matcher, so these had to be named.
    expect((await request.get("/games/caro.jpg")).status()).toBe(200);
  });

  test("but nothing else opened by accident", async ({ request }) => {
    for (const path of ["/", "/history", "/players"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} should still be gated`).toBe(307);
    }
    for (const path of ["/api/games", "/api/players?q=a"]) {
      expect((await request.get(path)).status(), `${path}`).toBe(401);
    }
  });
});
