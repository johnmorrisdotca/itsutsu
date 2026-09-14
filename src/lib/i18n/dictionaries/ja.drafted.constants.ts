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

  /*
   * The rivalry scoreboard. 対戦 is "playing each other" and 対局 is "a game
   * played", the words the site's own record already leans on; 連勝 and 連敗
   * are the site's own streak kanji (`STREAK_DISPLAY`), so a run is the same
   * word on a ladder and here. 互角 is "evenly matched", which is how a tie
   * between two players is said rather than a tie in a table. The `.one` and
   * `.other` pairs say the same thing where Japanese does not count in forms.
   */
  "rivalry.title": { text: "対戦成績", back: "Head-to-head record." },
  "rivalry.versus": { text: "対", back: "Versus." },
  "rivalry.wins": { text: "勝ち", back: "Wins." },
  "rivalry.draws": { text: "引き分け", back: "Draws." },
  "rivalry.games": { text: "対局数", back: "Number of games played." },
  "rivalry.allGames": { text: "通算", back: "All-time total." },
  "rivalry.lastPlayed": { text: "最後の対局", back: "The last game played." },
  "rivalry.notYet": { text: "まだなし", back: "None yet." },
  "rivalry.streak": { text: "連続", back: "In a row." },
  "rivalry.against": { text: "{name}との対戦", back: "Games against {name}." },
  "rivalry.unnamed": { text: "名前のない対局者", back: "A player with no name." },
  "rivalry.streakWon.one": { text: "直近の対局は{name}の勝ち", back: "The most recent game was won by {name}." },
  "rivalry.streakWon.other": { text: "{name}が{count}連勝中", back: "{name} is on {count} wins in a row." },
  "rivalry.streakDrawn.one": { text: "直近の対局は引き分け", back: "The most recent game was a draw." },
  "rivalry.streakDrawn.other": { text: "{count}局連続で引き分け", back: "{count} games in a row were draws." },
  "rivalry.never.you": {
    text: "あなたと{name}はまだ対戦したことがありません",
    back: "You and {name} have not yet ever played each other.",
  },
  "rivalry.never.named": {
    text: "{one}と{other}はまだ対戦したことがありません",
    back: "{one} and {other} have not yet ever played each other.",
  },
  "rivalry.neverGame.you": {
    text: "あなたと{name}は{game}でまだ対戦したことがありません",
    back: "You and {name} have not yet played each other at {game}.",
  },
  "rivalry.neverGame.named": {
    text: "{one}と{other}は{game}でまだ対戦したことがありません",
    back: "{one} and {other} have not yet played each other at {game}.",
  },
  "rivalry.gapMonths.you": { text: "{name}とは{count}か月対戦していません", back: "You have not played {name} for {count} months." },
  "rivalry.gapMonths.named": {
    text: "{one}と{other}は{count}か月対戦していません",
    back: "{one} and {other} have not played each other for {count} months.",
  },
  "rivalry.gapYear.you": { text: "{name}とは1年対戦していません", back: "You have not played {name} for a year." },
  "rivalry.gapYear.named": {
    text: "{one}と{other}は1年対戦していません",
    back: "{one} and {other} have not played each other for a year.",
  },
  "rivalry.gapYears.you": { text: "{name}とは{count}年対戦していません", back: "You have not played {name} for {count} years." },
  "rivalry.gapYears.named": {
    text: "{one}と{other}は{count}年対戦していません",
    back: "{one} and {other} have not played each other for {count} years.",
  },
  "rivalry.firstWin.you": { text: "{name}に対するあなたの初勝利", back: "Your first win against {name}." },
  "rivalry.firstLoss.you": { text: "{name}があなたに初勝利", back: "{name} wins against you for the first time." },
  "rivalry.firstWin.named": { text: "{winner}が{loser}に初勝利", back: "{winner} wins against {loser} for the first time." },
  "rivalry.beaten.you": { text: "{name}に{count}連勝中", back: "You are on {count} wins in a row against {name}." },
  "rivalry.lostTo.you": { text: "{name}に{count}連敗中", back: "You are on {count} losses in a row to {name}." },
  "rivalry.beaten.named": {
    text: "{winner}が{loser}に{count}連勝中",
    back: "{winner} is on {count} wins in a row against {loser}.",
  },
  "rivalry.drawnRun.you": { text: "{name}との直近{count}局は引き分け", back: "Your last {count} games with {name} were draws." },
  "rivalry.drawnRun.named": {
    text: "{one}と{other}の直近{count}局は引き分け",
    back: "The last {count} games between {one} and {other} were draws.",
  },
  "rivalry.allDrawn.you": { text: "{name}との対局はすべて引き分け", back: "Every game with {name} has been a draw." },
  "rivalry.allDrawn.named": {
    text: "{one}と{other}の対局はすべて引き分け",
    back: "Every game between {one} and {other} has been a draw.",
  },
  "rivalry.tied.you": { text: "あなたと{name}は{score}で互角", back: "You and {name} are evenly matched at {score}." },
  "rivalry.tied.named": { text: "{one}と{other}は{score}で互角", back: "{one} and {other} are evenly matched at {score}." },
  "rivalry.lead.you": { text: "{name}に{score}でリード", back: "You lead {name} {score}." },
  "rivalry.behind.you": { text: "{name}があなたに{score}でリード", back: "{name} leads you {score}." },
  "rivalry.lead.named": { text: "{leader}が{trailer}に{score}でリード", back: "{leader} leads {trailer} {score}." },
};
