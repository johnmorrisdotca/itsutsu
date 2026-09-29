"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import {
  GAME_SETTINGS,
  WORD_LANGUAGE_DISPLAY,
  WORD_LANGUAGES,
  WORD_LISTS,
  WORD_LIST_DISPLAY,
  kindOfSetting,
  listedGameOf,
} from "@/lib/catalogue/gameSettings";
import type { WordLanguage, WordList } from "@/lib/catalogue/gameSettings.types";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * WHERE EACH LANGUAGE'S AND LIST'S WORDS COME FROM, in a line of the same room
 * for every one, so choosing another moves nothing under it. The whole story
 * is on the rules page, a section a language.
 */
const SETTING_NOTES: Record<`${WordLanguage}:${WordList}`, string> = {
  "english:everyday": "English words from SCOWL, Kevin Atkinson's spelling lists: easy hides one of the commonest.",
  "french:everyday": "French words from Lexique, every hidden one in Wiktionary too; accents fold to their letter.",
  "german:everyday": "German words from LanguageTool's dictionary, with Ä, Ö and Ü as letters of their own.",
  "japanese:everyday": "Kana words from JMdict, in hiragana, typed on the kana keys or in romaji.",
  "english:pop": "Pop culture words kept by hand, each shown with its category: a Pokemon, a Greek deity.",
  "french:pop": "",
  "german:pop": "",
  "japanese:pop": "",
};

/** What the line says of a list a language does not have. */
const ENGLISH_ONLY = "Pop culture is in English only.";

/**
 * A WORD GAME'S LANGUAGE AND WORD LIST, chosen on its set-up. John,
 * 2026-09-28: "just have 1 and allow language selection" — one Gomoji, and
 * which language and which list are settings of it (`gameSettings.ts`).
 * Choosing one is choosing the kind the puzzle is played and kept as
 * (`kindOfSetting`); the caller decides what that means — a new address on the
 * game's own set-up, the shelf's choice on the set-up screen. A list a
 * language does not have is drawn, switched off, and the line says so.
 */
export function WordSettingChips({ kind, onKind }: { kind: PuzzleKind; onKind: (kind: PuzzleKind) => void }) {
  const setting = GAME_SETTINGS[kind];
  if (setting === undefined) return null;
  const game = listedGameOf(kind);
  const note = SETTING_NOTES[`${setting.language}:${setting.list}`];
  return (
    <div className="flex flex-col gap-1.5" data-testid="word-settings" data-language={setting.language} data-list={setting.list}>
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Language" data-testid="word-languages">
        {WORD_LANGUAGES.map((language) => {
          // The same list in the other language, or its everyday words where it has no such list.
          const next = kindOfSetting(game, language, setting.list) ?? kindOfSetting(game, language, "everyday");
          const shown = WORD_LANGUAGE_DISPLAY[language];
          return (
            <button
              key={language}
              type="button"
              role="radio"
              aria-checked={setting.language === language}
              className={`${PICK_WORD_CHIP} ${setting.language === language ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              disabled={next === null}
              onClick={() => next !== null && next !== kind && onKind(next)}
              data-testid={`word-language-${language}`}
            >
              {shown.label}
              {shown.english === shown.label ? null : <span className="opacity-70">{shown.english}</span>}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap" role="radiogroup" aria-label="Word list" data-testid="word-lists">
        {WORD_LISTS.map((list) => {
          const next = kindOfSetting(game, setting.language, list);
          return (
            <button
              key={list}
              type="button"
              role="radio"
              aria-checked={setting.list === list}
              className={`${PICK_WORD_CHIP} ${setting.list === list ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
              disabled={next === null}
              title={next === null ? ENGLISH_ONLY : undefined}
              onClick={() => next !== null && next !== kind && onKind(next)}
              data-testid={`word-list-${list}`}
            >
              {WORD_LIST_DISPLAY[list].label} <span className="font-mincho opacity-70">{WORD_LIST_DISPLAY[list].kanji}</span>
            </button>
          );
        })}
      </div>
      {/* Three lines' room at a phone's width, the longest note's, so no language moves what is under it. */}
      <p className="min-h-12 text-xs text-muted" data-testid="word-setting-note">
        {note}
        {setting.language !== "english" ? ` ${ENGLISH_ONLY}` : ""}
      </p>
    </div>
  );
}
