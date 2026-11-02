// Kumimoji's rules are their own open-source package (github.com/johnmorrisdotca/kumimoji, installed as @johnmorrisdotca/kumimoji);
// this module keeps its old address so the site and its browser specs import it unchanged.
import { checkKumimoji as checkKumimojiPackage } from "@johnmorrisdotca/kumimoji";

import { kumimojiVerdict } from "../packageRefusals";
import type { PuzzleCheck } from "../puzzles.types";

export { kumimojiPoints } from "@johnmorrisdotca/kumimoji";

/** Whether a grid solves a Kumimoji: the package's check, with a refusal said as the site's phrase for its code (`packageRefusals.ts`). */
export function checkKumimoji(size: number, givens: string, answer: string, options?: Parameters<typeof checkKumimojiPackage>[3]): PuzzleCheck {
  return kumimojiVerdict(checkKumimojiPackage(size, givens, answer, options));
}
