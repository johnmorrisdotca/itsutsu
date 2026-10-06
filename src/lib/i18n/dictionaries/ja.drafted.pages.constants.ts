import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the pages.* phrases (ENJA-10): the small pages. Joined into `JA_DRAFTED`.
 * Every row has been read by the reviewer agent.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_PAGES: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "pages.gamesWith": r("対局相手", "Opponent of the games"),
  "pages.everyGame": r("すべての対局", "All games"),

  "pages.diceTitle": r("ダイスロール", "Dice roll"),
  "pages.diceDescription": r(
    "タップして1〜10個のダイスを振れます。d4からd100まで、ボーナス、アドバンテージ、ディスアドバンテージにも対応し、合計、正確な確率、振った履歴、統計を表示します。",
    "Tap to roll 1 to 10 dice. From d4 to d100, with a bonus, advantage and disadvantage supported, it shows the total, the exact odds, the history of your rolls and your statistics.",
  ),
  "pages.diceIntro": r(
    "Korokoro（{kanji}）は、サイコロが転がる音です。フェルトをタップすると、d4からd100までのダイスを1〜10個振れて、出目の確率も読み取れます。振った記録はこの端末に残ります。",
    "Korokoro ({kanji}) is the sound of dice rolling. Tap the felt and you can roll 1 to 10 dice from d4 to d100, and also read the odds of the result. The record of your rolls stays on this device.",
  ),
  "pages.diceAbout": r(
    "振った結果はすべて、お使いの端末の暗号論的乱数生成器から出ます。そのため、このサイトも含めて誰にも、予測も操作もできません。卓で出目を確かめたいときは、「乱数」でシードを選んでください。Korokoroはオープンソース（MITライセンス）で、{github}と、npmの{package}で公開しています。ダイスが必要なサイトやゲームで使えます。",
    "Every result comes from your device's cryptographic random number generator, so no one, this site included, can predict or manipulate it. When a table wants to check a roll, choose a seed under \"乱数 (randomness)\". Korokoro is open source (MIT licence), published on {github} and as {package} on npm. It can be used by any site or game that needs dice.",
  ),

  "pages.historyDescription": r("すべての対局を、石を置いた順に記録しています。", "Every game is recorded in the order the stones were placed."),

  "pages.releasesTitle": r("更新内容", "What was updated"),
  "pages.releasesLead": r(
    "新しい順に、プレイヤーに伝わる言葉で書いています。作業と同じコミットで書かれる更新履歴そのものから読み込むので、この一覧がサイトに遅れることはありません。いま表示しているバージョンには印が付いています。更新履歴の本文は、記録として英語のままです。",
    "Newest first, written in words that reach players. It is read from the changelog itself, which is written in the same commit as the work, so this list cannot fall behind the site. The version being shown now is marked. The text of the changelog stays in English as a record.",
  ),
  "pages.releasesNote": r("すべてのゲームは{link}にあります。それぞれの遊び方は、ゲームのページにあります。", "Every game is on {link}. How to play each is on the game's own page."),
  "pages.releasesOnePage": r("1つのページ", "one page"),
  "pages.releasesUnreadable": r("更新履歴を読み込めませんでした。", "The update history could not be loaded."),
  "pages.releases.one": r("{count}件の更新", "{count} updates"),
  "pages.releases.other": r("{count}件の更新", "{count} updates"),
  "pages.releasesOlder": r("過去の更新（{count}件）", "Past updates ({count})"),
  "pages.thisEdition": r("現行版", "Current edition"),
  "pages.running": r("実行中 {version}", "running {version}"),
  "pages.hideTime": r("時刻を隠す", "Hide the time"),
  "pages.showTime": r("時刻を表示", "Show the time"),
  "pages.released": r("公開：{when}", "Released: {when}"),
};
