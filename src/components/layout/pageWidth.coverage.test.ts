import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PAGE_WIDTH } from "./Page";

/**
 * ONE WIDTH FOR EVERY PAGE, AND TEXT THAT RUNS IT.
 *
 * John, 2026-09-24: "We can't have pages be one width on one page, and then
 * change width in other pages. It needs to be consistent." And, of text that
 * stops at half the page beside cards that run the whole of it: "it should be
 * full width, or there should be a reason for that."
 *
 * Both had been got wrong page by page for months, each for a reason that
 * made sense where it was written. `e2e/page-width.spec.ts` measures every
 * page in a browser, which is the real test; this is the cheap half that runs
 * in `pnpm test:unit` and stops the two shapes the browser found most often
 * before they are ever drawn:
 *
 * - a second frame: a page-sized `max-w-5xl`/`6xl`/`7xl` or a
 *   `2xl:max-w-[…]` anywhere but `pageWidth.constants.ts`, where `PAGE_WIDTH` lives;
 * - a paragraph capped with `max-w-prose`, or with a `max-w-…` size on the
 *   `<p>` itself, with no `data-width-reason` saying why.
 *
 * An exception is `data-width-reason="…"` on the element, in the source, where
 * the next person to read it will see the reason. Nothing is listed here.
 */

const ROOTS = ["src/components", "src/app"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap(filesUnder).map((path) => ({ path, lines: readFileSync(path, "utf8").split("\n") }));

/** Every line matching `shape`, as `path:line: text`, skipping comments. */
function offenders(shape: RegExp, skip: (path: string, line: string) => boolean = () => false): string[] {
  const found: string[] = [];
  for (const { path, lines } of FILES) {
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) return;
      if (shape.test(line) && !skip(path, line)) found.push(`${path}:${index + 1}: ${trimmed}`);
    });
  }
  return found;
}

describe("page width", () => {
  it("is one width, named once", () => {
    expect(typeof PAGE_WIDTH, "PAGE_WIDTH is a single class, not a choice of widths").toBe("string");
  });

  it("has no second frame anywhere but the one PAGE_WIDTH", () => {
    const found = offenders(
      /\bmax-w-(5xl|6xl|7xl)\b|\b(sm|md|lg|xl|2xl):max-w-(5xl|6xl|7xl|screen|\[(6[4-9]|[7-9]\d|\d{3,})rem\])/,
      (path) => path.endsWith(join("layout", "pageWidth.constants.ts")),
    );
    expect(
      found,
      "A page-sized width outside pageWidth.constants.ts is a page choosing its own frame. Every page is PAGE_WIDTH " +
        "(src/components/layout/pageWidth.constants.ts); take the class off and let the page fill the frame.",
    ).toEqual([]);
  });

  it("has no paragraph held short of the frame without a reason", () => {
    const found = offenders(
      /\bmax-w-prose\b|<p\b[^>]*\bmax-w-(xs|sm|md|lg|xl|2xl|3xl|4xl)\b/,
      (_path, line) => line.includes("data-width-reason"),
    );
    expect(
      found,
      "Text capped with a max-width stops part way across the page. Take the max-w-… off so it runs the " +
        'frame\'s width, or put data-width-reason="…" on the element saying why this one is narrower.',
    ).toEqual([]);
  });
});
