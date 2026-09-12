import { expect, test } from "@playwright/test";

/**
 * Every reading page sits on the same column. The board pages are wider on
 * purpose — a board wants the room — and are checked against each other.
 */
const STANDARD = [
  "/",
  "/games",
  "/games?view=list",
  "/games?view=cards",
  "/games/gomoku",
  "/games/gomoku/rules",
  "/games/gomoku/family",
  "/games/gomoku/standings",
  "/history",
  "/learn",
  "/champions",
  "/about",
  "/me",
];
// The board wants the room. It is /games/<slug>/play now — /games/<slug>
// itself is the game's page, and reads on the same column as the rest.
/*
 * /players is wide since 0.164.2: the members table wants 1118px and was cutting
 * "Challenge" 61px past the edge of the standard column. Page.tsx splits `width`
 * from `board`, so it is wide without being a board page — no "Just the board".
 */
const WIDE = ["/games/gomoku/play", "/players"];

async function mainWidth(page: import("@playwright/test").Page, path: string): Promise<number> {
  await page.goto(path);
  const box = await page.locator("main").first().boundingBox();
  expect(box, `${path} has a main column`).not.toBeNull();
  return Math.round(box!.width);
}

test.describe("page widths", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("every reading page uses the same column", async ({ page }) => {
    const widths = new Map<string, number>();
    for (const path of STANDARD) widths.set(path, await mainWidth(page, path));
    const reference = widths.get("/about");
    for (const [path, width] of widths) expect(width, `${path} matches /about`).toBe(reference);
  });

  test("the board pages share their own, wider column", async ({ page }) => {
    const about = await mainWidth(page, "/about");
    for (const path of WIDE) expect(await mainWidth(page, path)).toBeGreaterThan(about);
  });
});
