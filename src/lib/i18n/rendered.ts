import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * WHAT A READER CAN ACTUALLY BE SHOWN.
 *
 * Two gates lean on this, and both are about the same thing: a word or a
 * phrase key that survives only in a code comment is not on the site. A gate
 * that reads the raw source cannot tell the difference between a phrase the
 * site says and a phrase somebody wrote a note about having removed — and it
 * will certify the second as the first.
 *
 * That is not hypothetical twice over. The navigation's kanji went in 0.124.0
 * and every surviving mention of 遊ぶ in this repo is a comment explaining the
 * removal; a plain search finds three and concludes the word is still shown.
 * And when the Rules and Learn rows left the bar, the comment written to
 * explain THAT named `nav.rules` and `nav.everyGame` in prose — which, tested
 * deliberately, made the dead-phrase check pass over two keys that nothing
 * rendered.
 *
 * So it lives here rather than inside one test file: the check about Japanese
 * words and the check about phrase keys are the same question asked twice, and
 * only one of them had the answer.
 */

/**
 * A file with its comments taken out, so what is left is what a reader could
 * actually be shown.
 *
 * String literals are KEPT, because that is where both the kanji and the
 * phrase keys live, and are skipped over rather than scanned so that a `//`
 * inside one — a URL, most often — cannot start a comment and eat the rest of
 * the line. JSX text is not a literal and is never inside one, so it stays.
 */
export function withoutComments(source: string): string {
  let out = "";
  let index = 0;
  const quotes = new Set(["'", '"', "`"]);
  while (index < source.length) {
    const here = source[index] as string;
    const next = source[index + 1];
    if (here === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }
    if (here === "/" && next === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index += 2;
      continue;
    }
    if (quotes.has(here)) {
      const quote = here;
      out += here;
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === "\\") {
          out += source[index];
          index += 1;
        }
        if (index < source.length) {
          out += source[index];
          index += 1;
        }
      }
      out += quote;
      index += 1;
      continue;
    }
    out += here;
    index += 1;
  }
  return out;
}

/**
 * Every `.ts`/`.tsx` under `src/` outside this library, comments removed and
 * joined — the text of the site as a reader could meet it.
 *
 * This library is skipped because it is where the catalogue itself lives: a
 * phrase key naturally appears in `i18n.constants.ts` and in the two Japanese
 * dictionaries, and counting those would make every key look used.
 */
export function renderedSource(root = "src"): string {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        if (!path.includes(join("lib", "i18n"))) walk(path);
      } else if (/\.tsx?$/.test(entry)) {
        files.push(path);
      }
    }
  };
  walk(root);
  return files.map((path) => withoutComments(readFileSync(path, "utf8"))).join("\n");
}
