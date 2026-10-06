import type { Speaker } from "../i18n/i18n";
import type { CountKey } from "../i18n/i18n";
import type { PhraseKey } from "../i18n/i18n.constants";

import { commaOf, stopOf } from "./puzzleText";

/**
 * WHAT CHECK SAYS, for every grid puzzle: how many of the marks are wrong and how
 * many are still to make, never which. One sentence made of two clauses, so each
 * language joins them its own way ("3 cells are wrong, 2 still to fill." and
 * "まちがっているマスが3個、あと2マスを埋める必要があります。").
 *
 * `ok` is the line for a grid with nothing wrong and nothing left; `wrongKey` is
 * the counted noun for what can be wrong (`pgrid.check.wrongCell`...); `left` is
 * the clause for what is still to do, or null for nothing.
 */
export function checkSentence(say: Speaker, ok: PhraseKey, wrong: number, wrongKey: CountKey, left: string | null): string {
  if (wrong === 0 && left === null) return say.say(ok);
  const bad = wrong === 0 ? say.say("pgrid.check.noneWrong") : say.count(wrongKey, wrong);
  return `${bad}${left === null ? "" : `${commaOf(say)}${left}`}${stopOf(say)}`;
}
