import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * A WIN'S WORDS ARE SAID IN THE READER'S LANGUAGE, WHICH ONLY HAPPENS IF THE CALLER HANDS THE SPEAKER OVER.
 * `solvedNews` and `tableNews` default to English so a test can call them bare, and a page that did so showed a
 * reader of Japanese "解決 in 0:01" on the cover of a solved puzzle, and "Play again, same players" on
 * Kumimoji's and Mahjong's (looked at on 2026-11-02). Every call in the components passes the speaker, and no
 * component reads the English copy table (`WIN_COVER_COPY`) for a label.
 */
const FILES = execFileSync("git", ["ls-files", "src"], { encoding: "utf8" })
  .split("\n")
  .filter((path) => /\.tsx?$/.test(path) && !path.endsWith(".test.ts") && !path.endsWith("winNews.ts") && !path.endsWith("winCover.constants.ts"));

/** How many arguments a call has, read from its parentheses (strings and nested brackets skipped). */
function argumentCount(source: string, from: number): number {
  let depth = 1;
  let commas = 0;
  let quote: string | null = null;
  let last = "";
  for (let at = from; at < source.length && depth > 0; at += 1) {
    const char = source[at]!;
    if (quote !== null) {
      if (char === "\\") at += 1;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'" || char === "`") quote = char;
    else if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    else if (char === "," && depth === 1) commas += 1;
    if (depth > 0 && char.trim() !== "") last = char;
  }
  return commas + 1 - (last === "," ? 1 : 0);
}

describe("a win's cover speaks the reader's language", () => {
  it("passes the speaker to every solvedNews and tableNews call", () => {
    const bare: string[] = [];
    for (const path of FILES) {
      const source = readFileSync(path, "utf8");
      for (const call of source.matchAll(/\b(solvedNews|tableNews)\(/g)) {
        if (argumentCount(source, call.index! + call[0].length) < 2) bare.push(`${path}:${source.slice(0, call.index).split("\n").length} ${call[1]}`);
      }
    }
    expect(bare, `these calls say the win in English to everybody: ${bare.join(", ")}`).toEqual([]);
  });

  it("reads no label from the English copy table in a component", () => {
    const using = FILES.filter((path) => path.startsWith("src/components/") && readFileSync(path, "utf8").includes("WIN_COVER_COPY"));
    expect(using, "a component says its cover's words from the English table").toEqual([]);
  });
});
