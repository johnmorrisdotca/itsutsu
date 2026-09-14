import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * "SIGNED IN" MEANS HOLDING A SESSION; WHO SOMEBODY IS MEANS THEIR MEMBER ID.
 *
 * Everybody John invites comes in with a code, and a code redeemed without
 * Google behind it makes a session with no address and no member row. Five
 * pages decided "signed in" by asking for the address — `email !== null`,
 * `Boolean(me?.email)` — so those people were shown the set-up screen with every
 * choice inert, the lobby sentence offering only a board at one screen, and a
 * line telling them to sign in, under a masthead offering to sign them out.
 * /games had been fixed for exactly this once already, a level up, and the
 * sentence inside it kept the old question.
 *
 * `currentReader()` is the one answer now: `signedIn` for what a session
 * allows, `hasAccount` for what only an account does (a challenge, a buddy, an
 * ignore, applause, a board saved to the account — every one of those routes
 * answers 401 to a caller with no address), and `memberId` for who somebody is.
 *
 * So this reads the source, in the manner of `gameLinks.coverage.test.ts`, and
 * holds three things:
 *
 *  - every `signedIn` a component is handed comes from the reader, or is the
 *    prop handed on from a parent that was;
 *  - every account-only switch (`canAsk`, `savesToAccount`, `hasAccount`) comes
 *    from `reader.hasAccount`, or is handed on;
 *  - no isYou, isBuddy or ignoring decision compares an address.
 *
 * Every exception is a line with its reason, so a hole can be argued with.
 */

const ROOTS = ["src/app", "src/components", "src/lib"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|coverage)\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, source: readFileSync(path, "utf8") }));

type Given = { path: string; line: number; expression: string };

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

/** The text of a `{…}` starting just after its opening brace, braces balanced. */
function braced(source: string, start: number): string {
  let depth = 1;
  for (let at = start; at < source.length; at += 1) {
    if (source[at] === "{") depth += 1;
    if (source[at] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, at);
  }
  return source.slice(start);
}

/** Written as a type rather than a value: `signedIn: boolean` inside an inline props type. */
const TYPE_ONLY = /^(boolean|string|number)\b/;

/**
 * Every value a prop or field of this name is given, anywhere in the source:
 * `name={…}` on an element, `name: …` in an object, and a bare `name` on an
 * element, which JSX reads as `true`.
 */
function valuesGiven(name: string): Given[] {
  const found: Given[] = [];
  for (const { path, source } of FILES) {
    for (const match of source.matchAll(new RegExp(`\\b${name}=\\{`, "g"))) {
      const expression = braced(source, match.index + match[0].length).replace(/\s+/g, " ").trim();
      found.push({ path, line: lineOf(source, match.index), expression });
    }
    for (const match of source.matchAll(new RegExp(`(?<![\\w.?])${name}:\\s*([^,;\\n}]+?)\\s*(?=,|\\n|\\})`, "g"))) {
      const expression = match[1].trim();
      if (TYPE_ONLY.test(expression)) continue;
      found.push({ path, line: lineOf(source, match.index), expression });
    }
    for (const match of source.matchAll(new RegExp(`(?<=\\s)${name}(?=\\s*/>|\\s*>|\\s+[a-zA-Z]\\w*=)`, "g"))) {
      found.push({ path, line: lineOf(source, match.index), expression: "true" });
    }
  }
  return found;
}

/**
 * The places a `signedIn` is decided by something other than the reader, and
 * why each is still the reader's answer.
 */
const SIGNED_IN_EXCEPTIONS: { path: string; expression: string; reason: string }[] = [
  {
    path: "src/lib/auth/reader.ts",
    expression: "true",
    reason: "The helper itself: `readerFrom` is where a session becomes `signedIn: true`.",
  },
  {
    path: "src/lib/auth/reader.ts",
    expression: "false",
    reason: "The helper itself: `SIGNED_OUT`, the reader with no session.",
  },
  {
    path: "src/app/games/page.tsx",
    expression: "false",
    reason: "`PublicCatalogue`, which the lobby draws only after `currentReader` has found no session.",
  },
  {
    path: "src/app/api/session/route.ts",
    expression: "session !== null",
    reason: "GET /api/session reports the cookie itself to the browser; the session IS the answer, read before any page.",
  },
  {
    path: "src/app/api/session/route.ts",
    expression: "true",
    reason: "POST /api/session answers the request that has just minted a session.",
  },
  {
    path: "src/components/layout/SiteHeader.tsx",
    expression: "false",
    reason: "`whoIsHere`, the masthead's own reading of the session: no session, so nobody. The same question, asked of the same cookie.",
  },
  {
    path: "src/components/layout/SiteHeader.tsx",
    expression: "true",
    reason: "`whoIsHere` with a session in hand — an invite holder included, which is why the masthead always offered them Sign out.",
  },
];

/** A value handed on from a parent — the parent is where it was decided, and is held to this too. */
const HANDED_ON = (name: string) => [name, `opponents.${name}`];

describe("signed in means holding a session", () => {
  const given = valuesGiven("signedIn");

  it("finds the pages it is about, so a pattern that stopped matching cannot pass in silence", () => {
    const fromReader = given.filter((one) => /^reader\.signedIn$|^\(await currentReader\(\)\)\.signedIn$/.test(one.expression));
    const pages = new Set(fromReader.map((one) => one.path));
    for (const page of [
      "src/app/games/page.tsx",
      "src/app/games/new/page.tsx",
      "src/app/games/[slug]/new/page.tsx",
      "src/app/games/[slug]/begin/page.tsx",
    ]) {
      expect(pages, `${page} should hand on reader.signedIn`).toContain(page);
    }
  });

  it("decides every signedIn from currentReader, or hands on one that was", () => {
    const allowed = new Set([...HANDED_ON("signedIn"), "reader.signedIn", "(await currentReader()).signedIn"]);
    const wrong = given.filter(
      (one) =>
        !allowed.has(one.expression) &&
        !SIGNED_IN_EXCEPTIONS.some((exception) => exception.path === one.path && exception.expression === one.expression),
    );
    expect(wrong.map((one) => `${one.path}:${one.line} signedIn = ${one.expression}`)).toEqual([]);
  });

  it("never reads signed in off an address", () => {
    const addressed = given.filter((one) => /email/i.test(one.expression));
    expect(addressed.map((one) => `${one.path}:${one.line} signedIn = ${one.expression}`)).toEqual([]);
  });

  it("keeps every exception pointing at a line that still exists", () => {
    for (const exception of SIGNED_IN_EXCEPTIONS) {
      const still = given.some((one) => one.path === exception.path && one.expression === exception.expression);
      expect(still, `${exception.path}: ${exception.reason}`).toBe(true);
    }
  });
});

describe("what only an account can do is decided by the account", () => {
  const SWITCHES = ["canAsk", "savesToAccount", "hasAccount"] as const;

  it("takes each switch from reader.hasAccount, or hands on one that was", () => {
    const wrong = SWITCHES.flatMap((name) =>
      valuesGiven(name)
        .filter((one) => ![...HANDED_ON(name), "reader.hasAccount"].includes(one.expression))
        .filter((one) => !(one.path === "src/lib/auth/reader.ts" && name === "hasAccount"))
        .map((one) => `${one.path}:${one.line} ${name} = ${one.expression}`),
    );
    expect(wrong).toEqual([]);
  });

  it("finds the pages that switch on it", () => {
    const pages = new Set(
      SWITCHES.flatMap((name) => valuesGiven(name)).filter((one) => one.expression === "reader.hasAccount").map((one) => one.path),
    );
    for (const page of [
      "src/app/players/[slug]/page.tsx",
      "src/app/games/[slug]/standings/page.tsx",
      "src/components/games/PlayedHere.tsx",
      "src/app/games/[slug]/play/page.tsx",
    ]) {
      expect(pages, `${page} should switch on reader.hasAccount`).toContain(page);
    }
  });
});

describe("who somebody is, is their member id", () => {
  it("never compares an address to decide isYou, isBuddy or ignoring", () => {
    const addressed = (["isYou", "isBuddy", "ignoring"] as const).flatMap((name) =>
      valuesGiven(name)
        .filter((one) => /email/i.test(one.expression))
        .map((one) => `${one.path}:${one.line} ${name} = ${one.expression}`),
    );
    expect(addressed).toEqual([]);
  });

  it("still finds the decisions, so the check above is about something", () => {
    const decided = (["isYou", "isBuddy", "ignoring"] as const).flatMap((name) =>
      valuesGiven(name).filter((one) => /memberId|\.id\b/.test(one.expression)),
    );
    expect(decided.length).toBeGreaterThanOrEqual(8);
  });
});
