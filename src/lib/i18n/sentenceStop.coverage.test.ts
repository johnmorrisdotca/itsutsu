import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A SENTENCE'S STOP IS THE LANGUAGE'S, NOT A LITERAL ".".
 *
 * Solitaire's set-up read "…積み上げます。 手順." for a reader of Japanese: the page put a link after the sentence and
 * a half-width stop after the link, written into the JSX. English wants a space before the link and "." after it;
 * Japanese wants nothing before it and "。" after it. `say.sentences(["", ""])` and `say.sentence("")` are those two,
 * so a link that ends a sentence draws them and a lone "." on the line after a closing tag fails here.
 */
const KNOWN: Record<string, string> = {
  "src/components/casual/CasualSetUpPage.tsx": "a casual game's set-up, in English until the card and casual games are translated (ENJA-08)",
};

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: false }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return /\.tsx$/.test(entry.name) ? [path] : [];
  });
}

describe("a link that ends a sentence", () => {
  it("is followed by the language's own stop, never a literal one", () => {
    const found: string[] = [];
    for (const path of files("src")) {
      if (KNOWN[path] !== undefined) continue;
      const text = readFileSync(path, "utf8");
      for (const match of text.matchAll(/<\/(?:Link|a|Inside|Out|PlayerName|GameName|button)>\s*\n\s*[.,;:!?]\s*\n/g)) {
        found.push(`${path}:${text.slice(0, match.index).split("\n").length}`);
      }
    }
    expect(found, "draw say.sentence(\"\") after the link, and say.sentences([\"\", \"\"]) before it").toEqual([]);
  });

  it("names no file that no longer has the fault", () => {
    for (const path of Object.keys(KNOWN)) {
      expect(readFileSync(path, "utf8"), path).toMatch(/<\/(?:Link|a|Inside|Out|PlayerName|GameName|button)>\s*\n\s*[.,;:!?]\s*\n/);
    }
  });
});
