import { expect, test, type Page } from "@playwright/test";

import { memberContext } from "./members";
import { gamesMade } from "./tidy";
import { PHRASE_LENGTH } from "../src/lib/phrase/phrase";
import { WORDLIST } from "../src/lib/phrase/wordlist.constants";
import { shownName } from "../src/lib/rating/shownName";

/**
 * The kitchen table: one iPad, John signed in, and his daughter taking the
 * free seat AS HERSELF so the game counts for her, using nothing but a name
 * and four words she can tap.
 *
 * Two screens, driven the way a reader drives them rather than by calling the
 * API directly, per AGENTS.md's "A Test That Does What A User Would Not Do" —
 * neither screen has a text box a phrase could be typed into, so these specs
 * never type one either.
 */
const tidyAway = gamesMade();

/**
 * Runs the picker to a finished phrase, always keeping the first candidate
 * offered. Returns the four words actually kept, read off the button that was
 * tapped rather than assumed — the picker draws them at random, so there is
 * no fixed phrase to expect.
 */
async function pickPhrase(page: Page): Promise<string[]> {
  const chosen: string[] = [];
  for (let round = 0; round < PHRASE_LENGTH; round += 1) {
    const candidate = page.getByTestId("phrase-candidate-0");
    await expect(candidate).toBeVisible();
    const word = (await candidate.textContent())?.trim() ?? "";
    await candidate.click();
    // Waiting for the slot to show this exact word is also the wait for the
    // next round's candidates: both come from the same response.
    await expect(page.getByTestId(`phrase-slot-${round}`)).toHaveText(word);
    chosen.push(word);
  }
  return chosen;
}

/** Finds a word on the entry pad by tapping letters, then the word itself. Never typed. */
async function tapWord(page: Page, word: string): Promise<void> {
  for (const letter of word) {
    const wordButton = page.getByTestId(`sit-as-word-${word}`);
    if (await wordButton.isVisible().catch(() => false)) {
      await wordButton.click();
      return;
    }
    await page.getByTestId(`sit-as-letter-${letter}`).click();
  }
  // Every letter is on the pad now, so the word itself must be showing.
  await page.getByTestId(`sit-as-word-${word}`).click();
}

test.describe("four words are how you get back to your games", () => {
  test("sets a phrase on an existing account, then claims a free seat with it on somebody else's device", async ({
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    // An account that already exists, exactly like any real member's row —
    // step one asks for a phrase on one of THOSE, never a fresh signup.
    const her = { email: `hanako-${stamp}@example.test`, name: `Hanako ${stamp}` };
    const john = { email: `kitchen-john-${stamp}@example.test`, name: `Kitchen John ${stamp}` };

    // STEP 1 — her own account gains a phrase, from her own session.
    const herContext = await memberContext(browser, baseURL!, her);
    const herPage = await herContext.newPage();
    await herPage.goto("/me?view=profile");
    await expect(herPage.getByTestId("phrase-setup")).toHaveAttribute("data-ready", "true");
    await expect(herPage.getByTestId("phrase-status")).toContainText("No four words");

    await herPage.getByTestId("phrase-set-button").click();
    await expect(herPage.getByTestId("phrase-picker")).toBeVisible();
    const words = await pickPhrase(herPage);
    expect(words).toHaveLength(PHRASE_LENGTH);

    await herPage.getByTestId("phrase-acknowledge").check();
    await herPage.getByTestId("phrase-save").click();
    // Back to the plain status view, and it now says so.
    await expect(herPage.getByTestId("phrase-status")).toContainText("Four words are set");
    await herContext.close();

    // STEP 2 — the kitchen table. John is signed in here and holds the black
    // seat from creating the game; white is still waiting for somebody.
    const johnContext = await memberContext(browser, baseURL!, john);
    const started = await johnContext.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, moveTimeMs: null },
    });
    expect(started.status(), await started.text()).toBe(201);
    const game = (await started.json()) as { id: string; blackToken: string };
    tidyAway(game.id);

    const johnPage = await johnContext.newPage();
    /*
     * He takes black first, which the comment above assumed and nothing did.
     * Creating a game through the API binds NEITHER seat — a seat is bound by
     * a challenge or by somebody following its link — so both were free, and
     * the panel rightly refuses to sit anybody down until it is told which
     * chair they mean. The button stayed disabled for two minutes and the
     * spec read it as the phrase being rejected.
     *
     * Following his own seat link is what a person does, and it leaves white
     * as the only free seat, which is the situation this test is about.
     */
    await johnPage.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await johnPage.goto(`/games/gomoku/match/${game.id}`);
    await expect(johnPage.getByTestId("sit-as-closed")).toHaveAttribute("data-ready", "true");

    await johnPage.getByTestId("sit-as-open").click();
    await expect(johnPage.getByTestId("sit-as-panel")).toBeVisible();
    await johnPage.getByTestId("sit-as-name").fill(her.name);

    // Tapped in the REVERSE of the order she picked them — order must not
    // matter, and this is that property exercised through the real screen
    // rather than only at the library level.
    for (const word of [...words].reverse()) await tapWord(johnPage, word);

    await johnPage.getByTestId("sit-as-submit").click();

    /*
     * Proof in two parts, and they check different things. First: the seat she
     * was offered is no longer free, so nothing on the page still offers it —
     * true from anybody's screen, whoever they are.
     *
     * Second, and this is the sharper claim: THIS tab is now bound to her seat.
     * `resolveSeat` prefers the seat cookie this claim just set over John's own
     * signed-in account, exactly the way it prefers a scanned seat link over
     * the account that scanned it — so reloading this same tab now shows the
     * board from HER side, and the opponent on screen has flipped to him. If
     * the claim had silently failed, this tab would still be his and would
     * show no opponent line change at all.
     */
    await expect(johnPage.getByTestId("sit-as-open")).toHaveCount(0);
    await expect(johnPage.getByTestId("opponent-line")).toContainText(shownName(john.name));

    await johnContext.close();
  });

  test("refuses a seat to the wrong four words, and leaves it free", async ({ browser, baseURL }) => {
    const stamp = Date.now().toString(36);
    const her = { email: `wrong-hanako-${stamp}@example.test`, name: `Wrong Hanako ${stamp}` };
    const john = { email: `wrong-john-${stamp}@example.test`, name: `Wrong John ${stamp}` };

    const herContext = await memberContext(browser, baseURL!, her);
    const herPage = await herContext.newPage();
    await herPage.goto("/me?view=profile");
    await herPage.getByTestId("phrase-set-button").click();
    const words = await pickPhrase(herPage);
    await herPage.getByTestId("phrase-acknowledge").check();
    await herPage.getByTestId("phrase-save").click();
    await expect(herPage.getByTestId("phrase-status")).toContainText("Four words are set");
    await herContext.close();

    const johnContext = await memberContext(browser, baseURL!, john);
    const started = await johnContext.request.post("/api/games/live", {
      data: { variant: "freestyle", size: 9, moveTimeMs: null },
    });
    const game = (await started.json()) as { id: string; blackToken: string };
    tidyAway(game.id);

    const johnPage = await johnContext.newPage();
    /*
     * He takes black first, which the comment above assumed and nothing did.
     * Creating a game through the API binds NEITHER seat — a seat is bound by
     * a challenge or by somebody following its link — so both were free, and
     * the panel rightly refuses to sit anybody down until it is told which
     * chair they mean. The button stayed disabled for two minutes and the
     * spec read it as the phrase being rejected.
     *
     * Following his own seat link is what a person does, and it leaves white
     * as the only free seat, which is the situation this test is about.
     */
    await johnPage.goto(`/games/gomoku/match/${game.id}/seat/${game.blackToken}`);
    await johnPage.goto(`/games/gomoku/match/${game.id}`);
    await johnPage.getByTestId("sit-as-open").click();
    await expect(johnPage.getByTestId("sit-as-panel")).toBeVisible();
    await johnPage.getByTestId("sit-as-name").fill(her.name);

    // Four real words from the list, guaranteed not to be the four she kept.
    const decoys = WORDLIST.filter((word) => !words.includes(word)).slice(0, PHRASE_LENGTH);
    for (const word of decoys) await tapWord(johnPage, word);

    await johnPage.getByTestId("sit-as-submit").click();
    await expect(johnPage.getByTestId("sit-as-error")).toBeVisible();
    // Refused, not seated: the way to try again is still on screen.
    await expect(johnPage.getByTestId("sit-as-panel")).toBeVisible();

    await johnContext.close();
  });
});
