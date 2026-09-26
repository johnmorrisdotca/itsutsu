#!/usr/bin/env node
/**
 * WRITES KUMIMOJI'S ENGLISH WORD LIST from SCOWL, so the list in the
 * repository is a machine's output that anybody can make again, never a
 * hand-kept table.
 *
 *   curl -sL -o scowl.tar.gz https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz
 *   tar xzf scowl.tar.gz
 *   node scripts/tile-words.mjs scowl-2020.12.07/final
 *
 * The same source and the same sizes Gomoji lets a player guess from
 * (`scripts/word-lists.mjs`): SCOWL sizes 10 to 70, English and American
 * spellings, lower case a–z only, so no proper names, abbreviations with
 * capitals, or possessives. Every length from 2 to 15, because a crossword on
 * a board fifteen squares wide can hold any of them.
 *
 * One thing is taken out that a speller keeps and a tile game must not: the
 * short "words" that are letters or units — "ks", "lm", "mb", the plural of a
 * letter. A word of three letters or fewer needs a vowel or a Y, unless it is
 * one of the few real words that have none (`NO_VOWEL_WORDS`).
 *
 * COMPACT, and fetched only when the game opens (`tileWords.ts`). Each length
 * is its words in order, FRONT-CODED: a word is written as how many letters it
 * shares with the word before it (one character, 0–9 then A–E) and then the
 * rest of it. Every word of a length is that length, so no separator is
 * needed; a newline every two hundred words keeps a diff readable and is
 * skipped when the list is read.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FINAL = process.argv[2];
if (FINAL === undefined) {
  console.error("Usage: node scripts/tile-words.mjs <scowl>/final");
  process.exit(1);
}
const OUT = "src/lib/puzzles/kumimoji/words.en.data.ts";
const SIZES = [10, 20, 35, 40, 50, 55, 60, 70];
const SHORTEST = 2;
const LONGEST = 15;
const PREFIX = "0123456789ABCDE";

/** Real words of three letters or fewer with no vowel and no Y. */
const NO_VOWEL_WORDS = new Set(["sh", "hm", "mm", "hmm", "shh", "brr", "nth", "tsk", "pst", "zzz", "psst"]);

const found = new Set();
for (const spelling of ["english", "american"]) {
  for (const size of SIZES) {
    const text = readFileSync(join(FINAL, `${spelling}-words.${size}`), "latin1");
    for (const line of text.split("\n")) {
      const word = line.trim();
      if (!/^[a-z]+$/.test(word) || word.length < SHORTEST || word.length > LONGEST) continue;
      if (word.length <= 3 && !/[aeiouy]/.test(word) && !NO_VOWEL_WORDS.has(word)) continue;
      found.add(word);
    }
  }
}

const byLength = new Map();
for (const word of [...found].sort()) {
  if (!byLength.has(word.length)) byLength.set(word.length, []);
  byLength.get(word.length).push(word);
}

/** One length, front-coded, a newline every two hundred words. */
function frontCoded(words) {
  let out = "";
  let before = "";
  words.forEach((word, at) => {
    let shared = 0;
    while (shared < word.length - 1 && shared < before.length && word[shared] === before[shared]) shared += 1;
    if (at > 0 && at % 200 === 0) out += "\n";
    out += PREFIX[shared] + word.slice(shared);
    before = word;
  });
  return out;
}

const parts = [];
let total = 0;
for (let length = SHORTEST; length <= LONGEST; length += 1) {
  const words = byLength.get(length) ?? [];
  total += words.length;
  parts.push(`  ${length}: \`\n${frontCoded(words)}\n\`,`);
  console.log(`${length} letters: ${words.length}`);
}

const copyright = readFileSync(join(FINAL, "..", "Copyright"), "latin1").split("\n").slice(0, 13).join("\n");
writeFileSync(
  OUT,
  `/**
 * THE ENGLISH WORDS FOR KUMIMOJI. Written by \`scripts/tile-words.mjs\` from
 * SCOWL 2020.12.07 (http://wordlist.aspell.net/), sizes 10–70, English and
 * American spellings, every length from ${SHORTEST} to ${LONGEST}: ${total} words.
 * Front-coded (see the script). Never edited by hand; run the script again.
 *
 * SCOWL's notice, which its licence asks to travel with the lists:
 *
${copyright
  .split("\n")
  .map((line) => ` * ${line}`.trimEnd())
  .join("\n")}
 */
export const TILE_WORDS_EN: Record<number, string> = {
${parts.join("\n")}
};
`,
);
console.log(`Wrote ${OUT}: ${total} words`);
