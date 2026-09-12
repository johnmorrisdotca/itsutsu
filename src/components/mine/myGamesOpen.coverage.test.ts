import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { MY_GAME_GROUPS, shownGroup } from "@/lib/history/myGames";
import { MY_GAMES_COPY } from "./mine.constants";

/**
 * "14 · SHOWING 5" HAS TO LEAD TO THE OTHER NINE.
 *
 * The cap on each group of /play was a display cap with nothing behind it: the
 * heading claimed fourteen and there was no way to reach nine of them. That is
 * the Nothing Is A Dead End rule about a count, one layer in — the number is not
 * a link to a filtered page here, because the games it counts are on this page
 * and nowhere else, so the way to them has to be on this page too.
 *
 * WHY THIS IS A SOURCE CHECK RATHER THAN A BROWSER ONE, said plainly. The link
 * only appears on a group that is OVER its cap — six finished games, or
 * twenty-one waiting on you — and no account on a development database has that.
 * A browser spec would have to play six games out to see it, and a spec that
 * quietly skipped instead would report green while checking nothing, which
 * AGENTS.md counts ten of already. So the pure decision is tested for real
 * below, and the wiring that carries it is checked in the shape this codebase
 * already checks .tsx files with.
 */

const LIST = readFileSync(join(process.cwd(), "src/components/mine/MyGamesList.tsx"), "utf8");
const PAGE = readFileSync(join(process.cwd(), "src/app/play/page.tsx"), "utf8");

describe("opening a capped group", () => {
  /*
   * THE DECISION ITSELF, against the real function. Opened means the cap is the
   * length, so `hidden` falls to nought and the heading stops saying "showing" —
   * which is the whole visible behaviour.
   */
  it("shows everything and hides nothing once the cap is the length", () => {
    const games = Array.from({ length: 14 }, (_, index) => index);

    const capped = shownGroup(games, 5);
    expect(capped.items).toHaveLength(5);
    expect(capped.total).toBe(14);
    expect(capped.hidden).toBe(9);

    const opened = shownGroup(games, games.length);
    expect(opened.items).toHaveLength(14);
    expect(opened.total).toBe(14);
    expect(opened.hidden).toBe(0);
    // In order, and the same games — opening is not a different list.
    expect(opened.items.slice(0, 5)).toEqual(capped.items);
  });

  it("says the total in the link, matching the number the heading just claimed", () => {
    expect(MY_GAMES_COPY.showAll(14)).toContain("14");
    expect(MY_GAMES_COPY.shownOf(14, 5)).toContain("14");
    expect(MY_GAMES_COPY.showFewer.trim()).not.toBe("");
  });

  it("the address carries the group, so an opened group can be linked and reloaded", () => {
    expect(PAGE).toMatch(/asked\.all/);
    expect(PAGE).toMatch(/showAll=\{/);
    expect(LIST).toMatch(/href=\{`\/play\?all=\$\{group\}`\}/);
  });

  /*
   * The cap is only lifted for the group that was asked for. Opening all of them
   * at once is the page the cap exists to prevent, and a single flag would have
   * done exactly that.
   */
  it("lifts the cap for one group only", () => {
    expect(LIST).toMatch(/const open = group === opened;/);
    expect(LIST).toMatch(/open \? groups\[group\]\.length : SHOWN\[group\]/);
  });

  /*
   * A group that could be opened and not closed is the one-directional fault only
   * a return trip finds — AGENTS.md's own example is a language you cannot get
   * out of. The way back is drawn only on the group that is open, so it is not a
   * link doing nothing on four other panels.
   */
  it("offers a way back, on the opened group alone", () => {
    expect(LIST).toMatch(/\{open \? \(/);
    expect(LIST).toMatch(/-fewer`\}/);
    expect(LIST).toMatch(/href="\/play"/);
  });

  /*
   * An unknown `?all=` opens nothing rather than throwing. A stale link is not
   * something to put an error in front of a reader for, and the page is the page
   * either way.
   */
  it("checks the group against the real list rather than trusting the address", () => {
    expect(LIST).toMatch(/function openedGroup/);
    expect(LIST).toMatch(/MY_GAME_GROUPS\.find\(\(group\) => group === asked\) \?\? null/);
    expect(MY_GAME_GROUPS.length).toBeGreaterThan(1);
  });

  /*
   * AND NOTHING IS ADDED TO A GROUP WITH NOTHING TO SAY. This is the ordinary
   * case — every group inside its cap — and it is John's daily page: an empty
   * flex row under all five panels would be a gap introduced by a feature that
   * had nothing to offer there.
   */
  it("draws no footer row on a group that is neither capped nor open", () => {
    expect(LIST).toMatch(/\{bucket\.hidden > 0 \|\| open \? \(/);
  });
});
