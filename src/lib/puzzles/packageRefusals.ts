import type { AwaseCheck, AwaseCheckCode } from "@johnmorrisdotca/jarajara/awase";
import type { KazuCheck, KazuCheckCode } from "@johnmorrisdotca/kazu";
import type { KumimojiCheck, KumimojiCheckCode } from "@johnmorrisdotca/kumimoji";

import type { RefusalCode, RefusalValues } from "@/lib/api/refusal.types";

import { no } from "./puzzleReasons";
import type { PuzzleCheck } from "./puzzles.types";

/**
 * WHAT THE THREE PACKAGES' CHECKS REFUSE WITH, SAID IN THE SITE'S WORDS.
 *
 * Kazu (2.2.0), Awase in Jarajara (1.8.0) and Kumimoji (1.4.0) each give a refusal as `{ ok: false, reason, code,
 * values }`: `reason` is their English, and `code` and `values` are what a site says in its own language. Until then
 * the site could only pass `reason` through, which a reader of Japanese saw in English inside "Not solved: …".
 *
 * THE PACKAGE'S `code` IS NOT THE SITE'S. A `PuzzleReason`'s `code` is a phrase key (`chk.kazu.rowRepeats`), and a
 * package's is its own stable name for a reason (`row-repeats`). Handing one to the other would hand the page a key
 * that is no phrase, so a package's refusal is never returned as it came: each code is looked up in a table below
 * and said as the site's phrase, with its values. A code a table does not have fails the build, because each table
 * is a `Record` of the package's own code type, and `packageRefusals.test.ts` holds every phrase's English to the
 * package's clause for it, word for word.
 */

const KAZU: Record<KazuCheckCode, RefusalCode> = {
  "no-kind-at": "chk.noKindAt",
  "no-check": "chk.noCheck",
  "givens-not-grid": "chk.kazu.givensNotGrid",
  "givens-not-regions": "chk.kazu.givensNotRegions",
  "givens-not-cages": "chk.kazu.givensNotCages",
  "givens-not-marks": "chk.kazu.givensNotMarks",
  "givens-not-clues": "chk.kazu.givensNotClues",
  "regions-not-sound": "chk.kazu.regionsNotSound",
  "answer-not-grid": "chk.kazu.answerNotGrid",
  "answer-has-empty-cells": "chk.emptyCells",
  "given-changed": "chk.kazu.givenChanged",
  "row-repeats": "chk.kazu.rowRepeats",
  "column-repeats": "chk.kazu.columnRepeats",
  "box-repeats": "chk.kazu.boxRepeats",
  "region-repeats": "chk.kazu.regionRepeats",
  "diagonal-repeats": "chk.kazu.diagonalRepeats",
  "cage-repeats": "chk.kazu.cageRepeats",
  "cage-sum-wrong": "chk.kazu.cageSumWrong",
  "mark-not-true": "chk.kazu.markNotTrue",
  "clue-sees-wrong": "chk.kazu.clueSeesWrong",
};

const AWASE: Record<AwaseCheckCode, RefusalCode> = {
  "givens-not-deal": "chk.awase.givensNotDeal",
  "answer-not-moves": "chk.awase.answerNotMoves",
  "move-not-allowed": "chk.awase.moveNotAllowed",
  "tiles-left": "chk.awase.tilesLeft",
};

const KUMIMOJI: Record<KumimojiCheckCode, RefusalCode> = {
  "no-hand": "chk.kumimoji.noHand",
  "givens-not-bag": "chk.kumimoji.givensNotBag",
  "wild-count-wrong": "chk.kumimoji.wildCountWrong",
  "bag-exceeds-set": "chk.kumimoji.bagExceedsSet",
  "answer-not-grid": "chk.kumimoji.answerNotGrid",
  "grid-not-the-bag": "chk.kumimoji.gridNotTheBag",
  "tiles-apart": "chk.kumimoji.tilesApart",
  "not-a-word": "chk.notInList",
  "grid-not-finished": "chk.kumimoji.gridNotFinished",
};

/** The side of a Towers grid a clue is on, said as a word of its own so that it is said in the reader's language too. */
const SIDES: Readonly<Record<string, RefusalCode>> = {
  top: "chk.side.top",
  bottom: "chk.side.bottom",
  left: "chk.side.left",
  right: "chk.side.right",
};

/** A package's values as the site's: the figures and names as they are, and a side as the phrase that names it. */
function valuesOf(given: Readonly<Record<string, string | number>> | undefined): RefusalValues | undefined {
  if (given === undefined) return undefined;
  const values: Record<string, string | number | { code: RefusalCode }> = {};
  for (const [name, value] of Object.entries(given)) {
    const side = name === "side" && typeof value === "string" ? SIDES[value] : undefined;
    values[name] = side === undefined ? value : { code: side };
  }
  return values;
}

/** Kazu's verdict as the site's, a refusal by the site's phrase. */
export function kazuVerdict(result: KazuCheck): PuzzleCheck {
  return result.ok ? result : no(KAZU[result.code], valuesOf(result.values));
}

/** Awase's verdict as the site's. */
export function awaseVerdict(result: AwaseCheck): PuzzleCheck {
  return result.ok ? result : no(AWASE[result.code]);
}

/** Kumimoji's verdict as the site's. */
export function kumimojiVerdict(result: KumimojiCheck): PuzzleCheck {
  return result.ok ? result : no(KUMIMOJI[result.code], valuesOf(result.values));
}
