import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * QUIET WHILE PLAYING, HELD. See `PlayingNow` for what stays and what goes
 * while a game is played, and why (John, 2026-09-30: "minimal distractions …
 * For all games").
 *
 * Read from the source, like the other layout gates: the promise is "every
 * game", and a new play is exactly the one that would forget.
 */
const read = (path: string) => readFileSync(path, "utf8");

/**
 * A play whose mark is drawn by the component that renders it, with the reason:
 * the card table's every line is in the party pictures' fingerprint
 * (`partyArtFingerprint.ts`), so an edit there asks for pictures that would not
 * change by a pixel.
 */
const DRAWN_BY_CALLER: Readonly<Record<string, string>> = {
  "src/components/party/cards/CardPlay.tsx": "src/components/party/cards/CardGameTable.tsx",
  "src/components/party/hitotsu/HitotsuPlay.tsx": "src/components/party/hitotsu/HitotsuTable.tsx",
};

/** Every play that knows when it is being played: the ones that cover their board at the end (`useWinMoment`). */
function plays(): string[] {
  return execSync("git grep -l 'useWinMoment(' -- 'src/**/*.tsx'", { encoding: "utf8" })
    .split("\n")
    .filter((path) => path !== "" && path !== "src/components/game/WinCover.tsx");
}

describe("quiet while playing", () => {
  it("every play that knows it is being played marks the page quiet while it is", () => {
    const found = plays();
    expect(found.length, "the plays were found").toBeGreaterThan(10);
    const silent = found.filter((path) => !read(path).includes("<PlayingNow on={moment.playing} />") && !(path in DRAWN_BY_CALLER));
    for (const [path, caller] of Object.entries(DRAWN_BY_CALLER)) expect(read(caller), `${path} is quieted by ${caller}`).toContain("<PlayingNow on=");
    expect(silent, "a play that never draws PlayingNow leaves the whole site around its board").toEqual([]);
  });

  it("a puzzle is quiet while its grid is being solved, and only then", () => {
    const solve = read("src/components/puzzles/solveShared.tsx");
    expect(solve).toContain("playing: done === null");
    expect(solve).toContain("<PlayingNow on={pausing.playing} />");
  });

  it("the other sections and New game, the member's figures and the footer's links are what goes", () => {
    const nav = read("src/components/layout/NavLinks.tsx");
    expect(nav).toContain('data-quiet-in-play={item.href === "/play" ? undefined : ""}');
    expect(nav).toMatch(/data-testid="nav-new-game"\s+data-quiet-in-play/);
    expect(read("src/components/layout/MemberStrip.tsx")).toContain("data-quiet-in-play");
    const footer = read("src/components/layout/SiteFooter.tsx");
    expect(footer).toMatch(/data-testid="version-link"\s+data-quiet-in-play/);
    expect(footer).not.toMatch(/<footer[^>]*data-quiet-in-play/);
  });

  it("My games stays, where a game left half way waits, and so does Report a problem", () => {
    expect(read("src/components/layout/SiteHeader.tsx")).not.toMatch(/<nav[^>]*data-quiet-in-play/);
    expect(read("src/components/layout/SiteFooter.tsx")).toMatch(/\n {8}<ReportProblem /);
  });

  it("the wordmark, the account and the trail back stay", () => {
    const header = read("src/components/layout/SiteHeader.tsx");
    expect(header).not.toMatch(/<header[^>]*data-quiet-in-play/);
    expect(header).not.toMatch(/data-testid="account-slot"[^>]*data-quiet-in-play|data-quiet-in-play[^>]*data-testid="account-slot"/);
    expect(read("src/components/games/GameTrail.tsx")).not.toContain("data-quiet-in-play");
  });

  it("the stylesheet hides the quiet furniture only on a board page holding a game being played", () => {
    expect(read("src/app/globals.css")).toMatch(/\[data-strippable\]:has\(\[data-playing-now\]\) \[data-quiet-in-play\] \{\s*display: none;/);
  });
});
