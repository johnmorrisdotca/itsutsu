#!/usr/bin/env node
/**
 * WRITES THE FRENCH AND GERMAN GOMOJI LISTS from hermitdave's FrequencyWords
 * (OpenSubtitles 2018), so the lists in the repository are a machine's output
 * that anybody can make again, never a hand-kept table. Modelled on
 * `scripts/word-lists.mjs`, which does the same for English from SCOWL.
 *
 *   curl -sL -o fr_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fr/fr_50k.txt
 *   curl -sL -o de_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt
 *   node scripts/word-lists-fr-de.mjs fr_50k.txt de_50k.txt
 *
 * FrequencyWords (Hermit Dave) is the 2018 OpenSubtitles word-frequency count,
 * "word count" one per line, most frequent first, under CC BY-SA 4.0:
 * https://github.com/hermitdave/FrequencyWords — read 2026-09-25.
 * Attribution: Word frequency lists compiled by Hermit Dave from OpenSubtitles
 * 2018 (https://opensubtitles.org), licensed CC BY-SA 4.0
 * (https://creativecommons.org/licenses/by-sa/4.0/).
 *
 * FRENCH folds accents to plain letters (é→E, ç→C…), as French Wordle clones
 * do, so the grid and keyboard are the AZERTY 26 letters; a word carrying œ or
 * æ has no plain-letter spelling and is left out entirely, raw form and all.
 *
 * GERMAN keeps Ä, Ö and Ü as letters of their own — QWERTZ has keys for them —
 * and a word carrying ß is left out, the way French leaves out œ and æ: there
 * is no fold that keeps ß a letter of its own without inventing one.
 *
 * An answer is a word anybody would be glad to see. Proper names, abbreviations
 * and vulgarity are held back from the answers by the NOT_AN_ANSWER set below,
 * hand-picked by scanning the source list itself (subtitle dialogue is full of
 * character names SCOWL never had to filter). Plurals and conjugated forms
 * whose stem is itself a word are held back too, where that is easy to detect —
 * a plain "-s" plural or a common suffix, not French or German's full
 * conjugation. All of them may still be GUESSED: the allowed list is every
 * word of the length the source carries, because refusing a real word is the
 * one thing a word puzzle must not do.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [frPath, dePath] = process.argv.slice(2);
if (frPath === undefined || dePath === undefined) {
  console.error("Usage: node scripts/word-lists-fr-de.mjs <fr_50k.txt> <de_50k.txt>");
  process.exit(1);
}
const LENGTHS = [4, 5];

/** Names seen in the source lists themselves: subtitle dialogue is full of them, English and native alike (dubbed television). */
/* "rose" (flower) and, for German, "will" (wants) and "jean" (real vocabulary too) are left off these lists on purpose. */
const FR_NAMES = `
abby adam addy alan alex andy anna arne bibi bill carl coco cole dave dean dena dirk dodo doug ella emil
emma emmy eric erik fifi finn gary gigi gina greg hank hans ivan jack jana jane jeff jens john josh judy
kara karl kate kati king kurt kyle lars lena liam lily lisa lois lucy luke lulu marc mark mary matt mike
mimi momo mona nate nick nils nina nino noah nora olaf otto paul phil remy rena rene rick rita rolf ross
rudi rudy ryan sara sean stan suzy sven tara theo tina toby tony vera will yvan yves agnes alain andre
anton bella billy bjorn bobby brian bruno carla chloe chris chuck clark danny david denis diana emily
erika frank franz fritz georg greta guido heidi henry horst james jerry jesus jimmy kevin laila larry
laura manon maria marie marta peter petra regis robin roger sarah scott serge steve tommy mlle
`;
const DE_NAMES = `
abby adam addy alan alex andy anke anna arne bibi bill carl coco cole dave dean dena dirk dodo doug egon
ella emil emma emmy eric erik fifi finn gary gigi gina greg hank hans ivan jack jana jane jean jeff jens
john josh judy kara karl kate kati king kurt kyle lars lena liam lily lisa lois lucy luke lulu marc mark
mary matt mike mimi momo mona nate nick nils nina nino noah nora olaf otto paul phil remy rena rene rick
rita rolf ross rudi rudy ryan sara sean stan susi suzy sven tara theo tina toby tony vera yves agnes
alain andre anton bella benno bernd billy bjorn bobby brian bruno carla chloe chris chuck clark danny
david denis diana emily erika frank franz fritz georg greta guido heidi henry horst james jerry jesus
jimmy kevin laila larry laura manon maria marie marta peter petra regis robin roger sarah scott serge
steve tommy
`;
/** Vulgar, sexual and slur words actually present at these lengths — found by scanning the candidate lists, not guessed blind. */
const FR_VULGAR = `anal baise bite cocu conne cons fesse merde negre negro nique penis pute putes salop seins vagin`;
/** A contraction's stem, split from its apostrophe by the source's own tokeniser (jusqu'à → "jusqu" + "à") — not a word of its own. */
const FR_FRAGMENTS = `jusqu`;
const DE_VULGAR = `arsch fick fickt fotze geil geile hure huren kacke kotze mist neger nutte pisse`;

const NOT_AN_ANSWER = {
  fr: new Set(`${FR_NAMES} ${FR_VULGAR} ${FR_FRAGMENTS}`.split(/\s+/).filter(Boolean)),
  de: new Set(`${DE_NAMES} ${DE_VULGAR}`.split(/\s+/).filter(Boolean)),
};

const FOLD_FR = { é: "e", è: "e", ê: "e", ë: "e", à: "a", â: "a", î: "i", ï: "i", ô: "o", ö: "o", ù: "u", û: "u", ü: "u", ç: "c" };

function foldFrench(word) {
  return [...word].map((ch) => FOLD_FR[ch] ?? ch).join("");
}

/**
 * Subtitle dialogue carries plenty of English and other foreign words and
 * names that are not this language's own — most visibly, French almost never
 * spells a native word with a "w" (it has none outside recent loanwords:
 * wagon, web), and neither language starts a common word with "x". Held back
 * from the ANSWERS only; a loanword or a name is still a real word to guess.
 */
function looksForeign(lang, word) {
  if (word.startsWith("x")) return true;
  if (lang === "fr" && word.includes("w")) return true;
  return false;
}

/** A plural (French "-s") or a common German suffix whose stem is a word of its own. Not a full conjugation table — the easy cases only. */
function inflected(lang, word, wide) {
  const has = (stem) => stem.length >= 2 && wide.has(stem);
  if (lang === "fr") {
    if (word.endsWith("s") && !word.endsWith("ss") && has(word.slice(0, -1))) return true;
    if (word.endsWith("e") && !word.endsWith("ee") && has(word.slice(0, -1))) return true;
    return false;
  }
  for (const suffix of ["en", "er", "es", "em", "e", "n", "s"]) {
    if (word.endsWith(suffix) && has(word.slice(0, -suffix.length))) return true;
  }
  return false;
}

/**
 * Read one FrequencyWords file into the words this game can use: alphabetic
 * (this language's letters only), the excluded letter left out entirely,
 * folded (French) or as-is (German), deduplicated keeping the most frequent
 * spelling's rank (the file is already ranked, most frequent first).
 */
function readSource(path, lang) {
  const raw = lang === "fr" ? /^[a-zàâäçèéêëîïôöùûüœæ]+$/ : /^[a-zäöüß]+$/;
  const excluded = lang === "fr" ? (word) => word.includes("œ") || word.includes("æ") : (word) => word.includes("ß");
  const byRank = new Map();
  const lines = readFileSync(path, "utf8").split("\n");
  lines.forEach((line, rank) => {
    const word = line.trim().split(/\s+/)[0];
    if (word === undefined || word === "" || !raw.test(word) || excluded(word)) return;
    const spelled = lang === "fr" ? foldFrench(word) : word;
    if (!byRank.has(spelled)) byRank.set(spelled, rank);
  });
  return byRank;
}

/** Words of one length as lines of text, a hundred and fifty to a line, so a diff shows what moved. */
function block(words) {
  const lines = [];
  for (let at = 0; at < words.length; at += 150) lines.push(words.slice(at, at + 150).join(" "));
  return `\`\n${lines.join("\n")}\n\``;
}

function buildLanguage(path, lang, outPath, label) {
  const byRank = readSource(path, lang);
  const wide = new Set(byRank.keys());
  const parts = [];
  for (const length of LENGTHS) {
    const atLength = [...byRank.entries()]
      .filter(([word]) => word.length === length)
      .sort((a, b) => a[1] - b[1]);
    const allowed = atLength.map(([word]) => word).sort();
    const answerRanked = atLength.filter(
      ([word]) => !inflected(lang, word, wide) && !NOT_AN_ANSWER[lang].has(word) && !looksForeign(lang, word) && !/(.)\1\1/.test(word),
    );
    const answers = answerRanked.map(([word]) => word).sort();
    // Easy: the more frequent half of the answers, by the same rank the source gave them.
    const easy = answerRanked
      .slice(0, Math.ceil(answerRanked.length / 2))
      .map(([word]) => word)
      .sort();
    parts.push(`  ${length}: {\n    easy: ${block(easy)},\n    answers: ${block(answers)},\n    allowed: ${block(allowed)},\n  },`);
    console.log(`${label} ${length} letters: ${easy.length} easy answers, ${answers.length} answers, ${allowed.length} allowed`);
  }
  writeFileSync(
    outPath,
    `/**
 * THE ${label.toUpperCase()} WORDS FOR GOMOJI. Written by \`scripts/word-lists-fr-de.mjs\`
 * from hermitdave's FrequencyWords (OpenSubtitles 2018), read 2026-09-25:
 * https://github.com/hermitdave/FrequencyWords, content/2018/${lang}/${lang}_50k.txt.
 * Licensed CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/) —
 * word frequency lists compiled by Hermit Dave from OpenSubtitles 2018
 * (https://opensubtitles.org). Never edited by hand; run the script again instead.
 *
 * Answers exclude proper names, abbreviations, slurs and vulgarity
 * (\`NOT_AN_ANSWER\` in the script) and plain plurals or conjugated forms whose
 * stem is itself a word; every word the source carries may still be guessed.
 ${lang === "fr" ? "* Accents are folded to their plain letter (é→E, ç→C…); a word with œ or æ has no plain spelling and is left out." : "* Ä, Ö and Ü are kept as letters of their own; a word with ß is left out, the way French leaves out œ and æ."}
 */
export const ${lang.toUpperCase()}_WORDS: Record<number, { easy: string; answers: string; allowed: string }> = {
${parts.join("\n")}
};
`,
  );
  console.log(`Wrote ${outPath}`);
}

buildLanguage(frPath, "fr", "src/lib/puzzles/gomoji/words.fr.data.ts", "French");
buildLanguage(dePath, "de", "src/lib/puzzles/gomoji/words.de.data.ts", "German");
