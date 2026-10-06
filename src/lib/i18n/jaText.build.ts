import { FATAL_MOVE_COPY_JA, OUTLOOK_COPY_JA } from "./dictionaries/analysis.ja.constants";
import { ALSO_LISTED_COPY_JA, FAMILY_COPY_JA } from "./dictionaries/families.ja.constants";
import { rulesAttributionJa } from "./dictionaries/attribution.ja.constants";
import { BOT_COPY_JA } from "./dictionaries/bots.ja.constants";
import { JA_DRAFTED } from "./dictionaries/ja.drafted.constants";
import { JA_ALREADY_SAID } from "./dictionaries/ja.site.constants";
import { HANDICAP_COPY_JA, OPENING_COPY_JA, SECOND_STONE_COPY_JA } from "./dictionaries/openings.ja.constants";
import { VARIANT_COPY_JA } from "./dictionaries/variants.ja.constants";
import { jaText as lineText } from "./copyJa.types";
import { PHRASE_KEYS } from "./i18n.constants";
import type { JaCopyText, JaPhraseText } from "./jaText.types";
import { LEVEL_NAMES_JA } from "../xp/levelNames.ja.constants";
import { IMPORTED_VOLUME_COPY_JA, XP_AWARD_COPY_JA } from "../xp/xpAwardCopy.ja.constants";
import type { XpEventType } from "../xp/xp.types";
import type { ImportedVolumeType } from "../xp/xpAwardCopy.constants";

/**
 * THE TEXT OF THE JAPANESE, TAKEN OUT OF THE FILES IT IS AUTHORED IN.
 *
 * Every sentence of Japanese is written beside its back-translation, its review
 * stamp and its open questions, so that John can see what he would publish and
 * a reviewer can mark what they have read. A browser needs none of that, and a
 * page's function does not either, so this reads the authored files and keeps
 * the sentences: `pnpm i18n:text` writes the result into the one generated
 * file a reader is given (`jaText.generated.json`), and
 * `jaText.coverage.test.ts` fails when that is not what this makes.
 *
 * Reads the authored files, so it is for the tests and that one command only:
 * a page or a browser module that imports it ships the back-translations
 * again, and the same test fails for that.
 */

/** A phrase's Japanese, in catalogue order: John's own kanji where the site already said it, the drafted text otherwise. */
export function buildPhraseText(): JaPhraseText {
  const text: Record<string, string> = {};
  for (const key of PHRASE_KEYS) {
    const said = JA_ALREADY_SAID[key]?.text ?? JA_DRAFTED[key]?.text;
    if (said !== undefined) text[key] = said;
  }
  return text;
}

/** Where a puzzle is named in the attribution paragraphs, until the page fills the puzzle's own kanji in. */
const puzzleMark = (kind: string) => `{puzzle.${kind}}`;

export function buildCopyText(): JaCopyText {
  const variants = Object.fromEntries(
    Object.entries(VARIANT_COPY_JA).map(([variant, ja]) => [
      variant,
      { tagline: lineText(ja.tagline), origin: lineText(ja.origin), rules: ja.rules.map(lineText), board: lineText(ja.board) },
    ]),
  );
  const openings = Object.fromEntries(
    Object.entries(OPENING_COPY_JA).map(([opening, ja]) => [opening, { label: ja.label, tagline: lineText(ja.tagline), rules: ja.rules.map(lineText) }]),
  );
  const handicaps = Object.fromEntries(
    Object.entries(HANDICAP_COPY_JA).map(([rule, ja]) => [rule, { description: lineText(ja.description), from: lineText(ja.from) }]),
  );
  const secondStone = Object.fromEntries(Object.entries(SECOND_STONE_COPY_JA).map(([squares, ja]) => [squares, lineText(ja.label)]));
  const bots = Object.fromEntries(
    Object.entries(BOT_COPY_JA).map(([tier, ja]) => [tier, { strength: lineText(ja.strength), blurb: lineText(ja.blurb), bio: lineText(ja.bio) }]),
  );
  const families = Object.fromEntries(Object.entries(FAMILY_COPY_JA).map(([key, ja]) => [key, lineText(ja.blurb)]));
  const alsoListed = Object.fromEntries(Object.entries(ALSO_LISTED_COPY_JA).map(([key, ja]) => [key, lineText(ja.why)]));
  const attribution = rulesAttributionJa((kind) => ({ ja: puzzleMark(kind), en: puzzleMark(kind) })).paragraphs.map(lineText);
  const outlooks = Object.fromEntries(Object.entries(OUTLOOK_COPY_JA).map(([outlook, ja]) => [outlook, { label: lineText(ja.label), detail: lineText(ja.detail) }]));
  const fatalMove = { label: lineText(FATAL_MOVE_COPY_JA.label), detail: lineText(FATAL_MOVE_COPY_JA.detail) };
  const levels = LEVEL_NAMES_JA.map((row) => ({ name: row.name, note: row.note }));
  const awards = Object.fromEntries(
    (Object.keys(XP_AWARD_COPY_JA) as XpEventType[]).map((type) => [type, { blurb: XP_AWARD_COPY_JA[type].blurb, sentence: XP_AWARD_COPY_JA[type].sentence }]),
  );
  const importedVolumes = Object.fromEntries(
    (Object.keys(IMPORTED_VOLUME_COPY_JA) as ImportedVolumeType[]).map((type) => [type, { blurb: IMPORTED_VOLUME_COPY_JA[type].blurb }]),
  );
  return { variants, openings, handicaps, secondStone, bots, families, alsoListed, attribution, outlooks, fatalMove, levels, awards, importedVolumes } as unknown as JaCopyText;
}

/**
 * The one file a server reads the Japanese from (`jaText.data.ts`): the phrases
 * one to a line, then the copy beside data one table to a line, and nothing else.
 * JSON has no comment to carry a "do not edit" header, so the rule is written
 * here, in `jaText.coverage.test.ts` (which fails when the file is not what this
 * makes) and in AGENTS.md. No indentation: every byte of it is in every function.
 */
export function jaTextJson(phrases: JaPhraseText, copy: JaCopyText): string {
  const lines = Object.entries(phrases).map(([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`);
  const tables = Object.entries(copy).map(([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`);
  return `{"phrases":{\n${lines.join(",\n")}\n},\n"copy":{\n${tables.join(",\n")}\n}}\n`;
}
