import type { LanguageOption } from "@/lib/i18n/i18n.types";

/** The language picker's settings, worked out on the server where the reader's language is known. */
export type MenuLanguages = {
  options: readonly LanguageOption[];
  current: string;
  param: string;
  label: string;
};

/** The edition the site is on, for the line near the foot of the menu. The footer carries the roman and kanji forms. */
export type MenuVersion = { stage: string; semver: string };
