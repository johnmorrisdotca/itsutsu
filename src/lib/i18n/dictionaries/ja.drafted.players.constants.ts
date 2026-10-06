import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the players.* phrases (ENJA-10). Joined into `JA_DRAFTED`.
 * The computer players are コンピュータ (John, 2026-10-06); a win, loss and draw are 勝, 敗 and 分 in a table and 勝ち, 負け and 引き分け in a sentence.
 * Every row has been read by the reviewer agent (`review`): the standards are `japanese-reviewer.md`, the terms `TERMS.md`.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_PLAYERS: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // Table headings
  "players.colPlayer": r(
    "対局者",
    "Player",
  ),
  "players.colMember": r(
    "会員",
    "Member",
  ),
  "players.colGame": r(
    "ゲーム",
    "Game",
  ),
  "players.colSite": r(
    "サイト",
    "Site",
  ),
  "players.colLeader": r(
    "首位",
    "First place",
  ),
  "players.colChampion": r(
    "王者",
    "Champion",
  ),
  "players.colPlayers": r(
    "人数",
    "Number of people",
  ),
  "players.colGames": r(
    "対局数",
    "Number of games",
  ),
  "players.colPlay": r(
    "対局",
    "Game",
  ),
  "players.colPlayed": r(
    "対局数",
    "Number of games played",
  ),
  "players.colWinRate": r(
    "勝率",
    "Win rate",
  ),
  "players.colStreak": r(
    "連続記録",
    "Streak",
  ),
  "players.colRating": r(
    "レーティング",
    "Rating",
  ),
  "players.colXp": r(
    "経験値",
    "Experience points",
  ),
  "players.colTier": r(
    "区分",
    "Category",
  ),
  "players.colJoined": r(
    "参加",
    "Joined",
  ),

  // What a heading's press does, for a screen reader
  "players.sortBy": r(
    "{label}で並べ替え",
    "Sort by {label}",
  ),
  "players.sortedBy": r(
    "{label}：{way}で並べ替え中。押すと逆順になります。",
    "{label}: sorted in {way} order. Pressing reverses it.",
  ),
  "players.ascending": r(
    "昇順",
    "ascending order",
  ),
  "players.descending": r(
    "降順",
    "descending order",
  ),

  // A record's cells and lines
  "players.titlePlayed": r(
    "ここで数えたすべての対局",
    "Every game counted here",
  ),
  "players.titleWon": r(
    "勝った対局",
    "The games won",
  ),
  "players.titleLost": r(
    "負けた対局",
    "The games lost",
  ),
  "players.titleDrawn": r(
    "引き分けた対局",
    "The games drawn",
  ),
  "players.noGamesYet": r(
    "まだ対局なし",
    "No games yet",
  ),
  "players.recordLine": r(
    "{played}局・{won}勝{lost}敗{drawn}分・勝率{rate}・{streak}",
    "{played} games · {won} wins {lost} losses {drawn} draws · win rate {rate} · {streak}",
  ),
  "players.figure": r(
    "{won}勝・{lost}敗・{drawn}分",
    "{won} wins · {lost} losses · {drawn} draws",
  ),

  // What a record's counts cover, said as a hover note
  "players.rated": r(
    "レーティング",
    "rating-",
  ),
  "players.friendly": r(
    "親善",
    "friendly ",
  ),
  "players.oneGame": r(
    "（このゲームのみ）",
    " (this game only)",
  ),
  "players.againstBots": r(
    "対コンピュータの",
    "against-computer ",
  ),
  "players.againstPeople": r(
    "対人の",
    "against-person ",
  ),
  "players.scopeWhat": r(
    "{pool}{rated}対局{game}",
    "{pool}{rated}games{game}",
  ),
  "players.streakCounts": r(
    "ここで終了した{what}を、新しい順に数えています。",
    "It counts the {what} finished here, newest first.",
  ),
  "players.streakCountsBy": r(
    "ここで終了した{player}の{what}を、新しい順に数えています。",
    "It counts {player}'s {what} finished here, newest first.",
  ),
  "players.streakElsewhere": r(
    "連続記録は、ここで行われた対局からしか数えません。",
    "A streak is only ever counted from games played here.",
  ),
  "players.playedCounts": r(
    "ここで終了した{what}を数えています。",
    "It counts the {what} finished here.",
  ),
  "players.playedElsewhere": r(
    "他のサイトで数えたものです。ここには開ける対局がありません。",
    "Counted on another site. There are no games here to open.",
  ),
  "players.blankNoGames": r(
    "終わった対局がまだないため、表示できる連続記録がありません。",
    "There are no finished games yet, so there is no streak to show.",
  ),
  "players.blankNoRun": r(
    "この行には連続記録が記録されていません。",
    "No streak is recorded for this row.",
  ),

  // XP, IP and the pools
  "players.unclaimedName": r(
    "まだ誰のものにもなっていない名前です。経験値を獲得した会員がいません。",
    "A name that is nobody's yet. There is no member who has earned experience.",
  ),
  "players.xpLinkTitle": r(
    "{site}で獲得した経験値に、記録がここに残っている他のサイトでの対局の分を加えたものです。経験値で全員を順位づけした表が開きます。",
    "Experience points earned on {site}, plus credit for games on other sites whose record is kept here. It opens the table that ranks everybody by it.",
  ),
  "players.ipHeadTitle": r(
    "{site}ポイント：この会員が勝ち取った分です。サイト全体の表ではサイト全体の分、ゲーム別の表ではそのゲームの分です。",
    "{site} Points: what this member has won. On the site-wide table, the site-wide amount; on a table for one game, that game's amount.",
  ),
  "players.botsPool": r(
    "コンピュータとの対局で得たレーティングです。コンピュータは別の枠でレーティングされます。",
    "A rating earned against computers. Computers are rated in a pool of their own.",
  ),
  "players.botsMark": r(
    "コンピュータ",
    "Computers",
  ),

  // How a list is narrowed, the words a chip and its clause use
  "players.chipEstablished": r(
    "確定レーティング",
    "Established ratings",
  ),
  "players.clauseEstablished": r(
    "レーティングが確定している",
    "has an established rating",
  ),
  "players.chipActive": r(
    "最近の活動",
    "Recent activity",
  ),
  "players.clauseActive": r(
    "過去{days}日以内に確認されている",
    "has been seen within the past {days} days",
  ),
  "players.remembered": r(
    "前回の選択のまま",
    "as you chose last time",
  ),

  // The members list
  "players.dirLead": r(
    "会員を最近見かけた順に並べ、その名前が積み上げた戦績を載せています。見出しを押すと、その列で並べ替えられます。名前の横の数字はその人のレベルで、そこへ導いたのが経験値です。経験値で全員を順位づけした{board}もご覧ください。新しい会員には2週間のあいだ印が付きます。その横の対局ボタンを押すと、対局を始めた瞬間から相手の一覧にも現れます。",
    "Members are lined up by most recently seen, with the record their names have built up. Press a heading and it sorts by that column. The number beside a name is that person's level, and what led them to it is experience points. Please also see the {board} that ranks everyone by experience points. New members have a mark for two weeks. If you press the game button beside it, the game appears in the other person's list from the moment you start it.",
  ),
  "players.dirBoard": r(
    "順位表",
    "ranking table",
  ),
  "players.dirNew": r(
    "新しく参加した会員です（2週間以内）",
    "A newly joined member (within two weeks)",
  ),
  "players.dirNewAria": r(
    "新しい会員",
    "new member",
  ),
  "players.dirKeptMark": r(
    "他のサイトでの対局を含みます。一度だけ書き写したもので、その後は更新されていません。",
    "It includes games from another site. They were copied down once and have not been updated since.",
  ),
  "players.dirScope": r(
    "この戦績を数える範囲",
    "How much of these records to count",
  ),
  "players.dirSortRefused": r(
    "会員の一覧にはその並び順がないため、最後に見かけた順に並べています。",
    "The members list does not have that order, so it is arranged by who was seen last.",
  ),
  "players.dirKeptNote": r(
    "{mark}{site}より前の対局を数えています。対象は、その対局者のページに書かれているサイトです。{bold}。一度だけ手作業で書き写したもので、その日の時点の記録です。リアルタイムで数えるのは、ここで起きたことだけです。レーティングと連続記録は、常に{site}だけのものです。",
    "{mark} It counts games from before {site}, on the sites written on that player's own page. {bold}. They were copied down by hand just once and are a record as of that day. Only what happens here is counted in real time. The rating and streak are always {site}'s alone.",
  ),
  "players.dirNoUpdate": r(
    "これらの数字は更新されません",
    "These numbers are not updated",
  ),
  "players.dirSortHere": r(
    "この並び順は、ここで行われた対局数によるものです。印の付いた行は、表示している合計ではなく、{site}での数字の位置に並びます。",
    "This order is by the number of games played here. A row with the mark is placed by its figure on {site}, not by the total shown.",
  ),
  "players.dirCount": r(
    "{total}人中{shown}人を表示",
    "Showing {shown} of {total} people",
  ),
  "players.showNext": r(
    "次の{count}人を表示",
    "Show the next {count} people",
  ),
  "players.dirTop": r(
    "最初のページへ戻る",
    "Back to the first page",
  ),
  "players.dirOwnOrder": r(
    "最近見かけた順",
    "In order of most recently seen",
  ),
  "players.filterLabel": r(
    "除外する条件",
    "Conditions for leaving out",
  ),
  "players.filterEstablishedTitle": r(
    "レーティングは、最初の数局は未定、落ち着くまでは仮の扱いです。",
    "A rating is undecided for the first few games, and provisional until it settles.",
  ),
  "players.filterActiveTitle": r(
    "過去{days}日以内に見かけた人です。コンピュータは常に対象に入ります。",
    "People seen within the past {days} days. Computers are always included.",
  ),
  "players.listedAll": r(
    "{total}人を表示",
    "Showing {total} people",
  ),
  "players.listedSome": r(
    "{total}人中{shown}人を表示",
    "Showing {shown} of {total} people",
  ),
  "players.filteredBy": r(
    "絞り込み",
    "Narrowed by",
  ),
  "players.removeChip": r(
    "{name}を外す",
    "Remove {name}",
  ),
  "players.showEveryone": r(
    "全員を表示",
    "Show everyone",
  ),
  "players.whoLabel": r(
    "表示する対局者",
    "Which players to show",
  ),
  "players.nobodyPerson": r(
    "該当する人はまだいません。",
    "There is no matching person yet.",
  ),
  "players.nobodyPersonWhere": r(
    "{clauses}人は、まだいません。",
    "There is not yet anyone who {clauses}.",
  ),
  "players.nobodyComputer": r(
    "該当するコンピュータはまだいません。",
    "There is no matching computer yet.",
  ),
  "players.nobodyComputerWhere": r(
    "{clauses}コンピュータは、まだいません。",
    "There is not yet any computer that {clauses}.",
  ),
  "players.nobodyAny": r(
    "該当する人はまだいません。",
    "There is no matching person yet.",
  ),
  "players.nobodyAnyWhere": r(
    "{clauses}人は、まだいません。",
    "There is not yet anyone who {clauses}.",
  ),

  // Who is here
  "players.hereLine": r(
    "直近5分に{now}、直近30分に{half}人がいます。",
    "{now} in the last five minutes, {half} people in the last half hour.",
  ),
  "players.siteClock": r(
    "サイト時刻：{time} UTC",
    "Site time: {time} UTC",
  ),
  "players.hereMore": r(
    "ほか{count}人（直近30分）",
    "and {count} more people (last 30 minutes)",
  ),
  "players.hereFewer": r(
    "表示を減らす",
    "show fewer",
  ),
  "players.localThere": r(
    "現地時刻{time}",
    "local time {time}",
  ),

  // Buddies
  "players.buddyEmpty": r(
    "まだ誰もいません。仲間とは、また会いたい人のことです。{link}か、その人のページで星を付けると、最近見かけた順にここに並び、進行中の対局と、申し込める対局が名前の横に表示されます。",
    "There is no one yet. A buddy is someone you want to meet again. If you put a star on them on the {link} or on their own page, they line up here in order of most recently seen, with the games in progress and a game you can propose shown beside the name.",
  ),
  "players.membersList": r(
    "会員一覧",
    "members list",
  ),
  "players.buddyCount.one": r(
    "よく対局する人を最近見かけた順に並べています。仲間は{count}人です。",
    "The people you play with, in order of most recently seen. {count} buddies.",
  ),
  "players.buddyCount.other": r(
    "よく対局する人を最近見かけた順に並べています。仲間は{count}人です。",
    "The people you play with, in order of most recently seen. {count} buddies.",
  ),
  "players.noGoing": r(
    "進行中の対局なし",
    "no games in progress",
  ),
  "players.goingYours": r(
    "進行中{going}局（自分の番{yours}局）",
    "{going} games in progress ({yours} games on my move)",
  ),
  "players.going": r(
    "進行中{going}局",
    "{going} games in progress",
  ),
  "players.gamesTogether": r(
    "一緒に対局した記録",
    "record of games together",
  ),

  // The computer players
  "players.botsLead": r(
    "この盤のどのゲームでも相手をするコンピュータが{graded}つあり、やさしい順から最強の順に並びます。ほかの人と同じように席に着き、対局はレーティングに数えられます。勝てばレーティングが上がり、負ければ下がります。コンピュータは、コンピュータどうしや相手をした人との対局で、独自のレーティングを持ちます。順位表とは別に管理されるので、コンピュータとの対局で人どうしの順位が変わることはありません。",
    "There are {graded} computers that play any game on this board, lined up from the gentlest to the strongest. They take a seat like anyone else, and the games count toward ratings. If you win, your rating goes up, and if you lose, it goes down. Computers have their own ratings from games against each other and against the people who play them. Because they are managed apart from the ranking table, a game against a computer never changes the ranking among people.",
  ),
  "players.botsLeadExperts": r(
    "この盤のどのゲームでも相手をするコンピュータが{graded}つあり、やさしい順から最強の順に並びます。ほかに、1つのゲームだけを打つ専門のコンピュータが{experts}つあり、そのゲームではここで最強です。ほかの人と同じように席に着き、対局はレーティングに数えられます。勝てばレーティングが上がり、負ければ下がります。コンピュータは、コンピュータどうしや相手をした人との対局で、独自のレーティングを持ちます。順位表とは別に管理されるので、コンピュータとの対局で人どうしの順位が変わることはありません。",
    "There are {graded} computers that play any game on this board, lined up from the gentlest to the strongest. In addition there are {experts} specialist computers that each play only one game, and are the strongest here at that game. They take a seat like anyone else, and the games count toward ratings. If you win, your rating goes up, and if you lose, it goes down. Computers have their own ratings from games against each other and against the people who play them. Because they are managed apart from the ranking table, a game against a computer never changes the ranking among people.",
  ),
  "players.botsEmpty": r(
    "このサイトには、まだコンピュータが設定されていません。",
    "No computers have been set up on this site yet.",
  ),
  "players.botsCaption": r(
    "それぞれのコンピュータにも、ほかの人と同じように専用のページがあります。名前を押すと、対局の記録が見られます。全員の一覧は{link}のページです。",
    "Each computer also has its own page, just like anyone else. Press a name to see the games played. The list of everyone is the page for {link}.",
  ),
  "players.playersLink": r(
    "対局者",
    "players",
  ),

  // The ladder
  "players.ladderLead": r(
    "レーティングはイロ式で、1600から始まります。最初の数局は未定、落ち着くまでは仮、20局を超えると確定です。見出しを押すと並べ替えられます。ゲームごとの順位表もあります。{link}をご覧ください。",
    "Ratings are Elo, starting from 1600. The first few games are undecided, provisional until it settles, and established after 20 games. Press a heading to sort. There is also a ranking table for each game. Please see {link}.",
  ),
  "players.champions": r(
    "名人",
    "meijin (champions)",
  ),
  "players.ladderSortRefused": r(
    "順位表にはその並び順がないため、レーティング順に並べています。",
    "The ranking table does not have that order, so it is arranged by rating.",
  ),
  "players.ladderEmpty": r(
    "レーティング対局がまだ誰にもありません。レーティング対局は、2人の会員のあいだで行う対局です。{link}、最初に順位表へ載りましょう。",
    "Nobody has a rated game yet. A rated game is a game between two members. {link} and be the first on the ranking table.",
  ),
  "players.ladderFind": r(
    "相手を探して",
    "Find an opponent",
  ),
  "players.ladderAll": r(
    "順位表の{total}人すべてを表示しました。",
    "All {total} people on the ranking table are shown.",
  ),
  "players.ladderLoading": r(
    "{total}人中{shown}人を表示中。続きを読み込んでいます…",
    "Showing {shown} of {total} people. Loading more…",
  ),
  "players.ladderScroll": r(
    "{total}人中{shown}人を表示しています。下へスクロールすると続きが読み込まれます。",
    "Showing {shown} of {total} people. Scroll down and more will load.",
  ),
  "players.ladderCount": r(
    "順位表{total}人中{shown}人",
    "{shown} of {total} people on the ranking table",
  ),
  "players.ladderFailed": r(
    "いまは続きを読み込めませんでした。リンクはそのまま使えます。",
    "More could not be loaded just now. The link still works.",
  ),
  "players.ladderTop": r(
    "順位表の先頭へ戻る",
    "Back to the top of the ranking table",
  ),

  // The switch for counting every site's games
  "players.scopeLabel": r(
    "この対局者の戦績を数える範囲",
    "How much of this player's record to count",
  ),
  "players.scopeOnTitle": r(
    "遊んだすべてのサイトを、このサイトも含めて数えています。チェックを外すと、このサイトだけになります。",
    "Every site played on is counted, this one included. If you uncheck it, it becomes this site only.",
  ),
  "players.scopeOffTitle": r(
    "このサイトだけを数えています。チェックを入れると、ほかのサイトでの対局も加わります。",
    "Only this site is counted. If you check it, games on other sites are added.",
  ),

  // A result in a word
  "players.outcomeWon": r(
    "勝ち",
    "won",
  ),
  "players.outcomeLost": r(
    "負け",
    "lost",
  ),
  "players.outcomeDrawn": r(
    "引き分け",
    "drawn",
  ),
  "players.versus": r(
    "対",
    "versus",
  ),
  "players.anonymous": r(
    "匿名",
    "anonymous",
  ),
  "players.somebody": r(
    "誰か",
    "somebody",
  ),
  "players.colourBlack": r(
    "黒",
    "black",
  ),
  "players.colourWhite": r(
    "白",
    "white",
  ),
  "players.wld": r(
    "勝ち・負け・引き分け",
    "Won, lost, drawn",
  ),
  "players.vsBots": r(
    "対コンピュータ",
    "Against computers",
  ),

  // Saved games kept from other sites
  "players.keptTitle": r(
    "保存された対局",
    "Saved games",
  ),
  "players.keptLine": r(
    "{date}・{game}（{board}）・対{opponent}・{colour}番・{result}・{source}",
    "{date} · {game} ({board}) · versus {opponent} · {colour}'s turn order · {result} · {source}",
  ),
  "players.keptStoryTitle": r(
    "{date}・対{opponent}",
    "{date} · versus {opponent}",
  ),
  "players.keptStorySource": r(
    "{site}で行われた対局を、記録としてここに残しています",
    "A game played on {site}, kept here as a record",
  ),
  "players.keptTailRemembered": r(
    "{site}では一度も対局していません。この記録は、ここで獲得したものではなく、保存されたものです。",
    "They never played on {site}. This record was not earned here but is kept.",
  ),
  "players.keptTailRememberedHere": r(
    "この記録は{site}より前のものを保存しています。同じ名前でここでも実際に対局しているため、下をご覧ください。",
    "This record was kept from before {site}. The same name has also played a real game here, so please see below.",
  ),
  "players.keptHereRemembered": r(
    "{site}での対局はありません。この記録は、このサイトができる前に別の場所で作られたもので、加筆せずにそのまま残しています。",
    "There are no games on {site}. This record was made elsewhere before this site existed, and is kept as it is without additions.",
  ),
  "players.keptTailHonorary": r(
    "{site}では一度も対局していません。名誉会員として、ご本人の記録をここに残しています。",
    "She never played on {site}. Her own record is kept here as an honorary member.",
  ),
  "players.keptTailHonoraryHere": r(
    "{site}の名誉会員として、ご本人の記録をここに残しています。同じ名前でここでも実際に対局しているため、下をご覧ください。",
    "Her own record is kept here as an honorary member of {site}. The same name has also played a real game here, so please see below.",
  ),
  "players.keptHereHonorary": r(
    "{site}での対局はありません。名誉会員は、ここで対局しなくても記録を持っています。もし席に着く日が来たら、その対局はここに表示されます。",
    "There are no games on {site}. An honorary member has a record here without having played here. If she ever takes a seat, those games would appear here.",
  ),
  "players.keptTailFallbackHere": r(
    "{site}より前のものを保存しています。同じ名前でここでも実際に対局しているため、下をご覧ください。",
    "Kept from before {site}. The same name has also played a real game here, so please see below.",
  ),
  "players.keptTailFallback": r(
    "{site}より前の記録で、その後ここで獲得した分と並べて残しています。",
    "A record from before {site}, kept alongside what they have since earned here.",
  ),
  "players.playedAsLead": r(
    "遊んだ名前：",
    "Names played under:",
  ),
  "players.alsoPlayedAsLead": r(
    "ほかに遊んだ名前：",
    "Other names played under:",
  ),
  "players.playedAs": r(
    "{site}の{handle}",
    "{handle} on {site}",
  ),
  "players.playedAsYears": r(
    "{site}の{handle}（{from}〜{to}）",
    "{handle} on {site} ({from} to {to})",
  ),
  "players.alsoKept": r(
    "。{site}より前の記録で、専用のタブにあります。",
    ". A record from before {site}, in its own tab.",
  ),
  "players.rollLine": r(
    "：ここでは対局していませんが、{possessive}{sites}での記録を保存しています。",
    ": They have not played here, but {possessive} record on {sites} is kept.",
  ),
  "players.rollRemembered": r(
    "偲ぶ",
    "Remembering",
  ),
  "players.rollHonorary": r(
    "名誉会員",
    "Honorary members",
  ),
  "players.legacyGame": r(
    "ゲーム",
    "Game",
  ),
  "players.legacyTotal": r(
    "合計",
    "Total",
  ),
  "players.legacyOpen": r(
    "{count}局を1局ずつ見る",
    "Look at {count} games one by one",
  ),
  "players.legacyAgainst": r(
    "対戦相手：",
    "Opponent:",
  ),
  "players.legacyComments": r(
    "コメント",
    "Comments",
  ),
  "players.legacyBreakdown": r(
    "内訳は、記録されている範囲までです。元のサイトには、ここに書き写した以上の記録がある場合があります。上の合計は、元のサイトの数字です。",
    "The breakdown goes only as far as what was recorded. The original site may hold more than what is copied here. The total above is the original site's own figure.",
  ),
  "players.legacyProfile": r(
    "{site}でのプロフィール",
    "Their profile on {site}",
  ),
  "players.legacyPlayedAs": r(
    "{handle}という名前で遊びました",
    "Played under the name {handle}",
  ),
  "players.legacyYears": r(
    "（{from}から{to}）",
    " ({from} to {to})",
  ),
  "players.legacyDaysOff": r(
    "。休みは{days}です",
    ". The days off are {days}",
  ),
  "players.legacyFigures": r(
    "ここの数字はすべて記録から計算したもので、保存はしていないため、下の合計と食い違うことはありません。勝率は、このサイトのレーティングと同じく、引き分けを半局の勝ちとして数えます。",
    "Every figure here is calculated from the record and none is stored, so it cannot disagree with the totals below. For the win rate, a draw counts as half a game won, the same as in the ratings on this site.",
  ),

  // A player's page
  "players.titleFallback": r(
    "対局者",
    "Player",
  ),
  "players.chaptersLabel": r(
    "この対局者の記録の場所と、経験値の獲得履歴",
    "Where this player's record was kept, and the history of how they earned experience points",
  ),
  "players.seenEnough": r(
    "対局してみませんか？",
    "Would you like to play?",
  ),
  "players.childClosed": r(
    "13歳未満：本人の仲間リストにいる人だけが、対局を申し込んだり、手紙を書いたりできます。",
    "Under 13: only the people on their own buddy list can propose a game to them or write them a letter.",
  ),
  "players.message": r(
    "手紙を書く",
    "Write a letter",
  ),
  "players.xpHistory": r(
    "この経験値の獲得履歴",
    "The history of how this experience was earned",
  ),
  "players.countingEverywhere": r(
    "すべてのサイト（{count}か所）を数えています。内訳は下にあります。レーティングは{site}独自のもので、他のサイトで得たレーティングは尺度が違うため、合算しません。",
    "All sites are counted ({count} of them), with the breakdown below. Ratings are {site}'s own; ratings earned on other sites are on a different scale, so they are not added.",
  ),
  "players.playingNow": r(
    "対局中",
    "Playing now",
  ),
  "players.versusLine": r(
    "{game}・対{other}",
    "{game} · versus {other}",
  ),
  "players.noGoingYet": r(
    "進行中の対局はありません。",
    "There are no games in progress.",
  ),
  "players.watch": r(
    "観戦",
    "watch",
  ),
  "players.puzzlesTitle": r(
    "パズル",
    "Puzzles",
  ),
  "players.noPuzzles": r(
    "ここで解き終えたパズルはまだありません。",
    "No puzzles have been finished here yet.",
  ),
  "players.puzzleSolves": r(
    "{count}問を解き終えました →",
    "{count} problems finished →",
  ),
  "players.allGamesYours": r(
    "自分の終了した対局すべて →",
    "All my finished games →",
  ),
  "players.allGamesTheirs": r(
    "終了した対局すべて →",
    "All their finished games →",
  ),
  "players.yourGamesTogether": r(
    "自分との対局すべて →",
    "All the games with me →",
  ),
  "players.noGamesHere": r(
    "ここで終わった対局はまだありません。",
    "There are no finished games here yet.",
  ),
  "players.emptyNote": r(
    "終わった対局はまだありません。ほかの会員との最初の1局が終わると、レーティングが表示されます。",
    "There are no finished games yet. After the first game against another member ends, a rating appears.",
  ),
  "players.byGame": r(
    "ゲーム別",
    "By game",
  ),
  "players.recentGames": r(
    "最近の対局",
    "Recent games",
  ),
  "players.replay": r(
    "再生",
    "replay",
  ),
  "players.giftsLine": r(
    "時計について：{text}。",
    "About the clock: {text}.",
  ),
  "players.giftsNone": r(
    "持ち時間を譲る必要は一度もありませんでした",
    "there was never a need to give time",
  ),
  "players.giftsGave.one": r(
    "{count}局で相手に持ち時間を譲りました",
    "gave the opponent time in {count} games",
  ),
  "players.giftsGave.other": r(
    "{count}局で相手に持ち時間を譲りました",
    "gave the opponent time in {count} games",
  ),
  "players.giftsReceived": r(
    "{count}局で持ち時間をもらい、そのうち{won}局に勝ち、{lost}局に負けました",
    "was given time in {count} games, and of those won {won} games and lost {lost} games",
  ),
  "players.moreFor": r(
    "{name}のその他の操作",
    "More actions for {name}",
  ),
  "players.moreForBuddy": r(
    "{name}（仲間）のその他の操作",
    "More actions for {name} (buddy)",
  ),
  "players.moreForIgnored": r(
    "{name}（無視中）のその他の操作",
    "More actions for {name} (ignored)",
  ),
  "players.moreForBoth": r(
    "{name}（仲間・無視中）のその他の操作",
    "More actions for {name} (buddy, ignored)",
  ),
  "players.rowTitleBoth": r(
    "{name}を仲間にする、または無視する",
    "Make {name} a buddy, or ignore them",
  ),
  "players.rowTitleBuddy": r(
    "{name}を仲間にする",
    "Make {name} a buddy",
  ),
  "players.twoPools": r(
    "対局数とその横の戦績は、終わったすべての対局を数えています。レーティングは2つに分けて管理しています。対人が{people}、対コンピュータが{bots}です。コンピュータとの対局で人どうしでの順位が動くことはなく、自分自身との対局は、どちらにも数えません。",
    "The number of games and the record beside it count every finished game. Ratings are managed in two separate sets: {people} against people, and {bots} against computers. A game against a computer never moves the ranking among people, and a game against yourself counts toward neither.",
  ),
  "players.titleRatedPeople": r(
    "人とのレーティング対局",
    "Rated games against people",
  ),
  "players.titleRatedBots": r(
    "コンピュータとのレーティング対局",
    "Rated games against computers",
  ),
  "players.localTime": r(
    "現地時刻 {time}",
    "Local time {time}",
  ),

  // The whole of what somebody has played
  "players.snapshotBold": r(
    "これは更新されません。",
    "This is not updated.",
  ),
  "players.snapshot": r(
    "{bold}他のサイトの数字は、一度だけ手作業で書き写したもので、その日の時点のものです。リアルタイムの集計ではないため、その後にそこで行われた対局は含まれていません。リアルタイムで数えているのは、ここで起きたことだけです。残りを自動で最新にすることは、やりたいことですが、まだできていません。",
    "{bold} The figures from other sites were copied down by hand just once, and are as of that day. They are not a real-time count, so games played there since are not included. Only what happens here is counted in real time. Bringing the rest up to date automatically is something we want to do but have not yet done.",
  ),
  "players.wholeTitle": r(
    "通算",
    "Overall",
  ),
  "players.asHandle": r(
    "{handle}として",
    "as {handle}",
  ),
  "players.wholeStreakBlank": r(
    "この行は1つのサイトの合計で、連続記録は対局の順番のことです。2つのサイトの対局は時間の中で入り交じるため、サイトごとの行は連続記録になりません。",
    "These rows are the totals of one site, and a streak is about the order of games. Games on two sites are interleaved in time, so the row for each site does not form a streak.",
  ),
  "players.wholeEmpty": r(
    "この名前での記録は、どこにもまだありません。",
    "Nothing has been recorded under this name anywhere yet.",
  ),
  "players.noCombined": r(
    "合算したレーティングはなく、今後も作りません。他のサイトのレーティングは尺度も対戦相手も違うため、足したり平均したりしても、何も表さない数字になります。対局数と勝ち数は正しく合算できますが、レーティングはできません。",
    "There is no combined rating, and there will not be one. Ratings from other sites differ in scale and in opponents, so adding or averaging them would produce a number that represents nothing. The number of games and wins can be added correctly, but ratings cannot.",
  ),
  "players.endsAlt": r(
    "{games}の終わり方",
    "How {games} ended",
  ),

  // Ladders for a game, and the champions
  "players.standingsEmpty": r(
    "このゲームのレーティング対局は、まだ誰にもありません。",
    "Nobody has a rated game of this yet.",
  ),
  "players.champEmpty": r(
    "レーティング対局はまだありません",
    "There are no rated games yet",
  ),
  "players.champGamesTitle": r(
    "この順位表の元になっているレーティング対局",
    "The rated games this ranking table is made of",
  ),
  "players.tabsLabel": r(
    "見る対局者の種類",
    "Which kind of players to look at",
  ),
  "players.champLead": r(
    "いま、ゲームごとにもっとも高いレーティングの対局者です。レーティングはゲームごとに別々で、{link}はすべてをまとめて数えます。",
    "The player with the highest rating at each game right now. Ratings are separate for each game, and the {link} counts everything together.",
  ),
  "players.ladderWord": r(
    "順位表",
    "ranking table",
  ),
  "players.champViews": r(
    "名人の表の見方",
    "How to read the champions table",
  ),
  "players.viewFull": r(
    "詳細",
    "In full",
  ),
  "players.viewSimple": r(
    "簡易",
    "Simple",
  ),

  // The Players page
  "players.buddiesNeedAccount": r(
    "仲間とは、また会いたい人のことです。サインインして、会員一覧で誰かに星を付けると、ここに並びます。",
    "A buddy is someone you want to meet again. Sign in and put a star on someone in the members list, and they line up here.",
  ),
  "players.honorsLead": r(
    "ここには来なかった対局者で、よそでの記録が名前ごとに保存されています。保存された記録には、その向こうに誰もいません。対局を申し込むことも、これから戦うこともできません。",
    "These are players who never came here, and whose records from elsewhere are kept under their names. A kept record has no one on the other side of it. You cannot propose a game to them, and nothing can be fought for.",
  ),
  "players.strengthTitle": r(
    "ゲーム別の強さ",
    "Strength by game",
  ),
  "players.strengthLevel": r(
    "{them}と互角（{score}）",
    "even with {them} ({score})",
  ),
  "players.strengthBeats": r(
    "{winner}が{loser}に勝ち越し（{score}）",
    "{winner} wins more than {loser} ({score})",
  ),
  "players.strengthNote": r(
    "ここで実際に対局させ、組み合わせごとに{games}局、先後を交互にして、実際の対局で1手に使える時間配分と同じ条件で測りました。測定日：{on}。",
    "The games were actually played out here, {games} games per pairing with the sides alternating, under the same time budget a move gets in a real game. Measured on {on}.",
  ),

  // What kind of member somebody is: the badge on the unusual rows, and what hovering it says
  "players.kindOperator": r(
    "管理者",
    "Administrator",
  ),
  "players.kindOperatorNote": r(
    "サイトを運営しています。会員表ではなく、公開時の設定で指定されています。",
    "Runs the site. Specified in the deployment settings, not in the members table.",
  ),
  "players.kindRobot": r(
    "コンピュータ",
    "Computer",
  ),
  "players.kindRobotNote": r(
    "対局するプログラムで、ほかの人と同じようにレーティングされます。",
    "A program that plays, and is rated like anyone else.",
  ),
  "players.kindRemembered": r(
    "偲ぶ",
    "Remembering",
  ),
  "players.kindRememberedNote": r(
    "その方の記録はここに残っていますが、ご本人はここにいません。",
    "Their record is kept here, but the person is not here.",
  ),
  "players.kindHonorary": r(
    "名誉",
    "Honorary",
  ),
  "players.kindHonoraryNote": r(
    "ここで対局したことはなく、ご本人の記録として残しています。",
    "They never played here, and their own record is kept.",
  ),
  "players.kindKeptRecord": r(
    "保存された記録",
    "Kept record",
  ),
  "players.kindKeptRecordNote": r(
    "このサイトより前の記録で、アカウントはありません。",
    "A record from before this site, with no account behind it.",
  ),
  "players.kindSeed": r(
    "初期登録",
    "Initially registered",
  ),
  "players.kindSeedNote": r(
    "サイトの準備時に登録されたもので、誰かが参加して作ったものではありません。",
    "Registered when the site was prepared, not created by someone joining.",
  ),
  "players.kindTest": r(
    "テスト",
    "Test",
  ),
  "players.kindTestNote": r(
    "テスト用に作られた架空の対局者で、テストモードの管理者にだけ表示されます。",
    "A simulated player made for testing, shown only to the administrator in Test mode.",
  ),
  "players.kindMember": r(
    "会員",
    "Member",
  ),
  "players.kindMemberNote": r(
    "通常のアカウントです。",
    "An ordinary account.",
  ),
};
