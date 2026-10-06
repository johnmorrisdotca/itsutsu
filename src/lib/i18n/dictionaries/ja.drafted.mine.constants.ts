import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the mine.* phrases (ENJA-10). Joined into `JA_DRAFTED`.
 * 合言葉 is the one word for the four words a member sets, and for the three the site gives (John, 2026-10-06). The computer players are コンピュータ.
 * Every row has been read by the reviewer agent (`review`): the standards are `japanese-reviewer.md`, the terms `TERMS.md`.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_MINE: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // My games: the page, its tabs and its groups
  "mine.play": r(
    "遊ぶ",
    "Play",
  ),
  "mine.myTitle": r(
    "自分の対局",
    "My games",
  ),
  "mine.viewGoing": r(
    "進行中",
    "In progress",
  ),
  "mine.viewCompleted": r(
    "終了",
    "Finished",
  ),
  "mine.viewPass": r(
    "1台で交代",
    "Take turns on one device",
  ),
  "mine.viewHistory": r(
    "履歴",
    "History",
  ),
  "mine.emptyYourMove": r(
    "自分の手番を待つ対局はありません。",
    "There is no game waiting for my move.",
  ),
  "mine.emptyTheirMove": r(
    "相手の手番を待つ対局はありません。",
    "There is no game waiting for the opponent's move.",
  ),
  "mine.emptyCompleted": r(
    "終わった対局はまだありません。",
    "There are no finished games yet.",
  ),
  "mine.emptyPass": r(
    "この画面での対局はありません。どのゲームのページでも、練習盤から始められます。",
    "There are no games on this screen. From any game's page you can start one with the practice board.",
  ),
  "mine.emptyPuzzles": r(
    "解きかけのパズルはありません。",
    "There are no puzzles in progress.",
  ),
  "mine.groupOffered": r(
    "申し込まれた対局",
    "Games proposed to me",
  ),
  "mine.groupOfferedHint": r(
    "誰かから対局を申し込まれています。受けるか断るかを選べます。断っても何も失いません。",
    "Someone has proposed a game to me. I can accept or decline, and declining costs me nothing.",
  ),
  "mine.groupYourMove": r(
    "自分の手番",
    "My move",
  ),
  "mine.groupYourMoveHint": r(
    "自分の着手を待っています。",
    "Waiting for my move.",
  ),
  "mine.groupTheirMove": r(
    "相手の手番",
    "Their move",
  ),
  "mine.groupTheirMoveHint": r(
    "相手の着手を待っています。",
    "Waiting for their move.",
  ),
  "mine.groupOfferSent": r(
    "自分が申し込んだ対局",
    "Games I proposed",
  ),
  "mine.groupOfferSentHint": r(
    "自分が誰かに申し込んだ対局です。相手が受けるまで始まらず、いつでも取り下げられます。",
    "Games I have proposed to someone. Nothing starts until they accept, and I can withdraw one at any time.",
  ),
  "mine.groupUnstarted": r(
    "未着手",
    "Not started",
  ),
  "mine.groupUnstartedHint": r(
    "まだ石が置かれていない盤です。もう一方の席を渡すか、誰でも座れるよう募集するか、先に打ってもかまいません。",
    "Boards with no stones placed yet. I can hand over the other seat, post it for anyone to take, or play first.",
  ),
  "mine.groupHotSeat": r(
    "1台で交代",
    "Take turns on one device",
  ),
  "mine.groupHotSeatHint": r(
    "2人がこの画面で交代しながら打ちます。レーティングには数えません。",
    "Two people take turns on this screen. It is never rated.",
  ),
  "mine.groupFinished": r(
    "終了",
    "Finished",
  ),
  "mine.groupFinishedHint": r(
    "終えたものを新しい順に並べています。対局、テーブル、1台で交代して遊んだ対局、パズルが含まれます。",
    "Everything I have finished, newest first. It includes games, tables, games played by taking turns on one screen, and puzzles.",
  ),
  "mine.favLabel": r(
    "星付き",
    "Starred",
  ),
  "mine.favHint": r(
    "星を付けた対局です。どんなに古くても、ここの先頭に並びます。",
    "Games I starred. They stay at the front here however old they are.",
  ),
  "mine.favEmpty": r(
    "星付きの対局はまだありません。終わった対局の☆を押すと、ここに残せます。",
    "No game is starred yet. If I press ☆ on a finished game, it stays here.",
  ),

  // An offer, and what can be done with it
  "mine.offerWaiting": r(
    "返事を待っています。",
    "Waiting for my answer.",
  ),
  "mine.offerSent": r(
    "{who}に申し込みました。受けてもらうまで始まりません。",
    "I proposed it to {who}. Nothing starts until they accept.",
  ),
  "mine.offerDeclined": r(
    "{who}が断りました。対局は行われず、レーティングも動いていません。",
    "{who} declined. No game was played and no rating moved.",
  ),
  "mine.offerWithdrawn": r(
    "この申し込みは取り下げました。",
    "I withdrew this proposal.",
  ),
  "mine.accept": r(
    "受ける",
    "Accept",
  ),
  "mine.decline": r(
    "断る",
    "Decline",
  ),
  "mine.withdraw": r(
    "取り下げる",
    "Withdraw",
  ),
  "mine.declineFailed": r(
    "この対局を断れませんでした。",
    "I could not decline that game.",
  ),
  "mine.acceptFailed": r(
    "この対局を受けられませんでした。",
    "I could not accept that game.",
  ),
  "mine.withdrawFailed": r(
    "この申し込みを取り下げられませんでした。",
    "I could not withdraw that proposal.",
  ),
  "mine.stale": r(
    "動きなし",
    "No movement",
  ),
  "mine.staleHint": r(
    "{days}日を超えて着手がありません。投了するか、着手してください。",
    "No move for more than {days} days. Resign it, or make a move.",
  ),
  "mine.rowYourMove": r(
    "自分の手番 →",
    "My move →",
  ),
  "mine.rowOpen": r(
    "開く →",
    "Open →",
  ),
  "mine.rowMoreTitle": r(
    "投了など、この対局でできる操作",
    "Resigning, and anything else that can be done in this game",
  ),
  "mine.rowMore": r(
    "{players}のその他の操作",
    "More actions for {players}",
  ),
  "mine.resign": r(
    "投了",
    "Resign",
  ),
  "mine.cancel": r(
    "取り消す",
    "Cancel",
  ),
  "mine.localGame": r(
    "続きから",
    "From where I left off",
  ),
  "mine.localParty": r(
    "1台で交代",
    "Take turns on one device",
  ),

  // Everything you have played
  "mine.historyLabel": r(
    "自分のすべての対局",
    "All my games",
  ),
  "mine.historyHint": r(
    "ここで遊んだものをすべて、新しい順に並べています。人やコンピュータとの対局、1台で交代して遊んだカードやパーティーゲーム、複数の端末のテーブル、パズルが含まれます。開くと続きを遊んだり、経過を振り返ったりできます。",
    "Everything I have played here, of every kind, newest first. It includes games against people and computers, card and party games played by taking turns on one screen, tables on several devices, and puzzles. If I open one, I can carry on with it or look back at how it went.",
  ),
  "mine.historyEmpty": r(
    "まだ何も遊んでいません。",
    "I have not played anything yet.",
  ),
  "mine.historyFirst": r(
    "始める",
    "Start one",
  ),
  "mine.stateYourMove": r(
    "自分の手番",
    "My move",
  ),
  "mine.stateTheirMove": r(
    "相手の手番",
    "Their move",
  ),
  "mine.stateGoing": r(
    "進行中",
    "In progress",
  ),
  "mine.stateWon": r(
    "勝ち",
    "Won",
  ),
  "mine.stateLost": r(
    "負け",
    "Lost",
  ),
  "mine.stateDrawn": r(
    "引き分け",
    "Drawn",
  ),
  "mine.stateShared": r(
    "勝利を分け合い",
    "Shared the win",
  ),
  "mine.stateEnded": r(
    "終了",
    "Ended",
  ),
  "mine.stateLeft": r(
    "途中でやめた",
    "Left partway",
  ),
  "mine.stateSolved": r(
    "解いた",
    "Solved",
  ),
  "mine.stateUnsolved": r(
    "未解決",
    "Not solved",
  ),
  "mine.openGoing": r(
    "続ける",
    "Carry on",
  ),
  "mine.openOver": r(
    "振り返る",
    "Look back",
  ),
  "mine.alone": r(
    "1台で",
    "On one device",
  ),
  "mine.computer": r(
    "コンピュータ",
    "Computer",
  ),
  "mine.guest": r(
    "対局者{seat}",
    "Player {seat}",
  ),
  "mine.older": r(
    "過去の対局",
    "Older games",
  ),
  "mine.newest": r(
    "新しい順",
    "Newest first",
  ),
  "mine.theirsHint": r(
    "ここで遊んだものをすべて、新しい順に並べています。開くと、観戦したり、経過を振り返ったりできます。",
    "Everything they have played here, of every kind, newest first. If I open one, I can watch it or look back at how it went.",
  ),
  "mine.theirsWaiting": r(
    "ほかの人を待っています",
    "Waiting for someone else",
  ),
  "mine.theirsWatch": r(
    "観戦",
    "Watch",
  ),
  "mine.puzzlesGoing": r(
    "解きかけのパズル",
    "Puzzles in progress",
  ),
  "mine.puzzlesGoingHint": r(
    "途中でやめたものは、やめた場所のまま残ります。自分を待っているレースもここに並びます。開くと続けられます。",
    "Puzzles left partway stay where I left them, and races waiting for me are also listed here. If I open one, I can carry on.",
  ),
  "mine.raceOpen": r(
    "レースを開く",
    "Open the race",
  ),
  "mine.filterFamily": r(
    "系統",
    "Family",
  ),
  "mine.filterGame": r(
    "ゲーム",
    "Game",
  ),
  "mine.filterEvery": r(
    "すべて",
    "All",
  ),
  "mine.filterShowing": r(
    "絞り込み中：",
    "Filtered by:",
  ),
  "mine.filterEverything": r(
    "すべて",
    "everything",
  ),
  "mine.filterTakeOff": r(
    "{what}以外も表示",
    "Show more than {what}",
  ),

  // Open games: seats posted for anyone
  "mine.openLabel": r(
    "対局募集",
    "Open games",
  ),
  "mine.openHint": r(
    "誰でも座れるよう、誰かが募集した対局です。座れば自分の対局になります。",
    "Games that someone has posted for anyone to take. If I sit down, it becomes my game.",
  ),
  "mine.openRules": r(
    "規則",
    "Rules",
  ),
  "mine.openSit": r(
    "席に着く",
    "Take the seat",
  ),
  "mine.openYouPlay": r(
    "{colour}を持つことになります",
    "I would play {colour}",
  ),
  "mine.openNobody": r(
    "いま対局を待っている人はいません。",
    "No one is waiting for a game right now.",
  ),
  "mine.openPost": r(
    "{link}と、次に来た人を待ってここに残ります。",
    "If I {link}, it waits here for whoever comes in next.",
  ),
  "mine.openPostLink": r(
    "最初の席を募集する",
    "post the first seat",
  ),
  "mine.sitWhite": r(
    "白で着席",
    "Sit as White",
  ),
  "mine.sitTaken": r(
    "その席は、いま別の人が座りました。",
    "Someone else has just taken that seat.",
  ),
  "mine.continue": r(
    "続ける",
    "Continue",
  ),
  "mine.yourTurn.one": r(
    "自分の手番の対局が{count}局",
    "{count} games waiting for my move",
  ),
  "mine.yourTurn.other": r(
    "自分の手番の対局が{count}局",
    "{count} games waiting for my move",
  ),
  "mine.waitingOffers.one": r(
    "返事待ちの申し込みが{count}件",
    "{count} proposals awaiting my reply",
  ),
  "mine.waitingOffers.other": r(
    "返事待ちの申し込みが{count}件",
    "{count} proposals awaiting my reply",
  ),
  "mine.showing": r(
    "・{shown}件を表示中",
    "· showing {shown}",
  ),
  "mine.showAll": r(
    "{total}件すべてを表示",
    "Show all {total}",
  ),
  "mine.showOlder": r(
    "過去に終わった対局",
    "Older finished games",
  ),
  "mine.showFewer": r(
    "表示を減らす",
    "Show fewer",
  ),
  "mine.seatedLabel": r(
    "進行中で、自分が席に着いている対局",
    "Still being played, with me in a seat",
  ),
  "mine.seatedHint": r(
    "同時に打てる対局数の上限に数えられる対局だけに絞っています。申し込まれた対局、アカウントなしでこのブラウザに残っている対局、終了した対局は含みません。",
    "Narrowed to the games counted by the limit on games at once. Games proposed to me, games held in this browser without my account, and finished games are left out.",
  ),
  "mine.seeRecord": r(
    "自分の戦績を見る",
    "See my record",
  ),

  // Filtering the open seats
  "mine.paceLabel": r(
    "ペース",
    "Pace",
  ),
  "mine.ratingLabel": r(
    "相手のレーティング",
    "Their rating",
  ),
  "mine.penaltyLabel": r(
    "期限を過ぎたとき",
    "If a deadline is missed",
  ),
  "mine.anyPace": r(
    "どのペースでも",
    "Any pace",
  ),
  "mine.anyRating": r(
    "どのレーティングでも",
    "Any rating",
  ),
  "mine.anyPenalty": r(
    "どの扱いでも",
    "Any treatment",
  ),
  "mine.ratingUnder": r(
    "{split}未満",
    "Under {split}",
  ),
  "mine.ratingOver": r(
    "{split}以上",
    "{split} and up",
  ),
  "mine.unrated": r(
    "未定",
    "Undecided",
  ),
  "mine.unratedHint": r(
    "レーティング対局が4局に満たない状態です（どちらの枠でも）。",
    "Fewer than four rated games (in either pool).",
  ),
  "mine.clearSeats": r(
    "すべての募集席を表示",
    "Show every open seat",
  ),
  "mine.emptySeats": r(
    "そのペース・レーティング・扱いで待っている人は、いません。",
    "No one is waiting at that pace, rating or treatment right now.",
  ),

  // Who is here, and a game somebody is asking for
  "mine.hereLabel": r(
    "オンライン中",
    "Online now",
  ),
  "mine.hereMore": r(
    "ほか{count}人（最近見かけた人）",
    "and {count} more people (seen recently)",
  ),
  "mine.hereFewer": r(
    "表示を減らす",
    "show fewer",
  ),
  "mine.hereNobody": r(
    "いまは、ほかに誰もいません。上で募集した席は、次に来た人を待ちます。",
    "No one else is here right now. A seat posted above waits for whoever comes next.",
  ),
  "mine.matchHint": r(
    "{who}がまったく同じ対局を求めています。いますぐ一緒に席に着き、先後は無作為に決まります。",
    "{who} is asking for exactly this game. We sit down together right now, and the sides are decided at random.",
  ),

  // Saving, and what a failed save says
  "mine.saved": r(
    "保存しました。",
    "Saved.",
  ),
  "mine.saveFailed": r(
    "保存できませんでした。",
    "It could not be saved.",
  ),

  // Game defaults: where a new game starts
  "mine.gdBoard": r(
    "盤",
    "Board",
  ),
  "mine.gdBoardNote": r(
    "専用の盤を持つゲーム（ヘックス、ハルマ、小さなゲームなど）は、それぞれの盤のままです。",
    "Games played on boards of their own (Hex, Halma, the small ones and so on) keep their own boards.",
  ),
  "mine.gdClockOne": r(
    "1台で打つ対局の時計",
    "Clock for games on one device",
  ),
  "mine.gdClockTwo": r(
    "2台で打つ対局の時計",
    "Clock for games on two devices",
  ),
  "mine.gdNoClock": r(
    "時計なし",
    "No clock",
  ),
  "mine.gdLength": r(
    "長さ",
    "Length",
  ),
  "mine.gdLengthNote": r(
    "9×9以上の盤だけで、引き分けにならないゲームには適用されません。",
    "Only on boards of 9 by 9 or larger, and never on a game that cannot end in a draw.",
  ),
  "mine.gdRated": r(
    "2台で打つ対局をレーティングに数える",
    "Count games on two devices toward ratings",
  ),
  "mine.gdRatedHint": r(
    "オフにすると、始めた共有の対局は親善対局になります。結果は残りますが、レーティングは動きません。",
    "If off, a shared game I start is a friendly game. The result is kept, but no rating moves.",
  ),
  "mine.gdUndo": r(
    "待ったを許可する",
    "Allow taking moves back",
  ),
  "mine.gdUndoHint": r(
    "すべての石を確定とする対局では、オフにします。",
    "Switch it off for a game where every stone is final.",
  ),
  "mine.gdSkip": r(
    "手番の見送りを許可する",
    "Allow skipping a turn",
  ),
  "mine.gdSwap": r(
    "先後の入れ替えを許可する",
    "Allow swapping sides",
  ),
  "mine.gdResize": r(
    "盤の大きさの変更を許可する",
    "Allow changing the size of the board",
  ),
  "mine.gdSave": r(
    "この内容を保存",
    "Save these",
  ),
  "mine.gdReset": r(
    "初期値に戻す",
    "Reset to the initial values",
  ),
  "mine.gdNote": r(
    "ここで決めるのは、新しい対局の出発点だけです。すでに始まっている対局は、両方の対局者が同意した、始めたときの設定のままで、ここを変えても影響しません。",
    "These decide only where a new game starts. A game already under way keeps the settings it started with, which both players agreed to, and changing anything here does not affect it.",
  ),

  // Playing a move: confirming it, and where to go next
  "mine.tfMove": r(
    "着手のしかた",
    "How to play a move",
  ),
  "mine.tfPreview": r(
    "着手を表示し、「確定」を押して打つ",
    "Show me the move, then I press \"Submit\" to play it",
  ),
  "mine.tfStraight": r(
    "盤に触れたらすぐに打つ",
    "Play it as soon as I touch the board",
  ),
  "mine.tfMoveNote": r(
    "ここでの対局は数日かけて打ち、記録は確定します。そのため、一度打った手は戻せません。先に表示するのは、スマートフォンでの押し間違いが着手にならないようにするためです。",
    "Games here are played over days, and the record is final, so a move cannot be taken back. Showing the move first is what stops a mistaken tap on a smartphone from becoming a move.",
  ),
  "mine.tfBot": r(
    "コンピュータとの着手のしかた",
    "How to play a move against a computer",
  ),
  "mine.tfBotNote": r(
    "コンピュータは1秒で応えるため、対局はお好きな速さで進められます。同じ切り替えが、その対局の盤にもあります。",
    "A computer answers in a second, so a game against one can go as fast as I like. The same switch is on the board in those games.",
  ),
  "mine.tfAfter": r(
    "着手のあと",
    "After the move",
  ),
  "mine.tfNext": r(
    "自分の手番を待つ次の対局へ移る",
    "Go to the next game waiting for my move",
  ),
  "mine.tfSame": r(
    "同じ種類の次の対局へ移る",
    "Go to the next game of the same kind",
  ),
  "mine.tfMyGames": r(
    "対局一覧に戻る",
    "Go back to the list of games",
  ),
  "mine.tfStay": r(
    "この盤にとどまる",
    "Stay on this board",
  ),
  "mine.tfAfterNote": r(
    "自分を待つ対局を探し回る必要はないはずです。同じ種類を続けると、頭の中の規則が1つで済みます。",
    "I should never have to hunt for the game waiting for me. Staying with the same kind keeps just one set of rules in my head at a time.",
  ),

  // Profile
  "mine.profileChild": {
    ...r(
      "13歳未満のため、このサイトでは市区町村、国、自己紹介を一切保存しません。ここには、いる場所を示すものはありません。タイムゾーンは自分の時計を合わせるだけで、ほかの人には見えません。",
      "Because you are under 13, this site keeps no city, country or self-introduction at all. Nothing here says where you are. Your time zone only sets your own clock, and nobody else can see it.",
    ),
    ask: "Tells a member under 13 what the site does not keep about them: about children, so a native read is recommended.",
  },
  "mine.city": r(
    "市区町村",
    "City",
  ),
  "mine.optional": r(
    "任意",
    "optional",
  ),
  "mine.country": r(
    "国",
    "Country",
  ),
  "mine.noCountry": r(
    "答えない",
    "Prefer not to say",
  ),
  "mine.zone": r(
    "タイムゾーン",
    "Time zone",
  ),
  "mine.useDevice": r(
    "この端末のものを使う",
    "use this device's",
  ),
  "mine.about": r(
    "自己紹介",
    "Self-introduction",
  ),
  "mine.saveProfile": r(
    "プロフィールを保存",
    "Save profile",
  ),
  "mine.profileNote": r(
    "国は、サイトが対局者を一覧にする場所で、名前の横に国旗として表示されます。市区町村と現地時刻は、ご自身のページに表示されます。すべて任意で、メールアドレスは決して表示されません。",
    "Your country is shown as a flag beside your name wherever the site lists players. Your city and local time are shown on your own page. Everything is optional, and your email address is never shown.",
  ),
  "mine.nameLabel": r(
    "ここでの名前",
    "Your name here",
  ),
  "mine.nameSaveNext": r(
    "保存して続ける",
    "Save and continue",
  ),
  "mine.nameSave": r(
    "保存",
    "Save",
  ),
  "mine.nameHint": r(
    "ほかの対局者が一覧や対局者のページで目にする名前で、戦績もこの名前で残ります。2〜40文字で、ほかの会員と重なる名前は使えません。",
    "This is what other players see in their lists and on the players page, and your record is kept under it. It is 2 to 40 characters, and a name that another member has cannot be used.",
  ),
  "mine.nameFailed": r(
    "この名前を保存できませんでした。",
    "That name could not be saved.",
  ),
  "mine.awayTitle": r(
    "休暇",
    "Vacation",
  ),
  "mine.awayFrom": r(
    "休暇の開始日",
    "Start of the vacation",
  ),
  "mine.awayUntil": r(
    "休暇の終了日",
    "End of the vacation",
  ),
  "mine.awayTo": r(
    "から",
    "to",
  ),
  "mine.awayClear": r(
    "消す",
    "clear",
  ),
  "mine.awayNote": r(
    "休暇中は、休暇日を無視する設定の対局を除き、対局の期限が止まります。年に3日まで、日単位です。",
    "While I am away, the deadlines in my games wait, except in games set to ignore vacation days. Three days a year, in whole days.",
  ),
  "mine.daysOffTitle": r(
    "打たない曜日",
    "Days I do not play",
  ),
  "mine.daysOffNote": r(
    "休暇を尊重する対局では、毎週これらの曜日の期限が飛ばされ、休暇日は減りません。どこかの曜日には打つ必要があるため、休めるのは最大6日です。",
    "In games that honour vacation, the deadlines skip these days every week, and they do not use up vacation days. Someone has to play on some day, so six is the most I can take.",
  ),
  "mine.sendsChild": {
    ...r(
      "13歳未満のため、自分がオンラインかどうかは誰にも表示されず、サイトからメールが届くこともありません。",
      "Because you are under 13, nobody is shown when you are here, and the site never sends you an email.",
    ),
    ask: "Tells a member under 13 that the site sends them no email and shows nobody their presence: about children, so a native read is recommended.",
  },
  "mine.showOnline": r(
    "オンラインのときに表示する",
    "Show when I am online",
  ),
  "mine.showOnlineHint": r(
    "サイトにいる間、対局者のページに載ります。オフにすると、出入りは誰にも見えません。",
    "I am listed on the players page while I am on the site. If off, nobody sees me come and go.",
  ),
  "mine.keepFinished": r(
    "終わった対局を一覧に残す期間",
    "How long to keep finished games in my list",
  ),
  "mine.keepNote": r(
    "この設定にかかわらず、記録にはすべての対局が残り、それぞれ専用のアドレスに残ります。ここで決めるのは、自分の一覧に並べておく期間だけです。",
    "The record keeps every game whatever this says, and each stays at its own address. This only decides how long they sit in my list.",
  ),
  "mine.saveSettings": r(
    "設定を保存",
    "Save settings",
  ),
  "mine.mailAll": r(
    "{site}からのメール",
    "Email from {site}",
  ),
  "mine.mailAllHint": r(
    "オフにすると、下の項目の設定にかかわらず、サイトからメールは一切届きません。",
    "If off, the site never emails me, whatever the rows below say.",
  ),
  "mine.mailYourTurn": r(
    "自分の手番になったとき",
    "When it is my move",
  ),
  "mine.mailYourTurnHint": r(
    "サイトを開いている間は届きません。対局が待っていて、席を外しているときだけ届きます。",
    "Never while I am on the site. Only when a game is waiting and I am away.",
  ),
  "mine.mailGameOver": r(
    "自分の対局が終わったとき",
    "When a game of mine finishes",
  ),
  "mine.mailGameOverHint": r(
    "勝敗とその理由、かかった時間、もう一度遊ぶためのリンクをお知らせします。",
    "It tells me who won and why, how long it took, and gives a link to play again.",
  ),
  "mine.mailNotYet": r(
    "対局に関するメールはまだ有効になっていません。この選択は、有効になったときのために保存されます。",
    "Emails about games are not switched on yet. These choices are kept for when they are.",
  ),
  "mine.mailStop": r(
    "どのメールにも、サインインしなくても配信を止める方法が書かれています。",
    "Every email says how to stop receiving it without signing in.",
  ),
  "mine.welcomeMail": r(
    "どんな内容をメールでお知らせしましょうか。設定でいつでも変えられます。",
    "And what should we email you about? You can change it any time in Settings.",
  ),

  // Inviting a friend
  "mine.inviteTitle": r(
    "友達を招待",
    "Invite a friend",
  ),
  "mine.inviteLead": r(
    "1人が入れるリンクで、有効期間は1か月です。お好きな方法で送ってください。相手が入ったら、対局者のページで、その人の横の対局ボタンを押してください。",
    "A link that lets one person in, valid for one month. Send it any way you like. Once they are in, press the game button beside them on the players page.",
  ),
  "mine.inviteLeadEmail": r(
    "1人が入れるリンクで、有効期間は1か月です。お好きな方法で送るか、サイトからメールで送ることもできます。相手が入ったら、対局者のページで、その人の横の対局ボタンを押してください。",
    "A link that lets one person in, valid for one month. You can send it any way you like, or have the site email it. Once they are in, press the game button beside them on the players page.",
  ),
  "mine.inviteCreate": r(
    "招待リンクを作る",
    "Create an invitation link",
  ),
  "mine.inviteCopied": r(
    "コピーしました",
    "Copied",
  ),
  "mine.inviteCopy": r(
    "リンクをコピー",
    "Copy the link",
  ),
  "mine.inviteNew": r(
    "新しいリンク",
    "New link",
  ),
  "mine.inviteQr": r(
    "招待のQRコード",
    "QR code of the invitation",
  ),
  "mine.inviteEmailLabel": r(
    "相手のメールアドレス",
    "Their email address",
  ),
  "mine.inviteEmailPlaceholder": r(
    "相手のメールアドレス",
    "their email address",
  ),
  "mine.inviteEmail": r(
    "招待をメールで送る",
    "Send an invitation by email",
  ),
  "mine.inviteSent": r(
    "{address}に送りました。メールの招待は、1人が入れるもので、有効期間は1か月です。",
    "Sent to {address}. The invitation in it lets one person in and is valid for one month.",
  ),
  "mine.inviteNotSent": r(
    "{notice}下のリンクは使えます。ご自身で送ってください。",
    "{notice} The link below works, so please send it yourself.",
  ),
  "mine.inviteNotSentDefault": r(
    "メールは送られませんでした。",
    "The email was not sent.",
  ),
  "mine.inviteFailed": r(
    "招待を作れませんでした。",
    "The invitation could not be made.",
  ),

  // Where a day ends
  "mine.zoneKnown": r(
    "日付は{zone}で数えています。そのため、連続日数は自分の日々のとおりになります。",
    "Days are counted in {zone}, so a run of days follows my own days.",
  ),
  "mine.zoneGuessed": r(
    "日付は{zone}で数えています。これはお住まいの国からの推測で、ご自身で教えていただいたものではありません。1日の終わりが別の時刻になる場合は、{link}してください。それに合わせて数え直します。",
    "Days are counted in {zone}. This is a guess from your country, not something you told us. If your day ends at a different time, {link}. It will be counted again to match.",
  ),
  "mine.zoneGuessedLink": r(
    "いる場所を教える",
    "tell us where you are",
  ),
  "mine.zoneFloor": r(
    "日付は{zone}で数えています。まだタイムゾーンが分かっていないため、1日が午後の途中で終わることがあります。{link}と、連続日数が自分の日々になります。",
    "Days are counted in {zone}, because the time zone is not known yet, so a day may end in the middle of the afternoon. If you {link}, the run of days becomes your own.",
  ),
  "mine.zoneFloorLink": r(
    "タイムゾーンを設定する",
    "set your time zone",
  ),

  // Buddies and ignoring
  "mine.buddyOff": r(
    "仲間から外す",
    "Remove from my buddies",
  ),
  "mine.buddyOn": r(
    "仲間に追加",
    "Add to my buddies",
  ),
  "mine.buddyIs": r(
    "★ 仲間",
    "★ Buddy",
  ),
  "mine.buddyNot": r(
    "☆ 仲間",
    "☆ Buddy",
  ),
  "mine.ignoreOff": r(
    "無視をやめる",
    "Stop ignoring",
  ),
  "mine.ignoreOn": r(
    "無視：相手は対局を申し込めず、相手のメッセージは非表示になります",
    "Ignore: they cannot ask me to play, and their messages are hidden",
  ),
  "mine.ignored": r(
    "無視中",
    "Ignored",
  ),
  "mine.ignore": r(
    "無視する",
    "Ignore",
  ),
  "mine.recencyNow": r(
    "直近5分以内に見かけました",
    "Seen within the last 5 minutes",
  ),
  "mine.recencyRecent": r(
    "直近15分以内に見かけました",
    "Seen within the last 15 minutes",
  ),
  "mine.recencyToday": r(
    "直近30分以内に見かけました",
    "Seen within the last 30 minutes",
  ),
  "mine.legendNow": r(
    "5分",
    "5 min",
  ),
  "mine.legendRecent": r(
    "15分",
    "15 min",
  ),
  "mine.legendToday": r(
    "30分",
    "30 min",
  ),
  "mine.buddiesTitle": r(
    "仲間",
    "Buddies",
  ),
  "mine.buddiesEmpty": r(
    "まだ誰もいません。{link}のページで人に星を付けると、最近見かけた順にここに並びます。",
    "No one yet. If you put a star on people on the {link} page, they are listed here in order of most recently seen.",
  ),
  "mine.buddiesPlayers": r(
    "対局者",
    "players",
  ),
  "mine.ignoredTitle": r(
    "無視",
    "Ignored",
  ),
  "mine.ignoredNote": r(
    "相手は対局を申し込めず、対局中の相手のメッセージも、こちらには表示されません。",
    "They cannot ask you to play, and their messages in a game are not shown to you.",
  ),

  // Age, and a parent's consent
  "mine.ageWelcome": r(
    "参加できました。最初にひとつだけ質問です。サイトが適切にお世話をするための質問です。",
    "You have joined. First, just one question. It is so that the site can look after you appropriately.",
  ),
  "mine.ageQuestion": r(
    "年齢はいくつですか？",
    "How old are you?",
  ),
  "mine.ageConsentLead": {
    ...r(
      "13歳未満の方は、保護者の方に、このアカウントを作ってよいと確認してもらう必要があります。保護者の方でしたら、下にお名前を入力してください。今日の日付とともに保存し、サイトの運営者以外には表示しません。",
      "Someone under 13 needs a parent or guardian to confirm that this account is acceptable. If you are that person, please enter your name below. It is kept with today's date and is shown only to the people who run the site.",
    ),
    ask: "Asks a parent or guardian to consent for a child under 13: about children and consent, so a native read is recommended.",
  },
  "mine.ageConsentName": r(
    "お名前",
    "Your name",
  ),
  "mine.ageConsentRelationship": r(
    "お子さまとの関係",
    "Relationship to the child",
  ),
  "mine.ageAgree": {
    ...r(
      "私はこの子の保護者で、この子がここでアカウントを持つことに同意します",
      "I am this child's parent or guardian, and I agree to the child having an account here",
    ),
    ask: "The parent's agreement to the site's rules for a child's account: consent text, so a native read is recommended.",
  },
  "mine.ageSave": r(
    "保存",
    "Save",
  ),
  "mine.ageShown": r(
    "年齢：",
    "Age:",
  ),
  "mine.ageConsented": r(
    "同意を記録済み",
    "consent recorded",
  ),
  "mine.ageChange": r(
    "変更",
    "Change",
  ),
  "mine.ageUnsaid": r(
    "未回答",
    "Not answered yet",
  ),
  "mine.ageWhy": {
    ...r(
      "一度だけお聞きします。子どもを適切に見守り、大人を子ども扱いしないためです。年齢の区分より詳しいことは、聞きもしませんし、保存もしません。",
      "We ask just once, so that a child here is looked after and an adult is not treated like a child. Nothing more exact than the age band is asked or kept.",
    ),
    ask: "Explains why the site asks a member's age: about children, so a native read is recommended.",
  },
  "mine.ageUnderThirteen": r(
    "13歳未満",
    "Under 13",
  ),
  "mine.ageThirteenToSeventeen": r(
    "13〜17歳",
    "13 to 17",
  ),
  "mine.ageEighteenPlus": r(
    "18歳以上",
    "18 or over",
  ),
  "mine.parent": r(
    "親",
    "Parent",
  ),
  "mine.guardian": r(
    "保護者",
    "Guardian",
  ),
  "mine.problemNeedsParent": r(
    "13歳未満の方は、アカウントを続けるために、保護者の同意が必要です。",
    "Someone under 13 needs the consent of a parent or guardian before the account can continue.",
  ),
  "mine.problemNoName": r(
    "保護者の方のお名前が必要です。",
    "The name of a parent or guardian is needed.",
  ),
  "mine.problemRelationship": r(
    "親か保護者かを選んでください。",
    "Please choose whether you are the parent or a guardian.",
  ),
  "mine.problemAgree": r(
    "保護者の方の同意が必要です。",
    "The agreement of a parent or guardian is needed.",
  ),
  "mine.problemNotForBand": r(
    "同意を記録するのは、13歳未満の会員だけです。",
    "Consent is recorded only for members under 13.",
  ),
  "mine.problemConsentAlone": r(
    "同意は年齢の区分とセットで、区分が指定されていません。",
    "Consent goes together with an age band, and no age band was given.",
  ),
  "mine.childProfile": r(
    "13歳未満の会員は、ここに市区町村、国、自己紹介を保存しないため、いる場所を示すものはありません。",
    "A member under 13 keeps no city, country or self-introduction here, so nothing says where they are.",
  ),

  // Removing the account
  "mine.removeHeading": r(
    "アカウントを削除",
    "Delete this account",
  ),
  "mine.removeLead": {
    ...r(
      "この操作は取り消せません。プロフィール、メッセージ、仲間と無視の設定、経験値、パズルの解答履歴が消えます。自分を待っている対局は投了となり、まだ誰も打っていなければ中止になります。終わった対局は、相手の対局者のものでもあるため残り、アカウントの情報だけが外されます。",
      "This cannot be undone. Your profile, messages, buddy and ignore settings, experience points and puzzle solving history are deleted. Games still waiting for you are resigned, or called off if no one has moved yet. Finished games stay, because they also belong to the other player, and only your account is taken off them.",
    ),
    ask: "Says what removing an account does and cannot undo: account text, so a native read is recommended.",
  },
  "mine.removeOpen": r(
    "アカウントを削除…",
    "Delete this account…",
  ),
  "mine.removeKeepName": r(
    "過去の対局に自分の名前を残す",
    "Leave my name on my old games",
  ),
  "mine.removeBlankName": r(
    "過去の対局からも自分の名前を外す",
    "Take my name off my old games as well",
  ),
  "mine.removeBlankNote": {
    ...r(
      "名前を外すと、過去の対局は空席として表示され、すべての順位表での位置も消えます。",
      "With my name taken off, my old games show an empty seat, and my place on every ranking table is gone too.",
    ),
    ask: "Says what happens to the games of a removed account: account text, so a native read is recommended.",
  },
  "mine.removeType": r(
    "確認のため、{phrase}と入力してください",
    "To confirm, please type {phrase}",
  ),
  "mine.removeSignIn": r(
    "ご本人確認のため、Googleでもう一度サインインしてください",
    "To confirm it is you, please sign in with Google again",
  ),
  "mine.removeSignInNote": r(
    "Googleのアカウントは先にもう一度サインインするため、サインインしたまま置かれたスマートフォンから削除されることはありません。",
    "A Google account signs in again first, so it cannot be deleted from a smartphone left signed in.",
  ),
  "mine.removePress": r(
    "アカウントを削除する",
    "Delete my account",
  ),
  "mine.removeKeep": r(
    "アカウントを残す",
    "Keep my account",
  ),
  "mine.removeLegend": r(
    "過去の対局での自分の名前",
    "My name on my old games",
  ),
  "mine.removeFailed": r(
    "アカウントを削除できませんでした。",
    "Your account could not be deleted.",
  ),

  // Keeping an account that lives in one browser
  "mine.keepLives": r(
    "このアカウントは、このブラウザの中だけにあり、{days}日間だけ有効です。",
    "This account exists only in this browser, and only for {days} days.",
  ),
  "mine.keepUnlessGoogle": r(
    "その後や、ほかの端末からは、Googleを連携しない限り、このアカウントに戻れません。",
    "After that, or on any other device, you cannot get back into it unless you link Google.",
  ),
  "mine.keepNoGoogle": r(
    "その後や、ほかの端末からは、このアカウントに戻れません。",
    "After that, or on any other device, you cannot get back into it.",
  ),
  "mine.keepLinkGoogle": r(
    "Googleを連携",
    "Link Google",
  ),
  "mine.keepLinkGoogleNote": r(
    "どの端末からでも、好きなだけサインインでき、この名前、この対局、この経験値を残せます。そのGoogleアドレスにすでにここのアカウントがある場合は、そちらにサインインします。",
    "You can sign in on any device for as long as you like, and keep this name, these games and this experience. If your Google address already has an account here, you are signed in to that one instead.",
  ),
  "mine.keepAddWords": r(
    "合言葉を追加",
    "Add a 合言葉",
  ),
  "mine.keepAddWordsNote": r(
    "ほかの人がサインインしている端末でも、自分として遊べます。合言葉はブラウザをサインインさせるものではないため、合言葉だけでは、{days}日後にこのアカウントを取り戻せません。",
    "You can play as yourself on a device where someone else is signed in. A 合言葉 does not sign a browser in, so on its own it will not bring this account back after {days} days.",
  ),

  // The four words (合言葉)
  "mine.wLead": r(
    "ほかの人の端末でも、誰もサインアウトせずに、自分として遊べる4つの合言葉です。",
    "Four 合言葉 that let you play as yourself on someone else's device, without anyone signing out.",
  ),
  "mine.wUnset": r(
    "合言葉は、まだ設定されていません。",
    "No 合言葉 is set yet.",
  ),
  "mine.wSet": r(
    "合言葉が設定されています",
    "A 合言葉 is set",
  ),
  "mine.wSince": r(
    "（{date}から）",
    " (since {date})",
  ),
  "mine.wKept": r(
    "合言葉は、ご自身にも二度と表示できません。忘れてしまった場合は、新しい4つを選び直してください。30秒で済みます。",
    "A 合言葉 cannot be shown again, not even to you. If you have forgotten it, please choose four new words. It takes half a minute.",
  ),
  "mine.wChoose": r(
    "合言葉を選ぶ",
    "Choose your 合言葉",
  ),
  "mine.wChooseAgain": r(
    "合言葉を選び直す",
    "Choose a new 合言葉",
  ),
  "mine.wRemove": r(
    "削除",
    "Delete",
  ),
  "mine.wRemoveQuestion": r(
    "合言葉を削除しますか？",
    "Delete your 合言葉?",
  ),
  "mine.wRemoveYes": r(
    "はい、削除する",
    "Yes, delete it",
  ),
  "mine.wRemoveNo": r(
    "残す",
    "Keep it",
  ),
  "mine.wCannotRemove": r(
    "合言葉は、このアカウントに入る唯一の方法のため、削除できません。先にサインイン用のアドレスを追加すると、削除できるようになります。",
    "Your 合言葉 is the only way into this account, so it cannot be deleted. If you first add an address to sign in with, it can be deleted.",
  ),
  "mine.wSaved": r(
    "保存しました。これからは、この合言葉が、どの端末でもあなたです。",
    "Saved. From now on this 合言葉 is you, on any device.",
  ),
  "mine.wSlots": r(
    "並べた順の合言葉",
    "Your 合言葉, in the order you arranged it",
  ),
  "mine.wEmptyBox": r(
    "{total}つの欄の{box}番目、空",
    "Box {box} of {total}, empty",
  ),
  "mine.wNextBox": r(
    "{total}つの欄の{box}番目、次に入れる欄",
    "Box {box} of {total}, the next to be filled",
  ),
  "mine.wHidden": r(
    "設定済みの隠れた言葉",
    "A word, set and hidden",
  ),
  "mine.wTileTitle": r(
    "タップすると、この言葉を取り出せます。ドラッグするか矢印キーで、別の欄へ移せます。",
    "Tap to take this word back out. Drag it, or use the arrow keys, to move it to another box.",
  ),
  "mine.wTileHint": r(
    "Enterでこの言葉を取り出せます。矢印キーで1欄ずつ動き、HomeとEndで最初と最後の欄へ動きます。",
    "Enter takes this word back out. The arrow keys move it one box at a time, and Home and End move it to the first and last box.",
  ),
  "mine.wMoved": r(
    "{word}は、{total}つの欄の{box}番目に入りました。",
    "{word} is now in box {box} of {total}.",
  ),
  "mine.wArrange": r(
    "覚えやすい順に、言葉を別の欄へドラッグして入れ替えてください。順番は自由で、言葉には影響しません。タップすると、言葉を取り出せます。",
    "If another order is easier to remember, drag a word to another box. The order is up to you and does not affect the words. Tap a word to take it back out.",
  ),
  "mine.wKeepOne": r(
    "言葉をタップして、残したいものを選んでください。",
    "Tap a word to choose the one to keep.",
  ),
  "mine.wToGoNone": r(
    "すべてそろいました。",
    "All are in place.",
  ),
  "mine.wToGoOne": r(
    "あと1つです。",
    "One more to go.",
  ),
  "mine.wToGoTwo": r(
    "あと2つです。",
    "Two more to go.",
  ),
  "mine.wToGoThree": r(
    "あと3つです。",
    "Three more to go.",
  ),
  "mine.wToGoFour": r(
    "あと4つです。",
    "Four more to go.",
  ),
  "mine.wFinding": r(
    "合言葉を探しています…",
    "Looking for a 合言葉…",
  ),
  "mine.wRefresh": r(
    "別の4語を表示",
    "Show four other words",
  ),
  "mine.wWriteDown": r(
    "この4語を、いまのうちにどこかに書き留めてください。",
    "Please write these four words down somewhere now.",
  ),
  "mine.wWriteDownWhy": r(
    "設定すると、ご自身を含め誰にも、二度と表示できません。忘れても、新しい4語を選び直すだけなので、困ることはありません。",
    "Once set, they cannot be shown again to anyone, including you. Even if you forget them, you only need to pick four new words, so there is no trouble.",
  ),
  "mine.wAcknowledge": r(
    "この4語を書き留めました。",
    "I have written these four words down.",
  ),
  "mine.wSave": r(
    "この合言葉を保存",
    "Save this 合言葉",
  ),
  "mine.wStartOver": r(
    "最初からやり直す",
    "Start over",
  ),
  "mine.wDrawFailed": r(
    "言葉を用意できませんでした。",
    "Words could not be offered.",
  ),
  "mine.wSaveFailed": r(
    "この合言葉を設定できませんでした。",
    "That 合言葉 could not be set.",
  ),
  "mine.wRemoveFailed": r(
    "この合言葉を削除できませんでした。",
    "That 合言葉 could not be deleted.",
  ),

  // What the site holds about a member
  "mine.holdTitle": r(
    "保存している情報",
    "The information we keep",
  ),
  "mine.holdLead": {
    ...r(
      "すべてを、平易な言葉で示します。それぞれを誰が見られるか、なぜ保存しているかは、プライバシーのページにあります。",
      "Everything, in plain words. The privacy page says who can see each of these and why we keep it.",
    ),
    ask: "Introduces the list of everything the site holds about a member: privacy text, so a native read is recommended.",
  },
  "mine.holdNothing": r(
    "なし",
    "nothing",
  ),
  "mine.holdNone": r(
    "なし",
    "none",
  ),
  "mine.holdEmail": r(
    "メールアドレス",
    "Your email address",
  ),
  "mine.holdNoEmail": r(
    "なし（合言葉で参加しました）",
    "none (you joined with a 合言葉)",
  ),
  "mine.holdName": r(
    "名前",
    "Your name",
  ),
  "mine.holdPicture": r(
    "画像",
    "Your picture",
  ),
  "mine.holdPictureGoogle": r(
    "Googleから受け取ったもの",
    "the one received from Google",
  ),
  "mine.holdAge": r(
    "年齢の区分",
    "Your age band",
  ),
  "mine.holdNotAsked": r(
    "まだ聞いていません",
    "not asked yet",
  ),
  "mine.holdConsent": r(
    "保護者の同意",
    "A parent's or guardian's consent",
  ),
  "mine.holdConsentOn": r(
    "お名前と日付とともに保存しています",
    "on file, with their name and the date",
  ),
  "mine.holdWords": r(
    "合言葉",
    "Your 合言葉",
  ),
  "mine.holdWordsSet": r(
    "設定済み（確認用の値だけを保存し、言葉そのものは保存しません）",
    "set (we keep only a value for checking, never the words themselves)",
  ),
  "mine.holdNotSet": r(
    "未設定",
    "not set",
  ),
  "mine.holdPlace": r(
    "市区町村、国、タイムゾーン",
    "Your city, country and time zone",
  ),
  "mine.holdBio": r(
    "自己紹介",
    "What you wrote about yourself",
  ),
  "mine.holdInvite": r(
    "参加に使った招待",
    "The invitation you joined with",
  ),
  "mine.holdJoined": r(
    "参加した日",
    "When you joined",
  ),
  "mine.holdSeen": r(
    "最後に来た日時",
    "When you were last here",
  ),
  "mine.holdMail": r(
    "対局に関するメール",
    "Email about your games",
  ),
  "mine.holdOnline": r(
    "オンライン状態の表示",
    "Showing when you are online",
  ),
  "mine.holdOn": r(
    "オン",
    "on",
  ),
  "mine.holdOff": r(
    "オフ",
    "off",
  ),
  "mine.holdGames": r(
    "席に着いている対局",
    "Games you have a seat in",
  ),
  "mine.holdGamesTitle": r(
    "席に着いているすべての対局",
    "Every game you have a seat in",
  ),
  "mine.holdMessages": r(
    "送信したメッセージと受信したメッセージ",
    "Messages you sent, and messages you received",
  ),
  "mine.holdAnd": r(
    "{first}件と{second}件",
    "{first} and {second}",
  ),
  "mine.holdInbox": r(
    "受信箱の件数",
    "Number of items in your inbox",
  ),
  "mine.holdBuddies": r(
    "仲間と、無視している人",
    "Buddies, and people you ignore",
  ),
  "mine.holdAndPeople": r(
    "{first}人と{second}人",
    "{first} and {second}",
  ),
  "mine.holdXp": r(
    "付与された経験値（1件ずつ）",
    "Experience points awarded, one line each",
  ),
  "mine.holdSolves": r(
    "解いたパズル",
    "Puzzles you solved",
  ),
  "mine.holdApplause": r(
    "拍手を送った対局",
    "Games you applauded",
  ),

  // A game's row in the list
  "mine.agoNow": r(
    "たったいま",
    "just now",
  ),
  "mine.agoMinutes": r(
    "{count}分前",
    "{count} minutes ago",
  ),
  "mine.agoHours": r(
    "{count}時間前",
    "{count} hours ago",
  ),
  "mine.agoYesterday": r(
    "昨日",
    "yesterday",
  ),
  "mine.agoDays": r(
    "{count}日前",
    "{count} days ago",
  ),
  "mine.rowAria": r(
    "{black}対{white}",
    "{black} versus {white}",
  ),
  "mine.rowWould": r(
    "{colour}を持つことになります",
    "I would hold {colour}",
  ),
  "mine.rowWere": r(
    "{colour}を持ちました",
    "I held {colour}",
  ),
  "mine.rowAre": r(
    "{colour}を持っています",
    "I hold {colour}",
  ),
  "mine.myGamesTabs": r(
    "表示する対局の種類",
    "Which kind of games to show",
  ),
  "mine.noneGoing": r(
    "進行中の対局はありません。",
    "There are no games in progress.",
  ),
  "mine.newGameArrow": r(
    "新規対局 →",
    "New game →",
  ),
  "mine.colTimeLimit": r(
    "持ち時間",
    "Time limit",
  ),
  "mine.colLocation": r(
    "場所",
    "Location",
  ),
  "mine.noResigning": r(
    "投了なし",
    "no resigning",
  ),
  "mine.waitingAll": r(
    "{total}件が待機中",
    "{total} waiting",
  ),
  "mine.waitingSome": r(
    "{total}件中{shown}件が待機中",
    "{shown} of {total} waiting",
  ),

  // My record
  "mine.recEmpty": r(
    "まだ対局がありません。レーティング対局は、2人の会員のあいだで行う対局です。{link}のページで、相手の横の対局ボタンを押してください。",
    "There are no games yet. A rated game is a game between two members. On the {link} page, press the game button beside someone.",
  ),
  "mine.recPlayers": r(
    "対局者",
    "players",
  ),
  "mine.recOverall": r(
    "全体：",
    "Overall:",
  ),
  "mine.recStandingPool": r(
    "コンピュータとの対局で、別の枠でレーティングされています。",
    "Against computers, rated in a separate pool.",
  ),
  "mine.recEmptyTable": r(
    "どのゲームでも、レーティング対局はまだありません。レーティング対局は、2人の会員のあいだの対局、または{link}との対局です。",
    "There is no rated game of any game yet. A rated game is a game between two members, or a game against one of the {link}.",
  ),
  "mine.recBots": r(
    "コンピュータ",
    "computers",
  ),
  "mine.recVerdict": r(
    "自己評価：判定した{judged}局のうち、{up}局で良く打てたと感じました{tail}。この内容は自分にしか見えません。",
    "Self-assessment: of the {judged} games I judged, I felt I played well in {up}{tail}. Only I can see this.",
  ),
  "mine.recVerdictTail": r(
    "（良く打てたと感じた{up}局のうち{upWins}局、そう感じなかった{down}局のうち{downWins}局に勝ちました）",
    " (I won {upWins} of the {up} games I felt good about, and {downWins} of the {down} I did not)",
  ),
  "mine.recUpTitle": r(
    "良く打てたと感じた対局",
    "The games I felt I played well",
  ),
  "mine.recJudgedTitle": r(
    "判定したすべての対局",
    "Every game I judged",
  ),
  "mine.recPublic": r(
    "自分の公開ページ",
    "My public page",
  ),
  "mine.cardLocal": r(
    "{game}・{board}・{moves}・{who}の手番",
    "{game} · {board} · {moves} · {who}'s turn",
  ),
  "mine.cardParty": r(
    "{game}・{players}・{who}の手番",
    "{game} · {players} · {who}'s turn",
  ),
  "mine.cardMahjong": r(
    "{game}・{players}・{who}が一組を取る番",
    "{game} · {players} · {who}'s turn to take a pair",
  ),
  "mine.buddyLocal": r(
    "現地時刻 {time}",
    "local time {time}",
  ),
  "mine.buddyGames": r(
    "一緒に対局",
    "games together",
  ),

  // My XP tab
  "mine.xpNoMember": r(
    "経験値は会員に付くものですが、このセッションは会員情報のないままサインインしているため、「何も獲得していない」のではなく、表示するものがありません。",
    "Experience points belong to members, but this session is signed in without member information, so there is nothing to show, rather than nothing having been earned.",
  ),
  "mine.xpEarned": r(
    "獲得日",
    "Date earned",
  ),
  "mine.xpAllLevels": r(
    "全100レベル",
    "All 100 levels",
  ),
  "mine.xpWhere": r(
    "順位",
    "Ranking",
  ),
  "mine.xpStartAgain": r(
    "最初からやり直す",
    "Start over",
  ),
  "mine.xpEmpty": r(
    "まだありません。経験値は、顔を出して試すことで貯まります。終えた対局ごとと、ここにある{games}の初めてのプレイごとに入り、ゴモジの各言語もその数に含まれます。{link}。",
    "Nothing yet. Experience points build up by showing up and trying things. They come for every game finished and for the first play of each of the {games} here, and each language of Gomoji counts among them. {link}.",
  ),
  "mine.xpEmptyLink": r(
    "ゲームを選んで貯め始める",
    "Pick a game and start earning",
  ),
  "mine.xpEarlier": r(
    "以前の獲得分",
    "Earlier awards",
  ),

  // The account page itself
  "mine.accountTitle": r(
    "自分のアカウント",
    "My account",
  ),
  "mine.tabsAria": r(
    "アカウントのどの部分か",
    "Which part of the account",
  ),
  "mine.unnamed": r(
    "名前なし",
    "No name",
  ),
  "mine.welcome": r(
    "ようこそ",
    "Welcome",
  ),
  "mine.welcomeName": r(
    "参加できました。盤に向かう前にひとつだけ。ほかの対局者に、どう呼ばれたいですか。",
    "I have joined. Just one thing before the board: what would I like the other players to call me?",
  ),
  "mine.welcomeNoAddress": r(
    "アカウントには、とりあえずの名前が付いています。お好きな名前に変えてください。",
    "The account has a name to get by with for now. Please change it to the name I want.",
  ),
  "mine.welcomeGoogle": r(
    "Googleの名前が入っています。変えたい場合は変えてください。",
    "The name from Google is filled in. Change it if I want to.",
  ),
  "mine.newBoardNote": r(
    "新しい盤の初期設定です。ここでも、サインインしたどの端末でも、この設定で始まります。",
    "The initial settings of a new board. They apply here and on every device I sign in on.",
  ),
  "mine.turnNote": r(
    "着手のしかたの設定です。遊ぶどの盤にも適用されます。",
    "How a move works. It applies to every board I play.",
  ),
};
