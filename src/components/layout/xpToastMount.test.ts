import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The gate on the toast host's mount: exactly one, in the masthead.
 *
 * `XP_DESIGN.md` asks for this outright — "a page that mounts `SiteHeader` twice
 * would get two hosts. XP-07 should assert one" — and it is worth a source scan
 * rather than a browser test, because the fault is two components on one page
 * and that is a fact about the tree rather than about a render.
 *
 * Two toasts of the same award stacked on one page is the visible symptom. The
 * invisible one is worse: each host clears the flash when it has shown it, so
 * two hosts race, and whichever loses shows a stack that has already been
 * forgotten.
 */

const HOST = "XpToastHost";
const WRAPPER = "XpToasts";

/** Every `.ts`/`.tsx` file under a directory, excluding tests. */
function sourcesIn(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...sourcesIn(path));
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;
    if (/\.test\.tsx?$/.test(entry)) continue;
    found.push(path);
  }
  return found;
}

const sources = sourcesIn("src");

/** The files that actually render a component, rather than defining or typing it. */
function filesRendering(tag: string): string[] {
  return sources.filter((path) => readFileSync(path, "utf8").includes(`<${tag}`));
}

describe("the toast host is mounted once", () => {
  it("is rendered by the wrapper and by nothing else", () => {
    // The host is the thing that must not be doubled. It is drawn in exactly one
    // place — the client wrapper that also clears the flash — so any second
    // mount is a second host.
    expect(filesRendering(HOST)).toEqual(["src/components/layout/XpToasts.tsx"]);
  });

  it("has its wrapper mounted only by the masthead", () => {
    expect(filesRendering(WRAPPER)).toEqual(["src/components/layout/SiteHeader.tsx"]);
  });

  it("is not mounted by the root layout, which would never see it again", () => {
    // "Layouts do not rerender on navigation" — the Next 16 docs on
    // layout.tsx. A mount there renders once per document load, so a member who
    // earns XP and then moves around the site with next/link would be shown
    // nothing until they reloaded. The masthead is mounted per PAGE, which is
    // what makes "the next page they open" true.
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).not.toContain(HOST);
    expect(layout).not.toContain(WRAPPER);
  });

  it("mounts it in both shapes of the masthead, so the front page has one too", () => {
    // The hero and the compact wordmark are one page's two shapes and only one
    // renders — but they are two returns, and a mount added to one of them and
    // not the other is a toast that appears everywhere except the front page.
    const header = readFileSync("src/components/layout/SiteHeader.tsx", "utf8");
    // The masthead's own body, not the whole file: `Nav` returns markup too, and
    // counting every return in the file would be counting the wrong thing.
    const from = header.indexOf("export async function SiteHeader");
    const body = header.slice(from, header.indexOf("\n}\n", from));
    expect(from).toBeGreaterThan(-1);
    const mounts = body.match(/<XpFlashToasts\s*\/>/g) ?? [];
    const returns = body.match(/return \(/g) ?? [];
    expect(returns.length).toBeGreaterThan(1);
    expect(mounts.length).toBe(returns.length);
  });
});

describe("the toasts arrive without being asked for", () => {
  it("fetches nothing and polls nothing", () => {
    // John's standing rule, and the design's: the flash is written by the
    // awarder and read by the next server render. The only request this whole
    // mechanism makes is the Server Function that clears it, after the fact.
    const wrapper = readFileSync("src/components/layout/XpToasts.tsx", "utf8");
    expect(wrapper).not.toMatch(/\bfetch\(/);
    expect(wrapper).not.toMatch(/setInterval|setTimeout/);
    const host = readFileSync("src/components/xp/XpToastHost.tsx", "utf8");
    expect(host).not.toMatch(/\bfetch\(/);
    expect(host).not.toMatch(/setInterval\(/);
  });
});
