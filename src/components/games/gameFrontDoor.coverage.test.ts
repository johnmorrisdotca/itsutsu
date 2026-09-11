import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A game's page is the front door, and this is what keeps it one.
 *
 * John, standing on /rules/connect-six, listed what a game's page owes a
 * reader: the rules, who is best at it, the standings, his own record at it,
 * a way to challenge the people who played it, the games already played, and
 * a way to start one. "That should all be done through the Game page."
 *
 * The front door is the RULES page, and that is a fact about the code rather
 * than a preference. `GameName` sends every game name on this site to
 * `rulesPath`, and `gameLinks.coverage.test.ts` fails the build when a page
 * names a game any other way — so every list, every record row and every
 * family card lands here whether or not anybody designed it that way. A
 * second, better-built hub that nothing points at is not a second front door;
 * it is a room with no corridor to it, which is exactly what /champions/<slug>
 * had become.
 *
 * These check the corridors, because the corridors are what went missing.
 */

const RULES_PAGE = "src/app/rules/[slug]/page.tsx";
const LADDER = "src/components/games/GameLadder.tsx";
const FAMILY = "src/components/games/GameFamily.tsx";
const FOOTER = "src/components/layout/SiteFooter.tsx";

const read = (path: string) => readFileSync(path, "utf8");

describe("a game's own page answers what was asked of it", () => {
  it("carries the ladder", () => {
    // Who is best at it, where everybody stands, and the reader's own record:
    // three of the seven, all of them in this one panel.
    expect(read(RULES_PAGE), "the rules page must mount GameLadder").toContain("<GameLadder");
  });

  it("carries the family, so a game that is not for you is not a dead end", () => {
    /*
     * "Decide that this game isn't one I want to play, but the Variant it
     * mentions is." The code for this existed on /games/<slug> and on
     * /champions/<slug> and on neither of the pages a game's name leads to.
     */
    expect(read(RULES_PAGE), "the rules page must mount GameFamily").toContain("<GameFamily");
    expect(read(FAMILY), "a sibling leads to that sibling's own page").toContain("GameName");
  });

  it("carries the games already played, and starting a new one", () => {
    const source = read(RULES_PAGE);
    expect(source, "the played-games panel from 0.122.0, reused where it stands").toContain("<PlayedHere");
    expect(source, "and the way onto a board").toContain("gamePath(variant)");
  });

  it("offers a game to the people it lists", () => {
    /*
     * "Every opponent you are shown offers what you would want to do about
     * them" — this repo's own checklist. A ladder is a list of opponents
     * wearing a ranking, and it named ten people and offered nothing.
     */
    expect(read(LADDER), "through the same component the directory uses").toContain("PlayerActions");
  });
});

describe("the ladder does not break the build it sits in", () => {
  it("reads the database only at request time", () => {
    /*
     * THE LANDMINE, and it has gone off once already: /rules/[slug] declares
     * `generateStaticParams` and no `export const dynamic`, so its shell is
     * prerendered — and a database read in a prerendered page asks at build
     * time a question only a running site can answer. The build died on
     * /rules/drop-four with "Can't reach database server" and nothing
     * deployed at all.
     *
     * `connection()` is Next 16's request-time boundary: the docs say
     * "prerendering stops here", and everything after it runs per request.
     * `PlayedHere` has carried one since that outage; anything else on this
     * page that touches the database needs the same.
     *
     * Asserted rather than assumed, because the failure is a production build
     * failure rather than a test failure — nothing local tells you, since the
     * database IS reachable while you build on your own machine.
     */
    expect(read(RULES_PAGE), "the shell of this page is still prerendered").toContain(
      "generateStaticParams",
    );
    expect(read(LADDER), "so the ladder must wait for a request").toContain("await connection()");
  });

  it("shows nothing about people to a reader with no invite", () => {
    /*
     * `/rules` is an OPEN PATH in `proxy.ts`, and the reason written there is
     * exact: those pages "render nothing a visitor wrote, hold no data". A
     * ladder is members' names, their ratings and their records. Moving it
     * onto the rules page must not quietly move the gate with it.
     */
    const source = read(LADDER);
    expect(source, "the ladder asks who is reading").toContain("currentEmail()");
    expect(source, "and shows nothing at all to a reader with no session").toMatch(
      /if \(mine === null\) return null;/,
    );
  });
});

describe("the ladders are reachable without the footer", () => {
  /*
   * THE ORDERING CONDITION, and the reason this file was written before the
   * Champions row came out of the colophon rather than after.
   *
   * "Nothing is removed until what it pointed at is genuinely reachable from
   * a game's page." Left as a judgement, that judgement gets made by the same
   * person doing the removing, in the same minute — which is how a page
   * quietly becomes unreachable while everybody believes the opposite. So it
   * is a test, and it fails if the ladder ever leaves a game's page.
   */
  it("a game's own page leads to that game's whole ladder", () => {
    expect(read(LADDER), "the panel links through to /champions/<slug>").toContain("championsPath(variant)");
    expect(read(RULES_PAGE), "and the panel is on the page every game name leads to").toContain(
      "<GameLadder",
    );
  });

  it("the champions index is linked from somewhere that is not the footer", () => {
    /*
     * The site-wide ladder on /players carries it, and /games/all lists every
     * game's. Neither is the colophon, so the row at the foot of every page is
     * not load-bearing and can come out.
     */
    const elsewhere = [
      "src/components/players/Ladder.tsx",
      "src/app/games/all/page.tsx",
    ].filter((path) => /\/champions|championsPath/.test(read(path)));
    expect(elsewhere.length, "something other than the footer must lead to the ladders").toBeGreaterThan(0);
  });

  it("the footer no longer carries Champions", () => {
    /*
     * Removed because it was the ONLY route to the per-game ladders, which is
     * the opposite of what a colophon is for: the page that answered a game's
     * whole errand was reachable only from a word at the bottom of every other
     * page. It is not deleted, it is moved to where the question is asked.
     *
     * The two tests above are its precondition, and they were written and
     * watched to fail before the row came out — so if this file is ever green
     * while a game's page has no ladder on it, that is a bug in these tests
     * rather than permission to have removed the link.
     */
    expect(read(FOOTER), "Champions belongs on a game's page, not in the colophon").not.toContain(
      '"/champions"',
    );
  });
});
