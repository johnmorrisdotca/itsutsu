import { expect, test, type Locator, type Page } from "@playwright/test";

import { standingsPath } from "../src/lib/gomoku/slugs";
import { xpLevelName } from "../src/lib/xp/levelNames";
import { clearPeopleStanding, removePlayedUnder, seedLadderRow, seedPeopleStanding } from "./members";
import { ready } from "./support";
import { removeXpMembers, seedProgram, seedXpMember, type SeededXpMember } from "./xpMembers";

/**
 * XP IS ON EVERY TABLE OF PEOPLE, SAID THE SAME WAY, AND A PERSON'S PAGE OPENS
 * WITH THEIR NAME, THEIR RECORD AND THEIR STANDING.
 *
 * John, 2026-09-14: "Make sure all STATS tables actually show the userXP in
 * them too… after the Rating column… This means everywhere in the site. why are
 * some pages now showing it??? View Person should always show this prominent
 * info as well." `e2e/xp-column.spec.ts` drives the members list, which is the
 * one table that had it; this drives the rest — the Computers tab, the ladder,
 * a game's standings, the champions, the operator's Bots tab, and the person's
 * own page — the way a reader reaches them, by clicking the tabs.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT BRINGS ITS OWN WORLD, INCLUDING A PROGRAM
 * ─────────────────────────────────────────────────────────────────────────
 *
 * One member standing on a known rung, one program, one name on the ladder
 * that nobody has claimed, and one standing at a game nobody else touches —
 * every row this asserts about is one it made. The program matters most: the
 * seven real ones are somebody else's rows, a development database may hold
 * none, and the whole claim about a program is that its cell reads "–" and not
 * "0" — John: never 0 and never "Lv 1" — which cannot be shown on a table with
 * no program on it.
 *
 * Every wait is on something PRESENT before anything is read as absent: the
 * row is found by the id in the link on its name, so the dash and the missing
 * badge are statements about a rendered row and not about the speed of the
 * request; the ladder waits on its ready marker; and the standing block on a
 * person's page carries one of its own, so the program's page waits on the
 * figures beside where the block would be before saying there is none.
 */

/** The rung the member stands on. Wii, when this was written; read from the catalogue either way. */
const LEVEL = 60;

/** A game nothing else seeds or clears, so the standing is the only one there. */
const VARIANT = "wormDrop";

/** A row of a record table, by the id in the link on its name. */
function rowFor(table: Locator, member: SeededXpMember): Locator {
  return table.locator(`tbody tr:has(a[href="/players/${member.id}"])`);
}

/** The tab bar's link with this label, pressed the way a reader presses it. */
async function openTab(page: Page, label: string) {
  await page.getByTestId("tabs").getByTestId("tab").filter({ hasText: label }).click();
}

test.describe("XP on every stats table, and on a person's page", () => {
  let person: SeededXpMember;
  let program: SeededXpMember;
  let unclaimed = "";
  let standingKey = "";
  const shown = () => person.xp.toLocaleString("en-GB");

  test.beforeEach(async () => {
    person = await seedXpMember(LEVEL, "everywhere");
    program = await seedProgram("everywhere");
    /*
     * Ratings high enough to sit on the first page of a ladder sorted by
     * rating, whatever a development database holds — and distinct, so the
     * two rows cannot tie.
     */
    unclaimed = `Xp-unclaimed-${Math.floor(Math.random() * 1e6)}`;
    await seedLadderRow({ name: person.name, memberId: person.id, rating: 2600, games: 12, wins: 9, losses: 3 });
    await seedLadderRow({ name: unclaimed, rating: 2599, games: 5, wins: 3, losses: 2 });
    standingKey = await seedPeopleStanding(VARIANT, {
      key: `xp-standing-${Date.now()}`,
      name: person.name,
      memberId: person.id,
      rating: 2600,
      games: 6,
      wins: 5,
      losses: 1,
    });
  });

  test.afterEach(async () => {
    await clearPeopleStanding(VARIANT, standingKey);
    await removePlayedUnder([person.name, unclaimed]);
    await removeXpMembers([person.email, program.email]);
  });

  test("the Members, Computers and Ladder tabs say it the same way", async ({ page }) => {
    await page.goto("/players");
    const directory = page.getByTestId("directory");
    const mine = rowFor(directory, person);
    const bot = rowFor(directory, program);
    await expect(mine, "the seeded member is not on the first page of the members list").toHaveCount(1);
    await expect(bot, "the seeded program is not pinned to the first page").toHaveCount(1);
    await expect(mine.getByTestId("record-xp")).toHaveText(shown());
    await expect(mine.getByTestId("record-level")).toHaveAttribute("data-level", String(LEVEL));
    // A program: a dash, never a nought, and no rung beside its name.
    await expect(bot.getByTestId("record-xp")).toHaveText("–");
    await expect(bot.getByTestId("record-level")).toHaveCount(0);

    // The Computers tab, by its tab: every row a program, every cell a dash.
    await openTab(page, "Computers");
    const computers = page.getByTestId("computer-players-table");
    const botRow = rowFor(computers, program);
    await expect(botRow, "the seeded program is not on the Computers tab").toHaveCount(1);
    await expect(botRow.getByTestId("record-xp")).toHaveText("–");
    await expect(botRow.getByTestId("record-xp")).toHaveAttribute("title", /program/);
    await expect(botRow.getByTestId("record-level")).toHaveCount(0);
    // And in its place: directly after the rating, before the tier.
    const headings = await computers.locator("thead th").allInnerTexts();
    const rating = headings.findIndex((one) => /^rating/i.test(one.trim()));
    expect(headings[rating + 1]?.trim(), `headings: ${headings.join(" | ")}`).toMatch(/^xp/i);
    expect(headings[rating + 2]?.trim()).toMatch(/^tier/i);

    // The ladder, by its tab, once the browser has taken it over.
    await openTab(page, "Ladder");
    await ready(page, "ladder-live");
    const ladder = page.getByTestId("players-table");
    const onLadder = rowFor(ladder, person);
    await expect(onLadder, "the seeded member is not on the first page of the ladder").toHaveCount(1);
    await expect(onLadder.getByTestId("record-xp")).toHaveText(shown());
    await expect(onLadder.getByTestId("record-level")).toHaveAttribute("data-level", String(LEVEL));
    /*
     * A name with nobody behind it: a dash whose hover says so, rather than
     * the program's reason, which would be wrong about it. Found by the name
     * in its link, since a row with no member has no id to link by.
     */
    const nobody = ladder.locator("tbody tr").filter({ has: page.getByRole("link", { name: unclaimed }) });
    await expect(nobody).toHaveCount(1);
    await expect(nobody.getByTestId("record-xp")).toHaveText("–");
    await expect(nobody.getByTestId("record-xp")).toHaveAttribute("title", /nobody has claimed/);
    // The ladder cannot order by a column on Member, so its XP heading is text, not a link.
    const xpHead = ladder.locator("thead th").filter({ hasText: /^XP/ });
    await expect(xpHead).toHaveCount(1);
    await expect(xpHead.getByTestId("sortable-head")).toHaveCount(0);
  });

  test("a game's standings and the champions table carry it after the rating", async ({ page }) => {
    await page.goto(standingsPath(VARIANT));
    const standings = page.getByTestId("standings-table");
    const mine = rowFor(standings, person);
    await expect(mine, "the seeded standing is not on the game's ladder").toHaveCount(1);
    await expect(mine.getByTestId("record-xp")).toHaveText(shown());
    await expect(mine.getByTestId("record-level")).toHaveAttribute("data-level", String(LEVEL));
    const headings = await standings.locator("thead th").allInnerTexts();
    const rating = headings.findIndex((one) => /^rating/i.test(one.trim()));
    expect(headings[rating + 1]?.trim(), `headings: ${headings.join(" | ")}`).toMatch(/^xp/i);

    // The standing seeded is the only one at this game, so its holder is the champion.
    await page.goto("/champions");
    const row = page.getByTestId(`champion-row-${VARIANT}`);
    await expect(row.getByRole("link", { name: person.name })).toHaveCount(1);
    await expect(row.getByTestId("record-xp")).toHaveText(shown());
    await expect(row.getByTestId("champion-level")).toHaveAttribute("data-level", String(LEVEL));
    // Pressed, not read off the href: the number leads to the board.
    await row.getByTestId("record-xp-link").click();
    await expect(page).toHaveURL(/\/xp(\?|$)/);
    await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
  });

  test("the operator's Bots tab prints a dash for a program, never a nought", async ({ page }) => {
    await page.goto("/admin");
    await openTab(page, "The bots");
    const bots = page.getByTestId("admin-bots-table");
    const row = rowFor(bots, program);
    await expect(row, "the seeded program is not on the Bots tab").toHaveCount(1);
    await expect(row.getByTestId("record-xp")).toHaveText("–");
    await expect(row.getByTestId("record-level")).toHaveCount(0);
    const headings = await bots.locator("thead th").allInnerTexts();
    const rating = headings.findIndex((one) => /^rating/i.test(one.trim()));
    expect(headings[rating + 1]?.trim(), `headings: ${headings.join(" | ")}`).toMatch(/^xp/i);
  });

  test("a person's page opens with their name, their record, and their level by name", async ({ page }) => {
    await page.goto(`/players/${person.id}`);
    await ready(page, "member-level");
    // The name at the top, the record under it, the standing under that.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(person.name);
    await expect(page.getByTestId("player-figures")).toBeVisible();
    const standing = page.getByTestId("member-level");
    await expect(standing).toHaveAttribute("data-level", String(LEVEL));
    await expect(standing.getByTestId("member-level-name")).toContainText(`${LEVEL} · ${xpLevelName(LEVEL)}`);
    await expect(standing.getByTestId("member-level-total")).toHaveText(shown());
    // The rung ahead, named, with the distance to it — the member sits on the floor of this rung.
    await expect(standing.getByTestId("member-level-next")).toContainText(`Lv ${LEVEL + 1} · ${xpLevelName(LEVEL + 1)}`);
    // Order on the page: the figures come before the standing block.
    const figuresBox = await page.getByTestId("player-figures").boundingBox();
    const standingBox = await standing.boundingBox();
    expect(figuresBox).not.toBeNull();
    expect(standingBox).not.toBeNull();
    expect((standingBox?.y ?? 0) > (figuresBox?.y ?? 0)).toBe(true);

    // The level leads to its page; the total leads to the board. Both pressed.
    await standing.getByTestId("member-level-name").click();
    await expect(page).toHaveURL(new RegExp(`/xp/levels/${LEVEL}(\\?|$)`));
    await page.goBack();
    await ready(page, "member-level");
    await page.getByTestId("member-level-total").click();
    await expect(page).toHaveURL(/\/xp(\?|$)/);
    await expect(page.getByTestId("xp-leaderboard")).toBeVisible();
  });

  test("a program's page shows no standing block at all, rather than an empty one", async ({ page }) => {
    await page.goto(`/players/${program.id}`);
    // Present first: the figures the block would sit under. Then the absence means something.
    await expect(page.getByTestId("player-figures")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(program.name);
    await expect(page.getByTestId("member-level")).toHaveCount(0);
  });
});
