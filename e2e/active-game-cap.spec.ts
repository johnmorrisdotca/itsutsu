import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext } from "./members";
import { chooseGame, chooseRated, ready } from "./support";
import { gamesMade } from "./tidy";
import { RULE_VARIANTS } from "../src/lib/gomoku/gomoku.constants";
import { isLocalDatabase } from "../src/lib/db/localDatabase";

/**
 * THE TWENTY-GAME CAP, MET IN A BROWSER AT TWENTY.
 *
 * This could not be written until the knob was split. `RATE_LIMIT_RELIEF`
 * used to multiply the cap as well as the rate limits, so on any server the
 * suite drives the cap was four hundred — a spec here would have seeded twenty
 * games, pressed Begin, watched a game get made, and had nothing true to say.
 * The cap is twenty for every member now; only the suite's own operator is let
 * past it outside production (see `memberOverActiveLimit`), and this spec is a
 * member of its own, signed in as themselves.
 *
 * The twenty is written here as a number rather than imported, and on purpose:
 * `activeGames.ts` is server-only, and the point of the case is that the
 * sentence a person reads names the real twenty — not whatever a constant
 * happens to say on the day.
 */
const CAP = 20;

test.describe("the twenty-game cap", () => {
  const mine = gamesMade();

  test("a member already holding twenty games is refused a twenty-first, in their own numbers", async ({
    browser,
    baseURL,
  }) => {
    process.loadEnvFile(".env");
    // Rows are written straight to the table below: never anywhere but this machine.
    expect(isLocalDatabase(process.env.DATABASE_URL), "this spec writes games directly; local database only").toBe(true);

    const stamp = Date.now().toString(36);
    const member = { email: `cap-${stamp}@example.test`, name: `Cap${stamp} Keeper` };
    const context = await memberContext(browser, baseURL!, member);

    /*
     * Twenty games still being played with this member in a seat — what
     * `seatedLive` counts, and so what the cap counts. Written to the table
     * because there is no quicker honest way to be twenty games deep, and each
     * one is handed to `gamesMade` so the file takes them away when it ends.
     */
    const prisma = new PrismaClient();
    let memberId = "";
    try {
      const row = await prisma.member.findUniqueOrThrow({
        where: { email: member.email },
        select: { id: true, name: true },
      });
      memberId = row.id;
      const when = new Date();
      await prisma.game.createMany({
        data: Array.from({ length: CAP }, (_, at) => ({
          id: mine(`${stamp.slice(-6)}-cap${at}`),
          status: "active" as const,
          result: "abandoned" as const,
          moveCount: 0,
          rated: false,
          size: 9,
          winLength: 5,
          variant: RULE_VARIANTS.freestyle,
          obstacles: "none",
          opener: "black",
          blackName: row.name,
          blackMemberId: row.id,
          whiteName: "",
          playedAt: when,
          lastMoveAt: when,
        })),
      });
    } finally {
      await prisma.$disconnect();
    }

    // The ordinary way to a game: the games page, the set-up screen, the doorstep.
    const page = await context.newPage();
    await page.goto("/games");
    await page.getByTestId("lobby-set-up").click();
    await expect(page).toHaveURL(/\/games\/new/);
    await ready(page, "set-up-game");
    /*
     * Caro, friendly: a game no other spec posts a seat at. Posting at a game
     * somebody is already waiting at sits down at THEIR seat instead, and the
     * first version of this chose Gomoku, which a dozen specs post at — one
     * friendly Gomoku seat left over and this case could not reach its door.
     */
    await chooseGame(page, "caro");
    await chooseRated(page, false);
    const go = page.getByTestId("set-up-start");
    await expect(go, "a friendly seat already waiting at exactly this game would be sat at instead").not.toContainText(/sit/i);
    await go.click();

    await ready(page, "doorstep");
    await page.getByTestId("doorstep-begin").click();

    const refusal = page.getByTestId("doorstep-error");
    await expect(refusal).toContainText(`You have ${CAP} games on the go, and ${CAP} at once is the limit here`);
    await expect(refusal).toContainText(/finish or resign one/i);
    // Still on the doorstep: nothing to land on, because nothing was made.
    await expect(page).toHaveURL(/\/begin/);

    const check = new PrismaClient();
    try {
      const held = await check.game.count({
        where: { status: "active", OR: [{ blackMemberId: memberId }, { whiteMemberId: memberId }] },
      });
      expect(held, "the refusal wrote no twenty-first game").toBe(CAP);
    } finally {
      await check.$disconnect();
    }
    await context.close();
  });
});
