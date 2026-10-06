import { looksLikeEnglish } from "../../../scripts/check-i18n-strings.mjs";

import type { JaLine } from "./copyJa.types";
import { isCases } from "./copyTable";

/**
 * The questions a coverage test asks of an English table and its Japanese
 * overlay (`copyTable.ts`): which English sentences have no Japanese, which
 * Japanese lines answer nothing, and whether each line is Japanese with an
 * English back-translation. Only tests import it.
 */

export type AuditOptions = {
  /** Paths (`a.b[2].c`) whose English is a name, a code or a unit and is read as it is. */
  skip?: (path: string, value: string) => boolean;
};

const JAPANESE = /[ぁ-ヿ一-鿿]/;
const HALF_WIDTH_BESIDE_JAPANESE = /[ぁ-ヿ一-鿿][,:;()]|[,:;()][ぁ-ヿ一-鿿]/;
const JAPANESE_MARKS = /[。、「」（）]/;

function isLine(value: unknown): value is JaLine {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "string" && typeof value[1] === "string";
}

/** A label that sits beside its own kanji is a name, and a Japanese reader is shown the kanji. */
function isName(parent: unknown, key: string): boolean {
  return key === "label" && typeof parent === "object" && parent !== null && typeof (parent as Record<string, unknown>).kanji === "string";
}

/** The English sentences of `english` that `ja` does not answer, by path. */
export function unanswered(english: unknown, ja: unknown, options: AuditOptions = {}, path = "", parent: unknown = undefined, key = ""): string[] {
  if (typeof english === "string") {
    if (isName(parent, key)) return [];
    if (!looksLikeEnglish(english)) return [];
    if (options.skip?.(path, english) === true) return [];
    return isLine(ja) ? [] : [`${path}: "${english.slice(0, 60)}"`];
  }
  if (typeof english === "function") return isLine(ja) || isCases(ja) ? [] : [`${path}: a function with no Japanese`];
  if (Array.isArray(english)) {
    return english.flatMap((item, at) => unanswered(item, Array.isArray(ja) ? ja[at] : undefined, options, `${path}[${at}]`, english, String(at)));
  }
  if (typeof english === "object" && english !== null) {
    return Object.entries(english).flatMap(([name, value]) =>
      unanswered(value, typeof ja === "object" && ja !== null ? (ja as Record<string, unknown>)[name] : undefined, options, path === "" ? name : `${path}.${name}`, english, name),
    );
  }
  return [];
}

/** The paths of `ja` that have nothing of the same name in `english`: a typo, or a line left behind by a rename. */
export function orphaned(english: unknown, ja: unknown, path = ""): string[] {
  if (ja === undefined) return [];
  if (isLine(ja)) return [];
  if (isCases(ja)) return typeof english === "function" ? [] : [path];
  if (Array.isArray(ja)) {
    if (!Array.isArray(english)) return [path];
    return ja.flatMap((item, at) => (at >= english.length ? [`${path}[${at}]`] : orphaned(english[at], item, `${path}[${at}]`)));
  }
  if (typeof ja === "object" && ja !== null) {
    if (typeof english !== "object" || english === null) return [path];
    return Object.entries(ja).flatMap(([name, value]) =>
      name in english ? orphaned((english as Record<string, unknown>)[name], value, path === "" ? name : `${path}.${name}`) : [path === "" ? name : `${path}.${name}`],
    );
  }
  return [path];
}

/** What is wrong with a line: not Japanese, a half-width mark beside Japanese, or a back-translation that is not English. */
export function problemsWith(line: JaLine): string[] {
  const [text, back] = line;
  const out: string[] = [];
  if (!JAPANESE.test(text)) out.push(`"${back.slice(0, 50)}" is not in Japanese`);
  if (HALF_WIDTH_BESIDE_JAPANESE.test(text)) out.push(`a half-width mark beside Japanese in "${text.slice(0, 40)}"`);
  if (back.trim().length === 0) out.push(`"${text.slice(0, 40)}" has no back-translation`);
  if (JAPANESE_MARKS.test(back)) out.push(`the back-translation of "${text.slice(0, 40)}" is not English`);
  return out;
}
