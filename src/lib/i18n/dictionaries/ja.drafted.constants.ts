import type { PhraseKey } from "../i18n.constants";

/**
 * Japanese written here, by a machine, and not yet read by a Japanese reader.
 *
 * **This is the file that carries risk, and it is the only one.** Everything
 * in it is text this site would publish in a language its owner cannot check,
 * on the language that is his family's heritage and the site's voice. Keeping
 * it apart from `ja.site.constants` is the point: that file is his own words
 * already on the site, this file is somebody's guess.
 *
 * `back` is what the Japanese literally says, read back into English. It is
 * not decoration and not a comment — it is the only way the site's owner can
 * see what he would be publishing without being able to read it, and
 * `japanese.coverage.test.ts` requires one for every entry and holds
 * `docs/japanese-review.md` to matching it word for word, so the review sheet
 * he hands a real reader cannot drift from the text that actually ships.
 *
 * The rule for this file: an entry leaves it only when a Japanese reader has
 * read it, and leaving it means moving nothing — the text stays, the file
 * stops being the unread one. Until then, every line here is provisional.
 */
export type DraftedPhrase = {
  text: string;
  /** What the Japanese literally says, back in English. */
  back: string;
};

export const JA_DRAFTED: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "site.language": {
    text: "言語",
    back: "Language",
  },

  /*
   * 遊ぶ is John's own word — it is the kanji that sat beside Play in the
   * navigation bar. It is here rather than in `ja.site.constants` because
   * 0.124.0 took the kanji out of that bar and the front door, and those were
   * the only two places it was ever shown. Every mention of it left in this
   * repo is a comment explaining its removal, so the site no longer says it
   * to anybody: showing it to a Japanese reader is a new thing rather than an
   * existing one, and new things belong with the text somebody has to read.
   *
   * 管理 went the other way and is not here: it is still shown on the Admin
   * page's own heading, so it stayed published when the bar lost it. 種目 is
   * nobody's but mine.
   */
  "nav.play": {
    text: "遊ぶ",
    back: "Play / to play.",
  },
  "nav.games": {
    text: "種目",
    back: "Kinds of game — the catalogue of games, not a game in progress.",
  },

  "account.signIn": {
    text: "サインイン",
    back: "Sign in.",
  },
  "account.signOut": {
    text: "サインアウト",
    back: "Sign out.",
  },

  /*
   * The filter bars, which is where a reader spends most of their time on the
   * record and the players page. 対局者 for "Player" rather than 選手: the
   * site already calls the people who play here 対局者, and a filter should
   * use the page's own word for the thing it filters.
   */
  "filter.narrowedTo": {
    text: "絞り込み",
    back: "Narrowed down to / filtered by.",
  },
  "filter.player": {
    text: "対局者",
    back: "Player (the site's own word for one).",
  },
  "filter.result": {
    text: "結果",
    back: "Result.",
  },
  "filter.sort": {
    text: "並び順",
    back: "Sort order.",
  },
  "filter.any": {
    text: "すべて",
    back: "All / any.",
  },
  "filter.searchNames": {
    text: "名前を検索",
    back: "Search names.",
  },

  "rules.inspiredBy": {
    text: "{name}に着想を得た版です。名称は権利者に帰属し、ここに記すのは当サイト独自の規則です。",
    back: "This is a version inspired by {name}. The name belongs to its rights holder; what is set down here is this site's own rules.",
  },
  "rules.alsoKnownAs": {
    text: "別名は{names}。",
    back: "Its other names are {names}.",
  },
  "rules.from": {
    text: "{country}発",
    back: "Originating from {country}.",
  },
  "rules.imageAlt": {
    text: "対局中の{game}の盤面",
    back: "The board of a game of {game} in play.",
  },
  "rules.inProgress": {
    text: "対局中の盤面。",
    back: "A board in play.",
  },
  "rules.playThis": {
    text: "{game}で遊ぶ →",
    back: "Play {game} →",
  },
  "rules.everyGamePlayed": {
    text: "ここでの{game}の全対局",
    back: "Every game of {game} played here.",
  },
  "rules.wikipedia": {
    text: "{game}をウィキペディアで読む ↗",
    back: "Read about {game} on Wikipedia ↗",
  },
};
