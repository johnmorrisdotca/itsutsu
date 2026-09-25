#!/usr/bin/env node
/**
 * WRITES THE KANA WORDDROP LISTS from JMdict, so the list in the repository is
 * a machine's output anybody can make again, never a hand-kept table. See
 * docs/plans/other/WORD-04-kana.md.
 *
 *   curl -sL -o JMdict_e.gz http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz
 *   node scripts/word-lists-ja.mjs JMdict_e.gz
 *
 * JMdict is the Electronic Dictionary Research and Development Group's
 * dictionary, under CC BY-SA 4.0 with EDRDG's own conditions
 * (https://www.edrdg.org/edrdg/licence.html, read 2026-09-25): the pages that
 * show its words say so, and the data is refreshed from the newest release at
 * least monthly — which is why this runs on a schedule
 * (.github/workflows/jmdict-refresh.yml) and writes the release date into the
 * file it makes. The list it makes is a derived work under the same licence.
 *
 * Every kana reading of 3, 4 or 5 kana may be guessed, folded to hiragana (ー
 * stays). The answers are the COMMONEST readings, ranked by a rule rather than
 * picked by hand, and about as many as English has (John, 2026-09-25: "a
 * programmatic way to narrow down words to best words… shouldn't be too much
 * larger than english"): easy the first 900 at each length, medium and hard the
 * first 2,000. The rank: words in the textbook-common list (ichi1) first; then
 * the newspaper frequency band (nf01 is the 500 commonest, nf02 the next 500),
 * with spec1 counted as band 12, gai1 as 16 and spec2 as 30; then more marks
 * before fewer; then kana order. A reading shared by several entries takes its
 * best. Left out of the answers: interjections, particles, conjunctions,
 * affixes, counters, auxiliaries and set phrases, anything JMdict marks vulgar,
 * derogatory, sensitive, archaic, obsolete or rare, irregular spellings, a word
 * starting with ー or a small kana, and the few below.
 *
 * Stored one character a kana, the words of one length run together with
 * nothing between them, one file a length: a 3-kana puzzle loads about fifty
 * kilobytes, where all three lists written out as kana would be over a megabyte.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const SOURCE = process.argv[2];
if (SOURCE === undefined) {
  console.error("Usage: node scripts/word-lists-ja.mjs <JMdict_e.gz>");
  process.exit(1);
}
const OUT = (length) => `src/lib/puzzles/wordDropKana/words.ja.${length}.data.ts`;
const LENGTHS = [3, 4, 5];
const EASY = 900;
const ANSWERS = 2000;
/** Where a commonness mark with no newspaper band stands among the bands. */
const BAND = { ichi1: 12, spec1: 12, gai1: 16, spec2: 30 };

/** Parts of speech that are not the kind of word a puzzle hides. */
const NOT_ANSWER_POS = new Set(["int", "prt", "conj", "suf", "pref", "ctr", "aux", "aux-v", "aux-adj", "cop", "exp", "pn", "unc"]);
/** JMdict's own marks for words a puzzle should not hide. */
const NOT_ANSWER_MISC = new Set(["vulg", "X", "derog", "sens", "arch", "obs", "rare", "obsc"]);
/** Readings a puzzle should not hide that JMdict marks no differently. */
const NOT_AN_ANSWER = new Set(["うんこ", "うんち", "おなら", "おしっこ", "ちんこ", "まんこ", "ちんぽ", "くそ", "げろ", "しっこ", "ぶす", "でぶ", "はげ", "ばか", "あほ", "ぼけ", "かす"]);

const HIRAGANA = /^[ぁ-ゖー]+$/u;
/** Every character a word may hold, in a fixed order: each is written as one printable character. */
const KANA = [...Array.from({ length: 0x3096 - 0x3041 + 1 }, (_, at) => String.fromCodePoint(0x3041 + at)), "ー"];
/** Printable ASCII, less the double quote and backslash, so the strings need no escaping. */
const CODES = Array.from({ length: 0x7e - 0x21 + 1 }, (_, at) => String.fromCodePoint(0x21 + at)).filter((char) => char !== '"' && char !== "\\");
if (CODES.length < KANA.length) throw new Error("Not enough printable characters for the kana.");
const encode = (word) => [...word].map((kana) => CODES[KANA.indexOf(kana)]).join("");

const toHiragana = (text) =>
  [...text].map((char) => {
    const code = char.codePointAt(0);
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : char;
  }).join("");

const xml = gunzipSync(readFileSync(SOURCE)).toString("utf8");
const created = /<!-- JMdict created: (\d{4}-\d{2}-\d{2}) -->/.exec(xml)?.[1];
if (created === undefined) throw new Error("No JMdict release date in the file.");

const allowed = Object.fromEntries(LENGTHS.map((length) => [length, new Set()]));
/** Each reading fit to hide, and its best rank: lower is commoner. */
const ranked = Object.fromEntries(LENGTHS.map((length) => [length, new Map()]));
for (const entry of xml.split("<entry>").slice(1)) {
  const pos = [...entry.matchAll(/<pos>&([^;]+);<\/pos>/g)].map((match) => match[1]);
  const misc = [...entry.matchAll(/<misc>&([^;]+);<\/misc>/g)].map((match) => match[1]);
  // A word is fit to hide when some sense is a kind of word a puzzle hides and nothing marks it unfit.
  const fit = pos.some((each) => !NOT_ANSWER_POS.has(each)) && !misc.some((each) => NOT_ANSWER_MISC.has(each));
  for (const [, element] of entry.matchAll(/<r_ele>([\s\S]*?)<\/r_ele>/g)) {
    const reading = toHiragana(/<reb>([^<]+)<\/reb>/.exec(element)[1]);
    if (!HIRAGANA.test(reading)) continue;
    const length = [...reading].length;
    if (!LENGTHS.includes(length)) continue;
    allowed[length].add(reading);
    // An irregular or outdated kana spelling may be guessed, never hidden.
    if (/<re_inf>&(ik|ok|rk|sk);<\/re_inf>/.test(element) || !fit || NOT_AN_ANSWER.has(reading)) continue;
    // A word may not start with ー or a small kana, whatever a dictionary spells.
    if (reading.startsWith("ー") || /^[ぁぃぅぇぉっゃゅょゎゕゖ]/u.test(reading)) continue;
    const marks = [...element.matchAll(/<re_pri>([^<]+)<\/re_pri>/g)].map((match) => match[1]);
    const bands = marks.map((mark) => (/^nf\d\d$/.test(mark) ? Number(mark.slice(2)) : BAND[mark])).filter((band) => band !== undefined);
    if (bands.length === 0) continue;
    const rank = (marks.includes("ichi1") ? 0 : 1000) + Math.min(...bands) * 10 - marks.length;
    const was = ranked[length].get(reading);
    if (was === undefined || rank < was) ranked[length].set(reading, rank);
  }
}

const tiers = Object.fromEntries(
  LENGTHS.map((length) => {
    const order = [...ranked[length]].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1)).map(([reading]) => reading);
    return [length, { easy: new Set(order.slice(0, EASY)), answers: new Set(order.slice(0, ANSWERS)), allowed: allowed[length] }];
  }),
);

const packed = (set) => JSON.stringify([...set].sort().map(encode).join(""));
const counts = LENGTHS.map((length) => `${length}: ${tiers[length].easy.size} easy, ${tiers[length].answers.size} answers, ${tiers[length].allowed.size} allowed`);
/* One file a length, so a puzzle loads only the list of the length it is (`kanaWords.ts`). */
for (const length of LENGTHS) {
  const tier = tiers[length];
  writeFileSync(
    OUT(length),
    `/**
 * THE ${length}-KANA WORDS FOR WORDDROP. Written by \`scripts/word-lists-ja.mjs\` from
 * JMdict, release ${created}. Never edited by hand; the monthly refresh
 * (.github/workflows/jmdict-refresh.yml) runs the script again.
 *
 * JMdict is the property of the Electronic Dictionary Research and Development
 * Group (EDRDG), used under the Creative Commons Attribution-ShareAlike 4.0
 * licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.
 * This list is derived from it and is under the same licence.
 *
 * ${tier.easy.size} easy answers, ${tier.answers.size} answers at medium and hard, ${tier.allowed.size} words that may be guessed.
 * Each word is written one character a kana through \`alphabet\` and \`codes\`,
 * the words run together with nothing between them (\`kanaWords.ts\` reads them).
 */
export const JA_WORDS_${length} = {
  release: "${created}",
  alphabet: ${JSON.stringify(KANA.join(""))},
  codes: ${JSON.stringify(CODES.slice(0, KANA.length).join(""))},
  easy: ${packed(tier.easy)},
  answers: ${packed(tier.answers)},
  allowed: ${packed(tier.allowed)},
};
`,
  );
}
console.log(`JMdict ${created}: ${counts.join("; ")}`);
