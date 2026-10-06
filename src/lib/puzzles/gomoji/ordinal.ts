import type { Speaker } from "../../i18n/i18n";
import type { PhraseKey } from "../../i18n/i18n.constants";

const ORDINALS: readonly PhraseKey[] = ["pword.ord.first", "pword.ord.second", "pword.ord.third", "pword.ord.fourth", "pword.ord.fifth", "pword.ord.sixth", "pword.ord.seventh"];

/** A place in a word, said in the reader's language: "first", "fourth", "8th", "1つ目". */
export function ordinalIn(n: number, say: Speaker): string {
  const key = ORDINALS[n - 1];
  return key === undefined ? say.say("pword.ord.other", { n: String(n) }) : say.say(key);
}
