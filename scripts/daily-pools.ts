/**
 * Writes the daily words' pools: a frozen copy of each Gomoji's answer list,
 * per language and length, that the word of each day is drawn from
 * (`src/lib/puzzles/dailyWords/`). Run with `node scripts/daily-pools.ts`.
 *
 * IT ONLY EVER ADDS. A pool already written is copied back exactly as it
 * stands, because a pool in use decides every past day of its cycles and
 * `dailyPools.test.ts` holds each one to its hash. What this adds is a pool for
 * a length that has none yet — a new size of Gomoji — taken from that length's
 * answer list as it is today, from cycle 0.
 *
 * A newer list for a length that already has a pool is a new VERSION, never an
 * edit: `--next <lang>:<size>:<fromCycle>` appends the answer list as it is
 * today, starting at that cycle. Give a cycle that has not begun yet
 * (`currentCycles` in the test's report prints where each one is), so it
 * reaches no day that has already had its word.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

import { DE_WORDS } from "../src/lib/puzzles/gomoji/words.de.data.ts";
import { EN_WORDS } from "../src/lib/puzzles/gomoji/words.en.data.ts";
import { FR_WORDS } from "../src/lib/puzzles/gomoji/words.fr.data.ts";
import { POP_ANSWERS } from "../src/lib/puzzles/gomoji/words.pop.data.ts";
import { unpack } from "../src/lib/puzzles/gomojiKana/kanaWords.ts";
import type { PackedDailyPool } from "../src/lib/puzzles/dailyWords/dailyWords.types.ts";

const DIR = "src/lib/puzzles/dailyWords";
const TODAY = new Date().toISOString().slice(0, 10);

type Source = { lang: "en" | "fr" | "de" | "pop" | "ja"; size: number; words: () => string[]; file: string; describe: string };

const split = (text: string) => text.split(/\s+/).filter(Boolean);

function alphabetSources(): Source[] {
  const tables = { en: EN_WORDS, fr: FR_WORDS, de: DE_WORDS } as const;
  return (["en", "fr", "de"] as const).flatMap((lang) =>
    Object.keys(tables[lang]).map(Number).map((size) => ({
      lang,
      size,
      words: () => split(tables[lang][size]!.answers),
      file: `src/lib/puzzles/gomoji/words.${lang}.data.ts`,
      describe: `the ${size}-letter answers (medium and hard) of words.${lang}.data.ts, read ${TODAY}`,
    })),
  );
}

/** Pop Gomoji's answers, each written `word.n` with its category (`words.pop.data.ts`): the pool keeps the word alone. */
function popSources(): Source[] {
  return Object.keys(POP_ANSWERS).map(Number).map((size) => ({
    lang: "pop" as const,
    size,
    words: () => split(POP_ANSWERS[size]!).map((entry) => entry.slice(0, entry.indexOf("."))),
    file: "src/lib/puzzles/gomoji/words.pop.data.ts",
    describe: `the ${size}-letter answers of words.pop.data.ts, read ${TODAY}`,
  }));
}

async function kanaSources(): Promise<Source[]> {
  const sizes = readdirSync("src/lib/puzzles/gomojiKana")
    .map((name) => /^words\.ja\.(\d+)\.data\.ts$/.exec(name)?.[1])
    .filter((size): size is string => size !== undefined)
    .map(Number)
    .sort((a, b) => a - b);
  return Promise.all(
    sizes.map(async (size) => {
      const data = (await import(`../src/lib/puzzles/gomojiKana/words.ja.${size}.data.ts`)) as Record<string, Parameters<typeof unpack>[0]>;
      const packed = data[`JA_WORDS_${size}`]!;
      return {
        lang: "ja" as const,
        size,
        words: () => [...unpack(packed, size).answers],
        file: `src/lib/puzzles/gomojiKana/words.ja.${size}.data.ts`,
        describe: `the ${size}-kana answers (the commonest 2,000) of JMdict release ${packed.release}, read ${TODAY}`,
      };
    }),
  );
}

/** The notice at the head of a word list, which its licence asks to travel with anything made from it. */
function noticeOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const end = text.indexOf("*/");
  return text
    .slice(0, end)
    .split("\n")
    .slice(1)
    .map((line) => line.replace(/^ \* ?/, "").replace(/^ \*$/, "").trimEnd())
    .join("\n")
    .trim()
    .split("\n");
}

/** A words string wrapped at about a hundred characters, as the list files are. */
function wrapped(words: readonly string[]): string {
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line.length + word.length + 1 > 100) {
      lines.push(line);
      line = "";
    }
    line = line === "" ? word : `${line} ${word}`;
  }
  if (line !== "") lines.push(line);
  return `\n${lines.join("\n")}\n`;
}

function entryText(pool: PackedDailyPool, indent: string): string {
  return [
    `${indent}{`,
    `${indent}  fromCycle: ${pool.fromCycle},`,
    `${indent}  source: ${JSON.stringify(pool.source)},`,
    `${indent}  words: \`${pool.words}\`,`,
    `${indent}},`,
  ].join("\n");
}

function header(title: string, sources: readonly Source[]): string {
  const notices = [...new Set(sources.map((source) => source.file))].flatMap((file) => ["", `From ${file}, whose notice follows:`, "", ...noticeOf(file).map((line) => (line === "" ? "" : `  ${line}`))]);
  return [
    "/**",
    ` * ${title}`,
    " *",
    " * WRITTEN BY `node scripts/daily-pools.ts`, NEVER BY HAND, and never rewritten: each",
    " * entry is a frozen copy of an answer list, and the days of every cycle it",
    " * serves were drawn from exactly these words. `dailyPools.test.ts` holds each",
    " * entry to its hash. A newer list is a new entry from a later cycle.",
    ...notices.map((line) => (line === "" ? " *" : ` * ${line}`)),
    " */",
  ].join("\n");
}

async function existing(file: string, name: string): Promise<unknown> {
  if (!existsSync(file)) return undefined;
  return ((await import(`../${file}`)) as Record<string, unknown>)[name];
}

function nextAsked(): { lang: string; size: number; fromCycle: number } | null {
  const at = process.argv.indexOf("--next");
  if (at === -1) return null;
  const [lang, size, fromCycle] = (process.argv[at + 1] ?? "").split(":");
  if (lang === undefined || !Number.isInteger(Number(size)) || !Number.isInteger(Number(fromCycle)) || Number(fromCycle) < 1) {
    throw new Error("--next wants <lang>:<size>:<fromCycle>, a cycle of 1 or more.");
  }
  return { lang, size: Number(size), fromCycle: Number(fromCycle) };
}

function grown(kept: readonly PackedDailyPool[] | undefined, source: Source, next: ReturnType<typeof nextAsked>): PackedDailyPool[] {
  const pools = [...(kept ?? [])];
  const fresh = (fromCycle: number): PackedDailyPool => ({ fromCycle, source: source.describe, words: wrapped(source.words()) });
  if (pools.length === 0) {
    pools.push(fresh(0));
    console.log(`${source.lang} ${source.size}: a new pool of ${source.words().length} words, from cycle 0`);
  }
  if (next !== null && next.lang === source.lang && next.size === source.size) {
    if (pools.some((pool) => pool.fromCycle >= next.fromCycle)) throw new Error(`${source.lang} ${source.size} already has a pool from cycle ${next.fromCycle} or later.`);
    pools.push(fresh(next.fromCycle));
    console.log(`${source.lang} ${source.size}: a new version of ${source.words().length} words, from cycle ${next.fromCycle}`);
  }
  return pools;
}

async function main() {
  const next = nextAsked();
  const alphabet = [...alphabetSources(), ...popSources()];
  for (const lang of ["en", "fr", "de", "pop"] as const) {
    const file = `${DIR}/pool.${lang}.data.ts`;
    const name = `DAILY_POOL_${lang.toUpperCase()}`;
    const kept = ((await existing(file, name)) ?? {}) as Record<number, readonly PackedDailyPool[]>;
    const mine = alphabet.filter((source) => source.lang === lang);
    const body = mine.map((source) => `  ${source.size}: [\n${grown(kept[source.size], source, next).map((pool) => entryText(pool, "    ")).join("\n")}\n  ],`);
    writeFileSync(
      file,
      [
        header(`THE DAILY WORDS' POOLS FOR ${lang.toUpperCase()}, one list of versions per length.`, mine),
        'import type { PackedDailyPool } from "./dailyWords.types";',
        "",
        `export const ${name}: Record<number, readonly PackedDailyPool[]> = {`,
        ...body,
        "};",
        "",
      ].join("\n"),
    );
  }
  for (const source of await kanaSources()) {
    const file = `${DIR}/pool.ja.${source.size}.data.ts`;
    const name = `DAILY_POOL_JA_${source.size}`;
    const kept = (await existing(file, name)) as readonly PackedDailyPool[] | undefined;
    writeFileSync(
      file,
      [
        header(`THE DAILY WORDS' POOL FOR ${source.size}-KANA GOMOJI, as a list of versions.`, [source]),
        'import type { PackedDailyPool } from "./dailyWords.types";',
        "",
        `export const ${name}: readonly PackedDailyPool[] = [`,
        grown(kept, source, next).map((pool) => entryText(pool, "  ")).join("\n"),
        "];",
        "",
      ].join("\n"),
    );
  }
}

await main();
