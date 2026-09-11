import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A game's page is the front door, and this is what keeps it one.
 *
 * John, standing on the old /rules/connect-six, listed what a game's page owes
 * a reader: the rules, who is best at it, the standings, his own record at it,
 * a way to challenge the people who played it, the games already played, and
 * a way to start one. "That should all be done through the Game page."
 *
 * THE FRONT DOOR IS NOW THE GAME'S OWN PAGE, at /games/<slug>, and that is
 * what this file had to be re-pointed at. It used to be the RULES page, and
 * for a good reason at the time: `GameName` sent every game name on this site
 * to `rulesPath`, so every list, every record row and every family card landed
 * there whether or not anybody designed it that way, and the panels below were
 * brought to it because that was where the readers already were.
 *
 * That was the right fix under the old addresses and the wrong shape — a
 * document doing a hub's job. A game is one address with its facets underneath
 * now, `GameName` points at the game, and the panels moved one segment up with
 * the readers. The corridors are what these check, because the corridors are
 * what went missing.
 */

const GAME_PAGE = "src/app/games/[slug]/page.tsx";
const LADDER = "src/components/games/GameLadder.tsx";
const FAMILY = "src/components/games/GameFamily.tsx";
const STANDINGS = "src/app/games/[slug]/standings/page.tsx";
const FOOTER = "src/components/layout/SiteFooter.tsx";

const read = (path: string) => readFileSync(path, "utf8");

describe("a game's own page answers what was asked of it", () => {
  it("carries the ladder", () => {
    // Who is best at it, where everybody stands, and the reader's own record:
    // three of the seven, all of them in this one panel.
    expect(read(GAME_PAGE), "the game's page must mount GameLadder").toContain("<GameLadder");
  });

  it("carries the family, so a game that is not for you is not a dead end", () => {
    /*
     * "Decide that this game isn't one I want to play, but the Variant it
     * mentions is." The code for this once existed on the board page and on
     * the ladder page and on neither of the pages a game's name led to.
     */
    expect(read(GAME_PAGE), "the game's page must mount GameFamily").toContain("<GameFamily");
    expect(read(FAMILY), "a sibling leads to that sibling's own page").toContain("GameName");
  });

  it("carries the games already played, and starting a new one", () => {
    const source = read(GAME_PAGE);
    expect(source, "the played-games panel from 0.122.0, reused where it stands").toContain("<PlayedHere");
    /*
     * `playPath` rather than `gamePath`, and the change is the whole move in
     * one line. /games/<slug> WAS a board, so "the way onto a board" and "the
     * game's address" were the same string; the board is at /games/<slug>/play
     * now and the game's address is the page this test is about.
     */
    expect(source, "and the way onto a board").toContain("playPath(variant)");
  });

  it("offers a game to the people it lists, where it lists them in full", () => {
    /*
     * "Every opponent you are shown offers what you would want to do about
     * them" — this repo's own checklist. A ladder is a list of opponents
     * wearing a ranking, and it named ten people and offered nothing.
     *
     * THE OFFER MOVED WITH THE TABLE, which is the part worth pinning. The
     * panel on a game's page is a SIDE-VIEW now — rank, player, rating, in a
     * column 288px wide — because John said so in as many words: "it should be
     * a side-view so not the real view you see in a full page obviously... less
     * columns". A column of actions does not belong in that, so it lives on the
     * whole ladder, which the side-view links to.
     *
     * Both halves are checked, because either one alone is the failure: the
     * actions with nothing leading to them is a page nobody reaches, and the
     * side-view with no destination is the dead end this site has a gate
     * against. What must NOT happen is the affordance quietly disappearing
     * because a narrow column could not hold it.
     */
    expect(read(STANDINGS), "through the same component the directory uses").toContain("PlayerActions");
    expect(read(LADDER), "and the side-view leads to where they are offered").toContain(
      "standingsPath(variant)",
    );
  });
});

describe("the ladder does not break the build it sits in", () => {
  it("reads the database only at request time", () => {
    /*
     * THE LANDMINE, and it has gone off once already: the game's page declares
     * `generateStaticParams` and no `export const dynamic`, so its shell is
     * prerendered — and a database read in a prerendered page asks at build
     * time a question only a running site can answer. The build died on
     * /rules/drop-four with "Can't reach database server" and nothing
     * deployed at all. The address moved; the landmine did not.
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
    expect(read(GAME_PAGE), "the shell of this page is still prerendered").toContain(
      "generateStaticParams",
    );
    expect(read(LADDER), "so the ladder must wait for a request").toContain("await connection()");
  });

  it("shows nothing about people to a reader with no invite", () => {
    /*
     * A GAME'S PAGE IS OPEN WITHOUT AN INVITE, and that is exactly why this
     * check matters more than it did. John's rule is that reading is open and
     * playing is gated, so /games/<slug> is now reachable by anybody — while
     * a ladder is members' names, their ratings and their records, which is
     * the site's data rather than its documentation.
     *
     * `PlayerName` prints "Hanako M." and links to /players/hanako-morris, so
     * the whole name is still in the markup: a ladder drawn for a stranger
     * would publish a surname. So the panel asks who is reading, and names
     * nobody to a reader with no session.
     *
     * IT ASKS FOR THE SESSION, NOT THE ADDRESS, and this check used to pin the
     * opposite — it required the literal line `if (mine === null) return null;`
     * where `mine` came from `currentEmail()`. That is null for a browser
     * holding an INVITE, which is how everybody John invites gets in, so the
     * panel was hidden from members while the test called it privacy. A test
     * that pins an implementation pins its bugs too; this one states the rule.
     *
     * What a stranger gets instead of the table is a sentence and the door.
     * An empty table would be the dishonest version of John's empty-table rule:
     * it would say nobody has played this game, when people have.
     */
    const source = read(LADDER);
    expect(source, "the ladder asks who is reading").toContain("currentSession()");
    expect(source, "and decides on the session rather than on an address").toMatch(
      /if \(session === null\)/,
    );
    expect(source, "naming nobody to a stranger, and saying why").toContain("game-ladder-shut");
    expect(
      source.slice(0, source.indexOf("if (session === null)")),
      "and it asks before it reads anything about anybody",
    ).not.toContain("fetchVariantLeaders(");
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
    expect(read(LADDER), "the panel links through to /games/<slug>/standings").toContain(
      "standingsPath(variant)",
    );
    expect(read(GAME_PAGE), "and the panel is on the page every game name leads to").toContain(
      "<GameLadder",
    );
  });

  it("the champions index is linked from somewhere that is not the footer", () => {
    /*
     * The site-wide ladder on /players carries it, and the catalogue's plain
     * list leads to every game's own standings. Neither is the colophon, so
     * the row at the foot of every page is not load-bearing and can come out.
     */
    const elsewhere = [
      "src/components/players/Ladder.tsx",
      "src/components/games/GameList.tsx",
    ].filter((path) => /\/champions|standingsPath/.test(read(path)));
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
