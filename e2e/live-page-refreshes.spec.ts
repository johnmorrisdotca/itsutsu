import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

import { memberContext, memberIdFor, removeMember, seatTokensFor } from "./members";
import { playAt, ready, readyHere } from "./support";
import { gamesMade, namesPlayedUnder } from "./tidy";
import { PHRASE_LENGTH } from "../src/lib/phrase/phrase";
import { matchPath } from "../src/lib/gomoku/slugs";
import { shownName } from "../src/lib/rating/shownName";

/**
 * The other live-page controls that hand the page back to the server: do they
 * keep the document?
 *
 * A live board keeps its address on the move number with the native
 * `history.replaceState`, and Next takes that as the router's own URL. A game
 * settling under a reader whose router had taken it asked for an address the
 * page it held was not, and loaded the whole document again — fixed in
 * `useMatchAddress`, proved by `settled-in-place.spec.ts`. `SitAsPanel` and
 * `OfferButtons` each call `router.refresh()` of their own on the same page,
 * and a timeout claim ends a game by yet another route, so each is asked the
 * same question the same way: mark the document, do what a player does, and
 * see whether the mark survived.
 *
 * WHAT CANNOT HAPPEN IS NOT TESTED AS THOUGH IT COULD. Sitting down after a
 * stone has landed is refused by the server — `seatIsFree` says no seat is free
 * once a game has a move — so `SitAsPanel`'s refresh, which runs only after a
 * sit succeeds, never runs on a board whose address a move has moved. And no
 * move can be played on an offer. The cases below are the ones a reader can
 * reach: an offer that carries a forked position, a seat taken at a board with
 * no stone on it, a claim after a stone — each opened by its address, and the
 * offer and the seat also reached the usual way, by clicking the game in /play.
 *
 * IT BRINGS ITS OWN WORLD: members, games and names made here and taken away.
 */
test.describe("a live page's own hand-backs keep the document", () => {
  const mine = gamesMade();
  const under = namesPlayedUnder();

  /** Marks this document, and returns the check that it is still the same one. See settled-in-place.spec.ts. */
  async function markDocument(page: Page) {
    let documents = 0;
    page.on("domcontentloaded", () => {
      documents += 1;
    });
    await page.evaluate(() => {
      (window as unknown as { keptHere?: boolean }).keptHere = true;
    });
    return async (what: string) => {
      expect(documents, `${what} loaded a new document`).toBe(0);
      const kept = await page.evaluate(() => (window as unknown as { keptHere?: boolean }).keptHere === true);
      expect(kept, `${what} is not the document that was open before`).toBe(true);
    };
  }

  /** Opens /play and clicks the game's own row through to its board, the way a reader gets there. */
  async function clickThroughFromPlay(page: Page, variant: string, id: string) {
    const link = page.locator(`[data-testid="my-game"] a[href="${matchPath(variant, id)}"]`).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/match/${id}(/\\d+)?$`));
  }

  /** The four-words picker run to a finished phrase, keeping the first candidate each round. As kitchen-table.spec.ts. */
  async function pickPhrase(page: Page): Promise<string[]> {
    const chosen: string[] = [];
    for (let round = 0; round < PHRASE_LENGTH; round += 1) {
      const candidate = page.getByTestId("phrase-candidate-0");
      await expect(candidate).toBeVisible();
      const word = (await candidate.textContent())?.trim() ?? "";
      await candidate.click();
      await expect(page.getByTestId(`phrase-slot-${round}`)).toHaveText(word);
      chosen.push(word);
    }
    return chosen;
  }

  /** A word found on the entry pad by tapping letters, then the word. As kitchen-table.spec.ts. */
  async function tapWord(page: Page, word: string): Promise<void> {
    for (const letter of word) {
      const wordButton = page.getByTestId(`sit-as-word-${word}`);
      if (await wordButton.isVisible().catch(() => false)) {
        await wordButton.click();
        return;
      }
      await page.getByTestId(`sit-as-letter-${letter}`).click();
    }
    await page.getByTestId(`sit-as-word-${word}`).click();
  }

  test("sitting down at the free seat of a board reached from /play", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    // The first word carries the stamp: the list prints a first name and an initial.
    const her = { email: `sitdown-her-${stamp}@example.test`, name: `Sitdown${stamp} Morris` };
    const john = { email: `sitdown-john-${stamp}@example.test`, name: `Table${stamp} John` };

    const herContext = await memberContext(browser, baseURL!, her);
    const johnContext = await memberContext(browser, baseURL!, john);
    try {
      // Her four words, set on her own account first, as she would.
      const herPage = await herContext.newPage();
      await herPage.goto("/me?view=words");
      await ready(herPage, "phrase-setup");
      await herPage.getByTestId("phrase-set-button").click();
      const words = await pickPhrase(herPage);
      await herPage.getByTestId("phrase-acknowledge").check();
      await herPage.getByTestId("phrase-save").click();
      await expect(herPage.getByTestId("phrase-status")).toContainText("Four words are set");

      const started = await johnContext.request.post("/api/games/live", {
        data: { variant: "freestyle", size: 9, moveTimeMs: null },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string };
      mine(game.id);

      // John takes black by his own link, then comes back to the game the usual way: from /play.
      const page = await johnContext.newPage();
      await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
      await page.goto("/play");
      const kept = await markDocument(page);
      await clickThroughFromPlay(page, "gomoku", game.id);
      await ready(page, "shared-game");
      await ready(page, "sit-as-closed");

      // He hands the iPad over, and she sits down as herself.
      await page.getByTestId("sit-as-open").click();
      const list = page.getByTestId("sit-as-members");
      await expect(list).toBeVisible();
      await list.getByRole("button", { name: shownName(her.name), exact: true }).click();
      for (const word of words) await tapWord(page, word);
      await page.getByTestId("sit-as-submit").click();

      // Seated: nothing offers the seat any more, and this tab plays her side against him.
      await expect(page.getByTestId("opponent-line")).toContainText(shownName(john.name));
      await expect(page.getByTestId("sit-as-open")).toHaveCount(0);
      await kept("the board somebody sat down at");
    } finally {
      await herContext.close();
      await johnContext.close();
      await removeMember(her.email);
      await removeMember(john.email);
    }
  });

  /*
   * AN OFFER HAS NO MOVE THAT CAN LAND ON IT, so the case that carries moves is a
   * fork: the position arrives with the page. Both answers are clicked on the
   * board, which is opened once by its address and once from /play.
   */
  for (const arrival of ["address", "play"] as const) {
    for (const answer of ["accept", "decline"] as const) {
      test(`answering a forked offer on a board opened by ${arrival === "play" ? "clicking it in /play" : "its address"}: ${answer}`, async ({
        browser,
        baseURL,
      }) => {
        const stamp = `${Date.now().toString(36)}${arrival[0]}${answer[0]}`;
        const askerMember = { email: `refresh-asker-${stamp}@example.test`, name: under(`Asker${stamp} Fork`) };
        const askedMember = { email: `refresh-asked-${stamp}@example.test`, name: under(`Asked${stamp} Fork`) };
        const asker = await memberContext(browser, baseURL!, askerMember);
        const asked = await memberContext(browser, baseURL!, askedMember);
        try {
          const askedId = await memberIdFor(askedMember.email);

          // A real game between the two: offered, accepted, and three stones in.
          const offered = await asker.request.post("/api/games/live", {
            data: { variant: "freestyle", size: 9, winLength: 5, challengeId: askedId, moveTimeMs: null },
          });
          expect(offered.status(), await offered.text()).toBe(201);
          const source = (await offered.json()) as { id: string };
          mine(source.id);
          const accepted = await asked.request.post(`/api/games/${source.id}/offer/accept`, {});
          expect(accepted.status(), await accepted.text()).toBe(200);
          const seats = await seatTokensFor(source.id);
          for (const [token, row, col] of [[seats.blackToken, 4, 4], [seats.whiteToken, 0, 0], [seats.blackToken, 4, 5]] as const) {
            const played = await asker.request.post(`/api/games/${source.id}/moves`, { data: { token, row, col } });
            expect(played.status(), await played.text()).toBe(201);
          }

          // The asker forks it at move three: an offer to the same opponent, with the position in it.
          const forked = await asker.request.post("/api/games/live", { data: { from: { id: source.id, move: 3 } } });
          expect(forked.status(), await forked.text()).toBe(201);
          const fork = (await forked.json()) as { id: string };
          mine(fork.id);

          const page = await asked.newPage();
          let kept: (what: string) => Promise<void>;
          if (arrival === "play") {
            await page.goto("/play");
            kept = await markDocument(page);
            await clickThroughFromPlay(page, "gomoku", fork.id);
            await ready(page, "shared-game");
          } else {
            await page.goto(`/games/gomoku/match/${fork.id}`);
            await ready(page, "shared-game");
            kept = await markDocument(page);
          }
          await expect(page.getByTestId("turn-banner")).toHaveAttribute("data-offer", "to-me");
          await expect(page.getByTestId("live-moves")).toContainText("F5");

          const buttons = page.getByTestId("offer-panel").getByTestId("offer-buttons");
          await readyHere(buttons);
          await buttons.getByTestId(`offer-${answer}`).click();

          // The page is what the answer made it: an ordinary board, or no board at all.
          await expect(page.getByTestId("offer-panel")).toHaveCount(0, { timeout: 20_000 });
          if (answer === "accept") {
            await expect(page.getByTestId("turn-banner")).not.toHaveAttribute("data-offer", "to-me");
            await expect(page.getByTestId("shared-game")).toBeVisible();
          } else {
            await expect(page.getByTestId("shared-game")).toHaveCount(0);
          }
          await kept(`the board an offer was ${answer === "accept" ? "accepted" : "declined"} on`);
        } finally {
          await asker.close();
          await asked.close();
          await removeMember(askerMember.email);
          await removeMember(askedMember.email);
        }
      });
    }
  }

  test("claiming the game on time after a stone has landed on the board", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const kuro = { email: `refresh-claim-black-${stamp}@example.test`, name: under(`Kuro${stamp} Claim`) };
    const shiro = { email: `refresh-claim-white-${stamp}@example.test`, name: under(`Shiro${stamp} Claim`) };
    const blackContext = await memberContext(browser, baseURL!, kuro);
    const prisma = new PrismaClient();
    try {
      const started = await blackContext.request.post("/api/games/live", {
        data: {
          variant: "freestyle",
          size: 15,
          moveTimeMs: 86_400_000,
          timeoutPenalty: "game",
          rated: false,
          blackName: kuro.name,
          whiteName: shiro.name,
        },
      });
      expect(started.status(), await started.text()).toBe(201);
      const game = (await started.json()) as { id: string; blackToken: string };
      mine(game.id);

      const page = await blackContext.newPage();
      await page.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
      await ready(page, "shared-game");
      const board = page.getByTestId("shared-game");
      const kept = await markDocument(page);

      // Black's stone, clicked; it lands on this board and the address moves on.
      await playAt(page, 15, 7, 7);
      await expect(board.getByTestId("turn-banner")).toContainText("Waiting for White");
      await expect(page).toHaveURL(new RegExp(`/match/${game.id}/1$`));

      // White's day went by. The clock is the one thing a test cannot wait for; see forfeit-replay.spec.ts.
      const yesterday = new Date(Date.now() - 86_400_000);
      await prisma.game.update({
        where: { id: game.id },
        data: { lastMoveAt: new Date(yesterday.getTime() - 86_400_000), deadlineAt: yesterday },
      });

      const claim = board.getByTestId("claim-timeout");
      await expect(claim).toBeVisible({ timeout: 15_000 });
      await readyHere(claim);
      await claim.click();
      await board.getByTestId("claim-timeout-yes").click();

      // The record, in place: the live board gone, the filed heading naming both, at the last position's address.
      await expect(page.getByRole("heading", { level: 1 })).toContainText(shownName(kuro.name), { timeout: 20_000 });
      await expect(page.getByTestId("shared-game")).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`/match/${game.id}/1$`));
      await kept("the board that claimed the game");
    } finally {
      await prisma.$disconnect();
      await blackContext.close();
      await removeMember(kuro.email);
      await removeMember(shiro.email);
    }
  });
});
