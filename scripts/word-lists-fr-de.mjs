#!/usr/bin/env node
/**
 * WRITES THE FRENCH AND GERMAN GOMOJI LISTS, so the lists in the repository
 * are a machine's output that anybody can make again, never a hand-kept table.
 * Modelled on `scripts/word-lists.mjs`, which does the same for English from
 * SCOWL.
 *
 * A REAL DICTIONARY DECIDES WHAT IS A WORD; the subtitles only say how common
 * one is. John, 2026-09-26, on a French puzzle whose answer was RUDD: "Why is
 * the French Word RUDD accepted??? what is wrong with our dictionary!?" — and
 * then "other languages might have this same problem, which is not
 * acceptable." These lists used to be a count of film subtitles alone, and
 * dubbed dialogue is full of English names and words, so RUDD, ROOD, AANG and
 * ALEC were French. ANY LANGUAGE ADDED LATER TAKES ITS WORDS FROM A REAL
 * DICTIONARY OF THAT LANGUAGE TOO; a frequency count may rank them, never
 * decide them.
 *
 * THE SOURCES, all under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/),
 * read 2026-09-26:
 *
 * - Lexique 3.83 (lexique.org), a lexical database of about 140,000 French
 *   words with how often each is read in books and heard in films:
 *   curl -sL -o Lexique383.zip http://www.lexique.org/databases/Lexique383/Lexique383.zip && unzip Lexique383.zip
 * - LanguageTool's german-pos-dict (Morphy, extended by korrekturen.de),
 *   github.com/languagetool-org/german-pos-dict, the files german.dict and
 *   german.info under src/main/resources/org/languagetool/resource/de,
 *   decompiled to lines of lemma_form_tag by morfologik-tools 2.1.9 (with
 *   jcommander 1.78, morfologik-fsa, morfologik-fsa-builders and
 *   morfologik-stemming 2.1.9 and hppc 0.8.1, all from Maven Central) in any
 *   Java runtime:
 *   docker run --rm -v "$PWD":/w -w /w eclipse-temurin:21-jre java -cp 'jars/*' morfologik.tools.Launcher dict_decompile --input german.dict --output german.txt
 * - hermitdave's FrequencyWords (OpenSubtitles 2018), for how common a word is:
 *   curl -sL -o fr_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fr/fr_50k.txt
 *   curl -sL -o de_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt
 *   Attribution: word frequency lists compiled by Hermit Dave from
 *   OpenSubtitles 2018 (https://opensubtitles.org).
 * - Wiktionary's French and German entries, as kaikki.org extracts them, the
 *   second dictionary an answer must be in, and for where a word English also
 *   spells came from:
 *   curl -sL -o fr.jsonl https://kaikki.org/dictionary/French/kaikki.org-dictionary-French.jsonl
 *   curl -sL -o de.jsonl https://kaikki.org/dictionary/German/kaikki.org-dictionary-German.jsonl
 *
 *   node scripts/word-lists-fr-de.mjs fr_50k.txt de_50k.txt Lexique383.tsv german.txt fr.jsonl de.jsonl
 *
 * WHAT MAY BE GUESSED: every spelling of the length the dictionary has, less a
 * proper name or an abbreviation — refusing a real word is the one thing a
 * word puzzle must not do, and nothing else may be accepted. French: a
 * Lexique spelling that French books use, or that no corpus counts at all (so
 * "anya", which only film dialogue says, is not a word). German: any form in
 * the dictionary not tagged a name (EIG) or an abbreviation (ABK).
 *
 * WHAT MAY BE HIDDEN, from those the subtitles say (their 50,000 commonest
 * words), ranked by how common: for French by Lexique's own count of the word
 * as that word, since the subtitles count "juan" and "jules" as the names they
 * mostly are; for German by the subtitles.
 * - A WORD OF BOTH DICTIONARIES: Wiktionary must have it too, as a word of
 *   this language and not only a name, which leaves out the brands and names a
 *   dictionary carries unmarked ("lego", "ajax", "Volvo", "Rhein").
 * - A BASE FORM, as the dictionary says (its lemma): a noun as it is listed, a
 *   verb's infinitive, an adjective's plain form, never a plural or a
 *   conjugation. French folds its accents, so "aime" (loves) and "aimé"
 *   (beloved) are one spelling here: it is a base form only when its base
 *   readings are at least a quarter of how often the spelling is read and
 *   heard (`BASE_SHARE`). German: a noun made of an adjective ("die Neue",
 *   tagged SUB…:ADJ) is the adjective's inflection, not a base form, and a
 *   word the dictionary lists as a noun only is not one when it is also the
 *   plural of another noun ("Slums") or an adjective inflected ("Alte",
 *   "Freie"), which is how a reader takes it — at the cost of "Junge" and
 *   "Tiefe", which may still be guessed.
 * - A WORD OF THE LANGUAGE, NOT OF ENGLISH. A word English also spells (its
 *   Gomoji list) is hidden only when Wiktionary names where it came from in
 *   this language, and more of its senses came from elsewhere than from
 *   English: French "agent" (from Latin) and "chat" (the cat outweighs the
 *   online chat) stay, and a tie goes to English;
 *   "cool", "look", "Like" and "Song" may be guessed and are never the answer.
 *   Nor is a shared word Wiktionary has no entry for in this language ("team"
 *   in French, "head" and "push" in German) or gives no origin ("house",
 *   "code", "Aroma"): a shared word has to be shown to be this language's, and
 *   losing "code" as an answer costs less than hiding "house". It is still a
 *   word to guess. Comparing how often French books and films use a word, as
 *   this first did, held back "agent" and "bail" (films say them more) and let
 *   through "class" and "smart" (books say them too).
 * - French: read in French books (Lexique's `freqlivres` above nought), and not
 *   an onomatopoeia ("ahem", "argh").
 * - Not in `NOT_AN_ANSWER`: vulgarity, slurs, and the few words for a people a
 *   slur is most often made of, which are fine to guess and not an answer.
 *
 * FRENCH folds accents to plain letters (é→E, ç→C…), as French Wordle clones
 * do, so the grid and keyboard are the AZERTY 26 letters; a word carrying œ or
 * æ has no plain-letter spelling and is left out entirely.
 *
 * GERMAN keeps Ä, Ö and Ü as letters of their own — QWERTZ has keys for them —
 * and a word carrying ß is left out, the way French leaves out œ and æ.
 */
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const [frPath, dePath, frDictPath, deDictPath, frWiktPath, deWiktPath] = process.argv.slice(2);
if ([frPath, dePath, frDictPath, deDictPath, frWiktPath, deWiktPath].includes(undefined)) {
  console.error("Usage: node scripts/word-lists-fr-de.mjs <fr_50k.txt> <de_50k.txt> <Lexique383.tsv> <german.txt> <fr.jsonl> <de.jsonl>");
  process.exit(1);
}
const LENGTHS = [4, 5, 6];
/** How much of a folded French spelling's use its base readings must be, for it to be a base form. */
const BASE_SHARE = 0.25;

/**
 * Names seen in the source lists themselves: kept as a second fence behind the dictionaries, since a few are words too
 * (German "Polen" is a verb, and reads as Poland; "Mars" is a mast's top, and reads as the planet).
 */
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
berthe sylvie claude benoit julien carole robert pascal tarzan figaro boston dundee olympe sparte thrace moloch mauser
bresil elysee paques bayard
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
steve tommy audi polen mars
barbie boeing toyota michel buddha genfer prager berner
`;
/**
 * Vulgar, sexual and slur words actually present at these lengths — found by scanning the candidate lists, not guessed
 * blind — and a French word an English reader sees as one ("rape", a grater).
 */
const FR_VULGAR = `anal baise bite cocu conne cons fesse merde negre negro nique penis pute putes salop seins vagin zizi homo porno hymen
pede pine bitte etron beuh tapin rape boche ducon clito fion caca pipi vomi fatma nazi teton chier garce sucer viol sexe idiot
bander bordel chiant chieur encule foutre gerber gouine niquer nichon pisser putain salaud salope sperme nympho gigolo libido
luxure sexuel suceur gammee fuhrer hetero pubien uretre uriner fesser fessee lecher violer verole herpes puceau vierge salace
extase toxico debile cretin abruti batard tocard ignare neuneu crotte ordure soutif capote voyeur degueu rectum gyneco youpin
ricain romano`;
/** The words a slur is most often made of: a real word to guess, not a puzzle's answer. */
const FR_PEOPLES = `juif juive eskimo`;
/** A contraction's stem, split from its apostrophe by the source's own tokeniser (jusqu'à → "jusqu" + "à") — not a word of its own. */
const FR_FRAGMENTS = `jusqu`;
const DE_VULGAR = `arsch fick fickt fotze geil geile hure huren kacke kotze mist neger nutte pisse milf after lesbe porno penis vulva titte
ficke dirne tunte puff popo zicke luder depp busen tussi idiot
bumsen ficken vögeln muschi pimmel nippel pissen pisser kotzen furzen koitus kondom erotik libido vagina voyeur domina inzest
geilen kiffen kiffer koksen kokain heroin psycho prolet lusche penner fatzke dussel zicken zickig fresse schwul pfaffe suizid
tampon saufen säufer schiss pinkel poppen eunuch`;
const DE_PEOPLES = `jude arier moslem türken eskimo`;

const NOT_AN_ANSWER = {
  fr: new Set(`${FR_NAMES} ${FR_VULGAR} ${FR_PEOPLES} ${FR_FRAGMENTS}`.split(/\s+/).filter(Boolean)),
  de: new Set(`${DE_NAMES} ${DE_VULGAR} ${DE_PEOPLES}`.split(/\s+/).filter(Boolean)),
};

const FOLD_FR = { é: "e", è: "e", ê: "e", ë: "e", à: "a", â: "a", î: "i", ï: "i", ô: "o", ö: "o", ù: "u", û: "u", ü: "u", ç: "c" };

function foldFrench(word) {
  return [...word].map((ch) => FOLD_FR[ch] ?? ch).join("");
}

/** Every English word Gomoji knows (its SCOWL list), to find the words this language shares with English. */
function readEnglish(path) {
  const text = readFileSync(path, "utf8");
  const words = new Set();
  for (const match of text.matchAll(/allowed: `([^`]*)`/g)) for (const word of match[1].split(/\s+/)) if (word !== "") words.add(word);
  return words;
}

/**
 * THE FRENCH DICTIONARY. `words` is every spelling that may be guessed;
 * `answerable` whether one may also be hidden (before the English check). In
 * this game's spelling: folded, lower case.
 */
function readLexique(path) {
  const plain = /^[a-zàâäçèéêëîïôöùûü]+$/;
  const words = new Set();
  // Per folded spelling: how much all its readings are used, and how much its base readings that books use and that are not onomatopoeia.
  const used = new Map();
  const usedAsBase = new Map();
  for (const line of readFileSync(path, "utf8").split("\n").slice(1)) {
    const cells = line.split("\t");
    const ortho = cells[0];
    if (ortho === undefined || !plain.test(ortho)) continue;
    const spelled = foldFrench(ortho);
    const film = Number(cells[8]) || 0;
    const book = Number(cells[9]) || 0;
    // A spelling only film dialogue uses and no French book ever does ("anya") is subtitle noise, not a word to guess.
    if (book > 0 || film === 0) words.add(spelled);
    used.set(spelled, (used.get(spelled) ?? 0) + film + book);
    // Read in books, and not an onomatopoeia ("ahem", "argh"): an answer somebody would call a French word.
    if (ortho === cells[2] && book > 0 && cells[3] !== "ONO") usedAsBase.set(spelled, (usedAsBase.get(spelled) ?? 0) + film + book);
  }
  const answerable = (word) => {
    const base = usedAsBase.get(word);
    return base !== undefined && base >= BASE_SHARE * (used.get(word) ?? 0);
  };
  // How often books and films use the word as the word it is, per million: Lexique counts "juan" (of don Juan), not the name.
  const commonness = (word) => usedAsBase.get(word) ?? 0;
  return { words, answerable, commonness };
}

function readGermanPos(path) {
  const plain = /^[a-zäöü]+$/;
  const words = new Set();
  // Per spelling: the parts of speech it is a base form of, and whether it is also a form of another noun.
  const baseOf = new Map();
  const formOfAnotherNoun = new Set();
  const formOfAnAdjective = new Set();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const [lemma, form, tag] = line.split("_");
    if (lemma === undefined || form === undefined || tag === undefined) continue;
    // A proper name or an abbreviation is not a word to guess, whatever the subtitles say.
    if (tag.startsWith("EIG") || tag.startsWith("ABK")) continue;
    const spelled = form.toLowerCase();
    if (!plain.test(spelled)) continue;
    words.add(spelled);
    const pos = tag.split(":")[0];
    if (spelled === lemma.toLowerCase()) {
      // "die Neue" is neu inflected, wearing a noun's tag: not a base form.
      if (pos === "SUB" && tag.endsWith(":ADJ")) continue;
      if (!baseOf.has(spelled)) baseOf.set(spelled, new Set());
      baseOf.get(spelled).add(pos);
    } else if (pos === "SUB" && tag.includes(":PLU")) {
      // A plural, not a spelling variant: "Sauce" is a form of "Soße", and a word of its own.
      formOfAnotherNoun.add(spelled);
    } else if (pos === "ADJ") {
      formOfAnAdjective.add(spelled);
    }
  }
  const answerable = (word) => {
    const kinds = baseOf.get(word);
    if (kinds === undefined) return false;
    const nounOnly = [...kinds].every((kind) => kind === "SUB");
    // A noun only as the plural of another noun ("Slums", "Slum") is that noun's plural; one that is also an
    // adjective inflected ("Alte", "Freie", "Grüne") reads as the adjective.
    return !(nounOnly && (formOfAnotherNoun.has(word) || formOfAnAdjective.has(word)));
  };
  return { words, answerable };
}

/** Wiktionary's templates that name the language a word came from, in their second argument. */
const SOURCE_TEMPLATES = new Set(["inh", "inh+", "bor", "bor+", "ubor", "lbor", "slbor", "obor", "der", "der+", "calque", "cal", "clq", "psm", "pseudo-loan"]);
/** Its newer templates, which name it inside their later arguments ("en:cool"). */
const ETYMON_TEMPLATES = new Set(["ety", "etymon"]);

/** The languages one Wiktionary entry says its word came from, from its templates, or from its text when it has none. */
function sourcesOf(entry) {
  const languages = [];
  for (const template of entry.etymology_templates ?? []) {
    const args = template.args ?? {};
    if (SOURCE_TEMPLATES.has(template.name) && args["2"] !== undefined) languages.push(args["2"]);
    if (ETYMON_TEMPLATES.has(template.name)) {
      for (const [key, value] of Object.entries(args)) if (Number(key) >= 3 && /^[a-z-]+:/.test(value)) languages.push(value.split(":")[0]);
    }
  }
  const text = (entry.etymology_text ?? "").trim();
  if (languages.length === 0 && text !== "") {
    languages.push(/^(?:(?:unadapted |semi-learned )?borrow(?:ed|ing) from |from )?(?:american |british )?english\b/i.test(text) ? "en" : "?");
  }
  return languages;
}

/**
 * Where Wiktionary says a word came from, for each of `candidates`. A word
 * may have several entries — French "chat" is the cat, inherited from Latin,
 * and the online chat, borrowed from English — so each entry's senses are
 * counted towards its origin, and the word is "english" when more of its
 * senses came from English than from anywhere else, "other" when fewer,
 * "unknown" when it has entries that name no origin, and missing when it has
 * no entry in this language at all. A proper name's entry says nothing about
 * the word.
 */
async function readOrigins(path, langCode, candidates, fold) {
  const senses = new Map();
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of lines) {
    if (![...line.matchAll(/"word": "([^"]*)"/g)].some((match) => candidates.has(fold(match[1].toLowerCase())))) continue;
    const entry = JSON.parse(line);
    const word = fold(entry.word.toLowerCase());
    if (entry.lang_code !== langCode || !candidates.has(word) || entry.pos === "name") continue;
    // French entries are lower case, so a capital is a name; German nouns are capitalised.
    if (langCode === "fr" && entry.word !== entry.word.toLowerCase()) continue;
    // A conjugated or plural form's entry points at its lemma and says nothing of its own.
    if ((entry.etymology_templates ?? []).some((template) => template.name === "nonlemma")) continue;
    const count = { english: 0, other: 0, ...senses.get(word) };
    const sources = sourcesOf(entry);
    const weight = Math.max(1, entry.senses?.length ?? 0);
    if (sources.includes("en")) count.english += weight;
    else if (sources.length > 0) count.other += weight;
    senses.set(word, count);
  }
  const origins = new Map();
  for (const [word, count] of senses) {
    // A tie goes to English: German "Gate" is the airport's before it is a Hungarian pair of long johns.
    origins.set(word, count.english === 0 && count.other === 0 ? "unknown" : count.english >= count.other ? "english" : "other");
  }
  return origins;
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

const CREDIT = {
  fr: `Lexique 3.83 (http://www.lexique.org), which decides what is a word; ranked by
 * hermitdave's FrequencyWords (OpenSubtitles 2018, https://github.com/hermitdave/FrequencyWords,
 * content/2018/fr/fr_50k.txt; word frequency lists compiled by Hermit Dave from
 * https://opensubtitles.org), with Lexique's own count ranking the answers; and
 * Wiktionary (via https://kaikki.org), which an answer must also be in, and which
 * says where a word English also spells came from`,
  de: `LanguageTool's german-pos-dict (Morphy and korrekturen.de,
 * https://github.com/languagetool-org/german-pos-dict), which decides what is a
 * word; ranked by hermitdave's FrequencyWords (OpenSubtitles 2018,
 * https://github.com/hermitdave/FrequencyWords, content/2018/de/de_50k.txt; word
 * frequency lists compiled by Hermit Dave from https://opensubtitles.org); and
 * Wiktionary (via https://kaikki.org), which an answer must also be in, and which
 * says where a word English also spells came from`,
};

async function buildLanguage(path, lang, dictionary, wiktPath, english, outPath, label) {
  const byRank = readSource(path, lang);
  const wide = dictionary.words;
  // Only what could be hidden needs its origin read.
  const candidates = new Set([...byRank.keys()].filter((word) => LENGTHS.includes(word.length) && wide.has(word) && dictionary.answerable(word)));
  const origins = await readOrigins(wiktPath, lang, candidates, lang === "fr" ? foldFrench : (word) => word);
  // Two dictionaries must agree: one the main dictionary has and Wiktionary does not is a brand or a name ("lego", "ajax", "Volvo", "Rhein").
  const inWiktionary = (word) => origins.has(word);
  // A shared word is this language's only when Wiktionary says so: no entry, no origin or an English one all hold it back.
  const borrowed = (word) => english.has(word) && origins.get(word) !== "other";
  const parts = [];
  for (const length of LENGTHS) {
    // Ranked by how often dialogue says it, but only words the dictionary has.
    const atLength = [...byRank.entries()]
      .filter(([word]) => word.length === length && wide.has(word))
      .sort((a, b) => a[1] - b[1]);
    const allowed = [...wide].filter((word) => word.length === length).sort();
    const answerRanked = atLength.filter(
      ([word]) =>
        dictionary.answerable(word) && inWiktionary(word) && !borrowed(word) && !NOT_AN_ANSWER[lang].has(word) && !/(.)\1\1/.test(word),
    );
    // A dictionary that counts its own words ranks them itself: the subtitles count "juan" and "jules" as the names they mostly are.
    if (dictionary.commonness !== undefined) answerRanked.sort((a, b) => dictionary.commonness(b[0]) - dictionary.commonness(a[0]) || a[1] - b[1]);
    const answers = answerRanked.map(([word]) => word).sort();
    // Easy: the more frequent half of the answers.
    const easy = answerRanked
      .slice(0, Math.ceil(answerRanked.length / 2))
      .map(([word]) => word)
      .sort();
    parts.push(`  ${length}: {\n    easy: ${block(easy)},\n    answers: ${block(answers)},\n    allowed: ${block(allowed)},\n  },`);
    const held = atLength.filter(([word]) => dictionary.answerable(word) && borrowed(word)).length;
    console.log(`${label} ${length} letters: ${easy.length} easy answers, ${answers.length} answers, ${allowed.length} allowed (${held} shared with English held back)`);
  }
  writeFileSync(
    outPath,
    `/**
 * THE ${label.toUpperCase()} WORDS FOR GOMOJI. Written by \`scripts/word-lists-fr-de.mjs\`, read 2026-09-26, from
 * ${CREDIT[lang]}. All under CC BY-SA 4.0
 * (https://creativecommons.org/licenses/by-sa/4.0/), and this list with them.
 * Never edited by hand; run the script again instead.
 *
 * Every word the dictionary has may be guessed. An answer is also in
 * Wiktionary, a base form, a word of this language rather than one borrowed
 * from English, and not vulgar or a slur (the script says how).
 ${lang === "fr" ? "* Accents are folded to their plain letter (é→E, ç→C…); a word with œ or æ has no plain spelling and is left out." : "* Ä, Ö and Ü are kept as letters of their own; a word with ß is left out, the way French leaves out œ and æ."}
 */
export const ${lang.toUpperCase()}_WORDS: Record<number, { easy: string; answers: string; allowed: string }> = {
${parts.join("\n")}
};
`,
  );
  console.log(`Wrote ${outPath}`);
}

const english = readEnglish("src/lib/puzzles/gomoji/words.en.data.ts");
await buildLanguage(frPath, "fr", readLexique(frDictPath), frWiktPath, english, "src/lib/puzzles/gomoji/words.fr.data.ts", "French");
await buildLanguage(dePath, "de", readGermanPos(deDictPath), deWiktPath, english, "src/lib/puzzles/gomoji/words.de.data.ts", "German");
