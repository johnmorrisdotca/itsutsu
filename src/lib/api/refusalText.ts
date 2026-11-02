import { PHRASES, type PhraseKey } from "@/lib/i18n/i18n.constants";
import type { Speaker } from "@/lib/i18n/i18n";

import { clause } from "./refusal";
import type { RefusalPart, RefusalValue, RefusalValues } from "./refusal.types";

/**
 * What a page shows for a refusal the server sent (ENJA-13): the key said in the reader's language when the body
 * carries one, and otherwise the English `error` a caller that is not a page would read, and then `fallback`, the
 * page's own words for "that did not work".
 *
 * A key the page's catalogue does not know (a deploy ahead of or behind the browser) is treated as no key at all,
 * rather than said as a hole.
 */
export type RefusalBody = { error?: unknown; code?: unknown; values?: unknown } | null | undefined;

function value(say: Speaker, given: RefusalValue): string {
  if (typeof given === "string") return given;
  if (typeof given === "number") return say.number(given);
  return clause(sayCode(say, given.code, given.values) ?? "");
}

function sayCode(say: Speaker, code: unknown, values: unknown): string | null {
  if (typeof code !== "string" || !Object.hasOwn(PHRASES, code)) return null;
  const filled: Record<string, string> = {};
  if (typeof values === "object" && values !== null) {
    for (const [name, one] of Object.entries(values as RefusalValues)) filled[name] = value(say, one);
  }
  return say.say(code as PhraseKey, filled);
}

/** A refusal known only as its key and values, said in the reader's language. */
export function sayRefusal(say: Speaker, part: RefusalPart): string {
  return sayCode(say, part.code, part.values) ?? say.say(part.code);
}

/** The same, with the page's own words for "that did not work" given as text rather than as a key. */
export function refusalOr(body: RefusalBody, say: Speaker, fallback: string): string {
  const keyed = body ? sayCode(say, body.code, body.values) : null;
  if (keyed !== null) return keyed;
  if (body && typeof body.error === "string" && body.error !== "") return body.error;
  return fallback;
}

export function refusalText(body: RefusalBody, say: Speaker, fallback: PhraseKey): string {
  return refusalOr(body, say, say.say(fallback));
}
