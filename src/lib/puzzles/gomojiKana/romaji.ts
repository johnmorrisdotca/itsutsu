/**
 * ROMAJI INTO KANA, as it is typed on a keyboard with no Japanese input: our
 * own small table (docs/plans/other/WORD-04-kana.md), no input-method library.
 * Hepburn and Kunrei both (shi and si, chi and ti, tsu and tu, fu and hu, ji
 * and zi), the contracted sounds (kya, sho, ja), a doubled consonant for っ, n
 * or nn for ん, x or l before a vowel or ya/yu/yo/tsu/wa for a small kana,
 * and - for ー. "nn" before a vowel is ん and the next sound's n (konnichiha).
 *
 * `readRomaji` turns what has been typed into kana and says what is left over
 * — the start of a sound not yet finished, "k" or "ky" or a last "n" — so the
 * typist sees it pending and the next key completes it. `finishRomaji` settles
 * the leftover at Enter: a last "n" is ん, anything else is dropped.
 */
const VOWELS = "aiueo";

const ROWS: Record<string, string> = {
  "": "あいうえお",
  k: "かきくけこ",
  g: "がぎぐげご",
  s: "さしすせそ",
  z: "ざじずぜぞ",
  t: "たちつてと",
  d: "だぢづでど",
  n: "なにぬねの",
  h: "はひふへほ",
  b: "ばびぶべぼ",
  p: "ぱぴぷぺぽ",
  m: "まみむめも",
  r: "らりるれろ",
};

/** Every sound this table knows, romaji to kana. */
const TABLE: Record<string, string> = (() => {
  const table: Record<string, string> = {};
  for (const [consonant, kana] of Object.entries(ROWS)) {
    [...VOWELS].forEach((vowel, at) => (table[consonant + vowel] = kana[at]!));
  }
  Object.assign(table, {
    ya: "や", yu: "ゆ", yo: "よ", wa: "わ", wo: "を", vu: "ゔ",
    shi: "し", chi: "ち", tsu: "つ", fu: "ふ", ji: "じ",
    xa: "ぁ", xi: "ぃ", xu: "ぅ", xe: "ぇ", xo: "ぉ", la: "ぁ", li: "ぃ", lu: "ぅ", le: "ぇ", lo: "ぉ",
    xya: "ゃ", xyu: "ゅ", xyo: "ょ", lya: "ゃ", lyu: "ゅ", lyo: "ょ",
    xtsu: "っ", xtu: "っ", ltsu: "っ", ltu: "っ", xwa: "ゎ", lwa: "ゎ",
    fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ",
    she: "しぇ", che: "ちぇ", je: "じぇ",
  });
  // The contracted sounds: an i-row kana and a small ya, yu or yo.
  const contracted: Record<string, string> = { ky: "き", gy: "ぎ", sy: "し", zy: "じ", ty: "ち", dy: "ぢ", ny: "に", hy: "ひ", by: "び", py: "ぴ", my: "み", ry: "り", sh: "し", ch: "ち", j: "じ", jy: "じ", cy: "ち" };
  for (const [start, kana] of Object.entries(contracted)) {
    table[`${start}a`] = `${kana}ゃ`;
    table[`${start}u`] = `${kana}ゅ`;
    table[`${start}o`] = `${kana}ょ`;
  }
  return table;
})();

const LONGEST = Math.max(...Object.keys(TABLE).map((key) => key.length));

/** Whether some sound starts with this, so it may yet be finished. */
function mayFinish(start: string): boolean {
  return Object.keys(TABLE).some((key) => key.startsWith(start));
}

/** What has been typed, as kana, and what is still being typed. */
export function readRomaji(typed: string): { kana: string[]; rest: string } {
  const text = typed.toLowerCase();
  const kana: string[] = [];
  let at = 0;
  while (at < text.length) {
    const here = text[at]!;
    if (here === "-") {
      kana.push("ー");
      at += 1;
      continue;
    }
    // n before a consonant (not y, not a vowel), or nn: ん. An nn before a vowel or y is ん and the start of
    // the next sound, so konnichiha is こんにちは, as the common input methods read it.
    if (here === "n" && at + 1 < text.length) {
      const next = text[at + 1]!;
      if (next === "n") {
        const after = text[at + 2];
        kana.push("ん");
        at += after !== undefined && (VOWELS.includes(after) || after === "y") ? 1 : 2;
        continue;
      }
      if (!VOWELS.includes(next) && next !== "y") {
        kana.push("ん");
        at += 1;
        continue;
      }
    }
    // A doubled consonant: っ, and the second starts the next sound.
    if (at + 1 < text.length && here === text[at + 1] && !VOWELS.includes(here) && here !== "n" && /[a-z]/.test(here)) {
      kana.push("っ");
      at += 1;
      continue;
    }
    let matched = false;
    for (let length = Math.min(LONGEST, text.length - at); length > 0; length -= 1) {
      const piece = text.slice(at, at + length);
      const found = TABLE[piece];
      if (found !== undefined) {
        kana.push(...found);
        at += length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const rest = text.slice(at);
    if (mayFinish(rest)) return { kana, rest };
    // Nothing starts this way: drop the key that cannot begin a sound and read on.
    at += 1;
  }
  return { kana, rest: "" };
}

/** At Enter: what was typed, with a last "n" read as ん and any other unfinished sound dropped. */
export function finishRomaji(typed: string): string[] {
  const { kana, rest } = readRomaji(typed);
  return rest === "n" ? [...kana, "ん"] : kana;
}
