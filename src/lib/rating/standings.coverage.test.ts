import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The ladder and the per-game standings count the same games, and this is what
 * keeps it that way.
 *
 * `Player` is a name's record across every game here; `PlayerVariantRating` is
 * the same name's record at ONE game. A rated game belongs in both, so the two
 * must always have counted the same set — and for a while they did not. The
 * writer committed the ladder half in one transaction and the standings half in
 * a second one, so anything that stopped the second left the ladder a game
 * ahead of the standing, permanently and silently. Two computer players reached
 * production one game apart, which also stopped `backfillStreaks.play.test.ts`
 * writing their runs at all.
 *
 * Three rules, and each one closes a door the fault came through:
 *
 *  1. **One writer.** `recordResult.ts` is the only module that may move either
 *     table's figures. A second function that writes one of them is a second
 *     way for them to disagree, whatever care it takes — which is exactly what
 *     `recordVariantResult` was.
 *  2. **One transaction.** That writer sends both tables' updates through a
 *     single `$transaction`. Two calls is the bug back.
 *  3. **Every ending goes through it.** A game can be filed as finished by a
 *     move, a flag, a resignation, or a position nobody can play from. Each of
 *     those must record the result, or say in the source why it does not.
 *
 * Crude on purpose: it reads the source for the shapes that went wrong. A test
 * that ran the endings would need a database and would still only prove the
 * paths it thought to drive — and the fault was in the path nobody drove.
 */

const WRITER = "src/lib/rating/recordResult.ts";

/** The figure columns. A write carrying any of these is a write of a record. */
const FIGURES = ["ratedGames", "computerRatedGames", "wins", "losses", "draws", "rating", "Streak"];

function filesUnder(dir: string, ending: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path, ending));
    else if (entry.name.endsWith(ending) && !entry.name.includes(".test.")) out.push(path);
  }
  return out;
}

const SOURCES = filesUnder("src", ".ts")
  .concat(filesUnder("src", ".tsx"))
  .map((path) => ({ path, source: readFileSync(path, "utf8") }));

/**
 * Writing a NAME onto a record is not writing a record.
 *
 * `members.ts` renames every row a member holds when they change their display
 * name — both tables, by member id, `data: { name }` and nothing else. It moves
 * no figure and can make no disagreement, so it is allowed by this rule rather
 * than excused from it: the test asks what the write CARRIES, not which file it
 * is in.
 */
function writesFigures(call: string): boolean {
  return FIGURES.some((column) => call.includes(column));
}

/** Every `prisma.<table>.update|upsert|updateMany({ … })` in a file, roughly. */
function writeCalls(source: string, table: string): string[] {
  const calls: string[] = [];
  const pattern = new RegExp(`prisma\\.${table}\\.(update|upsert|updateMany|create|createMany)\\b`, "g");
  for (let found = pattern.exec(source); found !== null; found = pattern.exec(source)) {
    // From the call to the end of its argument object, by brace depth.
    let depth = 0;
    let at = found.index;
    for (; at < source.length; at += 1) {
      if (source[at] === "{") depth += 1;
      else if (source[at] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    calls.push(source.slice(found.index, at + 1));
  }
  return calls;
}

/**
 * Whether this code FILES a game as finished, rather than merely mentioning a
 * finished one.
 *
 * The distinction is the whole difficulty. `"finished"` appears all over
 * `src/lib/history` as a `where` clause and as a refusal — "only a finished
 * game can be hidden", "wait until the game is over" — and a first draft of
 * this rule named seven readers and two guards as endings. A gate that cries
 * about nine innocent functions teaches whoever meets it that the gate is
 * noise, which is worse than not having it.
 *
 * So: a `prisma.game.update` whose DATA sets the status to finished, and
 * nothing else.
 */
function filesAGame(body: string): boolean {
  return writeCalls(body, "game").some((call) =>
    /\bstatus:[^\n]*"finished"/.test(call.slice(call.indexOf("data:"))),
  );
}

describe("the two ladders cannot disagree", () => {
  it("lets only one module write either table's figures", () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      if (file.path === WRITER) continue;
      for (const table of ["player", "playerVariantRating"]) {
        for (const call of writeCalls(file.source, table)) {
          if (writesFigures(call)) offenders.push(`${file.path}: ${call.slice(0, 90)}…`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("is one module, and it is there", () => {
    // Without this the rule above passes by the writer having been deleted.
    const writer = SOURCES.find((file) => file.path === WRITER);
    expect(writer).toBeDefined();
    expect(writer?.source).toContain("export async function recordResult(");
  });

  it("sends both tables through one transaction", () => {
    const source = SOURCES.find((file) => file.path === WRITER)?.source ?? "";
    const commits = source.match(/prisma\.\$transaction\(/g) ?? [];
    expect(commits).toHaveLength(1);

    // And that one commit carries both tables' updates.
    const commit = source.slice(source.indexOf("prisma.$transaction("));
    expect(commit).toContain("prisma.player.update");
    expect(commit).toContain("prisma.playerVariantRating.update");
  });

  /**
   * Four endings, and the one that deliberately rates nothing.
   *
   * A game reaches `finished` from a move that wins it, a flag somebody claims,
   * a resignation, and a position with no legal turn in it — a full Reversi
   * board, which has no last move to do the filing and was sitting `active` on
   * production until `settleEnded` was written. Each of those must record the
   * result. `cancelGame` must NOT: a board with no stones on it costs nobody
   * anything, and its own comment says so.
   */
  const NEVER_RATES = new Map([
    ["cancelGame", "a game with no moves in it costs nobody anything — no winner, no rating"],
    ["truncateMoves", "refuses anything but a hot seat, and a game at one screen is never rated"],
  ]);

  it("records a result from every ending that finishes a game", () => {
    const reached: string[] = [];
    const missed: string[] = [];

    for (const file of SOURCES) {
      // Each top-level function, from its declaration to the next one.
      const declarations = [...file.source.matchAll(/^(?:export )?(?:async )?function (\w+)/gm)];
      for (let index = 0; index < declarations.length; index += 1) {
        const name = declarations[index][1];
        const from = declarations[index].index ?? 0;
        const to = declarations[index + 1]?.index ?? file.source.length;
        const body = file.source.slice(from, to);
        if (!filesAGame(body)) continue;
        if (body.includes("recordResult(")) reached.push(name);
        else if (NEVER_RATES.has(name)) reached.push(`${name} (never rates: ${NEVER_RATES.get(name)})`);
        else missed.push(`${file.path} ${name}`);
      }
    }

    // Named rather than counted: a reader has to be able to see WHICH endings
    // this rule is standing over, or the green means nothing.
    expect(missed).toEqual([]);
    /*
     * AND THE PRESENCE, NOT ONLY THE ABSENCE. A regex that matched nothing
     * would leave `missed` empty and report green over a site where no ending
     * recorded anything — the quietest way for a gate to say nothing at all.
     */
    expect(reached.length).toBeGreaterThanOrEqual(5);
  });

  it("reaches the one writer from the endings and from nowhere else", () => {
    const importers = SOURCES.filter((file) => file.source.includes('from "@/lib/rating/recordResult"'));
    expect(importers.map((file) => file.path).sort()).toEqual([
      "src/lib/history/liveGame.ts",
      "src/lib/history/liveGameEndings.ts",
    ]);
  });
});
