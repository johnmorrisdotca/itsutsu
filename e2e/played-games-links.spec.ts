import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { makeMemberId } from "../src/lib/auth/memberId";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_SPECS } from "../src/lib/puzzles/puzzles.constants";
import { clockText } from "../src/lib/puzzles/clockText";
import { freshPuzzleSeed, ready } from "./support";

/**
 * EVERY FIGURE ABOUT PLAYING LEADS TO THE PLAYING. John, 2026-09-26, on Hidden
 * Stones' standings — a points board and the fastest times ("5x5 easy 2:41
 * John M."): "No way to view played games.. clicking a name takes us to
 * profile and no links to the Game Played History viewer. Look throughout all
 * our games pages, and make sure there are ways to view historic, played,
 * past, friend, etc games."
 *
 * Each case CLICKS the figure a reader would click and asserts where it lands
 * and what that page says it was narrowed to. The spec brings its own world —
 * an adult, Ann, and a child, Kim, with solves, games and a news line of their
 * own — and takes it all away in `finally`. It asserts nothing about a row it
 * did not make: every row is found by its own id.
 */

process.loadEnvFile(".env");
const prisma = new PrismaClient();

test.afterAll(async () => {
  await prisma.$disconnect();
});

const SLUG = PUZZLE_SLUGS.hiddenStones;
const DAY_MS = 86_400_000;

type World = {
  ann: { id: string; name: string };
  kim: { id: string; name: string };
  solves: string[];
  games: string[];
  news: string[];
};

async function makeWorld(): Promise<World> {
  const stamp = Date.now().toString(36);
  const person = (name: string, ageBand: string) => ({
    id: makeMemberId(),
    email: `played-${name.toLowerCase()}-${stamp}@example.test`,
    name: `${name}${stamp} Played`,
    picture: "",
    invitedWith: "playwright",
    ageBand,
  });
  const ann = person("Ann", "18_plus");
  const kim = person("Kim", "under_13");
  await prisma.member.createMany({ data: [ann, kim] });
  return { ann, kim, solves: [], games: [], news: [] };
}

async function unmakeWorld(world: World): Promise<void> {
  await prisma.siteNews.deleteMany({ where: { id: { in: world.news } } });
  await prisma.puzzleSolve.deleteMany({ where: { OR: [{ id: { in: world.solves } }, { memberId: { in: [world.ann.id, world.kim.id] } }] } });
  await prisma.game.deleteMany({ where: { id: { in: world.games } } });
  await prisma.member.deleteMany({ where: { id: { in: [world.ann.id, world.kim.id] } } });
}

/**
 * A size Hidden Stones is still made at but no longer offered (`PUZZLE_SPECS`),
 * so nobody can play one: the fastest board shows its row only while somebody
 * holds a time there, and the only times there are this file's. A spec that
 * reads a rank on the board brings its own board this way — on 5×5, another
 * spec's solve in 300 ms pushed this file's off the top ten.
 */
const OWN_SIZE = 6;

/** A kept Hidden Stones solve of a real grid, as `/api/puzzles/solved` keeps one. */
async function solveOf(
  world: World,
  memberId: string,
  { elapsedMs, points, daysAgo, seed = freshPuzzleSeed(), size = 5 }: { elapsedMs: number; points: number; daysAgo: number; seed?: number; size?: number },
) {
  const puzzle = generatePuzzle("hiddenStones", size, "easy", seed);
  const row = await prisma.puzzleSolve.create({
    data: {
      memberId,
      kind: "hiddenStones",
      size,
      level: "easy",
      givens: puzzle.givens,
      answer: puzzle.solution,
      elapsedMs,
      points,
      checksUsed: 0,
      hintsUsed: 0,
      pausedMs: 0,
      finishedAt: new Date(Date.now() - daysAgo * DAY_MS),
    },
    select: { id: true },
  });
  world.solves.push(row.id);
  return { id: row.id, seed, puzzle };
}

test("a puzzle's standings lead to each solve, to the solves a score was made of, and to every solve at a size", async ({ page }) => {
  const world = await makeWorld();
  try {
    // Still made and never offered: if that changes, pick another size nobody can play.
    expect(PUZZLE_SPECS.hiddenStones.sizes).toContain(OWN_SIZE);
    expect(PUZZLE_SPECS.hiddenStones.offered).not.toContain(OWN_SIZE);
    // On a board of their own (`OWN_SIZE`), so both are on it whatever other specs have solved.
    const fast = 1_000 + Math.floor(Math.random() * 400);
    const best = await solveOf(world, world.ann.id, { elapsedMs: fast, points: 12_000, daysAgo: 1, size: OWN_SIZE });
    await solveOf(world, world.ann.id, { elapsedMs: 90_000, points: 11_000, daysAgo: 2, size: OWN_SIZE });
    const child = await solveOf(world, world.kim.id, { elapsedMs: fast + 1, points: 1, daysAgo: 1, size: OWN_SIZE });

    // The time on the fastest board opens that solve, as it ended, and says whose it was.
    await page.goto(`/games/${SLUG}/standings`);
    const time = page.locator(`[data-testid="puzzle-fastest-time"][data-solve="${best.id}"]`);
    await expect(time).toHaveText(clockText(fast));
    await time.click();
    await expect(page).toHaveURL(new RegExp(`/games/${SLUG}/history/${best.id}$`));
    const shown = page.getByTestId("solve-page");
    await expect(shown).toHaveAttribute("data-own", "false");
    await expect(shown).toHaveAttribute("data-kept", "true");
    await expect(page.getByTestId("solve-solver")).toContainText(world.ann.name.split(" ")[0]!);
    await expect(page.getByTestId("solve-time")).toHaveText(clockText(fast));

    // And on from the solve to every solve of theirs, narrowed and saying so.
    await page.getByTestId("solve-their-solves").click();
    await expect(page).toHaveURL(new RegExp(`/games/${SLUG}/history\\?member=${world.ann.id}$`));
    await expect(page.locator('[data-testid="record-narrowing"][data-narrowing="member"]')).toBeVisible();
    await expect(page.getByTestId("record-solve")).toHaveCount(2);
    await expect(page.locator(`[data-testid="record-solve"]:not([data-member="${world.ann.id}"])`)).toHaveCount(0);
    await expect(page.getByTestId("record-tally")).toHaveAttribute("data-points", "23000");

    // The way back: the chip takes the narrowing off, and the record is everybody's again.
    await page.locator('[data-testid="record-narrowing"][data-narrowing="member"]').click();
    await expect(page).toHaveURL(new RegExp(`/games/${SLUG}/history$`));
    await expect(page.getByTestId("record-sort")).toBeVisible();
    await expect(page.getByTestId("record-narrowed")).toHaveCount(0);
    await expect(page.locator(`[data-testid="record-solve"][data-solve="${best.id}"]`)).toBeVisible();
    // A child's solves are in the record as a child's games are in theirs: for members.
    await expect(page.locator(`[data-testid="record-solve"][data-solve="${child.id}"]`)).toBeVisible();

    // A points figure opens the solves it is the sum of, and the page prints the same sum.
    await page.goto(`/games/${SLUG}/standings`);
    const figure = page.locator(`[data-testid="puzzle-points-all"] [data-testid="puzzle-points-row"][data-member="${world.ann.id}"] [data-testid="puzzle-points-figure"]`);
    await expect(figure).toHaveText("23,000");
    await figure.click();
    await expect(page).toHaveURL(new RegExp(`member=${world.ann.id}`));
    await expect(page.getByTestId("record-tally")).toHaveAttribute("data-points", "23000");
    await expect(page.getByTestId("record-solve-counted")).toHaveCount(2);

    // A size and level on the fastest board opens every solve at it, fastest first.
    await page.goto(`/games/${SLUG}/standings`);
    await page.locator(`[data-testid="puzzle-fastest-row"][data-size="${OWN_SIZE}"][data-level="easy"] [data-testid="puzzle-fastest-every"]`).click();
    await expect(page).toHaveURL(new RegExp(`size=${OWN_SIZE}&level=easy&sort=fastest`));
    await expect(page.locator('[data-testid="record-narrowing"][data-narrowing="sort"]')).toContainText("fastest first");
    await expect(page.locator('[data-testid="record-narrowing"][data-narrowing="size"]')).toBeVisible();

    // The child's time opens their solve too, to a member, as a child's finished game does.
    await page.goto(`/games/${SLUG}/standings`);
    await page.locator(`[data-testid="puzzle-fastest-time"][data-solve="${child.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/games/${SLUG}/history/${child.id}$`));
    await expect(page.getByTestId("solve-solver")).toContainText(world.kim.name.split(" ")[0]!);
  } finally {
    await unmakeWorld(world);
  }
});

test("somebody else's solve of today is kept back until the reader has finished that grid", async ({ page }) => {
  const world = await makeWorld();
  try {
    const today = await solveOf(world, world.ann.id, { elapsedMs: 2_000_000, points: 10, daysAgo: 0 });

    await page.goto(`/games/${SLUG}/history?member=${world.ann.id}`);
    await page.locator(`[data-testid="record-solve"][data-solve="${today.id}"] [data-testid="record-solve-time"]`).click();
    await expect(page).toHaveURL(new RegExp(`/history/${today.id}$`));
    await expect(page.getByTestId("solve-page")).toHaveAttribute("data-kept", "false");
    await expect(page.getByTestId("solve-kept-back")).toBeVisible();

    // The reader finishes the same grid, and the answer is theirs to compare with.
    const handed = await page.request.post("/api/puzzles/solved", {
      data: { kind: "hiddenStones", size: 5, level: "easy", seed: today.seed, givens: today.puzzle.givens, answer: today.puzzle.solution, elapsedMs: 95_000 },
    });
    expect(handed.ok()).toBe(true);
    await page.goto(`/games/${SLUG}/history?member=${world.ann.id}`);
    await page.locator(`[data-testid="record-solve"][data-solve="${today.id}"] [data-testid="record-solve-time"]`).click();
    await expect(page).toHaveURL(new RegExp(`/history/${today.id}$`));
    await expect(page.getByTestId("solve-page")).toHaveAttribute("data-kept", "true");
    await expect(page.getByTestId("solve-kept-back")).toHaveCount(0);

    // And the reader's own day of puzzles, on their feed, leads to their solves of it.
    await page.goto("/feed");
    await ready(page, "tabs");
    const line = page.locator(`[data-testid="feed-entry"][data-kind="puzzles"]`).filter({ has: page.locator(`a[href^="/games/${SLUG}/history?member="]`) }).first();
    await line.getByTestId("feed-solves").click();
    await expect(page).toHaveURL(new RegExp(`/games/${SLUG}/history\\?member=`));
    await expect(page.locator('[data-testid="record-narrowing"][data-narrowing="member"]')).toContainText("Your solves");
  } finally {
    await prisma.puzzleSolve.deleteMany({ where: { kind: "hiddenStones", elapsedMs: 95_000, finishedAt: { gte: new Date(Date.now() - DAY_MS) } } });
    await unmakeWorld(world);
  }
});

test("a player's page leads to their games finished and going, the games with the reader, and their puzzles", async ({ page }) => {
  const world = await makeWorld();
  try {
    await solveOf(world, world.ann.id, { elapsedMs: 70_000, points: 100, daysAgo: 1 });
    const operator = await prisma.member.findUnique({ where: { email: "operator@example.test" }, select: { id: true, name: true } });
    expect(operator, "the suite's operator has a member row").not.toBeNull();
    const at = new Date(Date.now() - 60 * 60_000);
    const game = async (suffix: string, status: "finished" | "active") => {
      const id = `pg${Date.now().toString(36).slice(-5)}-${suffix}`;
      await prisma.game.create({
        data: {
          id,
          variant: "freestyle",
          size: 15,
          winLength: 5,
          obstacles: "none",
          opener: "black",
          status,
          result: status === "finished" ? "black" : "abandoned",
          winner: status === "finished" ? "black" : null,
          playedAt: at,
          lastMoveAt: at,
          moveCount: 9,
          rated: false,
          blackName: world.ann.name,
          blackMemberId: world.ann.id,
          whiteName: operator!.name,
          whiteMemberId: operator!.id,
          blackClaimedAt: at,
          whiteClaimedAt: at,
        },
      });
      world.games.push(id);
      return id;
    };
    const finished = await game("f", "finished");
    const going = await game("a", "active");

    await page.goto(`/players/${world.ann.id}`);
    await page.locator('[data-testid="player-puzzle"][data-kind="hiddenStones"] [data-testid="player-puzzle-solves"]').click();
    await expect(page).toHaveURL(new RegExp(`/games/${SLUG}/history\\?member=${world.ann.id}$`));
    await expect(page.getByTestId("record-solve")).toHaveCount(1);

    await page.goto(`/players/${world.ann.id}`);
    await page.locator(`[data-testid="player-going-game"][data-game="${going}"] [data-testid="player-going-watch"]`).click();
    // A game going opens at its current move: the match, or the match at a move number.
    await expect(page).toHaveURL(new RegExp(`/match/${going}(/\\d+)?$`));

    await page.goto(`/players/${world.ann.id}`);
    await page.getByTestId("player-all-games").click();
    await expect(page).toHaveURL(new RegExp(`/history\\?member=${world.ann.id}$`));
    await expect(page.locator('[data-testid="history-narrowing"][data-narrowing="player"]')).toBeVisible();
    await expect(page.locator(`a[href$="/match/${finished}"]`).first()).toBeVisible();

    await page.goto(`/players/${world.ann.id}`);
    await page.getByTestId("player-games-together").click();
    await expect(page).toHaveURL(new RegExp(`against=${world.ann.id}`));
    await expect(page.locator('[data-testid="history-narrowing"][data-narrowing="against"]')).toBeVisible();
    await expect(page.locator(`a[href$="/match/${finished}"]`).first()).toBeVisible();

    // A child's page shows their games and puzzles to members, as it shows their record.
    await page.goto(`/players/${world.kim.id}`);
    await expect(page.getByTestId("player-all-games")).toBeVisible();
    await expect(page.getByTestId("player-puzzles-none")).toBeVisible();
  } finally {
    await unmakeWorld(world);
  }
});

test("a best time on the feed opens the solve it was, and a game's IP opens the games that paid it", async ({ page }) => {
  const world = await makeWorld();
  try {
    const ms = 1_500 + Math.floor(Math.random() * 400);
    const best = await solveOf(world, world.ann.id, { elapsedMs: ms, points: 100, daysAgo: 0.01 });
    const told = await prisma.siteNews.create({ data: { kind: "bestTime", memberId: world.ann.id, variant: "hiddenStones", subject: `5:easy:${ms}` }, select: { id: true } });
    world.news.push(told.id);

    await page.goto("/feed?view=everyone");
    await ready(page, "tabs");
    const time = page.locator(`[data-testid="feed-entry"][data-id="news:${told.id}"] [data-testid="feed-time"]`);
    await expect(time).toHaveAttribute("data-solve", best.id);
    await time.click();
    await expect(page).toHaveURL(new RegExp(`/games/${SLUG}/history/${best.id}$`));
    await expect(page.getByTestId("solve-time")).toHaveText(clockText(ms));

    // A game's IP board: the figure opens that game's record, the games that paid Ann, this month.
    const at = new Date();
    const id = `pg${Date.now().toString(36).slice(-5)}-ip`;
    await prisma.game.create({
      data: {
        id, variant: "freestyle", size: 15, winLength: 5, obstacles: "none", opener: "black", status: "finished", result: "black", winner: "black",
        playedAt: at, lastMoveAt: at, moveCount: 9, rated: false, blackName: world.ann.name, blackMemberId: world.ann.id, whiteName: "Nobody", blackPoints: 900_000,
      },
    });
    world.games.push(id);
    await page.goto("/games/gomoku");
    const figure = page.locator(`[data-testid="ip-board-month"] [data-testid="ip-row"][data-member="${world.ann.id}"] [data-testid="ip-row-figure"]`);
    await expect(figure).toHaveText("900,000");
    await figure.click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/history\\?member=${world.ann.id}&ip=paid&month=\\d{4}-\\d{2}$`));
    await expect(page.locator('[data-testid="history-narrowing"][data-narrowing="ip"]')).toHaveText(/Paid IP/);
    await expect(page.locator('[data-testid="history-narrowing"][data-narrowing="month"]')).toHaveText(/Finished in/);
    await expect(page.locator(`a[href$="/match/${id}"]`).first()).toBeVisible();

    // And this week's board: the same figure opens the games of this week alone, never the whole month's.
    await page.goto("/games/gomoku");
    const weekly = page.locator(`[data-testid="ip-board-week"] [data-testid="ip-row"][data-member="${world.ann.id}"] [data-testid="ip-row-figure"]`);
    await expect(weekly).toHaveText("900,000");
    await weekly.click();
    await expect(page).toHaveURL(new RegExp(`/games/gomoku/history\\?member=${world.ann.id}&ip=paid&week=\\d{4}-\\d{2}-\\d{2}$`));
    await expect(page.locator('[data-testid="history-narrowing"][data-narrowing="week"]')).toHaveText(/Finished in the week of/);
    await expect(page.locator(`a[href$="/match/${id}"]`).first()).toBeVisible();
  } finally {
    await unmakeWorld(world);
  }
});
