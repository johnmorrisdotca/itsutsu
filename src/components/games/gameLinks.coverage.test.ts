import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Nothing is a dead end, and this is what keeps it that way.
 *
 * Two rules, in John's words:
 *
 *   "If you see a name of a game, it's clickable."
 *   "If you see a W/L/T record, each number you see should be clickable —
 *    when it's for this site."
 *
 * And the principle under both: any number that refers to games is a filter
 * somebody already ran. The page had those games in its hands in order to
 * count them; printing the total and dropping the query makes the reader
 * rebuild by hand the question the page has just answered.
 *
 * This exists because both rules were stated, agreed to, and then broken again
 * on the next page somebody wrote — four pages named a game in plain words and
 * three printed a record as a string. A rule that lives only in a review is a
 * rule that holds until the reviewer is busy. So it lives here, and a page
 * that forgets it fails the build.
 *
 * Crude on purpose: it reads the source and looks for the shapes that went
 * wrong. Anything cleverer would need the components rendered, and this is a
 * rule about what the source asks for rather than about pixels.
 *
 * The exceptions are listed by name with their reason, and that is the point
 * of them. A rule with unexplained holes rots; a rule whose three holes each
 * say why they are holes can be argued with.
 */

const ROOTS = ["src/components", "src/app"];

/** The two components every other file goes through, and nothing else. */
const OWNERS = new Set(["GameName.tsx", "GameCount.tsx", "PlayerRecord.tsx"]);

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx") && !OWNERS.has(entry.name)) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({
  path,
  source: readFileSync(path, "utf8"),
}));

/**
 * Whether what is printed here is already inside something clickable.
 *
 * The rule is that a game's name leads to that game, not that it goes through
 * one component: the family line under a game links its siblings to their own
 * ladders, and the learn page links a guide's games to their rules, and both
 * are the rule kept rather than broken. So this looks for an open link around
 * the name rather than for an import.
 *
 * Bounded to what a tag and its attributes can span, so a link four elements
 * earlier cannot vouch for a name that is nowhere near it.
 */
function inside(tag: string, source: string, at: number): boolean {
  const before = source.slice(Math.max(0, at - 400), at);
  const open = before.lastIndexOf(`<${tag}`);
  if (open === -1) return false;
  return open > before.lastIndexOf(`</${tag}>`);
}

function clickable(source: string, at: number): boolean {
  return inside("Link", source, at) || inside("a ", source, at);
}

/**
 * Every place a file prints a game's name into the page.
 *
 * `${...}` is left out on purpose. A name inside a template string is a name
 * inside a SENTENCE — a hover note, a page title, a line of advice — and a
 * link cannot live in a string. Those are the exception the rule always had:
 * "a game named inside a sentence of copy is not a link and cannot be."
 */
function namesPrinted(source: string): number[] {
  const patterns = [
    /(?<!\$)\{\s*variantLabel\(/g,
    /(?<!\$)\{\s*RULE_VARIANT_DISPLAY\[[^\]]+\]\.label\s*\}/g,
  ];
  const found: number[] = [];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match.index);
  }
  return found;
}

describe("a game's name is the way into that game", () => {
  it("has files to check, so a passing run means something", () => {
    // A glob that quietly matched nothing would pass every case below.
    expect(FILES.length).toBeGreaterThan(40);
  });

  it("finds the names that are printed, so the check below is not vacuous", () => {
    // If the patterns ever stop matching, every file becomes compliant at once.
    expect(FILES.filter((file) => namesPrinted(file.source).length > 0).length).toBeGreaterThan(3);
  });

  it("nobody prints a game's name with nothing behind it", () => {
    /*
     * Five pages did exactly this — the waiting room, a member's own games,
     * the local game card, a kept game's line and a finished match's heading.
     * Each named a game, in the ordinary way a page names a game, and led
     * nowhere at all.
     */
    const offenders = FILES.filter((file) =>
      namesPrinted(file.source).some(
        (at) =>
          !clickable(file.source, at) &&
          // A value in a select. An <option> cannot hold a link, and choosing
          // one is itself the way to that game — the same promise kept
          // another way.
          !inside("option", file.source, at),
      ),
    ).map((file) => file.path);

    expect(offenders, "render the name through GameName, which links it").toEqual([]);
  });
});

describe("a count of games is the way into those games", () => {
  it("nobody prints a record as a string", () => {
    /*
     * `recordText` returns "7W · 4L · 1D" — one string, and therefore one
     * thing to click at most, which is not what the rule asks for. It is
     * still right for the plain-text listing, which is text and has no links
     * in it at all, and that lives in lib rather than here.
     */
    const offenders = FILES.filter((file) => /recordText\(/.test(file.source)).map(
      (file) => file.path,
    );
    expect(
      offenders,
      "use RecordFigure from PlayerRecord.tsx, which links each number",
    ).toEqual([]);
  });

  it("every table of records says whose games it is counting", () => {
    /*
     * `of` is how a record says which set of games its numbers came from —
     * whose, which game, which ladder — and a count cannot link without it.
     * Leaving it off is the quiet way to opt out of the rule, so it is
     * required at every call site rather than defaulted to nothing.
     *
     * `of={{ here: false }}` is a valid answer. It says the figures were
     * counted on another site and there is nothing here to open, which is the
     * one honest reason a count does not link.
     */
    const call = /<Record(Cells|Line)\b[\s\S]{0,400}?\/>/g;
    const missing = FILES.flatMap((file) =>
      (file.source.match(call) ?? [])
        .filter((snippet) => !/\bof=\{/.test(snippet))
        .map(() => file.path),
    );
    expect(
      [...new Set(missing)],
      "pass of={{ player, variant, pool, rated }} — or of={{ here: false }} and say why",
    ).toEqual([]);
  });
});

describe("the components the rules are kept in", () => {
  it("GameName links, and says plainly when a game is not ours", () => {
    const source = readFileSync("src/components/games/GameName.tsx", "utf8");
    expect(source).toContain("rulesPath");
    // The exception has to look like an exception, or the rule is a lie.
    expect(source).toContain("game-not-here");
  });

  it("GameCount carries the filter that was counted", () => {
    const source = readFileSync("src/components/games/GameCount.tsx", "utf8");
    for (const filter of ["player", "outcome", "pool", "rated", "variant"]) {
      expect(source, `a count must be able to say ${filter}`).toContain(filter);
    }
  });
});
