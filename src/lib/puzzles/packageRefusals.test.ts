import { AWASE_CHECK_REASONS, awaseRefusal, type AwaseCheckCode } from "@johnmorrisdotca/jarajara/awase";
import { KAZU_CHECK_REASONS, kazuRefusal, type KazuCheckCode } from "@johnmorrisdotca/kazu";
import { KUMIMOJI_CHECK_REASONS, kumimojiRefusal, type KumimojiCheckCode } from "@johnmorrisdotca/kumimoji";
import { describe, expect, it } from "vitest";

import { sayRefusal } from "@/lib/api/refusalText";
import { PHRASES } from "@/lib/i18n/i18n.constants";
import { speaker } from "@/lib/i18n/i18n";
import { reasonValue } from "./puzzleReasons";
import { checkSolution } from "./puzzleCheck";
import { generatePuzzle } from "./generate";
import { awaseVerdict, kazuVerdict, kumimojiVerdict } from "./packageRefusals";

/**
 * A PACKAGE'S REFUSAL IS SAID AS THE SITE'S PHRASE, NEVER PASSED THROUGH.
 *
 * Kazu, Awase and Kumimoji refuse with a `code` of their own (`row-repeats`), which is not a phrase key
 * (`chk.kazu.rowRepeats`), so a refusal handed on as it came would reach a page as a key it cannot say. Each code
 * is mapped (`packageRefusals.ts`), and these hold every one: the English of the phrase is the package's clause
 * word for word, the key is a phrase the catalogue has, and a reader of Japanese is told it in Japanese.
 */

/** Something to fill each gap a clause can have. */
const VALUES: Record<string, string | number> = { n: 3, sum: 17, side: "top", clue: 3, seen: 2, kind: "numberPlace", size: 4, word: "aow" };

function valuesFor(clauseText: string): Record<string, string | number> | undefined {
  const names = [...clauseText.matchAll(/\{(\w+)\}/g)].map((found) => found[1] as string);
  return names.length === 0 ? undefined : Object.fromEntries(names.map((name) => [name, VALUES[name] as string | number]));
}

const ja = speaker("ja");

const PACKAGES = [
  {
    name: "Kazu",
    reasons: KAZU_CHECK_REASONS as Record<string, string>,
    made: (code: string, values?: Record<string, string | number>) => kazuVerdict(kazuRefusal(code as KazuCheckCode, values)),
    refusal: (code: string, values?: Record<string, string | number>) => kazuRefusal(code as KazuCheckCode, values),
  },
  {
    name: "Awase",
    reasons: AWASE_CHECK_REASONS as Record<string, string>,
    made: (code: string) => awaseVerdict(awaseRefusal(code as AwaseCheckCode)),
    refusal: (code: string) => awaseRefusal(code as AwaseCheckCode),
  },
  {
    name: "Kumimoji",
    reasons: KUMIMOJI_CHECK_REASONS as Record<string, string>,
    made: (code: string, values?: Record<string, string | number>) => kumimojiVerdict(kumimojiRefusal(code as KumimojiCheckCode, values)),
    refusal: (code: string, values?: Record<string, string | number>) => kumimojiRefusal(code as KumimojiCheckCode, values),
  },
];

describe("a package's refusals, said as the site's phrases", () => {
  for (const pack of PACKAGES) {
    it(`${pack.name}: every code is a phrase of the catalogue that says the package's own words, and has its Japanese`, () => {
      for (const [code, text] of Object.entries(pack.reasons)) {
        const values = valuesFor(text);
        const given = pack.refusal(code, values);
        const verdict = pack.made(code, values);
        expect(verdict.ok, code).toBe(false);
        if (verdict.ok) continue;
        // The phrase's English, filled, is the clause the package has always said, so a log line and a script read what they did.
        expect(verdict.reason, code).toBe((given as { reason: string }).reason);
        // The key is the site's phrase and not the package's code.
        expect(verdict.code, code).not.toBe(code);
        expect(Object.hasOwn(PHRASES, verdict.code as string), code).toBe(true);
        // A reader of Japanese is told it in Japanese, whatever the values.
        const said = sayRefusal(ja, reasonValue(verdict) as { code: never });
        expect(said, `${pack.name} ${code} in Japanese`).toMatch(/[぀-ヿ一-鿿]/);
        expect(said, `${pack.name} ${code} leaves no gap open`).not.toMatch(/\{\w+\}/);
      }
    });
  }

  it("a side of a Towers clue is said in the reader's language too", () => {
    const verdict = kazuVerdict(kazuRefusal("clue-sees-wrong", { side: "left", clue: 3, seen: 2 }));
    expect(verdict).toMatchObject({ ok: false, reason: "the left clue 3 sees 2", code: "chk.kazu.clueSeesWrong" });
    expect(sayRefusal(ja, reasonValue(verdict as never) as { code: never })).toContain("左");
  });

  it("a real wrong answer is refused with the site's phrase", () => {
    const puzzle = generatePuzzle("numberPlace", 4, "easy", 7);
    const wrong = puzzle.givens.replace(/\./g, "1");
    const verdict = checkSolution("numberPlace", 4, puzzle.givens, wrong);
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    expect(String(verdict.code).startsWith("chk.")).toBe(true);
    expect(verdict.reason).toMatch(/repeats a number|was changed/);
  });

  it("a right answer is still accepted", () => {
    const puzzle = generatePuzzle("numberPlace", 4, "easy", 7);
    expect(checkSolution("numberPlace", 4, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
  });
});
