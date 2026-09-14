import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A check on the button alone is not a cap.
 *
 * The twenty-game limit was correct about what it counted and wrong about
 * where it was asked: `memberOverActiveLimit` was called from the route that
 * STARTS a game and from nowhere else. A member can acquire a board five
 * ways — creating one, posting an open seat, sitting at somebody else's,
 * being challenged, and forking from a position — and two of those never met
 * the rule. Sitting at a posted seat was the loud one, because answering a
 * posted seat is the cheapest act on the site and open seats are the pile
 * most likely to grow. Claiming a seat from its link was the quiet one: a
 * private game binds nobody at creation, so that route is where the board
 * first becomes somebody's, and it was the one place nobody asked.
 *
 * The rule is one function and it is tested next door. This is about the
 * shape of the bug rather than the bug — a cap enforced at some doors is not
 * a cap, and the next door is added by somebody who has not read this file.
 * So the requirement is mechanical: a module that seats a member asks the
 * rule, in the same file, or it is named here with a reason.
 *
 * Crude on purpose, in the manner of `gameLinks.coverage.test.ts`: it reads
 * the source for the calls that bind somebody to a board. Anything cleverer
 * would need the routes driven, and the route tests beside each door already
 * do that.
 */

/** The calls that end with a member sitting at a board. */
const SEATS_A_MEMBER = /\b(createLiveGame|bindSeat|sitAtOpenSeat)\s*\(/;

/** Asking the one rule that decides this. */
const ASKS_THE_RULE = /\bmemberOverActiveLimit\s*\(/;

/**
 * Named holes, with their reasons. A rule with unexplained exceptions rots;
 * one whose exceptions each say why can be argued with.
 */
const EXEMPT = new Map<string, string>([
  [
    "src/lib/history/liveGameCreate.ts",
    "Writes the row. It is called by the doors and takes the seats already decided — checking here would be the rule asked after the answer mattered, and it has no request to refuse.",
  ],
  [
    "src/lib/history/openGames.ts",
    "The seat claim itself, a conditional update. It asks whether a seat is free and never who is taking it; the doors above it ask about the person.",
  ],
  [
    "src/lib/history/seats.ts",
    "The binding primitive. Same reason: it is the write the doors perform once they have decided, not a decision.",
  ],
  [
    "src/lib/bots/botSeats.ts",
    "A computer player taking a seat. Exempt by design — they exist to always have a seat open, and `memberOverActiveLimit` skips bot ids anyway, so a check here would be a call that can only ever answer null.",
  ],
  [
    "src/lib/bots/botSeriesGame.ts",
    "The bot batch writing a game between two computer players, run in process by `pnpm bots:play` and never reached by a request. Both seats are programs, which `memberOverActiveLimit` skips, so a check here could only ever answer null.",
  ],
]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if ([".ts", ".tsx"].includes(extname(entry.name)) && !entry.name.includes(".test.")) out.push(path);
  }
  return out;
}

const SEATING = ["src/app", "src/lib"]
  .flatMap(filesUnder)
  .map((path) => ({ path, source: readFileSync(path, "utf8") }))
  .filter((file) => SEATS_A_MEMBER.test(file.source));

describe("every door a member gets a board through asks the limit", () => {
  it("finds the doors at all, so an empty sweep cannot pass for a clean one", () => {
    // A regex that matched nothing would make every case below vacuously
    // true — the failure mode this whole file exists to catch, one layer up.
    expect(SEATING.length).toBeGreaterThanOrEqual(4);
  });

  it.each(SEATING.map((file) => file.path))("%s asks, or is a named exception", (path) => {
    const source = SEATING.find((file) => file.path === path)!.source;
    if (EXEMPT.has(path)) {
      expect(ASKS_THE_RULE.test(source), `${path} is exempt but asks anyway — delete the exemption`).toBe(false);
      return;
    }
    expect(
      ASKS_THE_RULE.test(source),
      `${path} seats a member without asking memberOverActiveLimit. One rule, called from every door — ` +
        `add the call, or add this file to EXEMPT with the reason it cannot be over the limit.`,
    ).toBe(true);
  });

  it("covers the three doors a person comes through by name", () => {
    /*
     * `it.each` above proves nothing about a door that has been RENAMED or
     * moved away — the sweep would simply stop seeing it. These three are the
     * paths the ticket names, so they are asserted by path as well.
     */
    for (const door of [
      "src/app/api/games/live/route.ts",
      "src/app/api/games/[id]/sit/route.ts",
      "src/app/games/[slug]/match/[id]/seat/[token]/route.ts",
    ]) {
      const file = SEATING.find((entry) => entry.path === door);
      expect(file, `${door} has moved or stopped seating anybody — find where it went`).toBeDefined();
      expect(ASKS_THE_RULE.test(file!.source), `${door} must ask the limit`).toBe(true);
    }
  });

  /*
   * THE CAP'S COUNT IS A LINK, TO EXACTLY THE GAMES IT COUNTED.
   *
   * It went wrong twice. First it linked to all of /play, the BROWSER's queue —
   * cookie seats, offers, finished games kept — which opened a longer list than
   * it counted. Then it was printed plain, which kept that promise by breaking
   * the rule that a count of games is a link. The answer the rule asks for is
   * the page: `/play?all=seated` lists `seatedLive`, the where the count reads.
   *
   * So three things, each of which one of the two wrong versions failed: every
   * file quoting the count links a number to `SEATED_LIVE_PATH`; the count reads
   * `seatedLive`; and the queue narrows by `seatedLive` too — one definition on
   * both sides, so the number and the rows it opens cannot come apart.
   */
  it("links the cap's count to the /play narrowing that lists exactly what it counted", () => {
    const quoting = ["src/app", "src/components"]
      .flatMap(filesUnder)
      .map((path) => ({ path, source: readFileSync(path, "utf8") }))
      .filter((file) => /\bactiveGameCount\s*\(/.test(file.source));
    expect(quoting.length, "nothing quotes the cap's count — find where the notice went").toBeGreaterThan(0);
    for (const file of quoting) {
      expect(
        /<Link\b[^>]*href=\{SEATED_LIVE_PATH\}[^>]*>[\s\S]{0,200}?\{[^}]+\}[\s\S]{0,80}?<\/Link>/.test(file.source),
        `${file.path} quotes the cap's count without linking it to SEATED_LIVE_PATH — the page listing exactly those games.`,
      ).toBe(true);
    }
    expect(readFileSync("src/lib/history/activeGames.ts", "utf8")).toMatch(/count\(\{\s*where:\s*seatedLive\(/);
    expect(readFileSync("src/lib/history/myGames.ts", "utf8")).toMatch(/\?\s*seatedLive\(memberId\)/);
  });

  it("keeps the counting in one place, so no door grows its own", () => {
    /*
     * The other half of "one rule, one place". A door that reimplemented the
     * count would pass every case above while drifting from the rule — and a
     * cap that means two different things is the bug wearing the fix.
     */
    for (const file of SEATING) {
      if (file.path === "src/lib/history/activeGames.ts") continue;
      expect(
        /status:\s*"active"[\s\S]{0,200}(blackMemberId|whiteMemberId)/.test(file.source),
        `${file.path} looks like it counts active games itself — the count lives in activeGames.ts`,
      ).toBe(false);
    }
  });
});
