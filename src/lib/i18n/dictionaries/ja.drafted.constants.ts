import type { PhraseKey } from "../i18n.constants";
import { JA_DRAFTED_PIECES } from "./ja.drafted.pieces.constants";
import { JA_DRAFTED_GAMEPAGES } from "./ja.drafted.gamepages.constants";
import { JA_DRAFTED_ENDING } from "./ja.drafted.ending.constants";
import { JA_DRAFTED_BOARDLOOK } from "./ja.drafted.boardlook.constants";
import { JA_DRAFTED_WINCOVER } from "./ja.drafted.wincover.constants";
import { JA_DRAFTED_GAMESCREEN } from "./ja.drafted.gamescreen.constants";
import { JA_DRAFTED_GAME } from "./ja.drafted.game.constants";
import { JA_DRAFTED_SUMMARY } from "./ja.drafted.summary.constants";
import { JA_DRAFTED_LIVE } from "./ja.drafted.live.constants";
import { JA_DRAFTED_READMOVES } from "./ja.drafted.readmoves.constants";
import { JA_DRAFTED_RESULT } from "./ja.drafted.result.constants";
import { JA_DRAFTED_MOSAIC } from "./ja.drafted.mosaic.constants";
import { JA_DRAFTED_REPLAY } from "./ja.drafted.replay.constants";
import { JA_DRAFTED_PLAYED } from "./ja.drafted.played.constants";
import { JA_DRAFTED_HANDICAPOFFER } from "./ja.drafted.handicapoffer.constants";
import { JA_DRAFTED_HEADSTART } from "./ja.drafted.headstart.constants";
import { JA_DRAFTED_ADVANTAGE } from "./ja.drafted.advantage.constants";
import { JA_DRAFTED_GOMOKU } from "./ja.drafted.gomoku.constants";
import { JA_DRAFTED_RATING } from "./ja.drafted.rating.constants";
import { JA_DRAFTED_CLOCK } from "./ja.drafted.clock.constants";
import { JA_DRAFTED_CUBEMETHOD } from "./ja.drafted.cubemethod.constants";
import { JA_DRAFTED_RULESPAGE } from "./ja.drafted.rulespage.constants";
import { JA_DRAFTED_PCARD } from "./ja.drafted.pcard.constants";
import { JA_DRAFTED_PKUMI } from "./ja.drafted.pkumi.constants";
import { JA_DRAFTED_PMAZE } from "./ja.drafted.pmaze.constants";
import { JA_DRAFTED_PGRID } from "./ja.drafted.pgrid.constants";
import { JA_DRAFTED_PWORD } from "./ja.drafted.pword.constants";
import { JA_DRAFTED_PSET } from "./ja.drafted.pset.constants";
import { JA_DRAFTED_PUZZLE } from "./ja.drafted.puzzle.constants";
import { JA_DRAFTED_HOUSEKI } from "./ja.drafted.houseki.constants";
import { JA_DRAFTED_PARTY } from "./ja.drafted.party.constants";
import { JA_DRAFTED_CASUAL } from "./ja.drafted.casual.constants";
import { JA_DRAFTED_CTABLE } from "./ja.drafted.ctable.constants";

import { JA_DRAFTED_XP } from "./ja.drafted.xp.constants";
import { JA_DRAFTED_COUNTRIES } from "./ja.drafted.countries.constants";
import { JA_DRAFTED_LEARN } from "./ja.drafted.learn.constants";
import { JA_DRAFTED_ABOUT } from "./ja.drafted.about.constants";
import { JA_DRAFTED_MINE } from "./ja.drafted.mine.constants";
import { JA_DRAFTED_PLAYERS } from "./ja.drafted.players.constants";
import { JA_DRAFTED_PAGES } from "./ja.drafted.pages.constants";
import { JA_DRAFTED_HOME } from "./ja.drafted.home.constants";
import { JA_DRAFTED_AUTH } from "./ja.drafted.auth.constants";
import { JA_DRAFTED_MESSAGES } from "./ja.drafted.messages.constants";
import { JA_DRAFTED_INBOX } from "./ja.drafted.inbox.constants";
import { JA_DRAFTED_REPORTS } from "./ja.drafted.reports.constants";
import { JA_DRAFTED_CHROME } from "./ja.drafted.chrome.constants";

/**
 * Japanese written here, by a machine, and read since by `japanese-reviewer`
 * but not yet by a person who reads Japanese.
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
 * Who has read an entry is `review`. Left out, the entry is DRAFTED: a machine
 * wrote it and nobody has read it. `{ by: "agent" }` is the reviewer agent's
 * pass (the standards are in `japanese-reviewer.md`, the terms it settled in
 * `docs/plans/en-ja-everywhere/TERMS.md`); `{ by: "person" }` is a reader of
 * Japanese signing it off. The review sheet shows the state of every phrase,
 * and the gate refuses a phrase that is drafted and has no open question.
 *
 * `ask` is a plain-English note for whoever reads the sheet next: a decision
 * only John can make (an entry with no `review`), or a native read the agent
 * recommends for high-stakes text, about children, consent, brands, legal or
 * payments (an entry reviewed by the agent). Such entries are listed first on
 * the sheet, and `ask` goes once a person has read it.
 */
export type Review = {
  /** Who read it: the reviewer agent, or a person who reads Japanese. */
  by: "agent" | "person";
  /** The day, as YYYY-MM-DD. */
  on: string;
};

export type DraftedPhrase = {
  text: string;
  /** What the Japanese literally says, back in English. */
  back: string;
  /** Left out while the entry is drafted: nobody has read it. */
  review?: Review;
  /** What a person has still to decide or to read, in English; see above. */
  ask?: string;
};

/** The reviewer agent's pass over the first 179 phrases, 2026-10-06. */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

const JA_DRAFTED_BASE: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "site.language": {
    text: "言語",
    back: "Language",
    review: AGENT_READ,
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
    text: "対局中",
    back: "Games in progress — my own games, going.",
    review: AGENT_READ,
  },
  "nav.newGame": {
    text: "新規対局",
    back: "New game — the same word as the heading of the set-up screen this button opens.",
    review: AGENT_READ,
  },
  "nav.games": {
    text: "ゲーム",
    back: "Games — the catalogue of games, not a game in progress.",
    review: AGENT_READ,
  },
  "nav.privacy": {
    text: "プライバシー",
    back: "Privacy — the loanword every Japanese site uses for the page that says what it keeps about you.",
    review: AGENT_READ,
  },
  "nav.terms": {
    text: "利用規約",
    back: "Terms of use — the usual Japanese name for a site's terms page.",
    review: AGENT_READ,
  },

  "account.signIn": {
    text: "サインイン",
    back: "Sign in.",
    review: AGENT_READ,
  },
  "account.signOut": {
    text: "サインアウト",
    back: "Sign out.",
    review: AGENT_READ,
  },

  /*
   * The hint that offers the site as a home-screen app. The steps name the
   * buttons as a Japanese iPhone and Android phone label them: 共有 and
   * ホーム画面に追加 on iOS, アプリをインストール in Chrome.
   */
  "install.title": {
    text: "ホーム画面に追加",
    back: "Add to home screen.",
    review: AGENT_READ,
  },
  "install.lead": {
    text: "アプリのように開きます。全画面で、ブラウザのバーはなく、サインインしたままです。",
    back: "It opens like an app. Full screen, no browser bar, and you stay signed in.",
    review: AGENT_READ,
  },
  "install.ios": {
    text: "共有（新しいiPhoneでは ••• メニューの中）をタップし、「ホーム画面に追加」を選んでください。",
    back: "Tap Share (inside the ••• menu on newer iPhones), then choose \"Add to Home Screen\".",
    review: AGENT_READ,
  },
  "install.android": {
    text: "ブラウザの ⋮ メニューを開き、「アプリをインストール」または「ホーム画面に追加」を選んでください。",
    back: "Open the browser's ⋮ menu, then choose \"Install app\" or \"Add to home screen\".",
    review: AGENT_READ,
  },
  "install.button": {
    text: "アプリをインストール",
    back: "Install the app.",
    review: AGENT_READ,
  },
  "install.dismiss": {
    text: "今はしない",
    back: "Not now.",
    review: AGENT_READ,
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
    review: AGENT_READ,
  },
  "filter.player": {
    text: "対局者",
    back: "Player (the site's own word for one).",
    review: AGENT_READ,
  },
  "filter.result": {
    text: "結果",
    back: "Result.",
    review: AGENT_READ,
  },
  "filter.sort": {
    text: "並び順",
    back: "Sort order.",
    review: AGENT_READ,
  },
  "filter.any": {
    text: "すべて",
    back: "All / any.",
    review: AGENT_READ,
  },
  "filter.searchNames": {
    text: "名前を検索",
    back: "Search names.",
    review: AGENT_READ,
  },

  "rules.inspiredBy": {
    text: "{name}に着想を得た版です。名称は権利者に帰属し、ここに記すのは当サイト独自の規則です。",
    back: "This is a version inspired by {name}. The name belongs to its rights holder; what is set down here is this site's own rules.",
    review: AGENT_READ,
    ask: "A trademark notice (the name belongs to its owner): a native read is recommended.",
  },
  "rules.alsoKnownAs": {
    text: "別名は{names}。",
    back: "Its other names are {names}.",
    review: AGENT_READ,
  },
  "rules.from": {
    text: "{country}発",
    back: "Originating from {country}.",
    review: AGENT_READ,
  },
  "rules.imageAlt": {
    text: "対局中の{game}の盤面",
    back: "The board of a game of {game} in play.",
    review: AGENT_READ,
  },
  "rules.play.button": {
    text: "遊ぶ →",
    back: "Play →",
    review: AGENT_READ,
  },
  "rules.everyGamePlayed": {
    text: "ここでの{game}の全対局",
    back: "Every game of {game} played here.",
    review: AGENT_READ,
  },
  "rules.wikipedia": {
    text: "{game}をウィキペディアで読む ↗",
    back: "Read about {game} on Wikipedia ↗",
    review: AGENT_READ,
  },

  /*
   * The set-up screen's tiles for the opening, the rating and the opponent.
   *
   * The four opponent headings keep the kanji their dropdown's groups already
   * showed — 指名, 在室, 知人, 対コンピュータ — beside the English, but they are
   * on this side of the line for the reason 昇級 is: a session wrote them, not
   * John, so being on the site already is not the same as having been read.
   * A Japanese reader sees only the one word, and 在室 ("in the room") is not
   * how a site says who is online, so that heading reads オンライン中 and the
   * kanji stays beside the English. 対局者 is not used for "Opponent" because
   * the site uses it for "Player"; 対戦相手 is the one who sits across from you.
   */
  "setup.opening": {
    text: "開局ルール",
    back: "Opening rule — the rule for how a game begins.",
    review: AGENT_READ,
  },
  "setup.ratings": {
    text: "レーティング",
    back: "Rating.",
    review: AGENT_READ,
  },
  "setup.rated": {
    text: "レーティング対局",
    back: "Rated game.",
    review: AGENT_READ,
  },
  "setup.ratedMeans": {
    text: "結果が双方のレーティングに反映されます。",
    back: "The result is reflected in both players' ratings.",
    review: AGENT_READ,
  },
  "setup.friendly": {
    text: "親善対局",
    back: "Friendly game.",
    review: AGENT_READ,
  },
  "setup.friendlyMeans": {
    text: "対局そのものを楽しむ一局です。レーティングは変動しません。",
    back: "A game played to enjoy the game itself. The rating does not change.",
    review: AGENT_READ,
  },
  "setup.opponent": {
    text: "対戦相手",
    back: "Opponent — the person you play against.",
    review: AGENT_READ,
  },
  "setup.anyoneMeans": {
    text: "最初に来た人がもう一方の席に着きます。",
    back: "The first person to come sits in the other seat.",
    review: AGENT_READ,
  },
  "setup.askedFor": {
    text: "指名",
    back: "Nominated — the person named for this game.",
    review: AGENT_READ,
  },
  "setup.hereNow": {
    text: "オンライン中",
    back: "Online now.",
    review: AGENT_READ,
  },
  "setup.playersYouKnow": {
    text: "知人",
    back: "Acquaintances — people you know.",
    review: AGENT_READ,
  },
  "setup.theComputer": {
    text: "対コンピュータ",
    back: "Against the computer.",
    review: AGENT_READ,
  },
  /*
   * The press under a long run of people. 人 counts people, which is all a run
   * that folds can hold — the computer players are never more than the cap.
   */
  "setup.showAll": {
    text: "全{count}人を表示",
    back: "Show all {count} people.",
    review: AGENT_READ,
  },
  "setup.showFewer": {
    text: "折りたたむ",
    back: "Fold it back up — show fewer.",
    review: AGENT_READ,
  },
  /*
   * On a game's chip when the family showing it is not the one it lives in:
   * that family's name fills {family}. にも掲載 — "is also listed under".
   */
  "setup.alsoUnder": {
    text: "{family}にも掲載",
    back: "Also listed under {family}.",
    review: AGENT_READ,
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
    review: AGENT_READ,
  },
  "xp.pointsEarned": {
    text: "獲得経験値",
    back: "Experience points earned.",
    review: AGENT_READ,
  },
  "xp.dismiss": {
    text: "閉じる",
    back: "Close.",
    review: AGENT_READ,
  },
  "xp.levelUp": {
    text: "昇級",
    back: "Promotion — going up a grade.",
    review: AGENT_READ,
  },
  "xp.nextLevel": {
    text: "次のレベル：{name}",
    back: "Next level: {name}",
    review: AGENT_READ,
  },

  /*
   * The standing block on a person's page. レベル follows the toast's own
   * "次のレベル" so the same word is the same word two screens apart; the
   * distance line reads "{name}まであと{count}経験値" because Japanese puts the
   * goal first and the remaining amount last, and the unit is said because a
   * bare number after まであと does not say what it counts.
   */
  "xp.level": {
    text: "レベル",
    back: "Level.",
    review: AGENT_READ,
  },
  "xp.toNext": {
    text: "{name}まであと{count}経験値",
    back: "{count} experience points to go until {name}.",
    review: AGENT_READ,
  },
  "xp.atTheTop": {
    text: "最高レベルです。",
    back: "This is the highest level.",
    review: AGENT_READ,
  },
  "xp.board": {
    text: "経験値の順位表",
    back: "The experience-points ranking table.",
    review: AGENT_READ,
  },

  /*
   * Credit for another site's record, and which total a board counts. 通算 and
   * 五つ follow the chips' own "通算" and "五" on the players page, so the
   * sentence and the chip above it use one word each.
   */
  "xp.imported.includes": {
    text: "{sites}で対局した{games}局の分として、{xp}経験値を含みます。",
    back: "Includes {xp} experience points as credit for the {games} games played on {sites}.",
    review: AGENT_READ,
  },
  "xp.imported.includesElsewhere": {
    text: "他のサイトで対局した分として、{xp}経験値を含みます。",
    back: "Includes {xp} experience points as credit for games played on other sites.",
    review: AGENT_READ,
  },
  "xp.scope.everywhere": {
    text: "通算で集計：ここで得た経験値に、他のサイトでの対局分を加えています。",
    back: "Counting in total: the credit for games on other sites is added to the experience points earned here.",
    review: AGENT_READ,
  },
  "xp.scope.here": {
    text: "このサイトのみで集計：ここで得た経験値だけで、他のサイトの分は含みません。",
    back: "Counting this site only: only the experience points earned here; the credit from other sites is not included.",
    review: AGENT_READ,
  },
  "xp.scope.countEverywhere": {
    text: "他のサイトも含める",
    back: "Include other sites.",
    review: AGENT_READ,
  },

  /*
   * The button that downloads a finished game as an .sgf file. 形式 keeps SGF
   * reading as a file format rather than a thing being downloaded.
   */
  "record.downloadSgf": {
    text: "SGF形式でダウンロード",
    back: "Download in SGF format.",
    review: AGENT_READ,
  },
  /* The draughts family's file, in the same words. */
  "record.downloadPdn": {
    text: "PDN形式でダウンロード",
    back: "Download in PDN format.",
    review: AGENT_READ,
  },
  /* A chip on a record narrowed to a month or a week: a headline fragment, so no ending 。 */
  "record.finishedIn": {
    text: "{when}に終了",
    back: "Finished in {when}.",
    review: AGENT_READ,
  },
  "record.weekOf": {
    text: "{date}の週",
    back: "The week of {date}.",
    review: AGENT_READ,
  },

  /*
   * The rivalry scoreboard. 対戦 is "playing each other" and 対局 is "a game
   * played", the words the site's own record already leans on; 連勝 and 連敗
   * are the site's own streak kanji (`STREAK_DISPLAY`), so a run is the same
   * word on a ladder and here. 互角 is "evenly matched", which is how a tie
   * between two players is said rather than a tie in a table. The `.one` and
   * `.other` pairs say the same thing where Japanese does not count in forms.
   */
  "rivalry.title": { text: "対戦成績", back: "Head-to-head record.", review: AGENT_READ },
  "rivalry.versus": { text: "対", back: "Versus.", review: AGENT_READ },
  "rivalry.wins": { text: "勝ち", back: "Wins.", review: AGENT_READ },
  "rivalry.draws": { text: "引き分け", back: "Draws.", review: AGENT_READ },
  "rivalry.games": { text: "対局数", back: "Number of games played.", review: AGENT_READ },
  "rivalry.allGames": { text: "通算", back: "All-time total.", review: AGENT_READ },
  "rivalry.lastPlayed": { text: "最終対局", back: "The last game (the same word the games index uses for \"last played\").", review: AGENT_READ },
  "rivalry.notYet": { text: "まだなし", back: "None yet.", review: AGENT_READ },
  "rivalry.streak": { text: "連続記録", back: "Streak record — the run of results in a row.", review: AGENT_READ },
  "rivalry.against": { text: "{name}との対戦", back: "Games against {name}.", review: AGENT_READ },
  "rivalry.unnamed": { text: "ある対局者", back: "A (certain) player.", review: AGENT_READ },
  "rivalry.streakWon.one": { text: "直近の対局は{name}の勝ち", back: "The most recent game was won by {name}.", review: AGENT_READ },
  "rivalry.streakWon.other": { text: "{name}が{count}連勝中", back: "{name} is on {count} wins in a row.", review: AGENT_READ },
  "rivalry.streakDrawn.one": { text: "直近の対局は引き分け", back: "The most recent game was a draw.", review: AGENT_READ },
  "rivalry.streakDrawn.other": { text: "{count}局連続で引き分け", back: "{count} games in a row were draws.", review: AGENT_READ },
  "rivalry.never.you": {
    text: "{name}とはまだ対戦したことがありません",
    back: "You have not yet ever played {name}.",
    review: AGENT_READ,
  },
  "rivalry.never.named": {
    text: "{one}と{other}はまだ対戦したことがありません",
    back: "{one} and {other} have not yet ever played each other.",
    review: AGENT_READ,
  },
  "rivalry.neverGame.you": {
    text: "{name}とは{game}でまだ対戦したことがありません",
    back: "You have not yet played {name} at {game}.",
    review: AGENT_READ,
  },
  "rivalry.neverGame.named": {
    text: "{one}と{other}は{game}でまだ対戦したことがありません",
    back: "{one} and {other} have not yet played each other at {game}.",
    review: AGENT_READ,
  },
  "rivalry.gapMonths.you": { text: "{name}とは{count}か月対戦していません", back: "You have not played {name} for {count} months.", review: AGENT_READ },
  "rivalry.gapMonths.named": {
    text: "{one}と{other}は{count}か月対戦していません",
    back: "{one} and {other} have not played each other for {count} months.",
    review: AGENT_READ,
  },
  "rivalry.gapYear.you": { text: "{name}とは1年対戦していません", back: "You have not played {name} for a year.", review: AGENT_READ },
  "rivalry.gapYear.named": {
    text: "{one}と{other}は1年対戦していません",
    back: "{one} and {other} have not played each other for a year.",
    review: AGENT_READ,
  },
  "rivalry.gapYears.you": { text: "{name}とは{count}年対戦していません", back: "You have not played {name} for {count} years.", review: AGENT_READ },
  "rivalry.gapYears.named": {
    text: "{one}と{other}は{count}年対戦していません",
    back: "{one} and {other} have not played each other for {count} years.",
    review: AGENT_READ,
  },
  "rivalry.firstWin.you": { text: "{name}に初勝利", back: "First win against {name}.", review: AGENT_READ },
  "rivalry.firstLoss.you": { text: "{name}があなたに初勝利", back: "{name} wins against you for the first time.", review: AGENT_READ },
  "rivalry.firstWin.named": { text: "{winner}が{loser}に初勝利", back: "{winner} wins against {loser} for the first time.", review: AGENT_READ },
  "rivalry.beaten.you": { text: "{name}に{count}連勝中", back: "You are on {count} wins in a row against {name}.", review: AGENT_READ },
  "rivalry.lostTo.you": { text: "{name}に{count}連敗中", back: "You are on {count} losses in a row to {name}.", review: AGENT_READ },
  "rivalry.beaten.named": {
    text: "{winner}が{loser}に{count}連勝中",
    back: "{winner} is on {count} wins in a row against {loser}.",
    review: AGENT_READ,
  },
  "rivalry.drawnRun.you": { text: "{name}との直近{count}局は引き分け", back: "Your last {count} games with {name} were draws.", review: AGENT_READ },
  "rivalry.drawnRun.named": {
    text: "{one}と{other}の直近{count}局は引き分け",
    back: "The last {count} games between {one} and {other} were draws.",
    review: AGENT_READ,
  },
  "rivalry.allDrawn.you": { text: "{name}との対局はすべて引き分け", back: "Every game with {name} has been a draw.", review: AGENT_READ },
  "rivalry.allDrawn.named": {
    text: "{one}と{other}の対局はすべて引き分け",
    back: "Every game between {one} and {other} has been a draw.",
    review: AGENT_READ,
  },
  "rivalry.tied.you": { text: "{name}とは{score}で互角", back: "Evenly matched with {name} at {score}.", review: AGENT_READ },
  "rivalry.tied.named": { text: "{one}と{other}は{score}で互角", back: "{one} and {other} are evenly matched at {score}.", review: AGENT_READ },
  "rivalry.lead.you": { text: "{name}に{score}でリード", back: "You lead {name} {score}.", review: AGENT_READ },
  "rivalry.behind.you": { text: "{name}があなたに{score}でリード", back: "{name} leads you {score}.", review: AGENT_READ },
  "rivalry.lead.named": { text: "{leader}が{trailer}に{score}でリード", back: "{leader} leads {trailer} {score}.", review: AGENT_READ },

  /*
   * The figures under every game and family on /games. Japanese does not mark
   * one against many, so each pair of count phrases is answered the same way
   * twice. 首位 (first place) is the word for a ladder's top; 系統 is the
   * word the Families view already uses in its own switch.
   */
  "catalogue.played.one": {
    text: "対局数 {count}",
    back: "Games played: {count}",
    review: AGENT_READ,
  },
  "catalogue.played.other": {
    text: "対局数 {count}",
    back: "Games played: {count}",
    review: AGENT_READ,
  },
  "catalogue.nobodyYet": {
    text: "まだ誰も対局していません",
    back: "Nobody has played yet.",
    review: AGENT_READ,
  },
  "catalogue.beFirst": {
    text: "最初の対局者になる →",
    back: "Become the first to play →",
    review: AGENT_READ,
  },
  "catalogue.beFirstStranger": {
    text: "閲覧は自由です。参加して最初の対局者になる →",
    back: "Browsing is free. Join and become the first to play →",
    review: AGENT_READ,
  },
  "catalogue.topPlayer": {
    text: "首位",
    back: "First place.",
    review: AGENT_READ,
  },
  "catalogue.poolPeople": {
    text: "対人",
    back: "Against people.",
    review: AGENT_READ,
  },
  "catalogue.poolComputer": {
    text: "対コンピュータ",
    back: "Against the computer.",
    review: AGENT_READ,
  },
  "catalogue.topMeansPeople": {
    text: "この種目の対人順位表の首位です。会員同士のレーティング対局で、レーティングの高い順。成績はその順位表での勝ち–負け–引き分けです。",
    back: "This is first place on this game's ladder against people. Rated games between members, highest rating first. The record is wins–losses–draws on that ladder.",
    review: AGENT_READ,
  },
  "catalogue.topMeansComputer": {
    text: "対人の順位はまだないため、コンピュータ相手の順位表の首位です。対人の順位表とは別で、合算しません。成績はその順位表での勝ち–負け–引き分けです。",
    back: "There is no standing against people yet, so this is first place on the ladder against the computer. It is separate from the people's ladder and never added to it. The record is wins–losses–draws on that ladder.",
    review: AGENT_READ,
  },
  "catalogue.noStanding": {
    text: "レーティング対局はまだありません",
    back: "No rated games yet.",
    review: AGENT_READ,
  },
  "catalogue.joinToSeeWho": {
    text: "参加すると、誰なのかわかります →",
    back: "Join, and you will see who it is →",
    review: AGENT_READ,
  },
  "catalogue.play": {
    text: "対局する →",
    back: "Play →",
    review: AGENT_READ,
  },
  "catalogue.standings": {
    text: "順位表 →",
    back: "Standings →",
    review: AGENT_READ,
  },
  "catalogue.wonTitle": {
    text: "この順位表で勝ったレーティング対局",
    back: "The rated games won on this ladder.",
    review: AGENT_READ,
  },
  "catalogue.lostTitle": {
    text: "この順位表で負けたレーティング対局",
    back: "The rated games lost on this ladder.",
    review: AGENT_READ,
  },
  "catalogue.drawnTitle": {
    text: "この順位表で引き分けたレーティング対局",
    back: "The rated games drawn on this ladder.",
    review: AGENT_READ,
  },
  "catalogue.lastToday": {
    text: "最終対局：今日",
    back: "Last game: today.",
    review: AGENT_READ,
  },
  "catalogue.lastYesterday": {
    text: "最終対局：昨日",
    back: "Last game: yesterday.",
    review: AGENT_READ,
  },
  "catalogue.lastDays": {
    text: "最終対局：{count}日前",
    back: "Last game: {count} days ago.",
    review: AGENT_READ,
  },
  "catalogue.lastMonths": {
    text: "最終対局：{count}か月前",
    back: "Last game: {count} months ago.",
    review: AGENT_READ,
  },
  "catalogue.lastYears": {
    text: "最終対局：{count}年前",
    back: "Last game: {count} years ago.",
    review: AGENT_READ,
  },
  "catalogue.familyPlayed.one": {
    text: "この系統で{count}局",
    back: "{count} games in this family.",
    review: AGENT_READ,
  },
  "catalogue.familyPlayed.other": {
    text: "この系統で{count}局",
    back: "{count} games in this family.",
    review: AGENT_READ,
  },
  "catalogue.familyTried": {
    text: "{total}種目中{played}種目で対局あり",
    back: "Played in {played} of its {total} games.",
    review: AGENT_READ,
  },
  "catalogue.crownsHeld": {
    text: "最多首位",
    back: "Most first places.",
    review: AGENT_READ,
  },
  "catalogue.crownCount": {
    text: "{total}種目中{count}",
    back: "{count} of {total} games.",
    review: AGENT_READ,
  },
  "catalogue.crownMeans": {
    text: "首位とは、一つの種目の順位表の一番上のことです。この対局者は、この系統の種目で誰よりも多く首位に立っています。",
    back: "A first place is the top of one game's ladder. This player stands in first place in more of this family's games than anyone else.",
    review: AGENT_READ,
  },
  "catalogue.crownsShared": {
    text: "{count}人が首位を分け合っています",
    back: "{count} players share the first places.",
    review: AGENT_READ,
  },

  /* The feed (/feed). Drafted 2026-09-25 with the page; nobody who reads Japanese has read it yet. */
  "feed.title": {
    text: "近況",
    back: "Recent activity.",
    review: AGENT_READ,
  },
  "feed.homeLink": {
    text: "自分の近況",
    back: "Your own recent activity.",
    review: AGENT_READ,
  },
  "feed.lead": {
    text: "あなたと仲間が最近遊んだこと。新しい順です。",
    back: "What you and your buddies played recently. Newest first.",
    review: AGENT_READ,
  },
  "feed.leadEveryone": {
    text: "最近ここで終わった対局、新しく加わったゲーム、そしてサイトのニュース（初めての出来事、新しい首位、最速記録）です。名前を表示するのは、コンピュータと18歳以上と答えた会員だけです。",
    back: "Games that ended here recently, games newly added, and the site's news (first events, new leaders, fastest records). Names are shown only for computers and members who answered that they are 18 or over.",
    review: AGENT_READ,
    ask: "Says who is named by age (18 or over): about children, so a native read is recommended.",
  },
  "feed.tabMine": {
    text: "あなたと仲間",
    back: "You and your buddies.",
    review: AGENT_READ,
  },
  "feed.tabEveryone": {
    text: "全員",
    back: "Everyone (the same word as the Players page's Everyone filter).",
    review: AGENT_READ,
  },
  "feed.tabsLabel": {
    text: "誰の近況を表示するか",
    back: "Whose activity to show.",
    review: AGENT_READ,
  },
  "feed.today": {
    text: "今日",
    back: "Today.",
    review: AGENT_READ,
  },
  "feed.yesterday": {
    text: "昨日",
    back: "Yesterday.",
    review: AGENT_READ,
  },
  "feed.won.you": {
    text: "{game}で{other}に勝ちました",
    back: "You won against {other} at {game}.",
    review: AGENT_READ,
  },
  "feed.won.named": {
    text: "{who}が{game}で{other}に勝ちました",
    back: "{who} won against {other} at {game}.",
    review: AGENT_READ,
  },
  "feed.lost.you": {
    text: "{game}で{other}に負けました",
    back: "You lost to {other} at {game}.",
    review: AGENT_READ,
  },
  "feed.lost.named": {
    text: "{who}が{game}で{other}に負けました",
    back: "{who} lost to {other} at {game}.",
    review: AGENT_READ,
  },
  "feed.drawn.you": {
    text: "{game}で{other}と引き分けました",
    back: "You drew with {other} at {game}.",
    review: AGENT_READ,
  },
  "feed.drawn.named": {
    text: "{who}が{game}で{other}と引き分けました",
    back: "{who} drew with {other} at {game}.",
    review: AGENT_READ,
  },
  "feed.started.you": {
    text: "{other}と{game}の対局を始めました",
    back: "You started a game of {game} with {other}.",
    review: AGENT_READ,
  },
  "feed.started.named": {
    text: "{who}が{other}と{game}の対局を始めました",
    back: "{who} started a game of {game} with {other}.",
    review: AGENT_READ,
  },
  "feed.waiting.you": {
    text: "{game}の対局を始めました。相手を待っています",
    back: "You started a game of {game}. Waiting for an opponent.",
    review: AGENT_READ,
  },
  "feed.waiting.named": {
    text: "{who}が{game}の対局を始めました。相手を待っています",
    back: "{who} started a game of {game}. Waiting for an opponent.",
    review: AGENT_READ,
  },
  "feed.xp.you": {
    text: "{xp}を獲得しました",
    back: "You earned {xp}.",
    review: AGENT_READ,
  },
  "feed.xp.named": {
    text: "{who}が{xp}を獲得しました",
    back: "{who} earned {xp}.",
    review: AGENT_READ,
  },
  "feed.ip.you": {
    text: "{ip}を勝ち取りました",
    back: "You won {ip}.",
    review: AGENT_READ,
  },
  "feed.ip.named": {
    text: "{who}が{ip}を勝ち取りました",
    back: "{who} won {ip}.",
    review: AGENT_READ,
  },
  "feed.credited.you": {
    text: "他のサイトでの対局に対して{xp}が加算されました",
    back: "{xp} was added for games on other sites.",
    review: AGENT_READ,
  },
  "feed.credited.named": {
    text: "{who}に、他のサイトでの対局分として{xp}が加算されました",
    back: "{xp} was added to {who} for games played on other sites.",
    review: AGENT_READ,
  },
  "feed.level.you": {
    text: "レベル{level}「{name}」になりました",
    back: "You became level {level}, \"{name}\".",
    review: AGENT_READ,
  },
  "feed.level.named": {
    text: "{who}がレベル{level}「{name}」になりました",
    back: "{who} became level {level}, \"{name}\".",
    review: AGENT_READ,
  },
  "feed.puzzleOne.you": {
    text: "{game}のパズルを1問解きました",
    back: "You solved 1 {game} puzzle.",
    review: AGENT_READ,
  },
  "feed.puzzleOne.named": {
    text: "{who}が{game}のパズルを1問解きました",
    back: "{who} solved 1 {game} puzzle.",
    review: AGENT_READ,
  },
  "feed.puzzleMany.you": {
    text: "{game}のパズルを{count}問解きました",
    back: "You solved {count} {game} puzzles.",
    review: AGENT_READ,
  },
  "feed.puzzleMany.named": {
    text: "{who}が{game}のパズルを{count}問解きました",
    back: "{who} solved {count} {game} puzzles.",
    review: AGENT_READ,
  },
  /* The site's news on the Everyone tab. Drafted 2026-09-26 with the news; nobody who reads Japanese has read it yet. */
  "feed.news.firstGameWon": {
    text: "{game}がここで初めて遊ばれました。{who}が{other}に勝ちました",
    back: "{game} was played here for the first time. {who} won against {other}.",
    review: AGENT_READ,
  },
  "feed.news.firstGameDrawn": {
    text: "{game}がここで初めて遊ばれました。{who}と{other}は引き分けでした",
    back: "{game} was played here for the first time. {who} and {other} drew.",
    review: AGENT_READ,
  },
  "feed.news.firstGame": {
    text: "{game}がここで初めて遊ばれました",
    back: "{game} was played here for the first time.",
    review: AGENT_READ,
  },
  "feed.news.firstPlace": {
    text: "{who}が{game}で首位に立ちました",
    back: "{who} took first place at {game}.",
    review: AGENT_READ,
  },
  "feed.news.botBeaten": {
    text: "{who}が{game}で{other}に勝ちました。ここで勝った最初の人です",
    back: "{who} won against {other} at {game}. The first person here to win.",
    review: AGENT_READ,
  },
  "feed.news.botBeatenNobody": {
    text: "{other}が{game}で初めて負けました",
    back: "{other} lost at {game} for the first time.",
    review: AGENT_READ,
  },
  "feed.news.firstWin": {
    text: "{who}がここで初めて勝ちました（{game}）",
    back: "{who} won for the first time here ({game}).",
    review: AGENT_READ,
  },
  "feed.news.firstLoss": {
    text: "{who}がここで初めて負けました（{game}）",
    back: "{who} lost for the first time here ({game}).",
    review: AGENT_READ,
  },
  "feed.news.bestTime": {
    text: "{game} {board}の最速記録を更新：{who}、{time}",
    back: "Fastest record at {game} {board} broken: {who}, {time}.",
    review: AGENT_READ,
  },
  "feed.news.bestTimeNobody": {
    text: "{game} {board}の最速記録を更新：{time}",
    back: "Fastest record at {game} {board} broken: {time}.",
    review: AGENT_READ,
  },
  "feed.added": {
    text: "新しく加わりました：{games}",
    back: "Newly added: {games}.",
    review: AGENT_READ,
  },
  "feed.seeLadder": {
    text: "順位表を見る",
    back: "See the ladder.",
    review: AGENT_READ,
  },
  "feed.seeFastest": {
    text: "最速記録を見る",
    back: "See the fastest records.",
    review: AGENT_READ,
  },
  "feed.seeSolves": {
    text: "解いた記録を見る",
    back: "See the records of what was solved.",
    review: AGENT_READ,
  },
  "feed.seeGame": {
    text: "対局を見る",
    back: "See the game.",
    review: AGENT_READ,
  },
  "feed.somebody": {
    text: "誰か",
    back: "Somebody.",
    review: AGENT_READ,
  },
  "feed.emptyMine": {
    text: "まだ何もありません。あなたや仲間が対局を始めたり終えたり、経験値を得たり、レベルが上がったり、パズルを解いたりすると、ここに新しい順で表示されます。",
    back: "Nothing yet. When you or your buddies start or finish a game, earn experience, go up a level or solve a puzzle, it is shown here, newest first.",
    review: AGENT_READ,
  },
  "feed.emptyEveryone": {
    text: "まだ何もありません。このタブに表示できる対局者どうしの最近の対局も、新しいゲームも、ニュースもありません。",
    back: "Nothing yet. There are no recent games between players this tab can show, no new games and no news.",
    review: AGENT_READ,
  },
  "feed.beFirst": {
    text: "最初の対局者になる →",
    back: "Become the first to play →",
    review: AGENT_READ,
  },
  "feed.findBuddies": {
    text: "仲間を探す →",
    back: "Find buddies.",
    review: AGENT_READ,
  },
  "count.gameKind.one": { text: "{count}ゲーム", back: "{count} game.", review: AGENT_READ },
  "count.gameKind.other": { text: "{count}ゲーム", back: "{count} games.", review: AGENT_READ },
  "count.gamePlayed.one": { text: "{count}局", back: "{count} game.", review: AGENT_READ },
  "count.gamePlayed.other": { text: "{count}局", back: "{count} games.", review: AGENT_READ },
  "count.move.one": { text: "{count}手", back: "{count} move.", review: AGENT_READ },
  "count.move.other": { text: "{count}手", back: "{count} moves.", review: AGENT_READ },
  "count.offer.one": { text: "{count}件の対局申し込み", back: "{count} request to play a game.", review: AGENT_READ },
  "count.offer.other": { text: "{count}件の対局申し込み", back: "{count} requests to play a game.", review: AGENT_READ },
  "count.player.one": { text: "{count}人", back: "{count} person.", review: AGENT_READ },
  "count.player.other": { text: "{count}人", back: "{count} people.", review: AGENT_READ },
  "count.puzzle.one": { text: "{count}問", back: "{count} puzzle.", review: AGENT_READ },
  "count.puzzle.other": { text: "{count}問", back: "{count} puzzles.", review: AGENT_READ },
  "count.step.one": { text: "{count}手順", back: "{count} step.", review: AGENT_READ },
  "count.step.other": { text: "{count}手順", back: "{count} steps.", review: AGENT_READ },
  "count.level.one": { text: "{count}レベル", back: "{count} level.", review: AGENT_READ },
  "count.level.other": { text: "{count}レベル", back: "{count} levels.", review: AGENT_READ },
  "count.pair.one": { text: "{count}組", back: "{count} pair.", review: AGENT_READ },
  "count.pair.other": { text: "{count}組", back: "{count} pairs.", review: AGENT_READ },
  // Phrases kept in files of their own, so this one is not where every ticket edits (ENJA-05).
  ...JA_DRAFTED_RULESPAGE,
  ...JA_DRAFTED_PIECES,
  ...JA_DRAFTED_GAMEPAGES,
  ...JA_DRAFTED_ENDING,
  ...JA_DRAFTED_BOARDLOOK,
  ...JA_DRAFTED_WINCOVER,
  ...JA_DRAFTED_GAMESCREEN,
  ...JA_DRAFTED_GAME,
  ...JA_DRAFTED_SUMMARY,
  ...JA_DRAFTED_LIVE,
  ...JA_DRAFTED_READMOVES,
  ...JA_DRAFTED_RESULT,
  ...JA_DRAFTED_MOSAIC,
  ...JA_DRAFTED_REPLAY,
  ...JA_DRAFTED_PLAYED,
  ...JA_DRAFTED_HANDICAPOFFER,
  ...JA_DRAFTED_HEADSTART,
  ...JA_DRAFTED_ADVANTAGE,
  ...JA_DRAFTED_GOMOKU,
  ...JA_DRAFTED_CLOCK,
  ...JA_DRAFTED_CUBEMETHOD,
  ...JA_DRAFTED_RATING,
};

/**
 * Every drafted phrase, joined from this file and the per-area files beside it.
 *
 * Split the way the English catalogue is (`phrases.<area>.constants.ts`): the
 * drafted Japanese had grown past 64 KB in one file, which every page's server
 * function carries, and a file that size is a decision `pageFunction.coverage.test.ts`
 * wants written down. An area's Japanese is its own file, so two tickets adding
 * phrases at once no longer both edit the end of the same one. A key said in
 * two of them is refused by `japanese.coverage.test.ts`, which reads the join.
 */
export const JA_DRAFTED: Partial<Record<PhraseKey, DraftedPhrase>> = {
  ...JA_DRAFTED_BASE,
  ...JA_DRAFTED_XP,
  ...JA_DRAFTED_COUNTRIES,
  ...JA_DRAFTED_LEARN,
  ...JA_DRAFTED_ABOUT,
  ...JA_DRAFTED_MINE,
  ...JA_DRAFTED_PLAYERS,
  ...JA_DRAFTED_PAGES,
  ...JA_DRAFTED_HOME,
  ...JA_DRAFTED_AUTH,
  ...JA_DRAFTED_MESSAGES,
  ...JA_DRAFTED_INBOX,
  ...JA_DRAFTED_REPORTS,
  ...JA_DRAFTED_CHROME,
  ...JA_DRAFTED_PUZZLE,
  ...JA_DRAFTED_HOUSEKI,
  ...JA_DRAFTED_PSET,
  ...JA_DRAFTED_PWORD,
  ...JA_DRAFTED_PGRID,
  ...JA_DRAFTED_PMAZE,
  ...JA_DRAFTED_PKUMI,
  ...JA_DRAFTED_PCARD,
  ...JA_DRAFTED_PARTY,
  ...JA_DRAFTED_CTABLE,
  ...JA_DRAFTED_CASUAL,
};
