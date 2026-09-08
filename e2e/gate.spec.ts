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

  test("keeps the path when sending someone to the door", async ({ page }) => {
    // A link like /games/connect6 means "this game". Dropping the path would
    // land the visitor on a different one from the one they clicked.
    await page.goto("/games/connect6");
    await expect(page).toHaveURL(/\/join\?next=%2Fgames%2Fconnect6/);
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

  test("will not be talked into redirecting off-site", async ({ page }) => {
    /*
     * `next` is attacker-controlled, and startsWith("/") is not enough:
     * a browser reads //host and /\host as protocol-relative and leaves the
     * site, which is how a sign-in page becomes a phishing redirect wearing a
     * real domain.
     */
    for (const hostile of ["//example.com", "/\\example.com", "https://example.com"]) {
      await page.goto(`/join?next=${encodeURIComponent(hostile)}`);
      await page.getByTestId("toggle-mode").click();

      const href = await page.getByTestId("google-signin").getAttribute("href");
      expect(
        decodeURIComponent(href ?? ""),
        `${hostile} should not survive into the sign-in link`,
      ).toContain("next=/");
      expect(decodeURIComponent(href ?? "")).not.toContain("example.com");
    }
  });

  test("keeps a legitimate destination through the door", async ({ page }) => {
    await page.goto("/join?next=%2Fhistory");
    await page.getByTestId("toggle-mode").click();
    expect(
      decodeURIComponent((await page.getByTestId("google-signin").getAttribute("href")) ?? ""),
    ).toContain("next=/history");
  });
});
