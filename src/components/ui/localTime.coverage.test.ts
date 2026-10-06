import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A moment is never formatted in a render the server also draws.
 *
 * THE THIRD TIME, which is why this is a gate and not a paragraph. 0.146.1 was
 * `Intl.DisplayNames` in a client render: Node and Chromium spell four regions
 * differently. 0.173.2 was `toLocaleString()` in five places on the game pages:
 * the server formats in its own zone and language, the browser in the reader's,
 * and production runs in UTC, so every load for anybody not in UTC threw the
 * server's markup away. And the sweep after that found two more — the members
 * list's Joined column and the Words modal's date — one of them landed hours
 * after the fix. A rule nothing checks is a rule that holds until the next page.
 *
 * THE RULE: `toLocaleDateString`, `toLocaleString`, `toLocaleTimeString` and
 * `Intl.DateTimeFormat` do not appear under `src/components` or `src/app`. A
 * moment on a page goes through `LocalTime`, which draws `stableWhen` (UTC
 * digits, no `Intl`) until `useHydrated` and `readerWhen` after it.
 *
 * `Intl.DateTimeFormat` WITH OR WITHOUT `new`, not only the `new` form: the two
 * are the same constructor, and the calls that exist here are all written
 * without it.
 *
 * THE EXCEPTIONS ARE NAMED BY FILE, WITH A COUNT AND A REASON. The count is what
 * stops an exception being a hole: a second call added to a file that was
 * excused for its first one fails, because the reason was written about the
 * first. And an exception whose file no longer holds that many calls fails too,
 * so a reason cannot outlive the code it excused.
 *
 * WHAT THIS DOES NOT SEE, said plainly rather than implied. It reads the two
 * roots a page is drawn from, not `src/lib`: a helper there that formats a date
 * and is called in render would pass. `lib` is also where the sanctioned
 * formatter lives (`when.ts`) and where server-only code rightly formats days in
 * a zone (`xpDay.ts`), so covering it is an allowlist of its own, not a wider
 * glob. Crude on purpose, like `gameLinks.coverage.test.ts`: it reads source.
 */

const ROOTS = ["src/components", "src/app"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(path);
  }
  return out;
}

/**
 * The file with its comments blanked, character for character — the same
 * reading `gameLinks.coverage.test.ts` takes, for the same reason. `LocalTime`
 * explains its own history by quoting `toLocaleString()`, and a gate that reads
 * the explanation of the rule as a breach of it is a gate people delete. Blanked
 * rather than removed, so a line number is a line somebody can open.
 */
function code(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

const CALL = /\.toLocale(?:Date|Time)?String\s*\(|\bIntl\s*\.\s*DateTimeFormat\b/g;

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, source: code(readFileSync(path, "utf8")) }));

function callsIn(source: string): { line: number; text: string }[] {
  return [...source.matchAll(CALL)].map((match) => ({
    line: source.slice(0, match.index).split("\n").length,
    text: match[0].replace(/\s+/g, ""),
  }));
}

/**
 * Each file allowed to make these calls, how many, and why that is not the fault.
 *
 * `when.ts` and `LocalTime.tsx` are not here, and that is not an oversight:
 * `when.ts` is in `src/lib`, outside what this reads, and `LocalTime` makes no
 * call of its own — it asks `readerWhen`. They are the sanctioned place; the
 * gate has nothing to excuse in them.
 */
const EXCEPTIONS: Record<string, { calls: number; reason: string }> = {
  /*
   * AFTER HYDRATION, IN AN EFFECT. The device's zone is a fact only the browser
   * has, read once it has mounted to record it on the member's row. Nothing is
   * formatted and nothing is drawn: it renders null.
   */
  "src/components/layout/DeviceTimeZone.tsx": {
    calls: 1,
    reason: "reads the device zone inside useEffect; formats nothing, draws nothing",
  },
  /*
   * IN A CLICK HANDLER — the "use this device's time zone" link AGENTS.md names
   * as the one correct place for `Intl`: a handler runs after hydration, where
   * no second drawing exists to disagree with.
   */
  "src/components/mine/ProfileForm.tsx": {
    calls: 1,
    reason: "reads the device zone in the guessZone click handler",
  },
  /*
   * NOT A RENDER AT ALL. A zone a member sends is checked by asking the platform
   * whether it knows it; the formatter is thrown away.
   */
  "src/app/api/me/route.ts": {
    calls: 1,
    reason: "validates a time zone in an API route; nothing is drawn",
  },
  /*
   * The feed's one, in a server component that no client component imports.
   * It is not a moment: it is a day key the server already worked out in the
   * reader's own zone, written out at noon UTC with the zone pinned to UTC, so
   * it is the same date wherever it is drawn. (The counts and dates the other
   * components print come from the language's own table, `Speaker.number` and
   * `Speaker.day`, which is `Intl`-free and so is not read here.)
   */
  "src/components/feed/FeedList.tsx": {
    calls: 1,
    reason: "a day heading from a day key, formatted with the zone pinned to UTC, in a server component",
  },
};

describe("a moment is never formatted in a render the server also draws", () => {
  it("has files to check, so a passing run means something", () => {
    expect(FILES.length).toBeGreaterThan(100);
  });

  it("finds the calls that are there, so the check below is not vacuous", () => {
    const profile = FILES.find((file) => file.path === "src/components/mine/ProfileForm.tsx");
    expect(profile && callsIn(profile.source).map((call) => call.text)).toEqual(["Intl.DateTimeFormat"]);
  });

  it("does not read a comment about the rule as a breach of it", () => {
    const local = FILES.find((file) => file.path === "src/components/ui/LocalTime.tsx");
    expect(local && callsIn(local.source)).toEqual([]);
  });

  it("every exception names a file that still makes exactly that many calls", () => {
    const stale = Object.entries(EXCEPTIONS)
      .map(([path, { calls }]) => {
        const file = FILES.find((one) => one.path === path);
        const found = file === undefined ? "missing" : callsIn(file.source).length;
        return found === calls ? null : `${path}: excused ${calls}, found ${found}`;
      })
      .filter((one) => one !== null);
    expect(stale).toEqual([]);
  });

  it("nobody formats a date with toLocale* or Intl.DateTimeFormat outside the named exceptions", () => {
    const offenders = FILES.flatMap((file) => {
      const calls = callsIn(file.source);
      const allowed = EXCEPTIONS[file.path]?.calls ?? 0;
      if (calls.length <= allowed) return [];
      return calls.map((call) => `${file.path}:${call.line} ${call.text}`);
    });
    expect(
      offenders,
      "Draw a moment with <LocalTime at={iso} style=…/> (src/components/ui/LocalTime.tsx), not in a render the server also draws.",
    ).toEqual([]);
  });
});
