import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import type { Vars } from "@/lib/i18n/i18n.types";

import type { DocumentSection } from "./SectionedDocument";

/**
 * A SITE DOCUMENT AS ITS OUTLINE: what Privacy and Terms are made of, with no words in it.
 *
 * Each section is an anchor, the kanji beside its heading (which does not change with the reader's language), and
 * the phrase keys of its heading, paragraphs and points. The words live in the phrase catalogue (`privacy.*`,
 * `terms.*`), so a document reads in the reader's language and a test can read the English from the same place the
 * page does. Plain data and type-only imports, because a browser spec imports an outline and Playwright does not
 * resolve the `@/` alias for anything else.
 */
export type OutlineSection = {
  id: string;
  kanji: string;
  heading: PhraseKey;
  paragraphs: readonly PhraseKey[];
  points?: readonly PhraseKey[];
};

/** The outline said in one reader's language. `vars` fills what every sentence may name: the contact address, the site. */
export function sectionsFrom(say: Speaker, outline: readonly OutlineSection[], vars: Vars): readonly DocumentSection[] {
  return outline.map((section) => ({
    id: section.id,
    heading: say.say(section.heading, vars),
    kanji: section.kanji,
    paragraphs: section.paragraphs.map((key) => say.say(key, vars)),
    ...(section.points === undefined ? {} : { points: section.points.map((key) => say.say(key, vars)) }),
  }));
}
