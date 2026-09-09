import { expect, test } from "@playwright/test";

test("what the page shows after the second seat link", async ({ page, request }) => {
  const started = await request.post("/api/games/live", {
    data: { variant: "freestyle", size: 9, open: true, moveTimeMs: null, blackName: `P ${Date.now().toString(36)}` },
  });
  const game = (await started.json()) as { id: string; blackToken: string; whiteToken: string };

  await page.goto(`/games/gomoku/${game.id}/seat/${game.blackToken}`);
  await page.waitForURL(/\/games\/gomoku\//);
  console.log("after black link, url:", page.url());
  console.log("  rules panel:", await page.getByTestId("shared-rules").count());

  await page.goto(`/games/gomoku/${game.id}/seat/${game.whiteToken}`);
  await page.waitForTimeout(1200);
  console.log("after white link, url:", page.url());
  console.log("  rules panel:", await page.getByTestId("shared-rules").count());
  console.log("  size control:", await page.getByTestId("shared-rules-size").count());
  console.log("  statement:", await page.getByTestId("rules-statement").count());
  const body = await page.locator("body").innerText();
  console.log("  body starts:", body.slice(0, 160).replace(/\n/g, " | "));

  const after = await (await request.get(`/api/games/${game.id}`)).json();
  console.log("  openSeat:", after.openSeat, "status:", after.status);
  expect(true).toBe(true);
});
