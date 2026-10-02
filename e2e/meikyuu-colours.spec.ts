import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { contrast } from "../src/lib/pieces/colourMath";
import { mySolvePath, PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { LOOK_RULES, LOOK_STORAGE, PAPERS } from "../src/lib/puzzles/meikyuu/look.constants";
import { drawThrough, placedMaze, wayThrough } from "./meikyuu";
import { keptPreferences, memberContext, newestSolveOf, removeMember } from "./members";
import { ready } from "./support";

/**
 * MEIKYUU'S COLOURS: the border, the background and the maze, chosen from ready-made
 * sets or mixed from swatches, and always readable.
 *
 * John, 2026-10-02: "allow the user to change the colour for the border… the background
 * colour and even the colour of the maze. We have to be smart with colours that work
 * together and not make something that makes it very hard to see the thing, but it
 * allows kids and people to decorate their design even before and after playing."
 *
 * Every case drives the controls a player presses (the chooser's swatches and sets), and
 * reads the colours the drawing really wears — computed in the browser — rather than the
 * attributes the chooser sets. Each is a member of its own, made for it and taken away
 * after, and starts from no colours chosen.
 */
const AT = `/games/${PUZZLE_SLUGS.meikyuu}`;

async function aMember(browser: Browser, baseURL: string | undefined, tag: string, width = 1280): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const email = `meikyuu-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const context = await memberContext(browser, baseURL!, { email, name: "Meikyuu Painter" }, { viewport: { width, height: width === 1280 ? 1100 : 844 } });
  return { context, page: await context.newPage(), email };
}

/** What the maze on the page is drawn in: the paper's fill and the walls' and line's strokes, as the browser computed them. */
async function drawnColours(page: Page, scope = "meikyuu-board") {
  return page.getByTestId(scope).evaluate((host) => {
    const colour = (selector: string, property: "fill" | "stroke") => {
      const element = host.querySelector(selector);
      return element === null ? null : getComputedStyle(element)[property];
    };
    const rgb = (text: string | null) => {
      const found = text === null ? null : /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(text);
      return found === null || found === undefined ? null : `#${[1, 2, 3].map((at) => Number(found[at]).toString(16).padStart(2, "0")).join("")}`;
    };
    return { paper: rgb(colour(".mk-paper", "fill")), wall: rgb(colour(".mk-walls", "stroke")), trail: rgb(colour(".mk-trail", "stroke")) };
  });
}

/** The surface the wood is drawn as (`BoardFrame`'s own mark), by name. */
const frameName = (page: Page, scope: string) => page.getByTestId(scope).locator('[data-testid="board-surface"]').getAttribute("data-surface", { timeout: 10_000 });

async function openChooser(page: Page) {
  await page.getByTestId("meikyuu-colours").click();
  await expect(page.getByTestId("meikyuu-colours-dialog")).toBeVisible();
}

async function openSetUp(page: Page) {
  await page.goto(`${AT}/new`);
  await ready(page, "puzzle-set-up");
  await ready(page, "meikyuu-colours");
  await expect(page.getByTestId("meikyuu-preview-maze").locator("svg")).toBeVisible();
}

test("a ready-made set recolours the set-up's maze and its frame, and it is kept for the next page and the account", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "set");
  try {
    await openSetUp(page);
    // As it has always been: cream paper, ink walls, the plain wood.
    expect(await drawnColours(page, "meikyuu-preview-maze")).toMatchObject({ paper: "#fbf8f1", wall: "#1f2320" });
    expect(await frameName(page, "meikyuu-preview-maze")).toBe("Kaya");
    const boxBefore = await page.getByTestId("meikyuu-preview").boundingBox();

    await openChooser(page);
    // The press is kept on the account with one write; the page waits for it to land before it is left.
    const kept = page.waitForResponse((answer) => answer.url().includes("/api/me") && answer.request().method() === "PATCH" && (answer.request().postData() ?? "").includes("meikyuuFrame"));
    await page.getByTestId("meikyuu-theme-candy").click();
    expect((await kept).status()).toBe(200);
    await expect(page.getByTestId("meikyuu-theme-candy")).toHaveAttribute("data-chosen", "true");
    await page.getByTestId("meikyuu-colours-done").click();
    await expect(page.getByTestId("meikyuu-colours-dialog")).toHaveCount(0);
    expect(await drawnColours(page, "meikyuu-preview-maze")).toMatchObject({ paper: PAPERS.blush.colour });
    expect(await frameName(page, "meikyuu-preview-maze")).toBe("Pink");
    // Colours moved nothing: the preview's box is the box it was.
    expect(await page.getByTestId("meikyuu-preview").boundingBox()).toEqual(boxBefore);

    // Kept: the next page, which is a new load, draws the same colours, the device holds them, and so does the account.
    await page.goto(`${AT}/play?size=1&level=easy&seed=2`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
    expect(await drawnColours(page)).toMatchObject({ paper: PAPERS.blush.colour });
    expect(await frameName(page, "puzzle-grid")).toBe("Pink");
    expect(await page.evaluate((key) => window.localStorage.getItem(key), LOOK_STORAGE)).toContain('"paper":"blush"');
    await expect.poll(async () => keptPreferences(email), { timeout: 10_000 }).toMatchObject({ meikyuuFrame: "pink", meikyuuPaper: "blush", meikyuuInk: "berry" });
  } finally {
    await context.close();
    await removeMember(email);
  }
});

test("the swatches mix a look of one's own, a choice that would be hard to see is adjusted and said so, and Reset puts it back", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "own");
  try {
    await openSetUp(page);
    await openChooser(page);
    // Dark navy walls on a midnight background: left as chosen they could not be seen.
    await page.getByTestId("meikyuu-paper-midnight").click();
    await page.getByTestId("meikyuu-ink-navy").click();
    await page.getByTestId("meikyuu-frame-teal").click();
    await expect(page.getByTestId("meikyuu-look-adjusted")).toHaveAttribute("data-adjusted", "true");
    await expect(page.getByTestId("meikyuu-look-adjusted")).toContainText("easy to see");
    await page.getByTestId("meikyuu-colours-done").click();
    const drawn = await drawnColours(page, "meikyuu-preview-maze");
    expect(drawn.paper).toBe(PAPERS.midnight.colour);
    // What is drawn passes the rule the brief sets, whatever was pressed: the walls 4.5:1 on the paper, the line 3:1 on the paper and on the walls.
    expect(contrast(drawn.wall!, drawn.paper!)).toBeGreaterThanOrEqual(LOOK_RULES.wall);
    expect(contrast(drawn.trail ?? drawn.wall!, drawn.paper!)).toBeGreaterThanOrEqual(LOOK_RULES.trail);
    expect(await frameName(page, "meikyuu-preview-maze")).toBe("Teal");

    // Reset: the maze, the wood and the device's memory are as they were.
    await openChooser(page);
    await page.getByTestId("meikyuu-colours-reset").click();
    await page.getByTestId("meikyuu-colours-done").click();
    expect(await drawnColours(page, "meikyuu-preview-maze")).toMatchObject({ paper: "#fbf8f1", wall: "#1f2320" });
    expect(await frameName(page, "meikyuu-preview-maze")).toBe("Kaya");
    expect(await page.evaluate((key) => window.localStorage.getItem(key), LOOK_STORAGE)).toBeNull();
  } finally {
    await context.close();
    await removeMember(email);
  }
});

test("a level is played, solved and its finished page drawn in the colours chosen, and the wallpaper wears them", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "play");
  try {
    await page.goto(`${AT}/play?size=1&level=easy&seed=3`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("meikyuu-board").locator("svg")).toBeVisible();
    // Chosen before playing, on the play screen itself: the line is drawn in the new line colour as it goes.
    await openChooser(page);
    await page.getByTestId("meikyuu-theme-forest").click();
    await page.getByTestId("meikyuu-colours-done").click();
    const placed = await placedMaze(page);
    await drawThrough(page, placed, wayThrough(placed));
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    expect(await drawnColours(page)).toMatchObject({ paper: PAPERS.mint.colour });

    // After finishing: changed again, on the solved level.
    await openChooser(page);
    await page.getByTestId("meikyuu-theme-sunset").click();
    await page.getByTestId("meikyuu-colours-done").click();
    expect(await drawnColours(page)).toMatchObject({ paper: PAPERS.peach.colour });

    // The wallpaper is the board as it is drawn now: its picture is not the cream one.
    await page.getByTestId("open-board-wallpaper").click();
    const picture = page.getByTestId("mosaic-dialog").getByTestId("mosaic-picture");
    await expect(picture).toBeVisible({ timeout: 30_000 });
    const middle = await picture.evaluate(async (img: HTMLImageElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context2d = canvas.getContext("2d")!;
      context2d.drawImage(img, 0, 0);
      // A corner of the paper, inside the frame and clear of the walls, as a share of the picture.
      const x = Math.floor(img.naturalWidth * 0.5);
      const y = Math.floor(img.naturalHeight * 0.5);
      return Array.from(context2d.getImageData(x, y, 1, 1).data.slice(0, 3));
    });
    // Peach (255, 227, 207) or the line and walls on it: never the cream (251, 248, 241) the maze wore.
    expect(Math.abs(middle[2]! - 241), "the wallpaper was drawn on the cream paper").toBeGreaterThan(8);
    await page.getByTestId("close-mosaic").click();

    // And the page of this solve, which is another page and another load: the same colours, and the chooser there too.
    await page.goto(mySolvePath("meikyuu", await newestSolveOf(email, "meikyuu")));
    await ready(page, "solve-board");
    await expect(page.getByTestId("meikyuu-still")).toHaveAttribute("data-drawn", "true");
    expect(await drawnColours(page, "meikyuu-still")).toMatchObject({ paper: PAPERS.peach.colour });
    expect(await frameName(page, "meikyuu-still")).toBe("Orange");
    await expect(page.getByTestId("meikyuu-colours")).toBeVisible();
  } finally {
    await context.close();
    await removeMember(email);
  }
});

test("in Just the board the chooser is one press away, opens over the board and closes on Esc without leaving the mode", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "bare");
  try {
    await page.goto(`${AT}/play?size=1&level=easy&seed=4`);
    await ready(page, "puzzle-play");
    await ready(page, "bare-board");
    await page.getByTestId("bare-board-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
    const button = page.getByTestId("meikyuu-colours");
    await expect(button).toBeVisible();
    const box = await page.getByTestId("meikyuu-board").boundingBox();
    await button.click();
    await page.getByTestId("meikyuu-theme-ocean").click();
    expect(await drawnColours(page)).toMatchObject({ paper: PAPERS.sky.colour });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("meikyuu-colours-dialog")).toHaveCount(0);
    // The mode is still on, and the board is where it was.
    await expect(page.locator("html")).toHaveAttribute("data-bare", "true");
    expect(await page.getByTestId("meikyuu-board").boundingBox()).toEqual(box);
  } finally {
    await context.close();
    await removeMember(email);
  }
});

test("the chooser fits a phone: the window and every swatch can be reached with nothing scrolling sideways", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "phone", 390);
  try {
    await openSetUp(page);
    await openChooser(page);
    const dialog = page.getByTestId("meikyuu-colours-dialog");
    const fit = await dialog.evaluate((element) => ({ across: element.scrollWidth <= element.clientWidth, within: element.getBoundingClientRect().right <= window.innerWidth }));
    expect(fit).toEqual({ across: true, within: true });
    // A fingertip: every swatch is at least 36 pixels each way, and the last one is reachable by scrolling the window.
    const swatch = page.getByTestId("meikyuu-ink-sun");
    await swatch.scrollIntoViewIfNeeded();
    const size = await swatch.boundingBox();
    expect(Math.min(size!.width, size!.height)).toBeGreaterThanOrEqual(36);
    await swatch.click();
    await expect(swatch).toHaveAttribute("data-chosen", "true");
  } finally {
    await context.close();
    await removeMember(email);
  }
});

test("the colours follow the account to a device with nothing stored, and a device that refuses storage still draws and changes them", async ({ browser, baseURL }) => {
  const { context, page, email } = await aMember(browser, baseURL, "device");
  let other: BrowserContext | null = null;
  try {
    await openSetUp(page);
    await openChooser(page);
    const kept = page.waitForResponse((answer) => answer.url().includes("/api/me") && answer.request().method() === "PATCH" && (answer.request().postData() ?? "").includes("meikyuuFrame"));
    await page.getByTestId("meikyuu-theme-forest").click();
    expect((await kept).status()).toBe(200);

    // Another device: the same member, a browser that has never seen the chooser, and one that refuses to store anything.
    other = await memberContext(browser, baseURL!, { email, name: "Meikyuu Painter" }, { viewport: { width: 1280, height: 1100 } });
    await other.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("denied", "SecurityError");
        },
      });
    });
    const away = await other.newPage();
    await openSetUp(away);
    expect(await drawnColours(away, "meikyuu-preview-maze")).toMatchObject({ paper: PAPERS.mint.colour });
    expect(await frameName(away, "meikyuu-preview-maze")).toBe("Green");
    // And a choice there is drawn at once, kept on the account, and not a crash for want of storage.
    await openChooser(away);
    await away.getByTestId("meikyuu-theme-bright").click();
    expect(await drawnColours(away, "meikyuu-preview-maze")).toMatchObject({ paper: PAPERS.butter.colour });
    await expect.poll(async () => keptPreferences(email), { timeout: 10_000 }).toMatchObject({ meikyuuPaper: "butter" });
  } finally {
    await other?.close();
    await context.close();
    await removeMember(email);
  }
});
