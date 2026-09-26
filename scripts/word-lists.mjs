#!/usr/bin/env node
/**
 * WRITES THE GOMOJI LISTS from SCOWL, so the lists in the repository are
 * a machine's output that anybody can make again, never a hand-kept table.
 *
 *   curl -sL -o scowl.tar.gz https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz
 *   tar xzf scowl.tar.gz
 *   node scripts/word-lists.mjs scowl-2020.12.07/final
 *
 * SCOWL (Spell Checker Oriented Word Lists, Kevin Atkinson) is under a
 * permissive notice that asks only that its copyright notice travel with the
 * lists; the notice is written into the file this makes. Its sizes run from 10
 * (the commonest words) to 95 (the rarest): the answers come from sizes 10 to
 * 35, the easy answers from 10 and 20 alone, and what may be guessed from sizes
 * up to 70. English and American spellings both, lower case a–z only, so no
 * proper names, abbreviations or possessives.
 *
 * An answer is a word anybody would be glad to see. Plurals and past tenses
 * whose stem is itself a word are left out of the answers (a puzzle whose
 * answer is "cats" is a puzzle about "cat"), as are slurs, vulgarity,
 * anything sexual, drugs and insults a player could read as aimed at them, by
 * the list below. All of them may still be GUESSED: the allowed list is every
 * word, because refusing a real word is the one thing a word puzzle must not
 * do.
 *
 * SCOWL is a real dictionary, so a word here is English; any language Gomoji
 * adds later takes its words from a real dictionary of that language too, never
 * from a frequency count alone (`word-lists-fr-de.mjs` says why).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FINAL = process.argv[2];
if (FINAL === undefined) {
  console.error("Usage: node scripts/word-lists.mjs <scowl>/final");
  process.exit(1);
}
const OUT = "src/lib/puzzles/gomoji/words.en.data.ts";
const LENGTHS = [4, 5];

const NOT_AN_ANSWER = new Set(
  `arse arsed bitch boner boobs booby boob butt butts crap cunt damn dick dicks dildo dyke fag fags fart farts fuck
  fucks gook hell piss pissy shit slut sluts spic tits titty turd twat wank whore pussy prick horny bimbo homo negro
  kike pimp porn rape raped rapes sexy penis semen sperm anal anus coon dago gypsy honky jizz kinky nazi queer skank
  slag spunk tramp wench wop bong booze crack weed pee poop puke vomit pubic nude nudes lust lusty balls ballsy bust
  busty strip chink lynch noose orgy lewd smut hump booty thong puss coke dope moron idiot scum`.split(/\s+/).filter(Boolean),
);

function wordsAt(sizes) {
  const found = new Set();
  for (const spelling of ["english", "american"]) {
    for (const size of sizes) {
      const text = readFileSync(join(FINAL, `${spelling}-words.${size}`), "latin1");
      for (const line of text.split("\n")) {
        const word = line.trim();
        if (/^[a-z]+$/.test(word)) found.add(word);
      }
    }
  }
  return found;
}

const easy = wordsAt([10, 20]);
const common = wordsAt([10, 20, 35]);
const wide = wordsAt([10, 20, 35, 40, 50, 55, 60, 70]);

/** A plural or past tense whose stem is a word of its own. */
function inflected(word) {
  const has = (stem) => wide.has(stem);
  if (word.endsWith("s") && !word.endsWith("ss")) {
    if (has(word.slice(0, -1))) return true;
    if (word.endsWith("es") && has(word.slice(0, -2))) return true;
    if (word.endsWith("ies") && has(`${word.slice(0, -3)}y`)) return true;
  }
  if (word.endsWith("ed")) {
    if (has(word.slice(0, -2)) || has(word.slice(0, -1))) return true;
    if (word.length > 3 && word.at(-3) === word.at(-4) && has(word.slice(0, -3))) return true;
    if (word.endsWith("ied") && has(`${word.slice(0, -3)}y`)) return true;
  }
  return false;
}

/** Words of one length as lines of text, a hundred and fifty to a line, so a diff shows what moved. */
function block(words) {
  const lines = [];
  for (let at = 0; at < words.length; at += 150) lines.push(words.slice(at, at + 150).join(" "));
  return `\`\n${lines.join("\n")}\n\``;
}

const copyright = readFileSync(join(FINAL, "..", "Copyright"), "latin1").split("\n").slice(0, 13).join("\n");
const parts = [];
for (const length of LENGTHS) {
  const answers = [...common].filter((word) => word.length === length && !inflected(word) && !NOT_AN_ANSWER.has(word)).sort();
  const easyAnswers = answers.filter((word) => easy.has(word));
  const allowed = [...wide].filter((word) => word.length === length).sort();
  parts.push(`  ${length}: {\n    easy: ${block(easyAnswers)},\n    answers: ${block(answers)},\n    allowed: ${block(allowed)},\n  },`);
  console.log(`${length} letters: ${easyAnswers.length} easy answers, ${answers.length} answers, ${allowed.length} allowed`);
}

writeFileSync(
  OUT,
  `/**
 * THE ENGLISH WORDS FOR GOMOJI. Written by \`scripts/word-lists.mjs\` from
 * SCOWL 2020.12.07 (http://wordlist.aspell.net/), read 2026-09-25: answers from
 * sizes 10–35 (easy: 10–20), guesses from sizes 10–70, English and American
 * spellings. Never edited by hand; run the script again instead.
 *
 * SCOWL's notice, which its licence asks to travel with the lists:
 *
${copyright
  .split("\n")
  .map((line) => ` * ${line}`.trimEnd())
  .join("\n")}
 */
export const EN_WORDS: Record<number, { easy: string; answers: string; allowed: string }> = {
${parts.join("\n")}
};
`,
);
console.log(`Wrote ${OUT}`);
