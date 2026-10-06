/**
 * ENGLISH LEFT IN A TEXT THAT SHOULD BE JAPANESE, for the tests that render a whole page or email.
 *
 * A phrase with no Japanese falls back to its English (`Speaker.say`), and a sentence built in code can quietly keep
 * a word of English in the middle of Japanese, so a render in Japanese is read for any run of English words that is
 * not a name. Addresses and links are taken out first, then the names a caller says are names (the site's, a
 * provider's, the people in the fixture), and anything of three letters or more that is left is reported. It is a
 * sweep, as `check-i18n-strings.mjs` is: it finds what a person would see at once, and it is read by tests only.
 */

/** Names that are the same in every language on a legal page or in an email. */
export const NAMES_THE_SAME_IN_ANY_LANGUAGE = ["Itsutsu", "Google", "Vercel", "Neon", "Resend", "Sumilabu", "ItsYourTurn", "GoldToken", "Pente", "ID"] as const;

/** The English words in `text` that are not links, addresses or one of `names`. */
export function englishWordsIn(text: string, names: readonly string[] = NAMES_THE_SAME_IN_ANY_LANGUAGE): string[] {
  const bare = text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, " ")
    .replace(/\{\w+\}/g, " ");
  const left = names.reduce((rest, name) => rest.split(name).join(" "), bare);
  return left.match(/[A-Za-z][A-Za-z'’-]{2,}/g) ?? [];
}

/** Whether `text` holds any Japanese: kana or kanji. */
export function hasJapanese(text: string): boolean {
  return /[぀-ヿ㐀-鿿]/.test(text);
}
