import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUTTON_BASE, BUTTON_LEAD, BUTTON_TAP, PLAY_BUTTON, PLAY_SURFACE, SELECTABLE } from "./ui.constants";

/**
 * A DRAG OR A SELECT ALL NEVER PICKS UP A CONTROL OR A PLAY SURFACE AS TEXT.
 *
 * John, 2026-09-28, with Kumimoji's tray, chips, buttons and tiles painted
 * blue by a drag: "Buttons and labels should usually not be selectable…
 * when these are play elements or buttons, they should not. FIX. MAJOR."
 *
 * The rule is in globals.css (`.play-surface` and the controls), and the
 * browser spec `e2e/no-select.spec.ts` is what measures it on real pages.
 * This holds the ROOTS to it: the rule only reaches what carries the class,
 * so a new puzzle or a new party table whose root forgets `PLAY_SURFACE`
 * would be selectable again and nothing else would notice.
 *
 * WHAT IT CHECKS, AND WHY THAT IS HONEST. A puzzle's solve and a party table
 * each say "the browser has this now" with `readyMark` on their outermost
 * element — that element IS the play surface, by the same definition the
 * browser spec waits on. So every opening tag in those folders that carries
 * `readyMark(` must also carry `PLAY_SURFACE`. Every board is drawn inside
 * `BoardFrame`, so its root carries it too. Reading the source rather than
 * a list of files means tomorrow's puzzle is held without anybody adding it.
 */

const CSS = readFileSync("src/app/globals.css", "utf8");

/** The `.tsx` files directly in a folder. */
function tsxIn(dir: string): { path: string; source: string }[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".tsx"))
    .map((name) => ({ path: join(dir, name), source: readFileSync(join(dir, name), "utf8") }));
}

/**
 * Every opening JSX tag in a source that carries the ready mark: `<section … {...readyMark(…)}>`.
 * Not `readyMark(false)`: that is an empty box held open while the table loads, never ready and drawing nothing.
 */
function readyTags(source: string): string[] {
  return [...source.matchAll(/<(section|div)\b[^<>]*?readyMark\([^<>]*?>/g)].map((match) => match[0]).filter((tag) => !tag.includes("readyMark(false)"));
}

describe("controls and play surfaces are never text to select", () => {
  it("globals.css refuses a selection to every button, every control role and every play surface", () => {
    expect(CSS).toContain("@layer base");
    for (const selector of ["button", "summary", "label", '[role="button"]', '[role="tab"]', '[role="radio"]', '[role="switch"]', `.${PLAY_SURFACE}`]) {
      expect(CSS, `the no-select rule should name ${selector}`).toContain(selector);
    }
    expect(CSS).toMatch(/user-select:\s*none/);
    expect(CSS).toMatch(/-webkit-touch-callout:\s*none/);
    // And never blocks typing: an input or a textarea is always text.
    expect(CSS).toMatch(/textarea[^{]*\{[^}]*user-select:\s*text/);
  });

  it("a link dressed as a button is not text either", () => {
    for (const [name, look] of Object.entries({ BUTTON_BASE, BUTTON_TAP, BUTTON_LEAD, PLAY_BUTTON })) {
      expect(look.split(" "), `${name} should carry select-none, for the <Link> that wears it`).toContain("select-none");
    }
  });

  it("every board is a play surface, from its frame", () => {
    const frame = readFileSync("src/components/board/BoardFrame.tsx", "utf8");
    expect(frame).toMatch(/className=\{`\$\{PLAY_SURFACE\} grid w-full`\}/);
  });

  const roots = [...tsxIn("src/components/puzzles"), ...tsxIn("src/components/party")]
    .map((file) => ({ ...file, tags: readyTags(file.source) }))
    .filter((file) => file.tags.length > 0);

  it("finds the puzzles' and party tables' ready-marked roots at all, so a passing run is not an empty one", () => {
    const puzzles = roots.filter((file) => file.path.includes("/puzzles/") && file.path.endsWith("Solve.tsx"));
    const party = roots.filter((file) => file.path.includes("/party/") && file.path.endsWith("Game.tsx"));
    // Eight solves and four tables when this was written. The number is not the point; nought is.
    expect(puzzles.length).toBeGreaterThanOrEqual(8);
    expect(party.length).toBeGreaterThanOrEqual(4);
  });

  it("every puzzle's solve and every party table carries PLAY_SURFACE on the element it marks ready", () => {
    const missing = roots
      .filter((file) => file.path.endsWith("Solve.tsx") || file.path.endsWith("Game.tsx") || file.path.endsWith("KumimojiParty.tsx"))
      .flatMap((file) => file.tags.filter((tag) => !tag.includes("${PLAY_SURFACE}")).map((tag) => `${file.path}: ${tag.slice(0, 120)}`));
    expect(missing, "a play root without PLAY_SURFACE — its tiles, buttons and labels would be selectable again").toEqual([]);
  });

  it("a move list stays text even where each move is a button to jump to, because people copy notation", () => {
    for (const path of ["src/components/game/MoveHistory.tsx", "src/components/history/PlayedMoves.tsx"]) {
      expect(readFileSync(path, "utf8"), path).toContain("${SELECTABLE}");
    }
    expect(SELECTABLE).toBe("select-text");
  });
});
