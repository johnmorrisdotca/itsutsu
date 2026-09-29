/** A language a word game is played in, as its address and set-up say it (`language=french`). */
export type WordLanguage = "english" | "french" | "german" | "japanese";

/** A word list a word game hides its words from: the everyday words of its language, or a list of its own. */
export type WordList = "everyday" | "pop";

/** What a stored kind is a setting of: the game it is listed as, and its language and word list. */
export type GameSetting = { game: "gomoji"; language: WordLanguage; list: WordList };
