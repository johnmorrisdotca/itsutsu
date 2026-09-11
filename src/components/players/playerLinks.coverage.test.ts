import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A link to a person is built from their id, not from their name.
 *
 * John, on his twelve-year-old daughter: "links can still be full name but
 * maybe links to people might need to be the guids?"
 *
 * WHY A GATE AND NOT A HABIT. `shownName` shipped at 0.121.0 and prints
 * "Hanako M." wherever a member is named. It was defeated the same day by the
 * href underneath it, which read /players/hanako-morris — the whole surname,
 * in the markup, on pages a stranger may read. Shortening a name on screen
 * does nothing while the address under it is whole, and the two live in
 * different lines of the same component, so they drift apart silently.
 *
 * AND BECAUSE THE LAST HALF-FINISHED VERSION OF THIS COST A CHILD HER RECORD.
 * `memberId` was added to the rating tables in 0.73.0 and 0.75.0, populated,
 * indexed — and the lookups were never moved onto it. Nothing broke until
 * somebody renamed, and then their seven games read as "0 games played". The
 * failure mode of this kind of change is not a crash; it is one more caller
 * that nobody moved, waiting for the first row where the two disagree. So the
 * requirement is mechanical rather than remembered.
 *
 * Crude on purpose, in the manner of `gameLinks.coverage.test.ts`: it reads
 * the source for links to people and asks whether an id went with them.
 */

/** Building an address for a person. */
const LINKS_A_PERSON = /\bplayerPath\s*\(|<PlayerName\b|<PlayerLink\b/;

/** An id going with it, however the caller writes it. */
const CARRIES_AN_ID = /memberId\s*[=:]|playerPath\s*\([^)]*,/;

/**
 * Named holes, with their reasons. A rule with unexplained exceptions rots;
 * one whose exceptions each say why can be argued with.
 */
const EXEMPT = new Map<string, string>([
  [
    "src/lib/legacy/legacyPlayers.data.ts",
    "A kept record folded into a live member, in a pure data module with no database to ask. It holds a name-key and nothing else, and the name address still resolves — see the fallback in playerPath.",
  ],
  [
    "src/components/players/PlayerName.tsx",
    "The component itself: it takes the id and builds the address. It is what the rule is about, not a caller of it.",
  ],
  [
    "src/components/players/Standings.tsx",
    "Defines PlayerLink and also uses it, passing the standing's memberId. The definition is what the rule is about.",
  ],
  [
    "src/components/game/PlayerNames.tsx",
    "Names typed into a hot-seat game at one screen. Nobody is behind them — there is no member to link to and the component does not link at all.",
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

const LINKING = ["src/app", "src/components", "src/lib"]
  .flatMap(filesUnder)
  .map((path) => ({ path, source: readFileSync(path, "utf8") }))
  .filter((file) => LINKS_A_PERSON.test(file.source));

describe("every link to a person is built from their id", () => {
  it("finds the links at all, so an empty sweep cannot pass for a clean one", () => {
    // A pattern that matched nothing would make every case below vacuously
    // true — the failure this whole file exists to catch, one layer up.
    expect(LINKING.length).toBeGreaterThanOrEqual(8);
  });

  it.each(LINKING.map((file) => file.path))("%s carries an id, or is a named exception", (path) => {
    const source = LINKING.find((file) => file.path === path)!.source;
    if (EXEMPT.has(path)) return;
    expect(
      CARRIES_AN_ID.test(source),
      `${path} links to a person without their id, so the address is built from their NAME. ` +
        `Pass memberId — or add this file to EXEMPT with the reason nobody is behind the name.`,
    ).toBe(true);
  });

  it("every exception is a file that still exists", () => {
    // An exception left behind after its file is renamed is a hole nobody
    // knows is open.
    for (const path of EXEMPT.keys()) {
      expect(() => readFileSync(path, "utf8"), `${path} is exempted and is not there`).not.toThrow();
    }
  });

  it("the address helper prefers the id and keeps the name as the fallback", () => {
    /*
     * Stated here as well as in the helper, because the fallback is the part
     * somebody would delete while tidying: a record with nobody behind it — a
     * name typed at one screen, a record kept from another site — has only a
     * name, and its address has to go on working.
     */
    const source = readFileSync("src/lib/rating/playerKey.ts", "utf8");
    expect(source, "playerPath must take an id").toMatch(/playerPath\([\s\S]*?memberId/);
    expect(source, "and still answer for a name with nobody behind it").toContain("playerSlug(name)");
  });
});
