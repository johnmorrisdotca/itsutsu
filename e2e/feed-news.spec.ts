import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import { GAME_ADDED } from "../src/lib/catalogue/gameAdded.data";
import { ready } from "./support";

/**
 * THE SITE'S NEWS ON THE EVERYONE TAB (John, 2026-09-26): a game played for
 * the first time, a new leader, a top computer grade beaten, a first win or
 * loss, a new best time — and the day's new games in one line.
 *
 * THE AGE RULE, read the way a member meets it. The spec brings its own world:
 * two adults (Ann, Bo), a teenager (Tia) and a child (Kim), two finished games
 * and a news row of every kind, each written as the live writers write them.
 * On the Everyone tab the adults are named; a line whose person is under 18
 * is either said without them or not drawn, and neither young name appears
 * anywhere on the page. Every absence is asserted after a presence beside it
 * has been waited for. Everything the spec made goes in `finally`.
 */

process.loadEnvFile(".env");
const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

const TOP_GRADE = "guoshou";
const TOP_PROGRAM = "Guoshou";

test("the Everyone tab tells the site's news, and names nobody under 18", async ({ page }) => {
  const stamp = Date.now().toString(36);
  const person = (name: string, ageBand: string) => ({
    id: makeMemberId(),
    email: `news-${name.toLowerCase()}-${stamp}@example.test`,
    name: `${name}${stamp} News`,
    picture: "",
    invitedWith: "playwright",
    ageBand,
  });
  const ann = person("Ann", "18_plus");
  const bo = person("Bo", "18_plus");
  const tia = person("Tia", "13_17");
  const kim = person("Kim", "under_13");
  const members = [ann, bo, tia, kim];
  const games: string[] = [];
  const news: string[] = [];

  const game = async (suffix: string, black: typeof ann, white: typeof ann) => {
    const id = `news-${stamp}-${suffix}`;
    const at = new Date(Date.now() - 60 * 60_000);
    await prisma.game.create({
      data: {
        id,
        variant: "freestyle",
        size: 15,
        winLength: 5,
        obstacles: "none",
        opener: "black",
        status: "finished",
        result: "black",
        winner: "black",
        playedAt: at,
        lastMoveAt: at,
        moveCount: 9,
        blackName: black.name,
        blackMemberId: black.id,
        whiteName: white.name,
        whiteMemberId: white.id,
      },
    });
    games.push(id);
    return id;
  };
  const tell = async (kind: string, memberId: string | null, variant: string, subject: string, gameId: string | null) => {
    const row = await prisma.siteNews.create({ data: { kind, memberId, variant, subject, gameId } });
    news.push(row.id);
    return `news:${row.id}`;
  };

  try {
    await prisma.member.createMany({ data: members });
    const adults = await game("adults", ann, bo);
    const young = await game("young", kim, ann);

    /* Subjects carry the stamp where the reader does not read them, so no row
       here can collide with a fact another run already told. */
    const firstNamed = await tell("firstGameOfGame", ann.id, "freestyle", `a${stamp}`, adults);
    const firstNameless = await tell("firstGameOfGame", kim.id, "freestyle", `b${stamp}`, young);
    const placeAnn = await tell("tookFirstPlace", ann.id, "reversi", `c${stamp}`, adults);
    const placeTia = await tell("tookFirstPlace", tia.id, "reversi", `d${stamp}`, adults);
    const winAnn = await tell("firstWin", ann.id, "", `e${stamp}`, adults);
    const lossTia = await tell("firstLoss", tia.id, "", `f${stamp}`, young);
    const ms = 60_000 + (Date.now() % 50_000);
    const bestAnn = await tell("bestTime", ann.id, "numberPlace", `9:hard:${ms}`, null);
    const bestKim = await tell("bestTime", kim.id, "numberPlace", `9:hard:${ms - 1}`, null);
    // The grade's fact is unique per game; a game nobody has told it for yet.
    const told = await prisma.siteNews.findMany({ where: { kind: "hardBotBeaten", subject: TOP_GRADE }, select: { variant: true } });
    const taken = new Set(told.map((row) => row.variant));
    const [open1, open2] = ["connect6", "renju", "caro", "omok", "freestyle", "standard"].filter((variant) => !taken.has(variant));
    const botAnn = await tell("hardBotBeaten", ann.id, open1 as string, TOP_GRADE, null);
    const botKim = await tell("hardBotBeaten", kim.id, open2 as string, TOP_GRADE, null);

    await page.goto("/feed?view=everyone");
    await ready(page, "tabs");
    const panel = page.getByTestId("feed-panel");
    await expect(panel).toHaveAttribute("data-tab", "everyone");
    const line = (id: string) => panel.locator(`[data-testid="feed-entry"][data-id="${id}"]`);
    const first = (name: string) => name.split(" ")[0] as string;

    // A game's first game between adults: both named, and it stands for the game's own line.
    await expect(line(firstNamed)).toHaveAttribute("data-named", "true");
    await expect(line(firstNamed).getByTestId("feed-sentence")).toContainText("was played here for the first time");
    await expect(line(firstNamed).getByTestId("feed-who")).toContainText(first(ann.name));
    await expect(line(firstNamed).getByTestId("feed-other")).toContainText(first(bo.name));
    await expect(line(firstNamed).getByTestId("game-name")).toHaveAttribute("href", /\/games\//);
    await expect(line(firstNamed).getByTestId("feed-open")).toHaveAttribute("href", new RegExp(adults));
    await expect(panel.locator(`[data-testid="feed-entry"][data-game-id="${adults}"]`)).toHaveCount(0);

    // The same news with a child in it: said, and nobody named.
    await expect(line(firstNameless)).toHaveAttribute("data-named", "false");
    await expect(line(firstNameless).getByTestId("feed-sentence")).toHaveText(/was played here for the first time$/);
    await expect(line(firstNameless).getByTestId("feed-who")).toHaveCount(0);

    // First place, a first win: the adult's lines are there; the teenager's are not drawn at all.
    await expect(line(placeAnn).getByTestId("feed-sentence")).toContainText("took first place at");
    await expect(line(placeAnn).getByTestId("feed-open")).toHaveAttribute("href", /\/games\/[^/]+\/standings/);
    await expect(line(winAnn).getByTestId("feed-sentence")).toContainText("first win here");
    await expect(line(placeTia)).toHaveCount(0);
    await expect(line(lossTia)).toHaveCount(0);

    // A top grade beaten: the adult named; the child's win said with only the program named.
    await expect(line(botAnn).getByTestId("feed-who")).toContainText(first(ann.name));
    await expect(line(botAnn).getByTestId("feed-other")).toContainText(TOP_PROGRAM);
    await expect(line(botKim)).toHaveAttribute("data-named", "false");
    await expect(line(botKim).getByTestId("feed-sentence")).toContainText("was beaten at");
    await expect(line(botKim).getByTestId("feed-who")).toHaveCount(0);
    await expect(line(botKim).getByTestId("feed-other")).toContainText(TOP_PROGRAM);

    // Best times: the adult's with her name, the child's with the time alone.
    await expect(line(bestAnn).getByTestId("feed-who")).toContainText(first(ann.name));
    await expect(line(bestAnn).getByTestId("feed-sentence")).toContainText("9×9 hard");
    await expect(line(bestAnn).getByTestId("feed-time")).toHaveText(/^\d+:\d\d$/);
    await expect(line(bestKim)).toHaveAttribute("data-named", "false");
    await expect(line(bestKim).getByTestId("feed-time")).toBeVisible();
    await expect(line(bestKim).getByTestId("feed-who")).toHaveCount(0);

    // Neither young member's name is anywhere on the tab, having waited for the lines above.
    await expect(panel).not.toContainText(first(tia.name));
    await expect(panel).not.toContainText(first(kim.name));

    // The new games: one line a day for the days in the window, the opening day left out.
    const days = [...new Set(Object.values(GAME_ADDED))].sort();
    const since = new Date(Date.now() - 60 * 24 * 60 * 60_000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const expected = new Set(days.slice(1).filter((day) => day >= since && day <= today).map((day) => `added:${day}`));
    const shown = await panel.locator('[data-kind="added"]').evaluateAll((lines) => lines.map((one) => one.getAttribute("data-id")));
    for (const id of shown) expect(expected.has(id ?? ""), `${id} is not a day games arrived`).toBe(true);
    for (const id of shown) {
      const day = panel.locator(`[data-id="${id}"]`);
      const named = Object.entries(GAME_ADDED).filter(([, when]) => `added:${when}` === id).length;
      await expect(day.getByTestId("feed-added-game")).toHaveCount(named);
      await expect(day.getByTestId("feed-added-game").getByTestId("game-name").first()).toHaveAttribute("href", /\/games\//);
    }
    const entries = await panel.getByTestId("feed-entry").count();
    if (entries < 60) expect(shown.length, "every day in the window, when the page has room").toBe(expected.size);
  } finally {
    await prisma.siteNews.deleteMany({ where: { id: { in: news } } });
    await prisma.game.deleteMany({ where: { id: { in: games } } });
    await prisma.member.deleteMany({ where: { id: { in: members.map((member) => member.id) } } });
  }
});
