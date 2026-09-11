import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * NOTHING COMES OUT OF THE NAVIGATION UNTIL WHAT IT POINTED AT IS REACHABLE
 * FROM ITS NEW HOME, AND THIS IS WHAT SETTLES THAT.
 *
 * Three rows were removed when a game became one address with facets under it:
 * Rules and Learn from the header, Rules and Every game from the colophon. Each
 * of them was the way to something real, and "it is reachable now" left as a
 * judgement is made by the same person doing the removing, in the same minute
 * — which is exactly how a page quietly becomes unreachable while everybody
 * believes it was moved.
 *
 * So each removal has a test here that FAILS IF THE NEW ROUTE IN GOES AWAY,
 * and every one of them was written and watched to fail before the row it
 * covers came out. The precedent is `gameFrontDoor.coverage.test.ts`, written
 * the same way before the Champions row left the footer.
 *
 * Crude on purpose, like its neighbours: it reads the source and looks for the
 * corridor. Anything cleverer would need the pages rendered, and this is a rule
 * about what the source leads to rather than about pixels.
 */

const GAMES_ROOT = "src/app/games/page.tsx";
const CATALOGUE = "src/components/games/GameCatalogue.tsx";
const GAME_PAGE = "src/app/games/[slug]/page.tsx";
const NAV = "src/components/layout/NavLinks.tsx";
const FOOTER = "src/components/layout/SiteFooter.tsx";
const GAME_NAME = "src/components/games/GameName.tsx";

const read = (path: string) => readFileSync(path, "utf8");

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

/** Every page and component, for the sweep at the bottom of this file. */
const FILES = ["src/components", "src/app"]
  .flatMap(filesUnder)
  .map((path) => ({ path, source: readFileSync(path, "utf8") }));

describe("the rules are reachable without a Rules link", () => {
  /*
   * WHAT THE REMOVED ROWS POINTED AT. /rules was an index of forty rules
   * pages, in the header and in the colophon. Both rows are gone and the
   * index is gone with them, so the rules of a game are now reached the only
   * way that makes sense: through the game.
   */
  it("every game's name leads to that game", () => {
    /*
     * The hinge of the whole move. `GameName` is what every list, every record
     * row and every family card renders a game's name through, and it used to
     * send them all to `rulesPath` because the rules page was the front door.
     * The front door is the game itself now.
     */
    expect(read(GAME_NAME), "a game's name leads to the game, not to a document about it").toContain(
      "href={gamePath(known)}",
    );
    // The href, not the word: the comment beside it explains what it used to be.
    expect(read(GAME_NAME), "and not to the rules page it used to").not.toContain("href={rulesPath");
  });

  it("a game's own page leads to its rules", () => {
    // The corridor the Rules row used to be. If this goes, the rules of every
    // game become unreachable except by typing an address.
    expect(read(GAME_PAGE), "the game's page must link its rules").toContain("rulesPath(variant)");
  });

  it("the games themselves are reachable from /games, every way of looking", () => {
    /*
     * And /games is in the header, which is what makes the chain whole:
     * Games → a game → its rules. Each view of the catalogue names games
     * through `GameName`, so each one leads to the games it lists.
     */
    const catalogue = read(CATALOGUE);
    expect(catalogue, "the catalogue names games through GameName").toContain("GameName");
    expect(read(GAMES_ROOT), "and /games mounts the catalogue").toContain("<GameCatalogue");
    expect(read(NAV), "and /games is in the navigation").toContain('href: "/games"');
  });

  it("the plain list is a view of /games, not a page the colophon had to name", () => {
    /*
     * The Every game row pointed at /games/all. It is a view now, and the
     * switch that reaches it is on the page itself — so the row in the
     * colophon is no longer the only way in, and could come out.
     */
    expect(read(CATALOGUE), "the catalogue must offer the plain list").toContain("<GameList");
    expect(read(CATALOGUE), "through a switch a reader can see").toContain("catalogue-view");
  });
});

describe("the learning shelf is reachable without a Learn link", () => {
  it("/games offers it, prominently, in its own section", () => {
    /*
     * The condition John set for taking Learn out of the bar: it is offered
     * from /games rather than merely mentioned somewhere. A guide is wanted at
     * the moment somebody has met a game, and that is this page.
     *
     * Asserted on the section AND on the link, because a link on its own could
     * be a word buried in a paragraph — which is the thing a prominent offer is
     * not.
     */
    const source = read(GAMES_ROOT);
    expect(source, "a section of its own on the games page").toContain('data-testid="games-learn"');
    expect(source, "and it leads to the shelf").toContain('href="/learn"');
  });

  it("the lessons keep their own addresses", () => {
    // Only the index's route into the site moved. /learn/<slug> is untouched,
    // and a game's rules page still names the guides that cover it.
    expect(read("src/app/learn/[slug]/page.tsx"), "a lesson is still at /learn/<slug>").toContain(
      "PageProps<\"/learn/[slug]\">",
    );
    expect(read("src/app/games/[slug]/rules/page.tsx"), "and a game's rules still name its guides").toContain(
      "/learn/${guide.slug}",
    );
  });
});

describe("the rows that came out, and the shape of what is left", () => {
  /*
   * These are last on purpose. They are the only tests in this file that
   * assert an ABSENCE, and an absence is only safe once everything above it is
   * green — which is the order the work was done in.
   */
  it("the navigation is Play, Games, Players, About", () => {
    const source = read(NAV);
    expect(source, "Rules is a facet of a game now").not.toContain('href: "/rules"');
    expect(source, "Learn is offered from /games").not.toContain('href: "/learn"');
    for (const href of ["/play", "/games", "/players", "/about"]) {
      expect(source, `${href} stays in the bar`).toContain(`href: "${href}"`);
    }
  });

  it("the colophon is Games, Record, Players, About", () => {
    const source = read(FOOTER);
    expect(source, "there is no /rules to link to").not.toContain('"/rules"');
    expect(source, "and /games/all is a view, not a page").not.toContain('"/games/all"');
    for (const href of ["/games", "/history", "/players", "/about"]) {
      expect(source, `${href} stays in the colophon`).toContain(`"${href}"`);
    }
  });

  it("no page anywhere still points into the namespaces that were removed", () => {
    /*
     * The check that catches the link somebody forgot. There are no redirects
     * — that is a standing rule here, and deliberate — so a leftover /rules or
     * /games/all href is a 404 rather than a detour, and nothing at runtime
     * would say so.
     */
    const stale = /href=(?:"|\{")\/(rules|champions\/|games\/all)/;
    const offenders = FILES.filter((file) => stale.test(file.source)).map((file) => file.path);
    expect(offenders, "those addresses no longer exist and nothing redirects from them").toEqual([]);
  });
});
