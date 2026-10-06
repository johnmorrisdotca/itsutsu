import type { PhraseKey } from "../i18n.constants";

import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/** The reviewer agent's pass over the XP, level and points Japanese (ENJA-09), 2026-10-06, to the standard in `japanese-reviewer.md` and the terms in `TERMS.md`. */
const READ: Review = { by: "agent", on: "2026-10-06" };

/**
 * The Japanese a machine wrote for the XP pages, the points page and the level
 * ladder (ENJA-09), apart from `ja.drafted.constants.ts` for the reason given
 * there. The same rules: `back` is what it literally says, a `{name}` is kept
 * exactly, and every entry here has been read by the reviewer agent and by no person yet (`review`).
 */
export const JA_DRAFTED_XP: Partial<Record<PhraseKey, DraftedPhrase>> = {
  /*
   * The XP pages and the IP page (ENJA-09). 経験値 is the word for experience points, as in the toast's phrases in `ja.drafted.constants.ts`;
   * IP stays as letters (TERMS.md); the bots are コンピュータ (John, 2026-10-06). A heading that has a kanji
   * beside it shows that kanji alone to a reader of Japanese, so for those the text here is only what a
   * page title or a screen reader says.
   */
  "xp.board.nobody": {
    text: "順位表にはまだ誰もいません。",
    back: "Nobody is on the ranking table yet.",
    review: READ,
  },
  "xp.board.count": {
    text: "順位表の{total}人のうち、{shown}人を表示しています。",
    back: "Showing {shown} of the {total} people on the ranking table.",
    review: READ,
  },
  "xp.board.next": {
    text: "次の{count}人を表示",
    back: "Show the next {count} people",
    review: READ,
  },
  "xp.board.top": {
    text: "順位表の先頭に戻る",
    back: "Back to the top of the ranking table",
    review: READ,
  },
  "xp.standing.computers": {
    text: "この順位表はコンピュータだけに絞り込まれているため、ここには載りません。",
    back: "This ranking table is narrowed to the computers only, so you do not appear here.",
    review: READ,
  },
  "xp.standing.none": {
    text: "現在は{level}ですが、経験値がまだないため順位表には載っていません。{finish}と載ります。",
    back: "You are now at {level}, but you have no experience yet, so you are not on the ranking table. When you {finish}, you will be on it.",
    review: READ,
  },
  "xp.standing.levelName": {
    text: "レベル{level}（{name}）",
    back: "level {level} ({name})",
    review: READ,
  },
  "xp.standing.finish": {
    text: "対局を1局終える",
    back: "finish one game",
    review: READ,
  },
  "xp.standing.have": {
    text: "経験値は{total}で、現在は{badge}、{name}です。",
    back: "Your experience is {total}, and you are now at {badge}, {name}.",
    review: READ,
  },
  "xp.standing.marked": {
    text: "下の表で、自分の行に印が付いています。",
    back: "In the table below, your own row is marked.",
    review: READ,
  },
  "xp.standing.rankPeople": {
    text: "人間だけでは{total}人中{rank}位。",
    back: "Among the humans only: {rank}th of {total}.",
    review: READ,
  },
  "xp.standing.rankBoard": {
    text: "{total}人中{rank}位。",
    back: "{rank}th of {total} people.",
    review: READ,
  },
  "xp.you": {
    text: "あなた",
    back: "You",
    review: READ,
  },
  "xp.unnamed": {
    text: "名前未設定の会員",
    back: "A member with no name set",
    review: READ,
  },
  "xp.sort.sorted": {
    text: "{column}：{way}で並べ替え中。押すと逆順になります。",
    back: "{column}: sorted {way}. Press to reverse the order.",
    review: READ,
  },
  "xp.sort.by": {
    text: "{column}で並べ替え",
    back: "Sort by {column}",
    review: READ,
  },
  "xp.sort.ascending": {
    text: "昇順",
    back: "ascending order",
    review: READ,
  },
  "xp.sort.descending": {
    text: "降順",
    back: "descending order",
    review: READ,
  },
  "xp.col.place": {
    text: "表示順での位置",
    back: "Position in the order shown",
    review: READ,
  },
  "xp.col.placeAmong": {
    text: "表示順での位置（{who}のなかで）",
    back: "Position in the order shown (among {who})",
    review: READ,
  },
  "xp.col.member": {
    text: "会員",
    back: "Member",
    review: READ,
  },
  "xp.col.levelTitle": {
    text: "合計から求めます。曲線は増える一方なので、並びは合計と同じです。",
    back: "Worked out from the total. The curve only ever rises, so the order is the same as the total's.",
    review: READ,
  },
  "xp.col.ipTitle": {
    text: "{site}ポイント。勝ち負けの結果だけで獲得します。順位はIPの順位表で確認できます。",
    back: "{site} Points. They are won by results alone. The rankings can be checked on the IP ranking table.",
    review: READ,
  },
  "xp.col.today": {
    text: "今日",
    back: "Today",
    review: READ,
  },
  "xp.col.todayTitle": {
    text: "ここで今日獲得した経験値（会員それぞれの日付で数えます）。他のサイトからの加算は合計には入りますが、増加分には数えません。",
    back: "Experience earned here today, counted on each member's own day. Credit from other sites goes into the total, but is not counted as a gain.",
    review: READ,
  },
  "xp.col.week": {
    text: "7日間",
    back: "7 days",
    review: READ,
  },
  "xp.col.weekTitle": {
    text: "ここで直近7日間に獲得した経験値（今日を含みます）。他のサイトからの加算は合計には入りますが、増加分には数えません。",
    back: "Experience earned here over the last seven days, today included. Credit from other sites goes into the total, but is not counted as a gain.",
    review: READ,
  },
  "xp.col.behind": {
    text: "上との差",
    back: "Gap to the one above",
    review: READ,
  },
  "xp.col.behindTitle": {
    text: "表示順で、すぐ上の行との差（ポイント）",
    back: "The gap in points to the row directly above, in the order shown",
    review: READ,
  },
  "xp.col.aheadTitle": {
    text: "この並びでは、上の行より先にいます",
    back: "In this order, ahead of the row above",
    review: READ,
  },
  "xp.col.last": {
    text: "最終獲得",
    back: "Last earned",
    review: READ,
  },
  "xp.col.lastTitle": {
    text: "最後に何かを獲得した日",
    back: "The day they last earned anything",
    review: READ,
  },
  "xp.about.matchGone": {
    text: "保存期間が過ぎた対局",
    back: "a game whose keeping period has passed",
    review: READ,
  },
  "xp.about.matchGoneYours": {
    text: "この対局はもう保存されていません。終了した対局は、自分で決めた日数だけ保存されます。",
    back: "This game is no longer kept. Finished games are kept for the number of days you decided.",
    review: READ,
  },
  "xp.about.matchGoneTheirs": {
    text: "この対局はもう保存されていません。終了した対局は、本人が決めた日数だけ保存されます。",
    back: "This game is no longer kept. Finished games are kept for the number of days the person decided.",
    review: READ,
  },
  "xp.about.thatMatch": {
    text: "その対局",
    back: "that game",
    review: READ,
  },
  "xp.about.familyRenamed": {
    text: "獲得したあとに名前が変わった系統です。",
    back: "A family whose name has changed since this was earned.",
    review: READ,
  },
  "xp.about.theirPage": {
    text: "その人のページ",
    back: "that person's page",
    review: READ,
  },
  "xp.about.aBot": {
    text: "コンピュータ",
    back: "a computer",
    review: READ,
  },
  "xp.about.yourRival": {
    text: "自分のライバル",
    back: "your own rival",
    review: READ,
  },
  "xp.about.theirRival": {
    text: "その人のライバル",
    back: "that person's rival",
    review: READ,
  },
  "xp.about.stale": {
    text: "サイトには、これに当たるものがもうありません。",
    back: "Nothing on the site corresponds to this any more.",
    review: READ,
  },
  "xp.about.race": {
    text: "パズルでの競争",
    back: "a race at a puzzle",
    review: READ,
  },
  "xp.history.title": {
    text: "経験の記録",
    back: "The record of experience",
    review: READ,
  },
  "xp.history.introYours": {
    text: "獲得した日ごとに、新しいものから順にすべての加算を並べています。日付は自分のタイムゾーンで数えます。「合計」は、その加算を数えた時点の全体で、他のサイトからの加算も含みます。",
    back: "Every award is listed by the day it was earned, newest first. Days are counted in your own time zone. \"Total\" is the whole as it stood when that award was counted, and it includes credit from other sites.",
    review: READ,
  },
  "xp.history.introTheirs": {
    text: "獲得した日ごとに、新しいものから順にすべての加算を並べています。日付は本人のタイムゾーンで数えます。「合計」は、その加算を数えた時点の全体で、他のサイトからの加算も含みます。",
    back: "Every award is listed by the day it was earned, newest first. Days are counted in the person's own time zone. \"Total\" is the whole as it stood when that award was counted, and it includes credit from other sites.",
    review: READ,
  },
  "xp.history.for": {
    text: "内容",
    back: "Contents",
    review: READ,
  },
  "xp.history.about": {
    text: "対象",
    back: "Subject",
    review: READ,
  },
  "xp.history.total": {
    text: "合計",
    back: "Total",
    review: READ,
  },
  "xp.history.totalTitle": {
    text: "この加算を数えた時点の合計",
    back: "The total at the time this award was counted",
    review: READ,
  },
  "xp.history.emptyYours": {
    text: "まだ何も獲得していません。最後まで終えた対局はすべて経験値になり、ここで初めて遊ぶゲームも経験値になります。{link}",
    back: "Nothing earned yet. Every game you finish to the end gives experience, and so does every game you play here for the first time. {link}",
    review: READ,
  },
  "xp.history.emptyYoursLink": {
    text: "ゲームを選んで経験値を貯める",
    back: "Pick a game and start earning experience",
    review: READ,
  },
  "xp.history.emptyTheirs": {
    text: "ここではまだ何も獲得していません。加算があるたびに、日ごとにここへ並びます。{link}",
    back: "Nothing has been earned here yet. Each time there is an award, it will be listed here day by day. {link}",
    review: READ,
  },
  "xp.history.emptyTheirsLink": {
    text: "全員の順位を見る",
    back: "See everybody's ranking",
    review: READ,
  },
  "xp.history.dayTotal": {
    text: "この日は{total}",
    back: "{total} on this day",
    review: READ,
  },
  "xp.history.older": {
    text: "さらに古い加算",
    back: "Older awards",
    review: READ,
  },
  "xp.backToNewest": {
    text: "最新に戻る",
    back: "Back to the newest",
    review: READ,
  },
  "xp.history.skipped.one": {
    text: "このページの{count}件は、このバージョンのサイトでは説明できないルールで獲得されたため、表示していません。合計には含まれています。",
    back: "{count} item on this page was earned under a rule this version of the site cannot explain, so it is not shown. It is included in the total.",
    review: READ,
  },
  "xp.history.skipped.other": {
    text: "このページの{count}件は、このバージョンのサイトでは説明できないルールで獲得されたため、表示していません。合計には含まれています。",
    back: "{count} items on this page were earned under a rule this version of the site cannot explain, so they are not shown. They are included in the total.",
    review: READ,
  },
  "xp.history.elsewhere": {
    text: "他のサイト",
    back: "Another site",
    review: READ,
  },
  "xp.history.elsewhereTitle": {
    text: "他のサイトで残された記録への加算です。ここには開ける対局がありません。",
    back: "Credit for a record kept from another site. There is no game here to open.",
    review: READ,
  },
  "xp.promotions.levelUp": {
    text: "昇級",
    back: "Promotion",
    review: READ,
  },
  "xp.promotions.when": {
    text: "日付",
    back: "Date",
    review: READ,
  },
  "xp.promotions.to": {
    text: "から",
    back: "from (read as \"A から B\", from A to B)",
    review: READ,
  },
  "xp.promotions.several": {
    text: "一度に{levels}",
    back: "{levels} at once",
    review: READ,
  },
  "xp.promotions.imported": {
    text: "{sites}での対局分を取り込み",
    back: "Imported, for play on {sites}",
    review: READ,
  },
  "xp.promotions.otherSites": {
    text: "他のサイト",
    back: "other sites",
    review: READ,
  },
  "xp.promotions.backfilled": {
    text: "{day}の対局分をさかのぼって加算",
    back: "Added retroactively, for play on {day}",
    review: READ,
  },
  "xp.ladder.name": {
    text: "名前",
    back: "Name",
    review: READ,
  },
  "xp.ladder.toReach": {
    text: "必要な経験値",
    back: "Experience needed",
    review: READ,
  },
  "xp.ladder.toReachTitle": {
    text: "このレベルに到達するために会員が持っている必要がある経験値の合計",
    back: "The total experience a member must hold to reach this level",
    review: READ,
  },
  "xp.ladder.climb": {
    text: "上がり幅",
    back: "Size of the rise",
    review: READ,
  },
  "xp.ladder.climbTitle": {
    text: "1つ下のレベルから上るのに必要な経験値",
    back: "The experience needed to climb from the level below",
    review: READ,
  },
  "xp.ladder.why": {
    text: "この名前の理由",
    back: "Why this name",
    review: READ,
  },
  "xp.ladder.caption": {
    text: "経験値のレベルすべてについて、名前、到達に必要な経験値、名前の由来を載せています。",
    back: "Every level of experience, with its name, the experience needed to reach it, and the reason for the name.",
    review: READ,
  },
  "xp.announce.award": {
    text: "{amount}{unit}を獲得：{label}。",
    back: "Earned {amount} {unit}: {label}.",
    review: READ,
  },
  "xp.announce.levelUp": {
    text: "{head}{up}：{name}に到達。",
    back: "{head} {up}: reached {name}.",
    review: READ,
  },
  "xp.announce.next": {
    text: "{head}{next}です。",
    back: "{head} {next}.",
    review: READ,
  },
  "xp.who.everyone": {
    text: "全員",
    back: "everyone",
    review: READ,
  },
  "xp.who.people": {
    text: "人間",
    back: "the humans",
    review: READ,
  },
  "xp.who.computers": {
    text: "コンピュータ",
    back: "the computers",
    review: READ,
  },
  "xp.title": {
    text: "経験値",
    back: "Experience",
    review: READ,
  },
  "xp.showEveryone": {
    text: "全員を表示",
    back: "Show everyone",
    review: READ,
  },
  "xp.joinSite": {
    text: "{site}に参加する",
    back: "Join {site}",
    review: READ,
  },
  "xp.playAGame": {
    text: "ゲームで遊ぶ",
    back: "Play a game",
    review: READ,
  },
  "xp.narrowed": {
    text: "{who}で絞り込み中。",
    back: "Filtered by {who}.",
    review: READ,
  },
  "xp.amount": {
    text: "{count}経験値",
    back: "{count} experience points",
    review: READ,
  },
  "xp.board.metaTitle": {
    text: "経験値の順位表",
    back: "Experience ranking table",
    review: READ,
  },
  "xp.board.metaDescription": {
    text: "{site}の全会員を、獲得した経験値の順に並べています。レベル、合計、最後に獲得した日がわかります。",
    back: "Every member of {site}, ordered by the experience they have earned. You can see their level, their total and the day they last earned.",
    review: READ,
  },
  "xp.board.intro": {
    text: "経験値はレーティングとは別のものです。レーティングは対局の強さを表し、経験値は顔を出していろいろ試したことを表します。1局を終える、1局に勝つ、初めて遊ぶゲームを試す、仲間を加える、週末に遊ぶ、といったことが経験値になります。どのレベルにも名前があり、「{first}」から「{last}」まであります。見出しを押すと、その列で並べ替えられます。「今日」と「7日間」は、各会員がここで、それぞれの日付で獲得した分です。他のサイトからの加算は合計には入りますが、増加分には数えません。「上との差」は、1つ上の行にどれだけ届いていないかを表します。経験値の仕組みができる前にここで終えた対局も、仕組みを作ったときに加算されているので、サイトで最初の対局までさかのぼります。他のサイトの記録も加算されます。「他のサイトも含める」にチェックを入れると数え、外すと除きます。",
    back: "Experience is a separate thing from the rating. The rating shows how strong your play is, and experience shows that you turned up and tried various things. Finishing a game, winning a game, trying a game you have not played, adding a buddy, and playing at the weekend all give experience. Every level has a name, from \"{first}\" to \"{last}\". Press a heading to sort by that column. \"Today\" and \"7 days\" are what each member earned here, on their own days. Credit from other sites goes into the total but is not counted as a gain. \"Gap to the one above\" shows how far a row falls short of the one above it. Games finished here before the experience system existed were also given experience when it was made, so it reaches back to the first game on the site. Records from other sites are credited too. Tick \"Include other sites\" to count them, and untick it to leave them out.",
    review: READ,
  },
  "xp.board.sortRefused": {
    text: "その並べ方は順位表にないため、経験値の順で表示しています。",
    back: "The ranking table does not have that order, so it is shown in order of experience.",
    review: READ,
  },
  "xp.board.whoLabel": {
    text: "順位表に載せる対局者",
    back: "Which players the ranking table lists",
    review: READ,
  },
  "xp.board.scopeLabel": {
    text: "順位表が数える経験値の範囲",
    back: "How much experience the ranking table counts",
    review: READ,
  },
  "xp.board.narrowed": {
    text: "{who}で絞り込み中：順位表に{count}人。",
    back: "Filtered by {who}: {count} people on the ranking table.",
    review: READ,
  },
  "xp.board.emptyNarrowed": {
    text: "{who}には、ここで経験値を獲得した対局者がまだいません。",
    back: "Among {who}, there is no player yet who has earned experience here.",
    review: READ,
  },
  "xp.board.emptyGuest": {
    text: "まだ誰も、ここで経験値を獲得していません。{join}と、最初の一人として順位表に載れます。",
    back: "Nobody has earned experience here yet. If you {join}, you can be the first person on the ranking table.",
    review: READ,
  },
  "xp.board.emptyMember": {
    text: "まだ誰も、ここで経験値を獲得していません。{play}と、最初の一人として順位表に載れます。勝っても負けても、最後まで終えれば経験値になります。",
    back: "Nobody has earned experience here yet. If you {play}, you can be the first person on the ranking table. Whether you win or lose, finishing a game gives experience.",
    review: READ,
  },
  "xp.levels.title": {
    text: "全レベル",
    back: "All levels",
    review: READ,
  },
  "xp.levels.titleCount": {
    text: "{levels}すべて",
    back: "All {levels}",
    review: READ,
  },
  "xp.levels.metaDescription": {
    text: "{site}の経験値のレベルを、「{first}」から「{last}」まですべて載せています。各レベルの名前、必要な経験値、名前の由来がわかります。",
    back: "Every level of {site}'s experience, from \"{first}\" to \"{last}\". You can see each level's name, the experience it needs and the reason for its name.",
    review: READ,
  },
  "xp.levels.intro": {
    text: "経験値は、ここにある2つの尺度の2つめで、レーティングとは別のものです。レーティングは対局の強さを表し、経験値は顔を出していろいろ試したことを表します。そのため、1画面で遊んだレーティング対象外の対局にも経験値が付き、負けた対局も最後まで終えれば経験値になります。どのレベルにも、下はゲームセンターから上は殿堂まで、ゲームにちなんだ名前があります。全{count}レベルで、いちばん上の「{top}」には経験値{xp}で届きます。",
    back: "Experience is the second of the two measures here, and it is a separate thing from the rating. The rating shows how strong your play is, and experience shows that you turned up and tried things. So an unrated game on one screen also gives experience, and a game you lost gives experience too once you finish it. Every level has a name taken from games, from the arcade at the bottom to the hall of fame at the top, and across {count} levels you reach \"{top}\" at {xp} experience.",
    review: READ,
  },
  "xp.levels.guest": {
    text: "誰でも最初は{level}から始まります。{join}。",
    back: "Everybody starts at {level}. {join}.",
    review: READ,
  },
  "xp.levels.joinLink": {
    text: "参加して、上がり始める",
    back: "Join and start moving up",
    review: READ,
  },
  "xp.levels.marked": {
    text: "印の付いたレベル（{marked}）は、立ち止まる価値のある節目です。どのレベルを押しても、名前の意味、必要な経験値、そこにいる対局者がわかるページが開きます。",
    back: "The marked levels ({marked}) are milestones worth stopping at. Press any level and a page opens showing what the name means, the experience it needs, and the players standing there.",
    review: READ,
  },
  "xp.levels.youAre": {
    text: "現在は{level}で、経験値は{xp}です。{rest}",
    back: "You are now at {level}, with {xp} experience. {rest}",
    review: READ,
  },
  "xp.levels.topOfLadder": {
    text: "いちばん上のレベルです。「{top}」より上はありません。",
    back: "That is the top level. There is nothing above \"{top}\".",
    review: READ,
  },
  "xp.levels.moreReaches": {
    text: "あと経験値{count}で「{next}」に届きます。",
    back: "With {count} more experience you reach \"{next}\".",
    review: READ,
  },
  "xp.levels.progress": {
    text: "レベル{level}の経験値：{span}のうち{into}",
    back: "Experience in level {level}: {into} of {span}",
    review: READ,
  },
  "xp.level.floor": {
    text: "レベル{level}",
    back: "Level {level}",
    review: READ,
  },
  "xp.level.label": {
    text: "レベル{level}、{name}",
    back: "Level {level}, {name}",
    review: READ,
  },
  "xp.level.none": {
    text: "そのレベルはありません",
    back: "No such level",
    review: READ,
  },
  "xp.level.pageTitle": {
    text: "レベル{level}・{name}",
    back: "Level {level} · {name}",
    review: READ,
  },
  "xp.level.either": {
    text: "前後のレベル",
    back: "The levels before and after",
    review: READ,
  },
  "xp.level.bottom": {
    text: "いちばん下のレベル",
    back: "The lowest level",
    review: READ,
  },
  "xp.level.top": {
    text: "いちばん上のレベル",
    back: "The highest level",
    review: READ,
  },
  "xp.level.crumb": {
    text: "レベル{level}",
    back: "Level {level}",
    review: READ,
  },
  "xp.level.toReachIt": {
    text: "到達に必要",
    back: "Needed to reach it",
    review: READ,
  },
  "xp.level.climbedFrom": {
    text: "レベル{from}からの上がり幅",
    back: "The rise from level {from}",
    review: READ,
  },
  "xp.level.aboveIt": {
    text: "その上",
    back: "Above it",
    review: READ,
  },
  "xp.level.nextRung": {
    text: "レベル{next}まで",
    back: "Up to level {next}",
    review: READ,
  },
  "xp.level.nothingAbove": {
    text: "なし（ここが最上位です）",
    back: "None (this is the top)",
    review: READ,
  },
  "xp.level.rangeOpen": {
    text: "このレベルにいる会員は、経験値{from}以上です。",
    back: "A member on this level has {from} experience or more.",
    review: READ,
  },
  "xp.level.rangeClosed": {
    text: "このレベルにいる会員は、経験値{from}以上{to}以下です。",
    back: "A member on this level has from {from} up to {to} experience.",
    review: READ,
  },
  "xp.level.where": {
    text: "全レベルは{ladder}、誰がどこにいるかは{leaderboard}、最近誰が昇級したかは{promotions}で見られます。",
    back: "All the levels are on {ladder}, who is where is on {leaderboard}, and who has recently moved up is on {promotions}.",
    review: READ,
  },
  "xp.level.whereLadder": {
    text: "100レベルの一覧",
    back: "the list of the hundred levels",
    review: READ,
  },
  "xp.level.whereBoard": {
    text: "順位表",
    back: "the ranking table",
    review: READ,
  },
  "xp.level.wherePromotions": {
    text: "最近の昇級",
    back: "recent promotions",
    review: READ,
  },
  "xp.level.players": {
    text: "このレベルにいる対局者",
    back: "Players at this level",
    review: READ,
  },
  "xp.level.whoLabel": {
    text: "このレベルに載せる対局者",
    back: "Which players this level lists",
    review: READ,
  },
  "xp.level.scopeLabel": {
    text: "このレベルが数える経験値の範囲",
    back: "How much experience this level counts",
    review: READ,
  },
  "xp.level.youAreOn": {
    text: "現在は{link}にいます",
    back: "You are now at {link}",
    review: READ,
  },
  "xp.level.youLink": {
    text: "レベル{level}（{name}）→",
    back: "level {level} ({name}) →",
    review: READ,
  },
  "xp.level.nobody": {
    text: "レベル{level}にいる対局者はまだいません。",
    back: "Nobody is on level {level} yet.",
    review: READ,
  },
  "xp.level.nobodyNarrowed": {
    text: "{who}には、レベル{level}にいる対局者がまだいません。",
    back: "Among {who}, nobody is on level {level} yet.",
    review: READ,
  },
  "xp.level.more": {
    text: "上位{count}人まで、経験値の高い順に表示しています。全員の順位は{leaderboard}で見られます。",
    back: "Showing up to the first {count} people, highest experience first. Everybody's ranking can be seen on {leaderboard}.",
    review: READ,
  },
  "xp.level.inviteGuest": {
    text: "{join}と、最初にここへ立つ一人になれます。",
    back: "If you {join}, you can be the first person to stand here.",
    review: READ,
  },
  "xp.level.inviteMember": {
    text: "{play}と、最初にここへ立つ一人になれます。",
    back: "If you {play}, you can be the first person to stand here.",
    review: READ,
  },
  "xp.promotions.title": {
    text: "最近の昇級",
    back: "Recent level-ups",
    review: READ,
  },
  "xp.promotions.metaDescription": {
    text: "{site}で最近レベルが上がった人を、新しい順に並べています。どのレベルからどのレベルへ、いつ上がったかがわかります。",
    back: "People who recently went up a level on {site}, newest first. You can see from which level to which, and when.",
    review: READ,
  },
  "xp.promotions.intro": {
    text: "最近レベルが上がった人を、新しい順に並べています。レベルは合計から決まるので、昇級とは、ある加算によって誰かが次のレベルへ上がった瞬間のことです。1回の加算で複数のレベルを上がった場合は、元のレベルから着いたレベルまでを1行にまとめています。経験値の仕組みができる前に終えた対局は、2026年9月13日の一括計算で加算されました。そこから生じた昇級は、その一括計算の日付で表示し、どの日の対局分かも添えています。他のサイトの記録も加算されます。「他のサイトも含める」にチェックを入れると数え、その加算で上がった昇級は、加算した日付で表示し、対局した場所も添えます。外すと除かれます。",
    back: "Shows people who recently went up a level, newest first. The level is decided by the total, so a promotion is the moment an award takes somebody up to the next level. If one award took them up several levels, it is a single line from the level they were on to the level they arrived at. Games finished before the experience system existed were credited by a bulk calculation on 13 September 2026. A promotion that came from that is shown with the date of the bulk calculation, together with which day's play it was for. Records from other sites are credited too. Tick \"Include other sites\" to count them, and a promotion paid by that credit is shown with the date it was credited and the place where it was played. Untick it to leave them out.",
    review: READ,
  },
  "xp.promotions.whoLabel": {
    text: "一覧に載せる対局者",
    back: "Which players the list shows",
    review: READ,
  },
  "xp.promotions.scopeLabel": {
    text: "一覧が数える経験値の範囲",
    back: "How much experience the list counts",
    review: READ,
  },
  "xp.promotions.emptyNarrowed": {
    text: "{who}には、レベルが上がった対局者がまだいません。",
    back: "Among {who}, no player has gone up a level yet.",
    review: READ,
  },
  "xp.promotions.emptyGuest": {
    text: "まだ誰もレベルが上がっていません。{join}と、最初の一人になれます。",
    back: "Nobody has gone up a level yet. If you {join}, you can be the first.",
    review: READ,
  },
  "xp.promotions.emptyMember": {
    text: "まだ誰もレベルが上がっていません。{play}と、最初の一人になれます。勝っても負けても、最後まで終えれば経験値になります。",
    back: "Nobody has gone up a level yet. If you {play}, you can be the first. Whether you win or lose, finishing a game gives experience.",
    review: READ,
  },
  "xp.promotions.older": {
    text: "さらに古い昇級を表示",
    back: "Show older level-ups",
    review: READ,
  },
  "points.title": {
    text: "IP（{site}ポイント）",
    back: "IP ({site} Points)",
    review: READ,
  },
  "points.lead": {
    text: "どのゲームでもパズルでも、結果だけで獲得します。経験値は参加するともらえるもの、IPは勝つともらえるものです。",
    back: "Won by results alone, in every game and every puzzle. Experience is what you get for taking part; IP is what you get for winning.",
    review: READ,
  },
  "points.everyGame": {
    text: "すべてのゲーム",
    back: "every game",
    review: READ,
  },
  "points.vs.title": {
    text: "経験値とIP",
    back: "Experience and IP",
    review: READ,
  },
  "points.vs.xpHead": {
    text: "経験値",
    back: "Experience",
    review: READ,
  },
  "points.vs.ipHead": {
    text: "IP（{site}ポイント）",
    back: "IP ({site} Points)",
    review: READ,
  },
  "points.vs.means": {
    text: "意味",
    back: "Meaning",
    review: READ,
  },
  "points.vs.meansXp": {
    text: "サイトにどれだけ長く、どれだけ幅広く関わってきたか",
    back: "How long and how widely you have been involved with the site",
    review: READ,
  },
  "points.vs.meansIp": {
    text: "対局がどれだけ強いか",
    back: "How strong your play is",
    review: READ,
  },
  "points.vs.earned": {
    text: "獲得のしかた",
    back: "How it is earned",
    review: READ,
  },
  "points.vs.earnedXp": {
    text: "すべて：終えた対局、初めて試したゲーム、連続記録、仲間、拍手",
    back: "Everything: games finished, new games tried, streaks, buddies, applause",
    review: READ,
  },
  "points.vs.earnedIp": {
    text: "結果：勝ち、引き分け、惜しい負け、解いたすべてのパズル",
    back: "Results: wins, draws, close losses and every puzzle solved",
    review: READ,
  },
  "points.vs.loss": {
    text: "負けたとき",
    back: "When you lose",
    review: READ,
  },
  "points.vs.lossXp": {
    text: "それでも獲得できます。参加したからです",
    back: "You still earn it, because you took part",
    review: READ,
  },
  "points.vs.lossIp": {
    text: "何も獲得できません。ただし、惜しい負けは別です",
    back: "You earn nothing, except for a close loss",
    review: READ,
  },
  "points.vs.shows": {
    text: "表示される場所",
    back: "Where it appears",
    review: READ,
  },
  "points.vs.showsXp": {
    text: "名前の横の、レベルと称号",
    back: "The level and title beside your name",
    review: READ,
  },
  "points.vs.showsIp": {
    text: "各ゲームの順位表、各系統の順位表、そしてこのページでの順位",
    back: "Your place on each game's ranking table, each family's, and on this page",
    review: READ,
  },
  "points.pays.title": {
    text: "ゲームの配点",
    back: "What a game pays",
    review: READ,
  },
  "points.pays.intro": {
    text: "どのゲームにも、下に示す最高点があり、{most}を超えるものはありません。結果に応じて、その何割かを獲得します。",
    back: "Every game has a highest score, shown below, and none is more than {most}. Depending on the result you earn a share of it.",
    review: READ,
  },
  "points.pays.result": {
    text: "結果",
    back: "Result",
    review: READ,
  },
  "points.pays.winner": {
    text: "勝者",
    back: "Winner",
    review: READ,
  },
  "points.pays.loser": {
    text: "敗者",
    back: "Loser",
    review: READ,
  },
  "points.pays.won": {
    text: "盤上で勝ち",
    back: "Won on the board",
    review: READ,
  },
  "points.pays.wonLoser": {
    text: "最大{share}。点差が小さいほど多くなります",
    back: "up to {share}; the smaller the score gap, the more",
    review: READ,
  },
  "points.pays.resignedFrom": {
    text: "相手が{move}手目以降に投了",
    back: "The other side resigned from move {move} on",
    review: READ,
  },
  "points.pays.resignedBefore": {
    text: "相手が{move}手目より前に投了",
    back: "The other side resigned before move {move}",
    review: READ,
  },
  "points.pays.time": {
    text: "時間切れで勝ち",
    back: "Won on time",
    review: READ,
  },
  "points.pays.drawn": {
    text: "引き分け",
    back: "Drawn",
    review: READ,
  },
  "points.pays.upset": {
    text: "強い相手に勝つと、勝ちの最大{most}を獲得できます。はるかに弱い相手に勝つと、最小で{least}です。どちらも対局前の2人のレーティングで決まります。",
    back: "Beating a stronger opponent earns up to {most} of the win. Beating a much weaker one earns as little as {least}. Both are decided by the two players' ratings before the game.",
    review: READ,
  },
  "points.pays.favoured": {
    text: "勝者に有利なハンデや先行がある場合、勝ちの{share}になります。",
    back: "If a handicap or a head start favours the winner, it pays {share} of the win.",
    review: READ,
  },
  "points.pays.again": {
    text: "同じ2人が同じ日にもう一度対局した場合、2局目は{second}、それ以降はすべて{later}になります。",
    back: "If the same two players play again the same day, the second game pays {second}, and every one after that pays {later}.",
    review: READ,
  },
  "points.pays.rounded": {
    text: "どの結果も{step}単位に丸められ、番狂わせがどれだけ大きくても、{most}を超えることはありません。",
    back: "Every result is rounded to the nearest {step}, and no result pays more than {most}, however big the upset.",
    review: READ,
  },
  "points.pays.oneScreen": {
    text: "1画面での対局や練習盤での対局は、何も獲得できません。誰が対局したか確かめられないからです。",
    back: "A game on one screen, or on the practice board, earns nothing, because nobody can confirm who played it.",
    review: READ,
  },
  "points.max.title": {
    text: "各ゲームの最高点",
    back: "The highest score of each game",
    review: READ,
  },
  "points.max.game": {
    text: "ゲーム",
    back: "Game",
    review: READ,
  },
  "points.max.most": {
    text: "最高点（盤の大きさ別）",
    back: "Highest score (by board size)",
    review: READ,
  },
  "points.puzzle.title": {
    text: "パズルの配点",
    back: "What a puzzle pays",
    review: READ,
  },
  "points.puzzle.intro": {
    text: "どのパズルも1つの尺度で値付けされ、いちばん小さくやさしいものが{least}、いちばん大きく難しいものが{most}です。盤が大きいほど、レベルが難しいほど多くなり、値段はどの対局者でも同じです。迷宮、水道、繋ぎには各サイズに256レベルがあり（迷宮の特大2サイズは各128、水道の巨大3サイズは各64）、やさしい順に並んでいて、後のレベルほど多くなり、最大で{top}です。",
    back: "Every puzzle is priced on one scale: the smallest and easiest is {least}, and the biggest and hardest is {most}. A bigger board or a harder level pays more, and the price is the same for every player. Meikyuu, Suido and Tsunagi have 256 levels in each size (128 each in Meikyuu's two extra-large sizes, 64 each in Suido's three huge sizes), ordered from easiest, and the later the level the more it pays, up to {top}.",
    review: READ,
  },
  "points.puzzle.hints": {
    text: "チェックやヒントを使うたびに、そのパズル自身の得点から引かれた分に応じて、値段が下がります。",
    back: "Each time you use a Check or a Hint, the price goes down in proportion to the points taken off the puzzle's own score.",
    review: READ,
  },
  "points.puzzle.words": {
    text: "言葉のパズル、組文字、格子は、値段の半分を最後まで終えたことに、残りの半分を出来ばえに対して支払います。推測の回数が尽きた言葉は、見つけた分だけが支払われます。",
    back: "A word puzzle, Kumimoji and Koushi pay half the price for finishing and half for how well it went. A word whose guesses ran out pays only for what was found.",
    review: READ,
  },
  "points.puzzle.best": {
    text: "各パズルで最もよい解き方が、1回だけ数えられます。",
    back: "Your best solve of each puzzle is counted once.",
    review: READ,
  },
  "points.puzzle.puzzle": {
    text: "パズル",
    back: "Puzzle",
    review: READ,
  },
  "points.puzzle.pays": {
    text: "配点（小さいものから大きいものまで）",
    back: "Points paid (from smallest to biggest)",
    review: READ,
  },
  "points.puzzle.range": {
    text: "{least}から{most}",
    back: "{least} to {most}",
    review: READ,
  },
  "points.board.title": {
    text: "IP順位表",
    back: "IP ranking table",
    review: READ,
  },
  "points.board.shut": {
    text: "{title}で誰がいちばん勝っているかを見るには、招待が必要です。このサイトの対局に関わる部分だからです。",
    back: "To see who has won the most at {title}, you need an invitation. It is because this is the part of the site connected with playing.",
    review: READ,
  },
  "points.board.haveInvite": {
    text: "招待を持っています →",
    back: "I have an invitation →",
    review: READ,
  },
  "points.board.noInvite": {
    text: "招待がない場合は依頼する",
    back: "No invitation? Ask for one",
    review: READ,
  },
  "points.board.allTime": {
    text: "通算",
    back: "All time",
    review: READ,
  },
  "points.board.thisMonth": {
    text: "今月",
    back: "This month",
    review: READ,
  },
  "points.board.thisWeek": {
    text: "今週",
    back: "This week",
    review: READ,
  },
  "points.board.explain": {
    text: "IP（{site}ポイント）は結果だけで獲得します。勝つとそのゲームの最高点、引き分けは半分、惜しい負けは少しです。強い相手に勝つと多くなります。経験値は参加することでもらえます。",
    back: "IP ({site} Points) is won by results alone. A win pays the most the game is worth, a draw half, and a close loss a little. Beating a stronger opponent pays more. Experience is what you get for taking part.",
    review: READ,
  },
  "points.board.siteLink": {
    text: "すべてのゲームの合計と、それぞれの配点 →",
    back: "All the games together, and how each is priced →",
    review: READ,
  },
  "points.board.player": {
    text: "対局者",
    back: "Player",
    review: READ,
  },
  "points.board.xpTitle": {
    text: "経験値：この会員が{site}で獲得した分",
    back: "Experience: what this member has earned on {site}",
    review: READ,
  },
  "points.board.empty": {
    text: "まだ誰も載っていません。",
    back: "Nobody is on it yet.",
    review: READ,
  },
  "points.board.beFirst": {
    text: "最初の一人になる →",
    back: "Be the first →",
    review: READ,
  },
  "points.board.aMember": {
    text: "会員",
    back: "A member",
    review: READ,
  },
  "points.figure.several": {
    text: "複数のゲームとパズルをまたいで獲得した分です。各ゲームの順位表から、そのゲームの対局へ進めます。",
    back: "Won across several games and puzzles. From each game's own ranking table you can go to that game's games.",
    review: READ,
  },
  "points.figure.games": {
    text: "このIPを獲得した対局",
    back: "The games this IP was won in",
    review: READ,
  },
  "points.player.none": {
    text: "まだ獲得していません。IPは結果に対して付きます →",
    back: "None won yet. IP is given for results →",
    review: READ,
  },
  "points.player.allTime": {
    text: "通算",
    back: "all time",
    review: READ,
  },
  "points.player.thisMonth": {
    text: "今月",
    back: "this month",
    review: READ,
  },
  "points.player.thisWeek": {
    text: "今週",
    back: "this week",
    review: READ,
  },
  "xp.imported.twinLabel": {
    text: "{label}（他のサイト）",
    back: "{label} (another site)",
    review: READ,
  },
  "xp.imported.twinBlurb": {
    text: "他のサイトに残された記録から数えた「{label}」です。ここではなく、そのサイトでの分です。",
    back: "Counted from a record kept on another site: \"{label}\". It is the one there, not here.",
    review: READ,
  },
};
