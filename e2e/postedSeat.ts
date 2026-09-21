import { expect, type Browser, type Page } from "@playwright/test";

import { memberContext, seedMember } from "./members";
import { openSetUpPage, startAndBegin } from "./support";

/**
 * A SEAT POSTED BY SOMEBODY ELSE, so the doorstep can be reached the way a
 * reader reaches it.
 *
 * The set-up screen states a game of your own and writes it, so an ordinary
 * Begin goes straight to a board. The doorstep is what stands in front of
 * ANOTHER PERSON'S posted seat, where the rules being agreed to were written
 * by somebody else — so a spec about that page has to have one to sit at.
 *
 * The choices are made through the same controls, twice, because that is what
 * makes the two games match: `matchSeat` compares the RULES, and a seat posted
 * by any other means would be a seat the spec had reasoned its way to rather
 * than one the site produced.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY IT PRESSES MORE THAN ONCE, AND WHY THAT IS THE ROBUST VERSION
 * ─────────────────────────────────────────────────────────────────────────
 *
 * This machine's database holds seats left by hundreds of earlier runs. If one
 * of them happens to match, the HOST's own press is an offer to sit at it —
 * and then nothing new is posted and the reader finds nothing, which fails as
 * "there is no seat" several lines from the cause.
 *
 * So the host presses until it actually posts: every press that sits at a
 * leftover takes that leftover out of the way, and the next press has one
 * fewer to trip over. A spec that brings its own world, and tidies a little of
 * somebody else's on the way in.
 */
export async function seatPostedBySomebodyElse({
  browser,
  baseURL,
  slug,
  choose,
  noteGame,
}: {
  browser: Browser;
  baseURL: string;
  /** The game the address names, or undefined for the screen where it is still to be chosen. */
  slug?: string;
  /** The same choices the reader will make, made through the same controls. */
  choose: (page: Page) => Promise<void>;
  /** Told the id of every game this makes, so the caller can take them away. */
  noteGame: (id: string) => void;
}): Promise<() => Promise<void>> {
  const stamp = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const host = { email: `seat-${stamp}@example.test`, name: `Seat ${stamp}` };
  await seedMember(host);
  const hosting = await memberContext(browser, baseURL, host);
  const page = await hosting.newPage();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await openSetUpPage(page, slug);
    await choose(page);
    const posting = (await page.getByTestId("set-up-start").getAttribute("data-press")) === "begin";
    await startAndBegin(page);
    await page.waitForURL(/\/match\//, { timeout: 30_000 });
    noteGame(/match\/([^/?#]+)/.exec(page.url())?.[1] ?? "");
    if (posting) return () => hosting.close();
  }

  await hosting.close();
  expect(false, "five presses and this member never posted a seat of its own").toBe(true);
  throw new Error("unreachable");
}
