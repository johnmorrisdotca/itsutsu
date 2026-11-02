import { fill } from "@/lib/i18n/fill";
import { PHRASES_CHK } from "@/lib/i18n/phrases.chk.constants";
import { PHRASES_ERR } from "@/lib/i18n/phrases.err.constants";

import type { RefusalCode, RefusalPart, RefusalValue, RefusalValues, Said } from "./refusal.types";

/**
 * The English half of a refusal, which is all a server ever says itself (ENJA-13).
 *
 * It reads only the two areas of the catalogue that hold refusals, never `PHRASES` whole, so a route that refuses
 * carries a few kilobytes of sentences and not every word the site says. A reader's own language is said by the page
 * (`refusalText.ts`), from the same key.
 */
const ENGLISH: Readonly<Record<RefusalCode, string>> = { ...PHRASES_ERR, ...PHRASES_CHK };

function plain(value: RefusalValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return english(value.code, value.values);
}

/** The refusal in English, its values filled and any refusal inside them said the same way. */
export function english(code: RefusalCode, values?: RefusalValues): string {
  if (values === undefined) return ENGLISH[code];
  const filled: Record<string, string> = {};
  for (const [name, value] of Object.entries(values)) filled[name] = plain(value);
  return fill(ENGLISH[code], filled);
}

/** Whether a string is the key of a refusal: a schema's `message` is one, so a route can say which rule a body broke. */
export function isRefusalCode(value: unknown): value is RefusalCode {
  return typeof value === "string" && Object.hasOwn(ENGLISH, value);
}

/** The refusal a failed parse names first: the key its rule gave as its message, or `fallback` for a rule that gave none. */
export function issueCode(issues: readonly { message: string }[], fallback: RefusalCode): RefusalCode {
  const named = issues[0]?.message;
  return isRefusalCode(named) ? named : fallback;
}

/** A refusal ready to send: the key, its values and the English sentence beside them. */
export function said(code: RefusalCode, values?: RefusalValues): Said {
  return values === undefined ? { error: english(code), code } : { error: english(code, values), code, values };
}

/** The part of a refusal a value carries: the key and values with no sentence, which the page says in its own language. */
export function partOf(code: RefusalCode, values?: RefusalValues): RefusalPart {
  return values === undefined ? { code } : { code, values };
}
