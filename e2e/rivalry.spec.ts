import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { isLocalDatabase } from "../src/lib/db/localDatabase";
import { RULE_VARIANT_DISPLAY } from "../src/lib/gomoku/variants.constants";
import { memberContext, memberIdFor, removeMember, seedMember } from "./members";
import { ready } from "./support";
import { gamesMade } from "./tidy";

/**
 * The rivalry scoreboard: above a pair's record, before a match, and after one.
 *
 * THE SPEC BRINGS ITS OWN WORLD. Two members invented for this run and eight
 * games between them written straight to the database, all taken away when it
 * finishes. Nothing here reads a row it did not make, and nobody real is on
 * either seat — so the scores it asserts are true of this run and no other.
 *
 * The world, from Kaito's side:
 *
 *   five in a row (gomoku)   Kaito won · Sora won · Kaito won · drawn · abandoned
 *   renju                    Sora won
 *   still to play            a game of five in a row, and a game of tic-tac-toe
 *
 * So at five in a row Kaito leads 2–1 with a draw in 4 decided games — the
 * abandoned one is in the record's list and never in the score — and across
 * every game they are level, 2–2. Tic-tac-toe they have never played.
 *
 * Unrated, so no rating rows outlive the games. Signed in as the operator the
 * reader is neither of the two, which is the "names, not you" case; the "you"
 * cases sign in as Kaito and as Sora.
 */

type Seed = {
  key: string;
  variant: "freestyle" | "renju" | "tictactoe";
  black: "kaito" | "sora";
  result: "black" | "white" | "draw" | "abandoned";
  daysAgo: number;
  active?: boolean;
};

const DAY = 24 * 60 * 60 * 1000;

test.describe("a rivalry scoreboard", () => {
  const mine = gamesMade();
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const kaito = { email: `rival-kaito-${stamp}@example.test`, name: `Kaito${stamp}` };
  const sora = { email: `rival-sora-${stamp}@example.test`, name: `Sora${stamp}` };
  const ids = { kaito: "", sora: "" };
  const games: Record<string, string> = {};

  test.beforeAll(async () => {
    process.loadEnvFile(".env");
    if (!isLocalDatabase(process.env.DATABASE_URL)) throw new Error("This spec writes games, and only to a database on this machine.");
    await seedMember(kaito);
    await seedMember(sora);
    ids.kaito = await memberIdFor(kaito.email);
    ids.sora = await memberIdFor(sora.email);

    const seeds: Seed[] = [
      { key: "kaito-wins", variant: "freestyle", black: "kaito", result: "black", daysAgo: 10 },
      { key: "sora-wins", variant: "freestyle", black: "sora", result: "black", daysAgo: 8 },
      { key: "kaito-wins-white", variant: "freestyle", black: "sora", result: "white", daysAgo: 6 },
      { key: "drawn", variant: "freestyle", black: "kaito", result: "draw", daysAgo: 4 },
      { key: "renju", variant: "renju", black: "sora", result: "black", daysAgo: 3 },
      { key: "abandoned", variant: "freestyle", black: "kaito", result: "abandoned", daysAgo: 2 },
      { key: "to-play", variant: "freestyle", black: "kaito", result: "abandoned", daysAgo: 0, active: true },
      { key: "never-played", variant: "tictactoe", black: "kaito", result: "abandoned", daysAgo: 0, active: true },
    ];
    const prisma = new PrismaClient();
    try {
      for (const seed of seeds) {
        const at = new Date(Date.now() - seed.daysAgo * DAY);
        const blackIsKaito = seed.black === "kaito";
        const id = mine(`rival-${seed.key}-${stamp}`);
        games[seed.key] = id;
        const small = seed.variant === "tictactoe";
        await prisma.game.create({
          data: {
            id,
            variant: seed.variant,
            size: small ? 3 : 15,
            winLength: small ? 3 : 5,
            obstacles: "none",
            opener: "black",
            status: seed.active ? "active" : "finished",
            result: seed.result,
            winner: seed.result === "black" || seed.result === "white" ? seed.result : null,
            rated: false,
            playedAt: at,
            lastMoveAt: seed.active ? null : at,
            moveCount: 0,
            blackName: blackIsKaito ? kaito.name : sora.name,
            blackMemberId: blackIsKaito ? ids.kaito : ids.sora,
            whiteName: blackIsKaito ? sora.name : kaito.name,
            whiteMemberId: blackIsKaito ? ids.sora : ids.kaito,
          },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  test.afterAll(async () => {
    await removeMember(kaito.email);
    await removeMember(sora.email);
  });

  const pairRecord = () => `/games/gomoku/history?member=${ids.kaito}&against=${ids.sora}`;

  /** The board has been drawn and taken over by the browser; everything after this reads a rendered board. */
  async function board(page: Page) {
    await ready(page, "rivalry");
    return {
      line: page.getByTestId("rivalry-line"),
      oneWins: page.getByTestId("rivalry-one-wins"),
      otherWins: page.getByTestId("rivalry-other-wins"),
    };
  }

  test("above a pair's record, every number opens exactly the games it counted", async ({ page }) => {
    await page.goto(pairRecord());
    const { line, oneWins, otherWins } = await board(page);

    // Signed in as the operator, who is neither of the two: names, never "you".
    await expect(line).toHaveText(`${kaito.name} leads ${sora.name} 2–1`);
    await expect(oneWins).toHaveText("2");
    await expect(otherWins).toHaveText("1");
    await expect(page.getByTestId("rivalry-draws")).toHaveText("1");
    await expect(page.getByTestId("rivalry-games")).toHaveText("4");
    // Every game between them, beside this game's, because it is a longer list.
    await expect(page.getByTestId("rivalry-all-one-wins")).toHaveText("2");
    await expect(page.getByTestId("rivalry-all-other-wins")).toHaveText("2");

    // The page says what it was narrowed to: the player, and who against.
    await ready(page, "history-filters");
    await expect(page.locator('[data-narrowing="against"]')).toHaveText(new RegExp(`against ${sora.name}`));

    // Kaito's two wins, clicked the way a reader clicks them: exactly two games.
    await oneWins.click();
    await expect(page).toHaveURL(/outcome=won/);
    await expect(page.getByTestId("history-row")).toHaveCount(2);
    await expect(page.locator('[data-narrowing="outcome"]')).toBeVisible();

    // The games count leaves the abandoned game out, as the score did: four, not five.
    await page.getByTestId("rivalry-games").click();
    await expect(page).toHaveURL(/outcome=decided/);
    await expect(page.getByTestId("history-row")).toHaveCount(4);

    // Sora's one win, from Sora's side of the pair.
    await page.getByTestId("rivalry-other-wins").click();
    await expect(page).toHaveURL(new RegExp(`member=${ids.sora}&against=${ids.kaito}&outcome=won`));
    await expect(page.getByTestId("history-row")).toHaveCount(1);

    // The way back: take the pair off, and the record is one member's against the reader.
    await page.locator('[data-narrowing="against"]').click();
    await expect(page.getByTestId("rivalry-line")).toHaveText(`You and ${sora.name} have never played each other`);
    await expect(page.locator('[data-narrowing="player"]')).toBeVisible();
    await expect(page.locator('[data-narrowing="against"]')).toHaveCount(0);
  });

  test("says 'you' only to one of the two, from their own side", async ({ browser, baseURL }) => {
    const asKaito = await memberContext(browser, baseURL ?? "", kaito);
    const asSora = await memberContext(browser, baseURL ?? "", sora);
    try {
      const kaitoPage = await asKaito.newPage();
      await kaitoPage.goto(pairRecord());
      const mineBoard = await board(kaitoPage);
      await expect(mineBoard.line).toHaveText(`You lead ${sora.name} 2–1`);

      // Sora reads the same pair from the other side, and goes first on the board.
      const soraPage = await asSora.newPage();
      await soraPage.goto(pairRecord());
      const theirs = await board(soraPage);
      await expect(theirs.line).toHaveText(`${kaito.name} leads you 2–1`);
      await expect(theirs.oneWins).toHaveText("1");
      await expect(soraPage.getByTestId("rivalry-one-name")).toHaveText(sora.name);
    } finally {
      await asKaito.close();
      await asSora.close();
    }
  });

  test("after a game, the board counts it", async ({ page, browser, baseURL }) => {
    await page.goto(`/games/gomoku/match/${games["sora-wins"]}`);
    const watched = await board(page);
    await expect(watched.line).toHaveText(`${sora.name}'s first win against ${kaito.name}`);
    // Black first for a watcher: Sora held black in this one.
    await expect(watched.oneWins).toHaveText("1");
    await expect(watched.otherWins).toHaveText("2");

    const asKaito = await memberContext(browser, baseURL ?? "", kaito);
    try {
      const kaitoPage = await asKaito.newPage();
      await kaitoPage.goto(`/games/gomoku/match/${games["sora-wins"]}`);
      const mineBoard = await board(kaitoPage);
      await expect(mineBoard.line).toHaveText(`${sora.name}'s first win against you`);
    } finally {
      await asKaito.close();
    }
  });

  test("before a game, the board says what these two are to each other", async ({ page }) => {
    await page.goto(`/games/gomoku/match/${games["to-play"]}`);
    const again = await board(page);
    await expect(again.line).toHaveText(`${kaito.name} leads ${sora.name} 2–1`);

    // The common case: a game these two have never played together.
    await page.goto(`/games/tic-tac-toe/match/${games["never-played"]}`);
    const fresh = await board(page);
    await expect(fresh.line).toHaveText(
      `${kaito.name} and ${sora.name} have never played ${RULE_VARIANT_DISPLAY.tictactoe.label} before`,
    );
    await expect(fresh.oneWins).toHaveText("0");
    // Their record elsewhere is still there, under this game's empty score.
    await expect(page.getByTestId("rivalry-all-one-wins")).toHaveText("2");
  });
});
