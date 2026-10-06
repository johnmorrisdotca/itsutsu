import type { HandicapRule, OpeningRule, RuleVariant } from "../gomoku/gomoku.types";
import type { BotTier } from "../gomoku/opponent.types";
import type { XpEventType } from "../xp/xp.types";
import type { ImportedVolumeType } from "../xp/xpAwardCopy.constants";

import type { PhraseKey } from "./i18n.constants";

/**
 * THE JAPANESE A READER IS SHOWN, AS WORDS AND NOTHING ELSE.
 *
 * The Japanese is authored with its back-translation, its review stamp and its
 * open questions beside every sentence (`dictionaries/*.ja.*`, `xpAwardCopy.ja`,
 * `levelNames.ja`), because John cannot read it and has to see what he would
 * publish. None of that is for a reader: a back-translation is English, it is
 * several times the size of the Japanese it explains, and a page that carried it
 * sent every browser, and every page's function, the whole review sheet.
 *
 * This is the shape of what is kept after the review data is taken away: the
 * sentence and nothing about it. It is made from the authored files by
 * `pnpm i18n:text` (`jaText.build.ts`), written to two generated modules, and
 * read at run time through `jaText()` (`jaText.ts`). Each table keeps the
 * `Record<…>` its authored original has, so a game, an award or a level with no
 * Japanese still fails to compile where it is authored, and
 * `jaText.coverage.test.ts` fails when these copies are not what the authored
 * files say.
 */

/** A phrase's Japanese, by key. A key with no Japanese is absent and reads in English. */
export type JaPhraseText = Readonly<Partial<Record<PhraseKey, string>>>;

export type JaVariantText = { tagline: string; origin: string; rules: readonly string[]; board: string };
export type JaOpeningText = { label: string; tagline: string; rules: readonly string[] };
export type JaHandicapText = { description: string; from: string };
export type JaBotText = { strength: string; blurb: string; bio: string };
export type JaLevelText = { name: string; note: string };
export type JaAwardText = { blurb: string; sentence: string };

/** The Japanese that sits beside data: games, openings, computer players, families, levels and awards. */
export type JaCopyText = {
  variants: Record<RuleVariant, JaVariantText>;
  openings: Record<OpeningRule, JaOpeningText>;
  handicaps: Record<HandicapRule, JaHandicapText>;
  /** The label of a second-stone restriction, by the number of squares it leaves. */
  secondStone: Readonly<Record<number, string>>;
  bots: Record<BotTier, JaBotText>;
  /** A family's blurb, by the family's key. */
  families: Readonly<Record<string, string>>;
  /** Why a game is also on another family's shelf, by `<game>/<family key>`. */
  alsoListed: Readonly<Record<string, string>>;
  /**
   * The paragraphs under the catalogue, with `{puzzle.<kind>}` where a puzzle is named. The name is
   * the puzzle's own `kanji`, filled in when the paragraph is drawn, so a rename is still one edit.
   */
  attribution: readonly string[];
  /** The hundred level names, level 1 first. */
  levels: readonly JaLevelText[];
  awards: Record<XpEventType, JaAwardText>;
  importedVolumes: Record<ImportedVolumeType, { blurb: string }>;
};

export type JaText = JaCopyText & { phrases: JaPhraseText };
