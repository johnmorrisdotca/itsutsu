import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import { speaker } from "@/lib/i18n/i18n";

import { isWord } from "../gomoji/code";
import type { PuzzleCheck } from "../puzzles.types";
import { HIVE_LANGUAGES, lettersProblem, readFound, readHive, wordPoints } from "./code";

/** What the route answers with: the site's own English, as every refusal from it is. */
const refused = (reason: Parameters<ReturnType<typeof speaker>["say"]>[0]): PuzzleCheck => ({ ok: false, reason: speaker(DEFAULT_LOCALE).say(reason) });

/**
 * Whether a hive's words finish it: every one a different word of the list, made of the hive's letters with the
 * centre among them, and together worth its goal, and none of them needed after the goal was reached
 * but the last. A pass over the words handed in, never over the list: the goal is in the givens, as a Bridges
 * puzzle's numbers are. A list that is not loaded refuses rather than waving a word through.
 */
export function checkHachinosu(size: number, givens: string, answer: string): PuzzleCheck {
  const hive = readHive(givens);
  const language = HIVE_LANGUAGES[size];
  if (hive === null || language === undefined) return refused("pword.hachinosu.refuse.notHive");
  const found = readFound(answer);
  if (found === null || found.length === 0) return refused("pword.hachinosu.refuse.notWords");
  let points = 0;
  for (const [at, word] of found.entries()) {
    if (lettersProblem(hive, word) !== null) return refused("pword.hachinosu.refuse.notInHive");
    try {
      if (!isWord(word, word.length, language)) return refused("pword.hachinosu.refuse.notListed");
    } catch {
      return refused("pword.hachinosu.refuse.noList");
    }
    if (points >= hive.goal && at > 0) return refused("pword.hachinosu.refuse.goesOn");
    points += wordPoints(word);
  }
  return points >= hive.goal ? { ok: true } : refused("pword.hachinosu.refuse.short");
}
