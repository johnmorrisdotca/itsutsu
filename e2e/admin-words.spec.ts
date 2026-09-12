import { expect, test, type Locator } from "@playwright/test";

import { memberContext, phraseSetOn, removeMember, seedMember } from "./members";
import { PHRASE_LENGTH } from "../src/lib/phrase/phrase";

/**
 * The operator setting a member's four words from the Members list.
 *
 * THE THIRD WAY INTO THE SAME STORE, and this drives it the way the operator
 * does: the Members tab, the Words link on a row, the modal, four candidates
 * tapped, Save. Not by calling the route — per AGENTS.md's "A Test That Does
 * What A User Would Not Do", a spec that posted a ticket would have tested the
 * ticket and left the one thing John asked for undriven.
 *
 * IT PROVES THE WRITE THREE WAYS, because each says something the others do
 * not: the member's ROW carries a hash and a date (so it went through
 * `setPhrase` and not into some second column), the operator's list says "Words
 * set" against her name, and HER OWN Words tab says four words are set — which
 * is the only one of the three that proves the operator's door and the member's
 * own screen are looking at one credential.
 *
 * AND IT COMES BACK. Opening the modal a second time for the same member must
 * ask before replacing anything, and "leave them alone" must leave them alone —
 * the return trip, which is the half a one-directional spec never sees.
 *
 * ITS OWN WORLD, DELETED AFTER. Every row here is stamped and seeded by this
 * file and removed at the end: the real rows that carry four words are members
 * of this site, and John's own is on the shared development database. A spec
 * that set a phrase on somebody's real account would be locking a person out
 * of their games to make an assertion.
 */

/**
 * Runs the picker inside the modal to a finished phrase, always keeping the
 * first candidate offered. Returns the words kept, read off the tile that was
 * tapped rather than assumed — the picker draws at random, so there is no fixed
 * phrase to expect.
 *
 * Scoped to the modal rather than the page, because the tiles and the
 * candidates ARE the member's own components, test ids and all: that is the
 * point of importing them instead of building a second picker, and it means the
 * ids exist twice on a site where both screens can be open.
 */
async function pickFourIn(modal: Locator): Promise<string[]> {
  const chosen: string[] = [];
  for (let round = 0; round < PHRASE_LENGTH; round += 1) {
    const candidate = modal.getByTestId("phrase-candidate-0");
    await expect(candidate).toBeVisible();
    const word = (await candidate.textContent())?.trim() ?? "";
    await candidate.click();
    // Waiting for the slot to hold this exact word is also the wait for the
    // next round's candidates: both come from the one response.
    await expect(modal.getByTestId(`phrase-slot-${round}`)).toHaveText(word);
    chosen.push(word);
  }
  return chosen;
}

test.describe("the operator sets a member's four words", () => {
  test("from the Members list, and the member's own tab then says they are set", async ({
    page,
    browser,
    baseURL,
  }) => {
    const stamp = Date.now().toString(36);
    // The stamp is in the FIRST word: the site prints a first name and an
    // initial, so a stamp in the surname would leave this looking for
    // "Hanako M." among every member of this database.
    const her = { email: `adminwords-${stamp}@example.test`, name: `Words${stamp} Morris` };
    await seedMember(her);

    try {
      expect(await phraseSetOn(her.email), "the seeded account starts with no words").toBeNull();

      await page.goto("/admin?view=members");
      const row = page.getByTestId("admin-member").filter({ hasText: `Words${stamp}` });
      // The list arrives from the API, so wait for the row before reading
      // anything off it or asserting anything is absent from it.
      await expect(row).toBeVisible();
      await expect(row.getByTestId("member-words-state")).toContainText("No words");

      await row.getByTestId("member-words").click();
      const modal = page.getByTestId("member-words-modal");
      await expect(modal).toBeVisible();
      // No words yet, so it goes straight to the picker: nothing to ask about.
      await expect(modal.getByTestId("member-words-picker")).toBeVisible();
      await expect(modal, "the modal names whose words these are").toContainText(`Words${stamp}`);

      /*
       * NOTHING ON THIS SCREEN IS TYPED, asserted only after the picker is on
       * screen so that the absence is about a rendered panel rather than about
       * how fast the request was. The checkbox is the one input there is.
       */
      await expect(modal.locator("input:not([type=checkbox]), textarea")).toHaveCount(0);

      const words = await pickFourIn(modal);
      expect(words).toHaveLength(PHRASE_LENGTH);

      // Refused until the operator says they wrote the words down for her:
      // after this they cannot be shown to anybody, including to him.
      await expect(modal.getByTestId("member-words-save")).toBeDisabled();
      await modal.getByTestId("member-words-acknowledge").check();
      await modal.getByTestId("member-words-save").click();

      await expect(modal.getByTestId("member-words-saved")).toBeVisible();
      await expect(modal).toContainText("cannot be shown again");
      await modal.getByTestId("member-words-done").click();
      await expect(modal).toHaveCount(0);

      // ONE — the row itself, which the list re-read from the server.
      await expect(row.getByTestId("member-words-state")).toContainText("Words set");

      // TWO — the member's row carries a hash and a date. Proof it went
      // through the same store, rather than a sentence on a screen.
      const setAt = await phraseSetOn(her.email);
      expect(setAt, "the operator's save did not reach the member's row").not.toBeNull();

      // THREE — her own Words tab, from her own session. The operator's door
      // and the member's own screen are one credential or they are two
      // features wearing one name.
      const herContext = await memberContext(browser, baseURL!, her);
      try {
        const herPage = await herContext.newPage();
        await herPage.goto("/me?view=words");
        await expect(herPage.getByTestId("phrase-setup")).toHaveAttribute("data-ready", "true");
        await expect(herPage.getByTestId("phrase-status")).toContainText("Four words are set");
      } finally {
        await herContext.close();
      }
    } finally {
      await removeMember(her.email);
    }
  });

  test("asks before replacing words a member already has, and leaves them alone if told to", async ({ page }) => {
    const stamp = Date.now().toString(36);
    const her = { email: `adminreplace-${stamp}@example.test`, name: `Replace${stamp} Morris` };
    await seedMember(her);

    try {
      // The first set, through the screen, so the second open has something
      // real to ask about.
      await page.goto("/admin?view=members");
      const row = page.getByTestId("admin-member").filter({ hasText: `Replace${stamp}` });
      await expect(row).toBeVisible();
      await row.getByTestId("member-words").click();
      const modal = page.getByTestId("member-words-modal");
      await pickFourIn(modal);
      await modal.getByTestId("member-words-acknowledge").check();
      await modal.getByTestId("member-words-save").click();
      await expect(modal.getByTestId("member-words-saved")).toBeVisible();
      await modal.getByTestId("member-words-done").click();
      const first = await phraseSetOn(her.email);
      expect(first).not.toBeNull();

      // OPENED AGAIN. Replacing somebody's four words takes away the way they
      // sit down at a borrowed device, so the question comes before a single
      // candidate is drawn.
      await expect(row.getByTestId("member-words-state")).toContainText("Words set");
      await row.getByTestId("member-words").click();
      await expect(modal.getByTestId("member-words-replace")).toBeVisible();
      await expect(modal.getByTestId("member-words-picker")).toHaveCount(0);
      await expect(modal, "the question has to carry the date, or nobody can weigh it").toContainText(
        String(first?.getFullYear()),
      );

      // THE WAY BACK. "Leave them alone" closes it and changes nothing — the
      // half a one-directional spec never tests.
      await modal.getByTestId("member-words-replace-cancel").click();
      await expect(modal).toHaveCount(0);
      expect(await phraseSetOn(her.email), "leaving them alone changed the phrase").toEqual(first);

      // And saying yes reaches the picker, so the question is a question
      // rather than a wall.
      await row.getByTestId("member-words").click();
      await modal.getByTestId("member-words-replace-confirm").click();
      await expect(modal.getByTestId("member-words-picker")).toBeVisible();
    } finally {
      await removeMember(her.email);
    }
  });

  test("is refused for a row nobody signs in to, before any words are offered", async ({ request }) => {
    /*
     * A kept record, a seeded row and a computer player may never be claimed by
     * a login, so four words on one would be a credential for nobody's account.
     * Its own row rather than one of the real ones: the two remembered players
     * are somebody's, and a spec asserting anything about them is a spec about
     * this database's history.
     */
    const stamp = Date.now().toString(36);
    const kept = {
      email: `adminkept-${stamp}@example.test`,
      name: `Kept${stamp} Record`,
      unclaimableBecause: "kept-record",
    };
    await seedMember(kept);

    try {
      const listed = await request.get("/api/members");
      const items = ((await listed.json()) as { items: { id: string; name: string; mayHavePhrase: boolean }[] }).items;
      const row = items.find((one) => one.name === kept.name);
      expect(row, "the row this spec seeded is not in the operator's list").toBeDefined();
      // The list says so too, which is what keeps the link off that row.
      expect(row?.mayHavePhrase).toBe(false);

      const refused = await request.post(`/api/admin/members/${row?.id}/phrase/draw`, { data: {} });
      expect(refused.status()).toBe(422);
      expect(await refused.text()).toContain("not an account anybody signs in to");
    } finally {
      await removeMember(kept.email);
    }
  });
});

test.describe("the bots have a tab of their own", () => {
  test("lists the computer players, and the members list does not", async ({ page }) => {
    await page.goto("/admin?view=bots");
    const table = page.getByTestId("admin-bots-table");
    await expect(table).toBeVisible();

    /*
     * The headings stand whether or not there is anything under them — an
     * empty table is data, and a development database may have no programs
     * seeded yet. So what is asserted is the SHAPE, and the rows only where
     * there are rows to assert about.
     */
    await expect(table).toContainText("Played");
    await expect(table).toContainText("Rating");

    const rows = page.getByTestId("admin-bot");
    const count = await rows.count();
    if (count === 0) {
      // Said out loud rather than skipped silently: a skip that reports green
      // is the quietest way for a test to say nothing at all.
      await expect(page.getByTestId("admin-bots-table-empty")).toContainText("No computer players");
      return;
    }

    // Easiest first, so the ladder reads itself. Read off the grade rather
    // than the names, which are copy and will change.
    const tiers = await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-tier")));
    expect(tiers[0], `the grades came out as ${tiers.join(", ")}`).toBe("razryad");

    // Every row says what it is and when it last played — the two facts a
    // program has that the members list never carried.
    await expect(rows.first().getByTestId("admin-bot-grade")).toBeVisible();
    await expect(rows.first().getByTestId("admin-bot-last-played")).toBeVisible();

    /*
     * And they are not on the Members tab any more. Asserted after that tab's
     * own rows are on screen, so the absence is about a rendered list.
     */
    await page.goto("/admin?view=members");
    await expect(page.getByTestId("admin-member").first()).toBeVisible();
    await expect(page.getByTestId("admin-members").getByTestId("member-kind").filter({ hasText: "Robot" })).toHaveCount(
      0,
    );
  });
});
