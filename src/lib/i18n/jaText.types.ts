import type { Outlook } from "../gomoku/analysis.types";
import type { HandicapRule, OpeningRule, RuleVariant } from "../gomoku/gomoku.types";
import type { BotTier } from "../gomoku/opponent.types";
import type { XpEventType } from "../xp/xp.types";
import type { ImportedVolumeType } from "../xp/xpAwardCopy.constants";

import type { JaTextCases } from "./copyJa.types";
import type { PuzzleCopyJa } from "./dictionaries/puzzles.ja.types";
import type { PuzzleKind } from "../puzzles/puzzles.types";
import type { PuzzleTablesAuthored } from "./jaText.build";

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
 * `pnpm i18n:text` (`jaText.build.ts`), written to one generated file
 * (`jaText.generated.json`), and read at run time through `jaText()` (`jaText.ts`). Each table keeps the
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
export type JaOutlookText = { label: string; detail: string };
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
  /** The threat reading's heading and detail, by outlook. */
  outlooks: Record<Outlook, JaOutlookText>;
  /** The losing-move note's heading and detail. */
  fatalMove: JaOutlookText;
  /** The hundred level names, level 1 first. */
  levels: readonly JaLevelText[];
  awards: Record<XpEventType, JaAwardText>;
  importedVolumes: Record<ImportedVolumeType, { blurb: string }>;
  /** Every puzzle's words: its copy and the tables of its screens. */
  puzzles: JaPuzzleText;
};

/**
 * What an authored overlay (`JaOverlay`, with a back-translation under every line, and a review stamp and
 * open question beside a table) is as the reader is given it: each `[text, back]` is its text, each
 * function's lines are the text of its lines, and `review` and `ask` are gone.
 */
export type JaTextOf<T> = T extends undefined
  ? undefined
  : T extends readonly [string, string]
    ? string
    : T extends { readonly by: number; readonly is: unknown }
      ? JaTextCases
      : T extends readonly unknown[]
        ? { readonly [K in keyof T]: JaTextOf<T[K]> }
        : T extends object
          ? { [K in keyof T as Exclude<K, "review" | "ask">]: JaTextOf<T[K]> }
          : T;

/**
 * The Japanese of the puzzles: each puzzle's tagline, origin and rules (an overlay of its row in
 * `PUZZLE_DISPLAY`, a `Record<PuzzleKind, …>` so a puzzle with none does not compile) and every table of
 * its words that sits beside its data, by name (`PUZZLE_TABLES_AUTHORED` in `jaText.build.ts`, where each
 * is authored). Laid over the English table it answers by `copyTable.ts`, which is why a table is
 * read as `puzzleTable(english, "name", locale)` and nothing here has a function in it.
 */
export type JaPuzzleText = {
  copy: Record<PuzzleKind, JaTextOf<PuzzleCopyJa>>;
  tables: { [K in keyof PuzzleTablesAuthored]: JaTextOf<PuzzleTablesAuthored[K]> };
};

export type JaText = JaCopyText & { phrases: JaPhraseText };
