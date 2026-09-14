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

  /*
   * The set-up screen's tiles for the opening, the rating and the opponent.
   *
   * The four opponent headings keep the kanji their dropdown's groups already
   * showed — 指名, 在室, 知人, 対コンピュータ — but they are on this side of the
   * line for the reason 昇級 is: a session wrote them, not John, so being on
   * the site already is not the same as having been read. 対局者 is not used
   * for "Opponent" because the site uses it for "Player"; 対戦相手 is the one
   * who sits across from you.
   */
  "setup.opening": {
    text: "開局ルール",
    back: "Opening rule — the rule for how a game begins.",
  },
  "setup.ratings": {
    text: "レーティング",
    back: "Rating.",
  },
  "setup.rated": {
    text: "レーティング対局",
    back: "Rated game.",
  },
  "setup.ratedMeans": {
    text: "結果が双方のレーティングに反映されます。",
    back: "The result is reflected in both players' ratings.",
  },
  "setup.friendly": {
    text: "親善対局",
    back: "Friendly game.",
  },
  "setup.friendlyMeans": {
    text: "対局そのものを楽しむ一局です。レーティングは変動しません。",
    back: "A game played to enjoy the game itself. The rating does not change.",
  },
  "setup.opponent": {
    text: "対戦相手",
    back: "Opponent — the person you play against.",
  },
  "setup.anyoneMeans": {
    text: "最初に来た人がもう一方の席に着きます。",
    back: "The first person to come sits in the other seat.",
  },
  "setup.askedFor": {
    text: "指名",
    back: "Nominated — the person named for this game.",
  },
  "setup.hereNow": {
    text: "在室",
    back: "In the room — here now.",
  },
  "setup.playersYouKnow": {
    text: "知人",
    back: "Acquaintances — people you know.",
  },
  "setup.theComputer": {
    text: "対コンピュータ",
    back: "Against the computer.",
  },
  /*
   * The press under a long run of people. 人 counts people, which is all a run
   * that folds can hold — the computer players are never more than the cap.
   */
  "setup.showAll": {
    text: "全{count}人を表示",
    back: "Show all {count} people.",
  },
  "setup.showFewer": {
    text: "折りたたむ",
    back: "Fold it back up — show fewer.",
  },

  /*
   * The XP toast: the notice that drops in from the top of the page when
   * points land. 昇級 is the kanji the toast has shown beside "Level up"
   * since 0.158.4 and still shows there as the heading's mark; it is on this
   * side of the line because a session wrote it, not John. 経験値 is the
   * word Japanese games use for experience points; the letters "XP" would
   * be a name only an English reader knows.
   */
  "xp.unit": {
    text: "経験値",
    back: "Experience points.",
  },
  "xp.pointsEarned": {
    text: "獲得ポイント",
    back: "Points earned — the points acquired.",
  },
  "xp.dismiss": {
    text: "閉じる",
    back: "Close.",
  },
  "xp.levelUp": {
    text: "昇級",
    back: "Promotion — going up a grade.",
  },
  "xp.nextLevel": {
    text: "次のレベル：{name}",
    back: "Next level: {name}",
  },

  /*
   * The standing block on a person's page. レベル follows the toast's own
   * "次のレベル" so the same word is the same word two screens apart; the
   * distance line reads "{name} まであと {count}" because Japanese puts the
   * goal first and the remaining amount last.
   */
  "xp.level": {
    text: "レベル",
    back: "Level.",
  },
  "xp.toNext": {
    text: "{name}まであと{count}",
    back: "{count} more to go until {name}.",
  },
  "xp.atTheTop": {
    text: "最高レベルです。",
    back: "This is the highest level.",
  },
  "xp.board": {
    text: "経験値の順位表",
    back: "The experience-points ranking table.",
  },

  /*
   * The button that downloads a finished game as an .sgf file. 形式 keeps SGF
   * reading as a file format rather than a thing being downloaded.
   */
  "record.downloadSgf": {
    text: "SGF形式でダウンロード",
    back: "Download in SGF format.",
  },
};
