import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A LABEL THE GLOSSARY RETIRED DOES NOT COME BACK.
 *
 * John, 2026-09-29, at a finished Solitaire reading "How it ended: Solved /
 * Puzzle: draw 1 · Easy / Help: None", hours after two hundred labels had been
 * renamed: "Did we NOT have an English review to prevent crap words like
 * this???" There was one, and nothing held it: the next game built beside it
 * reached for the old words again.
 *
 * So the list of retired words is read from the glossary itself
 * (`docs/plans/plain-english/GLOSSARY.md`), every table with a "Was" or a "No
 * longer" column, and the doc and this gate cannot drift: a rename written
 * there is held here the same day. Only phrases of two words or more are held,
 * because a single word the glossary retired from one place ("Record", "Play",
 * "Level") is the right word somewhere else. A phrase counts when it is the
 * whole of a string or of a piece of JSX text, the way a label is written;
 * comments and tests are not read.
 *
 * Each exception is one line below, with the reason beside it.
 */

const GLOSSARY = "docs/plans/plain-english/GLOSSARY.md";

/** Split a "Was" cell into the labels it names: "A · B", "A / B", "A, B", with any kanji, arrow or full stop taken off. */
function labelsIn(cell: string): string[] {
  return cell
    .replace(/`/g, "")
    .split(/ · | \/ |, /)
    .map((part) =>
      part
        .replace(/\s*[぀-ヿ㐀-鿿].*$/, "")
        .replace(/[→.…:]+$/, "")
        .trim(),
    )
    .filter((part) => part.split(/\s+/).length >= 2 && !/[{}()…]/.test(part));
}

/** Every retired label of two words or more, read from the glossary's tables. */
function retiredLabels(): string[] {
  const found = new Set<string>();
  let column = -1;
  for (const line of readFileSync(GLOSSARY, "utf8").split("\n")) {
    if (!line.startsWith("|")) {
      column = -1;
      continue;
    }
    const cells = line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
    if (cells.every((cell) => /^-*$/.test(cell))) continue;
    if (column === -1) {
      // A table's heading row says which column holds the retired words, if any.
      column = cells.findIndex((cell) => cell === "Was" || cell === "No longer");
      if (column === -1) column = -2;
      continue;
    }
    if (column < 0) continue;
    for (const label of labelsIn(cells[column] ?? "")) found.add(label);
  }
  return [...found].sort();
}

/**
 * A retired phrase that is still right where it is, by file, with why.
 * Keyed "<phrase> @ <file>".
 */
const STILL_RIGHT: Record<string, string> = {
  "Being worked on @ src/lib/site/maintenance.ts": "the public maintenance page, which the glossary keeps as a sentence beside the gate",
  "The record @ src/components/history/RecordPage.tsx": "an error thrown to the log, never shown",
  "the record @ src/lib/history/gameHistory.sort.ts": "the sort spec's name for its list in a developer's error, never shown",
};

/** The source a reader's words come from: every .ts and .tsx under src/, tests aside. */
function sourceFiles(): string[] {
  return readdirSync("src", { recursive: true, encoding: "utf8" })
    .map((file) => join("src", file))
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file));
}

/** A line that is only a comment: its words are notes to the next builder, not labels. */
function isComment(line: string): boolean {
  return /^\s*(\*|\/\/|\/\*|\{\/\*)/.test(line);
}

/** Where a retired phrase is written as a label: the whole of a string, or of a run of JSX text. */
function writtenAsLabel(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(["'\`>])\\s*${escaped}\\s*[.…:!?→]?\\s*(["'\`<]|\\$\\{)`);
}

describe("plain English, held", () => {
  const retired = retiredLabels();

  it("reads the retired labels from the glossary", () => {
    // A glossary this gate cannot read would hold nothing and pass.
    expect(retired.length).toBeGreaterThan(50);
    expect(retired).toContain("Who is best at it");
    expect(retired).toContain("Try the board");
  });

  it("finds no retired label written into the site's source", () => {
    const files = sourceFiles().map((file) => ({ file, lines: readFileSync(file, "utf8").split("\n") }));
    const back: string[] = [];
    const used = new Set<string>();
    for (const phrase of retired) {
      const shape = writtenAsLabel(phrase);
      for (const { file, lines } of files) {
        const at = lines.findIndex((line) => !isComment(line) && shape.test(line));
        if (at === -1) continue;
        const key = `${phrase} @ ${file}`;
        if (key in STILL_RIGHT) used.add(key);
        else back.push(`${file}:${at + 1} says "${phrase}", which the glossary retired`);
      }
    }
    expect(back).toEqual([]);
    // An exception nothing needs any longer goes, so the list stays one of real reasons.
    expect(Object.keys(STILL_RIGHT).filter((key) => !used.has(key))).toEqual([]);
  });
});
