// Relative, not `@/`: the browser specs import this through `gameKeys.ts`, and Playwright resolves no alias.
import type { PuzzleKind } from "../puzzles/puzzles.types";
import type { GameSetting, WordLanguage, WordList } from "./gameSettings.types";

/**
 * A LANGUAGE OR A WORD LIST IS A SETTING OF A GAME, NEVER A GAME OF ITS OWN.
 * John, 2026-09-28, at five Gomoji cards on one shelf — English, Kana, French,
 * German and Pop: "just have 1 and allow language selection", then "this is
 * the correct way we should handle our language variants or corpus variants."
 *
 * So the catalogue lists ONE Gomoji: one card, one front door, one rules page,
 * one place in its family. Its language and word list are chosen on its
 * set-up and carried in its addresses (`/games/gomoji/play?language=french`).
 *
 * UNDERNEATH, each stays the kind it always was. A run, a solve, a fastest
 * table, a day's words and an XP ledger are kept under `gomojiMot` as before,
 * because a French word and an English one are not the same puzzle and their
 * times are not one table; nothing stored is moved. This table is the one
 * place that says which kind is which setting of which game.
 */
export const GAME_SETTINGS: Readonly<Partial<Record<PuzzleKind, GameSetting>>> = {
  gomoji: { game: "gomoji", language: "english", list: "everyday" },
  gomojiMot: { game: "gomoji", language: "french", list: "everyday" },
  gomojiWort: { game: "gomoji", language: "german", list: "everyday" },
  gomojiKana: { game: "gomoji", language: "japanese", list: "everyday" },
  gomojiPop: { game: "gomoji", language: "english", list: "pop" },
};

/** The languages, in the order the set-up offers them. */
export const WORD_LANGUAGES: readonly WordLanguage[] = ["english", "french", "german", "japanese"];

/** The word lists, in the order the set-up offers them. */
export const WORD_LISTS: readonly WordList[] = ["everyday", "pop"];

/** How a language is named where it is chosen: in itself, as a language menu names it, with the English beside where it differs. */
export const WORD_LANGUAGE_DISPLAY: Readonly<Record<WordLanguage, { label: string; kanji: string; english: string }>> = {
  english: { label: "English", kanji: "英語", english: "English" },
  french: { label: "Français", kanji: "仏語", english: "French" },
  german: { label: "Deutsch", kanji: "独語", english: "German" },
  japanese: { label: "日本語 かな", kanji: "かな", english: "Japanese kana" },
};

/** How a word list is named where it is chosen. */
export const WORD_LIST_DISPLAY: Readonly<Record<WordList, { label: string; kanji: string }>> = {
  everyday: { label: "Everyday", kanji: "日常" },
  pop: { label: "Pop culture", kanji: "ポップ" },
};

/** The default language and list, which an address leaves out. */
const ORDINARY: { language: WordLanguage; list: WordList } = { language: "english", list: "everyday" };

/** Whether a stored kind is a setting of another game, and so has no card, front door or family place of its own. */
export function isSettingKind(key: string): boolean {
  const setting = GAME_SETTINGS[key as PuzzleKind];
  return setting !== undefined && setting.game !== key;
}

/** The game a kind is listed as: itself, or the game it is a setting of. */
export function listedGameOf<Key extends string>(key: Key): Key | "gomoji" {
  return GAME_SETTINGS[key as unknown as PuzzleKind]?.game ?? key;
}

/** Every kind that is a setting of a game, the game itself first. */
export function settingsOf(game: string): PuzzleKind[] {
  return (Object.entries(GAME_SETTINGS) as [PuzzleKind, GameSetting][]).filter(([, setting]) => setting.game === game).map(([kind]) => kind);
}

/** The kind a game is played as in this language and list, or null where that game has no such setting (Pop culture is English only). */
export function kindOfSetting(game: string, language: WordLanguage, list: WordList): PuzzleKind | null {
  const found = (Object.entries(GAME_SETTINGS) as [PuzzleKind, GameSetting][]).find(([, setting]) => setting.game === game && setting.language === language && setting.list === list);
  return found?.[0] ?? null;
}

/** The languages a game is offered in with this word list. */
export function languagesOf(game: string, list: WordList): WordLanguage[] {
  return WORD_LANGUAGES.filter((language) => kindOfSetting(game, language, list) !== null);
}

/** The address parameters that name a kind's setting, the ordinary ones left out: "language=french", "list=pop", or "" for a game as it comes. */
export function settingQuery(kind: string): string {
  const setting = GAME_SETTINGS[kind as PuzzleKind];
  if (setting === undefined) return "";
  const params = new URLSearchParams();
  if (setting.language !== ORDINARY.language) params.set(SETTING_PARAMS.language, setting.language);
  if (setting.list !== ORDINARY.list) params.set(SETTING_PARAMS.list, setting.list);
  return params.toString();
}

/** The address parameters a setting is read from. `language` is the name Kumimoji's own language choice uses too. */
export const SETTING_PARAMS = { language: "language", list: "list" } as const;

/**
 * The kind an address plays, from a game's slug and its query: the setting its
 * `language` and `list` name, or the game itself for a language or list it
 * does not have (a French Pop culture is no puzzle, so it is Gomoji).
 */
export function kindOfAddress<Key extends string>(game: Key, query: Record<string, string | string[] | undefined>): Key | PuzzleKind {
  if (settingsOf(game).length === 0) return game;
  const one = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const language = (WORD_LANGUAGES as readonly string[]).includes(one(SETTING_PARAMS.language) ?? "") ? (one(SETTING_PARAMS.language) as WordLanguage) : ORDINARY.language;
  const list = (WORD_LISTS as readonly string[]).includes(one(SETTING_PARAMS.list) ?? "") ? (one(SETTING_PARAMS.list) as WordList) : ORDINARY.list;
  return kindOfSetting(game, language, list) ?? kindOfSetting(game, language, ORDINARY.list) ?? game;
}
