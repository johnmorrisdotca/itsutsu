import type { GomojiLanguage } from "./code";

/**
 * THE PHYSICAL KEYBOARD DRAWN UNDER A GOMOJI GRID, by language: QWERTY for
 * English, AZERTY for French (the same 26 plain letters English's keys carry,
 * arranged the way a French keyboard is), and QWERTZ for German, with Ä, Ö and
 * Ü carried as keys of their own — German's letters, not English's plus a
 * fold. All three are three rows, so `WordKeyboard`'s Enter and Backspace,
 * fixed to the last row, sit right whichever is drawn.
 */
export const KEYBOARD_ROWS: Record<GomojiLanguage, readonly string[]> = {
  en: ["qwertyuiop", "asdfghjkl", "zxcvbnm"],
  fr: ["azertyuiop", "qsdfghjklm", "wxcvbn"],
  de: ["qwertzuiopü", "asdfghjklöä", "yxcvbnm"],
};
