import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  ALLOWED_FILES,
  ALLOWED_TERMS,
  COPY_TABLES,
  EXCLUDED_PATHS,
  PENDING_PATHS,
  formatPatternsIn,
  judge,
  looksLikeEnglish,
  scan,
  withoutComments,
} from "../../../scripts/check-i18n-strings.mjs";

/**
 * THE PENDING LIST ONLY SHRINKS.
 *
 * `scripts/check-i18n-strings.mjs` (`pnpm i18n:check`) fails on English typed
 * outside the phrase table, except in the paths its `PENDING_PATHS` names,
 * each of which an ENJA ticket (docs/plans/en-ja-everywhere/) will take off.
 * This file is what makes that list a ratchet and not a suggestion.
 *
 * `RECORDED` is the list as it stood on 2026-10-06, when the gate landed. The
 * script's list may not grow past it, and it may not keep a path the script
 * has dropped, so finishing an area is a visible change to BOTH files and an
 * area that was finished cannot quietly come back. A new path here is a
 * decision for John and not for whoever finds the gate in their way: the way
 * out is to put the text through `PHRASES`.
 *
 * Nothing here reads the clock, the network or a database.
 */
const RECORDED = [
  // ENJA-05, game copy tables: every game's rules, tagline, openings, bots and family names. Each folder here holds only what is left of it: the games', openings', bots' and families' own words are done, beside their Japanese.
  "src/lib/famous",
  // ENJA-06, set-up screen, game screen and every ending
  "src/lib/history",
  // ENJA-07, puzzles: the folders are done, and what is left is the stamped screens, named one by one
  // ENJA-10, pages: home, About, Learn, players, history, My account, feed, inbox, join
  "src/app/about",
  "src/components/about",
  "src/lib/learn",
  "src/app/learn",
  "src/app/page.tsx",
  "src/app/players",
  "src/components/players",
  "src/components/mine",
  "src/components/home",
  "src/components/layout",
  "src/components/auth",
  "src/components/inbox",
  "src/components/messages",
  "src/components/ui",
  "src/components/offline",
  "src/components/embed",
  "src/components/famous",
  "src/components/reports",
  "src/lib/site",
  "src/lib/version.ts",
  "src/lib/auth",
  "src/lib/social",
  "src/lib/messages",
  "src/lib/preferences",
  "src/lib/reports",
  "src/app/join",
  "src/app/champions",
  "src/app/me",
  "src/app/stop",
  "src/app/thanks",
  "src/app/releases",
  "src/app/famous",
  "src/app/dice",
  "src/app/play",
  "src/app/history",
  "src/app/not-found.tsx",
  "src/app/layout.tsx",
  "src/app/manifest.ts",
  // ENJA-11, Privacy and Terms (with a native read)
  "src/app/privacy",
  "src/app/terms",
  // ENJA-12, emails
  "src/lib/mail",
  // ENJA-13, API errors a person can see
  "src/app/api",
  "src/proxy.ts",
  "src/lib/phrase",
  "src/lib/api",
  // ENJA-13 also takes the puzzles' refusals
  "src/lib/puzzles/puzzleCheck.ts",
  "src/lib/puzzles/bridges/check.ts",
  "src/lib/puzzles/koushi/check.ts",
  "src/lib/puzzles/cube/check.ts",
  "src/lib/puzzles/freecell/check.ts",
  "src/lib/puzzles/solitaire/check.ts",
  "src/lib/puzzles/spider/check.ts",
  "src/lib/puzzles/meikyuu/check.ts",
  "src/lib/puzzles/pictureLogic/check.ts",
  "src/lib/puzzles/tobiishi/check.ts",
  "src/lib/puzzles/tsunagi/check.ts",
  "src/lib/puzzles/suido/check.ts",
  "src/lib/puzzles/pencil/akari.ts",
  "src/lib/puzzles/pencil/crossSums.ts",
  "src/lib/puzzles/pencil/hitori.ts",
  "src/lib/puzzles/pencil/loop.ts",
  "src/lib/puzzles/pencil/regions.ts",
  "src/lib/puzzles/pencil/shikaku.ts",
  "src/lib/puzzles/jirai/board.ts",
  "src/lib/puzzles/server/puzzleRaceChecks.ts",
  "src/lib/puzzles/server/puzzleRaces.ts",
  // ENJA-13 also takes the party tables' refusals
  "src/lib/party/kept/keptReport.ts",
  "src/lib/party/online/onlineSeats.ts",
  "src/lib/party/online/online.constants.ts",
  "src/lib/party/online/server/tableCreate.ts",
  "src/lib/party/online/server/tableMove.ts",
  "src/lib/party/online/server/tableSeating.ts",
];

const TICKETS = /^ENJA-(?:05|06|07|08|09|10|11|12|13)$/;

describe("the pending list of English outside the phrase table", () => {
  it("never holds a path the recorded list does not", () => {
    const grown = PENDING_PATHS.map((entry) => entry.path).filter((path) => !RECORDED.includes(path));
    expect(grown, "PENDING_PATHS may only shrink: put the text through PHRASES instead of listing its path").toEqual([]);
  });

  it("does not keep a path the script has already dropped", () => {
    const kept = RECORDED.filter((path) => !PENDING_PATHS.some((entry) => entry.path === path));
    expect(kept, "a finished area is off the script's list: take it off RECORDED too").toEqual([]);
  });

  it("names the ticket that takes each path off, once", () => {
    for (const entry of PENDING_PATHS) expect(entry.ticket, entry.path).toMatch(TICKETS);
    const paths = PENDING_PATHS.map((entry) => entry.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("names only paths that exist, and each still holds English", () => {
    const verdict = judge(scan(), PENDING_PATHS, (path) => existsSync(path));
    expect(verdict.missing.map((entry) => entry.path), "no longer exists: take it off the list").toEqual([]);
    expect(verdict.finished.map((entry) => entry.path), "holds no English any more: take it off the list").toEqual([]);
  });

  it("leaves no English outside the list", () => {
    const verdict = judge(scan(), PENDING_PATHS);
    const lines = verdict.violations.map((v) => `${v.file}:${v.line} [${v.kind}] ${v.snippet.slice(0, 80)}`);
    expect(lines).toEqual([]);
  });
});

describe("what the gate looks at", () => {
  const root = mkdtempSync(join(tmpdir(), "enja-gate-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const write = (path: string, source: string) => {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, source);
  };

  it("flags a JSX sentence, a prose attribute, and a literal in a ternary or a list", () => {
    write("src/components/Sample.tsx", [
      "export function Sample({ done }: { done: boolean }) {",
      "  return (",
      '    <section title="Close this window">',
      "      <p>Save your changes before you leave</p>",
      '      <span>{done ? "Saved for later" : "Not saved yet"}</span>',
      "    </section>",
      "  );",
      "}",
      'export const BULLETS = ["The first player may play anywhere on the board."];',
    ].join("\n"));
    const found = scan(root).byFile.get("src/components/Sample.tsx") ?? [];
    expect(found.map((item) => item.kind).sort()).toEqual(["attr:title", "jsx-text", "literal", "literal", "literal"]);
  });

  it("lets a phrase key, a class name, a path and a brand through", () => {
    write("src/components/Quiet.tsx", [
      'import { useSpeaker } from "@/components/i18n/LocaleProvider";',
      "export function Quiet() {",
      "  const speaker = useSpeaker();",
      "  return (",
      '    <a href="/games/play-now" className="rounded-xl border px-3 text-sm" data-testid="play-now" title={speaker.say("nav.play")}>',
      "      Itsutsu 五つ",
      "    </a>",
      "  );",
      "}",
    ].join("\n"));
    expect(scan(root).byFile.get("src/components/Quiet.tsx")).toBeUndefined();
  });

  it("does not read a test, the phrase catalogue or a developer's error", () => {
    write("src/lib/thing.test.ts", 'export const SAYS = "Nobody has played this yet here";');
    write("src/lib/i18n/phrases.sample.constants.ts", 'export const SAYS = "Nobody has played this yet here";');
    write("src/lib/thrower.ts", 'export function boom() { throw new Error("Nobody has played this yet here"); }');
    const files = [...scan(root).byFile.keys()];
    expect(files.filter((file) => /thing\.test|i18n|thrower/.test(file))).toEqual([]);
  });

  it("fails a new sentence outside the list, and passes the same one inside it", () => {
    write("src/lib/newThing/copy.constants.ts", 'export const SAYS = { title: "Nobody has played this yet" };');
    const result = scan(root);
    expect(judge(result, []).violations.map((v) => v.file)).toContain("src/lib/newThing/copy.constants.ts");
    const covered = judge(result, [{ path: "src/lib/newThing", ticket: "ENJA-05" }]);
    expect(covered.violations.filter((v) => v.file.startsWith("src/lib/newThing"))).toEqual([]);
    expect(covered.counts.get("src/lib/newThing")).toBe(1);
  });

  it("calls a pending path with nothing left in it finished, and a missing one missing", () => {
    const verdict = judge({ byFile: new Map() }, [{ path: "src/gone", ticket: "ENJA-05" }], () => false);
    expect(verdict.finished.map((entry) => entry.path)).toEqual(["src/gone"]);
    expect(verdict.missing.map((entry) => entry.path)).toEqual(["src/gone"]);
  });
});

describe("what counts as English", () => {
  it("reads prose and short Title Case copy as English", () => {
    for (const text of ["Save your changes", "Not connected", "Display name", "You have not played yet."]) {
      expect(looksLikeEnglish(text), text).toBe(true);
    }
  });

  it("does not read identifiers, paths, acronyms, brands or coordinates as English", () => {
    for (const text of ["rounded-xl border-line", "/games/play-now", "GET", "POST", "Itsutsu", "XP", "e5", "h10", "data-testid", "SGF"]) {
      expect(looksLikeEnglish(text), text).toBe(false);
    }
  });

  it("gives every allowance a reason", () => {
    for (const [term, reason] of ALLOWED_TERMS) expect(reason.length, term).toBeGreaterThan(10);
    for (const [path, reason] of EXCLUDED_PATHS) expect(reason.length, path).toBeGreaterThan(10);
    for (const [path, reason] of ALLOWED_FILES) expect(reason.length, path).toBeGreaterThan(10);
    for (const [path, reason] of COPY_TABLES) expect(reason.length, path).toBeGreaterThan(10);
  });

  it("names only files that exist among the allowances", () => {
    for (const path of [...ALLOWED_FILES.keys(), ...COPY_TABLES.keys()]) expect(existsSync(path), path).toBe(true);
  });
});

/*
 * DATES, NUMBERS AND COUNTS (ENJA-04). Three patterns that are not sentences but
 * keep a reader from their language: a date or a number formatted by a locale
 * typed into the code or by the runtime's own, a plural made by hand, and a
 * figure counted with no locale. They count against a pending path like a
 * sentence does, and fail anywhere else.
 */
describe("what the gate sees in dates, numbers and counts", () => {
  const kinds = (source: string) => formatPatternsIn(source).map((item) => item.kind);

  it("flags a locale typed in, and the runtime's own", () => {
    expect(kinds('const a = xp.toLocaleString("en-US");')).toEqual(["locale"]);
    expect(kinds('const a = new Date(iso).toLocaleDateString("en-GB", { day: "numeric" });')).toEqual(["locale"]);
    expect(kinds("const a = at.toLocaleTimeString();")).toEqual(["locale"]);
    expect(kinds("const a = xp.toLocaleString(undefined);")).toEqual(["locale"]);
  });

  it("does not flag the other toLocale methods, which are about letters and not about a reader", () => {
    expect(kinds("const a = word.toLocaleLowerCase();")).toEqual([]);
  });

  it("flags every shape of hand-built plural the site had", () => {
    for (const source of [
      'const a = `${n} ${n === 1 ? "game" : "games"}`;',
      'const a = `${n} game${n === 1 ? "" : "s"}`;',
      'const a = `${n} game${n !== 1 ? "s" : ""}`;',
      'const a = `${n} game${n > 1 ? "s" : ""}`;',
      'const a = n === 1 ? "1 move" : `${n} moves`;',
      "const a = n === 1 ? `a ${one}` : `${n} ${many}`;",
      'if (n === 1) return "a card";',
      'const a = noun + "s";',
    ]) {
      expect(kinds(source), source).toEqual(["plural"]);
    }
  });

  it("does not flag a comparison with 1 that picks no text", () => {
    for (const source of [
      "const a = people.length === 1 ? people[0] : null;",
      "const a = n === 1 ? 0 : (1 - 2 * top) / (n - 1);",
      "const a = count > 1 ? ` calc(${x})` : 0;",
      "const a = row % 2 === 1 ? SEED_STEP / 2 : 0;",
      "const a = seat === 1 ? SIDES.black : SIDES.white;",
    ]) {
      expect(kinds(source), source).toEqual([]);
    }
  });

  it("flags a count with no locale, and passes one that has it", () => {
    expect(kinds("const a = countText(total);")).toEqual(["no-locale"]);
    expect(kinds("const a = countText(Math.min(a, b));")).toEqual(["no-locale"]);
    expect(kinds("const a = countText(total, say.locale);")).toEqual([]);
    expect(kinds("const a = countText(Math.min(a, b), locale);")).toEqual([]);
    expect(kinds("export function countText(value: number, locale: Locale = 'en') {}")).toEqual([]);
  });

  it("passes the helpers that replace them", () => {
    expect(kinds('const a = say.count("count.move", record.length);')).toEqual([]);
    expect(kinds("const a = say.number(xp);")).toEqual([]);
    expect(kinds('const a = say.day(day, "short");')).toEqual([]);
  });

  it("reads code and not a comment about the code", () => {
    expect(kinds('// the old way: n === 1 ? "game" : "games"\nconst a = 1;')).toEqual([]);
    expect(kinds('/* xp.toLocaleString("en-US") was here */ const a = 1;')).toEqual([]);
    expect(withoutComments('const url = "https://x.test/a"; // a note').trimEnd()).toBe('const url = "https://x.test/a";');
  });

  it("names the line, so a failure can be opened", () => {
    const found = formatPatternsIn('const a = 1;\nconst b = `${n} game${n === 1 ? "" : "s"}`;');
    expect(found.map((item) => item.line)).toEqual([2]);
  });

  it("counts a file's patterns against its pending path, and fails them anywhere else", () => {
    const root = mkdtempSync(join(tmpdir(), "enja-gate-format-"));
    try {
      const full = join(root, "src/lib/newThing/counts.ts");
      mkdirSync(join(full, ".."), { recursive: true });
      writeFileSync(full, 'export const moves = (n: number) => `${n} ${n === 1 ? "move" : "moves"}`;');
      const result = scan(root);
      expect(judge(result, []).violations.map((v) => `${v.file} ${v.kind}`)).toEqual(["src/lib/newThing/counts.ts plural"]);
      const covered = judge(result, [{ path: "src/lib/newThing", ticket: "ENJA-06" }]);
      expect(covered.violations).toEqual([]);
      expect(covered.counts.get("src/lib/newThing")).toBe(1);
      expect(covered.patterns.get("src/lib/newThing")).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
