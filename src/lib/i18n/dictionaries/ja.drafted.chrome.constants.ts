import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the chrome.* phrases (ENJA-10): the frame every page sits in. Joined into `JA_DRAFTED`.
 * Every row has been read by the reviewer agent (`review`); the standards are `japanese-reviewer.md`, the terms `TERMS.md`.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_CHROME: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "nav.xp": r("経験値", "Experience points"),
  "chrome.stage": r("ベータ版", "Beta version"),
  "chrome.betaTitle": r(
    "{site}はベータ版です。ほぼ毎日新しいものが加わり、粗い部分も少しずつ直しています。テストにご協力いただいている方々へのお礼は、こちらに載せています。",
    "{site} is a beta version. New things are added almost every day, and the rough parts are being fixed little by little. Thanks to the people helping with testing are posted here.",
  ),
  "chrome.homeLink": r("{site}のホーム", "{site}'s home"),
  "chrome.tagline": r("五目並べと、そこから広がったゲーム", "Gomoku, and the games that spread out from it"),
  "chrome.versionTitle": r("バージョン{version}：これまでの更新内容", "Version {version}: the updates so far"),
  "chrome.siteDescription": r(
    "{site}：五目並べ、連珠、Connect6など、線や升目で遊ぶゲームの仲間たち。2人で1つのブラウザ、または別々の端末でコードを伝えるだけで遊べます。",
    "{site}: gomoku, renju, Connect6 and the other games played on lines and squares. Two people on one browser, or on separate devices just by passing along a code.",
  ),

  "chrome.strip.label": r("自分の対局と戦績", "My games and record"),
  "chrome.strip.noGames": r("進行中の対局なし", "No games in progress"),
  "chrome.strip.yourMove": r("自分の手番 {count}局", "My move: {count} games"),
  "chrome.strip.going": r("進行中 {count}局", "In progress: {count} games"),
  "chrome.strip.recordTitle": r("レーティング対局の戦績（対人・対コンピュータ）", "Record in rated games (against people and against computers)"),
  "chrome.strip.won": r("勝", "wins"),
  "chrome.strip.lost": r("敗", "losses"),
  "chrome.strip.drawn": r("分", "draws"),
  "chrome.strip.level": r("Lv {level}・{name}", "Lv {level} · {name}"),

  "chrome.menu.account": r("アカウント", "Account"),
  "chrome.menu.inbox": r("受信箱", "Inbox"),
  "chrome.menu.profile": r("プロフィール", "Profile"),
  "chrome.menu.settings": r("設定", "Settings"),
  "chrome.menu.whatsNew": r("更新内容 →", "What's been updated →"),

  "chrome.offline.intro": r(
    "開いたゲームは、オフラインで遊べるようにこの端末へ保存されます。電波が届かなくなる前に、すべてのゲームをまとめて保存することもできます。",
    "A game you open is saved to this device so you can play it offline. Before the signal is lost, you can also save all the games together.",
  ),
  "chrome.offline.keepAll": r("すべてのゲームを保存", "Save every game"),
  "chrome.offline.keeping": r(
    "この端末にすべてのゲームを保存しています：{total}ページ中{done}ページ（これまでに{size}）…",
    "Saving every game on this device: {done} of {total} pages (so far {size})…",
  ),
  "chrome.offline.done": r(
    "すべてのゲームをこの端末に保存しました（{size}）。どのゲームも通信なしで遊べます。",
    "Every game is saved on this device ({size}). Each one can be played without a connection.",
  ),
  "chrome.offline.again": r("もう一度保存", "Save again"),
  "chrome.offline.remove": r("削除", "Delete"),
  "chrome.offline.ready": r("オフライン可", "Offline OK"),
  "chrome.offline.readyTitle": r("この端末で以前に開いたので、通信なしで遊べます", "It was opened on this device before, so it can be played without a connection"),
  "chrome.offline.notice": r(
    "オフラインです。{link}で「オフライン可」の印がついたゲームは、ここでも遊べます。ライブ対局、レース、記録は、通信が戻るまでお待ちください。",
    "You are offline. Games marked \"Offline OK\" on the {link} can still be played here. Live games, races and records have to wait until the connection returns.",
  ),
  "chrome.offline.gamesList": r("ゲーム一覧", "list of games"),

  "chrome.notFound.title": r("ページが見つかりません", "The page cannot be found"),
  "chrome.notFound.body": r(
    "このアドレスにはページがありません。存在しないゲームのページか、リンクが途中までしかコピーされていない可能性があります。",
    "There is no page at this address. It may be the page of a game that does not exist, or a link that was only copied partway.",
  ),
  "chrome.notFound.home": r("ホーム", "Home"),

  "chrome.embed.played.one": r("対局数：{count}局", "Games played: {count} games"),
  "chrome.embed.played.other": r("対局数：{count}局", "Games played: {count} games"),
  "chrome.embed.black": r("黒", "Black"),
  "chrome.embed.white": r("白", "White"),
  "chrome.embed.draw": r("引き分け", "Draw"),
  "chrome.embed.versus": r("対", "versus"),
  "chrome.embed.over": r("{count}局中", "out of {count} games"),

  "chrome.famous.step": r("{count}手を順に見る", "Look through the {count} moves in order"),
  "chrome.famous.moves": r("手順", "Move sequence"),
  "chrome.famous.hide": r("手順を隠す", "Hide the move sequence"),
  "chrome.famous.thisGame": r("この対局", "this game"),
  "chrome.famous.notPlayed": r("名局です。{site}で打たれた対局ではありません。棋譜の出典：", "A famous game. It was not played on {site}. Source of the record:"),
  "chrome.famous.round": r("{round}回戦", "round {round}"),
  "chrome.famous.mosaicAlt": r("{event}、{black}対{white}の全局面", "All positions of {black} versus {white}, {event}"),
  "chrome.famous.versus": r("対", "versus"),
  "chrome.famous.title": r("名局", "Famous games"),
  "chrome.famous.blurb": r(
    "選手権や歴史的な対局を、このサイトのルールで1手ずつ再現します。それぞれの全局面を並べた1枚の絵にすることもでき、絵はお使いのブラウザで描かれます。",
    "Championship and historic games are replayed one move at a time under this site's rules. Each can also be made into a single picture laying out every position, and the picture is drawn in your own browser.",
  ),
  "chrome.famous.source": r("棋譜の出典：", "Source of the record:"),
  "chrome.famous.sourceName": r("Andries Brouwer氏の囲碁対局データベース（CWI、パブリックドメイン）", "Mr Andries Brouwer's database of Go games (CWI, public domain)"),
};
