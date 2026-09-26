#!/usr/bin/env node
/**
 * WRITES POP GOMOJI'S LISTS from its hand-kept corpus and from SCOWL.
 *
 *   curl -sL -o scowl.tar.gz https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz
 *   tar xzf scowl.tar.gz
 *   node scripts/word-lists-pop.mjs scowl-2020.12.07/final
 *
 * John, 2026-09-26: a pop-culture Gomoji "built as a curated corpus, not a
 * script that invents 2,000 per length: each word with its category shown as
 * the clue, checked true and family-safe… deduplicated, quality over count…
 * guesses accepted from the dictionary lists and the corpus, lengths 3-7".
 *
 * So the ANSWERS are `scripts/pop-corpus.txt`, a person's list, each word with
 * its category; this checks every one of them — a to z only, three to seven
 * letters, none on the list of words never hidden, none twice — and refuses to
 * write anything if one fails. A word under two categories is kept under the
 * first, and said so.
 *
 * The GUESSES are the English dictionary's words of the length and the
 * corpus's. Four to six letters are Gomoji's own lists already
 * (`words.en.data.ts`); three and seven are written here from SCOWL, sizes up
 * to 70 as Gomoji's are, into a file of their own that is fetched only when a
 * three- or seven-letter puzzle is played (`loadPopGuesses`), so no other
 * Gomoji carries them.
 *
 * Both files are written; neither is edited by hand.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FINAL = process.argv[2];
if (FINAL === undefined) {
  console.error("Usage: node scripts/word-lists-pop.mjs <scowl>/final");
  process.exit(1);
}
const CORPUS = "scripts/pop-corpus.txt";
const ANSWERS_OUT = "src/lib/puzzles/gomoji/words.pop.data.ts";
const GUESSES_OUT = "src/lib/puzzles/gomoji/words.pop.guesses.data.ts";
const LENGTHS = [3, 4, 5, 6, 7];
/** The lengths Gomoji's English lists do not have, whose guesses are written here. */
const OWN_GUESS_LENGTHS = [3, 7];

/**
 * Never an answer: Gomoji's own list of such words (`word-lists.mjs`), and the
 * pop-culture words a children's site keeps out, John's examples first.
 */
const NEVER = new Set(
  `gyatt twerk twerking arse bitch boner boobs booby butt crap damn dick dildo fart fuck hell piss shit slut tits turd twat
  wank whore pussy prick horny porn rape sexy penis semen anal anus nazi queer skank nude lust booty thong coke dope moron
  idiot scum weed booze vodka beer wine sake rum poker casino bet vape drugs kill murder blood gore uranus
  bugger condom erotic heroin incest nipple orgasm vagina virgin junkie racist stupid retard breast`
    .split(/\s+/)
    .filter(Boolean),
);

const problems = [];
const categories = [];
/** word -> category index, the first category it was met under. */
const found = new Map();
let doubled = 0;

for (const [number, raw] of readFileSync(CORPUS, "utf8").split("\n").entries()) {
  const line = raw.trim();
  if (line === "" || line.startsWith("#")) continue;
  const colon = line.indexOf(":");
  if (colon < 1) {
    problems.push(`line ${number + 1}: no "Category:" before the words`);
    continue;
  }
  const category = line.slice(0, colon).trim();
  if (categories.includes(category)) problems.push(`line ${number + 1}: the category "${category}" appears twice`);
  const index = categories.push(category) - 1;
  const seen = new Set();
  for (const word of line.slice(colon + 1).split(/\s+/).filter(Boolean)) {
    if (!/^[a-z]+$/.test(word)) problems.push(`line ${number + 1}: "${word}" is not a to z only`);
    else if (word.length < 3 || word.length > 7) problems.push(`line ${number + 1}: "${word}" is ${word.length} letters`);
    else if (NEVER.has(word)) problems.push(`line ${number + 1}: "${word}" is never an answer here`);
    else if (seen.has(word)) problems.push(`line ${number + 1}: "${word}" twice in ${category}`);
    else if (found.has(word)) doubled += 1;
    else found.set(word, index);
    seen.add(word);
  }
}
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

/** Words of one length as lines of text, a hundred and twenty to a line, so a diff shows what moved. */
function block(words) {
  const lines = [];
  for (let at = 0; at < words.length; at += 120) lines.push(words.slice(at, at + 120).join(" "));
  return `\`\n${lines.join("\n")}\n\``;
}

const answerParts = [];
for (const length of LENGTHS) {
  const words = [...found.keys()].filter((word) => word.length === length).sort();
  answerParts.push(`  ${length}: ${block(words.map((word) => `${word}.${found.get(word)}`))},`);
  console.log(`${length} letters: ${words.length} answers`);
}
console.log(`${found.size} answers in ${categories.length} categories; ${doubled} kept under an earlier category`);

writeFileSync(
  ANSWERS_OUT,
  `/**
 * POP GOMOJI'S ANSWERS. Written by \`scripts/word-lists-pop.mjs\` from the
 * hand-kept \`scripts/pop-corpus.txt\`; never edited by hand. Each word is
 * written \`word.n\`, n being its category's place in \`POP_CATEGORIES\`: the
 * clue the puzzle shows.
 */
export const POP_CATEGORIES: readonly string[] = ${JSON.stringify(categories, null, 2).replace(/\n/g, "\n")};

export const POP_ANSWERS: Record<number, string> = {
${answerParts.join("\n")}
};
`,
);
console.log(`Wrote ${ANSWERS_OUT}`);

/* The dictionary's three- and seven-letter words, as Gomoji's English guesses are read (\`word-lists.mjs\`). */
const wide = new Set();
for (const spelling of ["english", "american"]) {
  for (const size of [10, 20, 35, 40, 50, 55, 60, 70]) {
    const text = readFileSync(join(FINAL, `${spelling}-words.${size}`), "latin1");
    for (const line of text.split("\n")) {
      const word = line.trim();
      if (/^[a-z]+$/.test(word)) wide.add(word);
    }
  }
}
const copyright = readFileSync(join(FINAL, "..", "Copyright"), "latin1").split("\n").slice(0, 13).join("\n");
const guessParts = [];
for (const length of OWN_GUESS_LENGTHS) {
  const words = [...wide].filter((word) => word.length === length).sort();
  guessParts.push(`  ${length}: ${block(words)},`);
  console.log(`${length} letters: ${words.length} dictionary guesses`);
}
writeFileSync(
  GUESSES_OUT,
  `/**
 * POP GOMOJI'S DICTIONARY GUESSES AT THREE AND SEVEN LETTERS, the lengths
 * Gomoji's English lists do not have. Written by \`scripts/word-lists-pop.mjs\`
 * from SCOWL 2020.12.07 (http://wordlist.aspell.net/), read 2026-09-26: sizes
 * 10–70, English and American spellings, as \`words.en.data.ts\` is. Fetched
 * only when a three- or seven-letter Pop Gomoji is played (\`loadPopGuesses\`).
 * Never edited by hand; run the script again instead.
 *
 * SCOWL's notice, which its licence asks to travel with the lists:
 *
${copyright
  .split("\n")
  .map((line) => ` * ${line}`.trimEnd())
  .join("\n")}
 */
export const POP_GUESSES: Record<number, string> = {
${guessParts.join("\n")}
};
`,
);
console.log(`Wrote ${GUESSES_OUT}`);
