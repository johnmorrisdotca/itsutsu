/**
 * The terms of play, sentence by sentence (PRIV-05).
 *
 * The register of /privacy, and the same discipline: each sentence is either
 * something the code keeps, checked on 2026-09-24, or says plainly that it is
 * a request — one account each and your own moves are asked of people, not
 * enforced by anything. No legalese: if a line would not be said to a friend
 * across a board, it is rewritten. `terms.coverage.test.ts` holds the facts to
 * the code they describe.
 *
 * The words are phrases (ENJA-11): English in `phrases.terms.constants.ts`, Japanese beside its literal
 * back-translation in `ja.drafted.terms.constants.ts`. This file keeps the order of the page, each section's anchor
 * and the kanji beside its heading, which do not change with the reader, and `terms.sections.ts` says it in a
 * reader's language. The Japanese page says at its head that the English version governs.
 */

// Relative, not "@/": the browser spec imports this file, and Playwright does not resolve the alias.
import { CONTACT } from "../privacy/privacy.constants";
import type { OutlineSection } from "@/components/layout/documentOutline";

export const TERMS_KANJI = "利用規約";

/** When the terms last changed. Moves with every change to a sentence in `phrases.terms.constants.ts`. */
export const TERMS_CHANGED = "2026-09-24";

/** The one address both documents name, from the privacy page, so there is one to change. */
export { CONTACT };

/** The page, section by section: the anchor, the kanji beside the heading and the phrases that say it. */
export const TERMS_OUTLINE: readonly OutlineSection[] = [
  { id: "one-account", kanji: "一人一口", heading: "terms.oneAccount.h", paragraphs: ["terms.oneAccount.paraA", "terms.oneAccount.paraB"] },
  { id: "own-moves", kanji: "自力", heading: "terms.ownMoves.h", paragraphs: ["terms.ownMoves.paraA"] },
  { id: "be-kind", kanji: "礼儀", heading: "terms.beKind.h", paragraphs: ["terms.beKind.paraA", "terms.beKind.paraB"] },
  { id: "shut", kanji: "停止", heading: "terms.shut.h", paragraphs: ["terms.shut.paraA", "terms.shut.paraB"] },
  { id: "ending", kanji: "退会", heading: "terms.ending.h", paragraphs: ["terms.ending.paraA", "terms.ending.paraB"] },
  { id: "abandoned", kanji: "放置", heading: "terms.abandoned.h", paragraphs: ["terms.abandoned.paraA"] },
  { id: "beta", kanji: "試験版", heading: "terms.beta.h", paragraphs: ["terms.beta.paraA"] },
  { id: "changes", kanji: "改訂", heading: "terms.changes.h", paragraphs: ["terms.changes.paraA"] },
];
