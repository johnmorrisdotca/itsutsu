import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the live.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_LIVE: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // A board that has stopped checking for moves
  "live.pausedLine": {
    text: "しばらく動きがないため、この盤は手の確認を止めています。",
    back: "Nothing has happened here for a while, so this board has stopped checking for moves.",
    review: AGENT_READ,
  },
  "live.pausedCheck": {
    text: "今すぐ確認",
    back: "Check now",
    review: AGENT_READ,
  },
  "live.pausedNextIn": {
    text: "{seconds}秒後に手を確認します",
    back: "It will check for a move in {seconds} seconds",
    review: AGENT_READ,
  },
  "live.pausedChecking": {
    text: "手を確認しています…",
    back: "Checking for a move…",
    review: AGENT_READ,
  },
  // An address that asked for more than the game offers
  "live.unreadOne": {
    text: "このアドレスの一部は、このゲームにない設定だったので、通常の設定のままにしました：{names}。",
    back: "Part of this address is a setting this game does not have, so it was left at the usual setting: {names}.",
    review: AGENT_READ,
  },
  "live.unreadMany": {
    text: "このアドレスの一部は、このゲームにない設定だったので、通常の設定のままにしました：{names}。",
    back: "Part of this address is a setting this game does not have, so they were left at the usual setting: {names}.",
    review: AGENT_READ,
  },
  // The previews on the set-up screen
  "live.previewIs": {
    text: "{game}の盤のプレビューです。ここでの操作は手になりません。",
    back: "A preview of the board of {game}. Nothing done here counts as a move.",
    review: AGENT_READ,
  },
  "live.previewMahjong": {
    text: "この配置の一例です。実際の配牌は、始めるときに行われます。",
    back: "An example of this layout. The real deal is made when you start.",
    review: AGENT_READ,
  },
  "live.previewPuzzle": {
    text: "{puzzle}の盤面のプレビューです。まだ何も書き込まれていません。",
    back: "A preview of the grid of {puzzle}. Nothing has been written yet.",
    review: AGENT_READ,
  },
  "live.previewCards": {
    text: "{game}の配り方の一例で、山札を1回めくった状態です。まだ何も遊んでいません。",
    back: "An example of a deal of {game}, with the stock turned once. Nothing has been played yet.",
    review: AGENT_READ,
  },
  "live.previewDealt": {
    text: "このゲームは盤面をランダムに散らすので、実際に遊ぶ盤とは違います。",
    back: "This game scatters its board at random, so the board you play will be different.",
    review: AGENT_READ,
  },
  // Playing a particular opponent
  "live.against": {
    text: "{who}と対局",
    back: "Playing {who}",
    review: AGENT_READ,
  },
  "live.againstHint": {
    text: "対局する相手は{who}です。ゲームと規則を選んで始めると、すぐ相手の一覧に入ります。相手が承諾する必要はありません。",
    back: "Your opponent is {who}. When you choose the game and the rules and start, it goes straight into their list. They do not need to accept.",
    review: AGENT_READ,
  },
  "live.again": {
    text: "{who}ともう一局",
    back: "Another game with {who}",
    review: AGENT_READ,
  },
  "live.againHint": {
    text: "前回の{who}との対局と同じ盤、同じ規則、同じ時計で、色を入れ替えて打ちます。今回は{colour}です。下の項目はすべて入力済みで、確認だけで始められます。変えたいところがあれば変更してください。",
    back: "The same board, rules and clock as last time against {who}, with the colours swapped. This time you are {colour}. Everything below is already filled in, so you only need to confirm. Change anything you want to be different.",
    review: AGENT_READ,
  },
  "live.againChanged": {
    text: "設定を変えたので、前回の再戦ではなく、同じ相手との新しい対局になります。色は通常どおりに決まり、自分が先手です。",
    back: "You changed a setting, so this is a new game against the same player, not a rematch of the last one. The colours are decided the usual way, and you play first.",
    review: AGENT_READ,
  },
  "live.againElsewhere": {
    text: "{chosen}を選んだので、この規則での新しい対局になります。{them}との前回の対局の再戦ではなく、色も入れ替わりません。",
    back: "You chose {chosen}, so this is a new game with these rules. It is not a rematch of your last game against {them}, and the colours are not swapped.",
    review: AGENT_READ,
  },
  "live.againNobody": {
    text: "{them}とは対局しないことを選んだので、この規則での新しい対局になります。{them}との前回の対局の再戦ではなく、色も入れ替わりません。",
    back: "You chose not to play {them} again, so this is a new game with these rules. It is not a rematch of your last game against {them}, and the colours are not swapped.",
    review: AGENT_READ,
  },
  "live.fork": {
    text: "{move}手目から続ける",
    back: "Continue from move {move}",
    review: AGENT_READ,
  },
  "live.forkHint": {
    text: "{move}手目の局面から、{who}と2つ目の対局を始めます。元の対局はそのまま残ります。盤、ゲーム、開局ルールは局面とともに引き継がれ、変えられません。時計とレーティングに数えるかどうかは、この対局で決められます。",
    back: "A second game starts from the position after move {move}, against {who}. The original game stays as it is. The board, the game and the opening come with the position and cannot be changed. The clock and whether it counts for rating are decided for this game.",
    review: AGENT_READ,
  },
  "live.forkAlone": {
    text: "元の対局では、もう一方の席に誰もいなかったので、1つの画面で打つ盤になります。始めてから、もう一方の席を渡してください。",
    back: "Nobody was in the other seat in the original game, so this becomes a board on one screen. Start it, and then hand the other seat to someone.",
    review: AGENT_READ,
  },
  // A head start and a handicap
  "live.headStartFor": {
    text: "先行を与える側",
    back: "The side given a head start",
    review: AGENT_READ,
  },
  "live.headStartHint": {
    text: "弱いほうの側に与えるスタートです。最初に打てる手数と、そのゲーム固有の伝統的な先行があればそれを含みます。先行のある対局はレーティングに数えません。互角の対局にするときは「なし」のままにしてください。",
    back: "A start for the weaker side. It includes moves in hand at the beginning, and the game's own traditional head start if it has one. A game with a head start does not count for rating. Leave it at None for an even game.",
    review: AGENT_READ,
  },
  "live.headStartNone": {
    text: "なし",
    back: "None",
    review: AGENT_READ,
  },
  "live.freeTurns": {
    text: "先行の手数",
    back: "Number of head-start moves",
    review: AGENT_READ,
  },
  "live.freeTurnsHint": {
    text: "最初に、相手が応じる前に、{colour}がこの手数だけ続けて打ちます。それぞれ、棋譜には相手のパスとして記録されます。",
    back: "At the very start, {colour} plays this many moves in a row before the other side answers. Each one appears in the record as a pass by the other side.",
    review: AGENT_READ,
  },
  "live.handicapFor": {
    text: "厳しい規則を課す側",
    back: "The side given harder rules",
    review: AGENT_READ,
  },
  "live.handicapHint": {
    text: "片方の色には追加の制限がかかり、もう片方は通常の規則で打ちます。昔のサイトで、強い人が弱い人に有利な条件を与えていた方法です。互角の対局にするときは「なし」のままにしてください。",
    back: "One colour plays under extra restrictions and the other plays the plain game. It is how the old sites let a stronger player give a weaker one an advantage. Leave it at None for an even game.",
    review: AGENT_READ,
  },
  "live.handicapOpen": {
    text: "{colour}は、下で入れた制限をすべて受けて打ちます。もう一方の色は通常の規則で打ちます。必要なものだけを入れてください。どれも{lower}の側を不利にします。",
    back: "{colour} plays under every restriction switched on below, and the other colour plays the game as it is. Switch on only what you mean, because each one puts {lower} at a disadvantage.",
    review: AGENT_READ,
  },
  "live.noHandicap": {
    text: "先行なし、ハンデなし。互角の対局",
    back: "No head start, no handicap: an even game",
    review: AGENT_READ,
  },
  // Asking somebody who does not play this game
  "live.notAtThisGame": {
    text: "{who}は{game}を遊ばないので、このままでは誰でも座れる席が作られます。ゲームを戻すか、ほかの人を選んでください。",
    back: "{who} does not play {game}, so this would put up a seat anyone can take. Change the game back or choose someone else.",
    review: AGENT_READ,
  },
  "live.opponentFixed": {
    text: "相手のページから指定されています。別の人にしたいときは、ここで変更してください。",
    back: "Chosen from their page. Change it here if you meant someone else.",
    review: AGENT_READ,
  },
  "live.startOver": {
    text: "最初から設定し直す",
    back: "Set up again from the beginning",
    review: AGENT_READ,
  },
  "live.startLeads": {
    text: "相手の席は、まさにこのゲームです。押すと、盤の向かい側に着席します。",
    back: "Their seat is at exactly this game. Press, and you sit opposite them at the board.",
    review: AGENT_READ,
  },
  "live.beginHere": {
    text: "「始める」を押すまで、何も記録されません。次に見えるのは盤です。",
    back: "Nothing is recorded until you press Start. The next thing you see is the board.",
    review: AGENT_READ,
  },
  "live.board": {
    text: "対局へ",
    back: "To the game",
    review: AGENT_READ,
  },
  "live.continueToSeat": {
    text: "{who}の向かいに座る",
    back: "Sit down opposite {who}",
    review: AGENT_READ,
  },
  // Choosing colour and number of games
  "live.youPlay": {
    text: "自分の色",
    back: "My colour",
    review: AGENT_READ,
  },
  "live.black": {
    text: "黒（先手）",
    back: "Black (plays first)",
    review: AGENT_READ,
  },
  "live.white": {
    text: "白（後手）",
    back: "White (plays second)",
    review: AGENT_READ,
  },
  "live.lot": {
    text: "ランダム",
    back: "Random",
    review: AGENT_READ,
  },
  "live.gamesLabel": {
    text: "局数",
    back: "Number of games",
    review: AGENT_READ,
  },
  "live.gamesOne": {
    text: "1局",
    back: "One game",
    review: AGENT_READ,
  },
  "live.gamesMany": {
    text: "{count}局、色を交互に",
    back: "{count} games, colours alternating",
    review: AGENT_READ,
  },
  "live.gamesSaid": {
    text: "{count}局の番勝負。色は1局ごとに交代します。",
    back: "A match of {count} games. The colours alternate every game.",
    review: AGENT_READ,
  },
  // The sections and their folds
  "live.sectionOpponent": {
    text: "対戦相手",
    back: "Opponent",
    review: AGENT_READ,
  },
  "live.sectionRules": {
    text: "規則",
    back: "Rules",
    review: AGENT_READ,
  },
  "live.sectionHandicap": {
    text: "ハンデ",
    back: "Handicap",
    review: AGENT_READ,
  },
  "live.foldChange": {
    text: "変更",
    back: "Change",
    review: AGENT_READ,
  },
  "live.foldDone": {
    text: "完了",
    back: "Done",
    review: AGENT_READ,
  },
  "live.foldAmong": {
    text: "{count}件から選べます",
    back: "{count} to choose from",
    review: AGENT_READ,
  },
  "live.postedWhere": {
    text: "誰かが座るまで、ゲームのページで待っています。",
    back: "It waits on the Games page until somebody takes it.",
    review: AGENT_READ,
  },
  "live.elsewhere": {
    text: "ここにいない人は、{link}で探して「対局する」を押してください。その人が選ばれた状態でここに来ます。",
    back: "If someone is not listed here, find them on the {link} and press Play. They will arrive here already chosen.",
    review: AGENT_READ,
  },
  "live.elsewhereLink": {
    text: "対局者のページ",
    back: "players page",
    review: AGENT_READ,
  },
  // The rules beside a game that has begun
  "live.settled": {
    text: "この対局が作られる前に決めたものです。いまは何も変更できません。",
    back: "These were agreed before this game was created. Nothing here can be changed now.",
    review: AGENT_READ,
  },
  "live.handicapMeans": {
    text: "ハンデのある色にはその追加制限がかかり、もう一方の色は通常の規則で打ちます。",
    back: "The colour with the handicap plays under those extra restrictions, and the other colour plays the plain game.",
    review: AGENT_READ,
  },
  "live.headStartMeans": {
    text: "先行を与えられた色は、相手が応じる前に先行の手を打ちます。伝統的な先行がある場合は、最初の手から盤上に置かれています。",
    back: "The colour given a head start plays its head-start moves before the other side answers. A traditional head start, if there is one, is on the board from the first move.",
    review: AGENT_READ,
  },
  "live.signInToPlay": {
    text: "サインインすると、誰かとの対局を始められます。",
    back: "Sign in to start a game against somebody.",
    review: AGENT_READ,
  },
  "live.askNeedsAccount": {
    text: "会員やコンピュータを指名すると、その相手に対局を申し込むことになり、アカウントが必要です。招待コードだけではアカウントになりません。誰でも座れる席と、1つの画面で2人で打つ対局は、いまのまま使えます。",
    back: "Naming a member or a computer offers them a game, and that needs an account. An invite code alone does not make an account. A seat anyone can take, and a game for two on one screen, work as you are.",
    review: AGENT_READ,
  },
  // The doorstep: what will be played, before it exists
  "live.doorstepTitle": {
    text: "開始の確認",
    back: "Confirm the start",
    review: AGENT_READ,
  },
  "live.doorstepNote": {
    text: "これから打つ内容です。まだ何も記録されていません。",
    back: "This is what will be played. Nothing has been recorded yet.",
    review: AGENT_READ,
  },
  "live.sit": {
    text: "{who}の向かいに座る",
    back: "Sit down opposite {who}",
    review: AGENT_READ,
  },
  "live.change": {
    text: "設定を変更",
    back: "Change the settings",
    review: AGENT_READ,
  },
  "live.drawnFrom": {
    text: "「始める」を押したときに、{names}からランダムに選ばれるコンピュータ",
    back: "a computer chosen at random from {names} when you press Start",
    review: AGENT_READ,
  },
  "live.made": {
    text: "この対局はすでに始めています。下のボタンは、2つ目を作らずに、その盤を開きます。",
    back: "You have already begun this game. The button below opens its board instead of making a second one.",
    review: AGENT_READ,
  },
  "live.another": {
    text: "同じ設定でもう1局始める",
    back: "Start one more with the same settings",
    review: AGENT_READ,
  },
  "live.refused": {
    text: "その対局を始められませんでした。",
    back: "That game could not be started.",
    review: AGENT_READ,
  },
  "live.rematchOf": {
    text: "{them}との前回の対局の再戦です。色は入れ替わります。",
    back: "A rematch of your last game against {them}, with the colours swapped.",
    review: AGENT_READ,
  },
  "live.rematchChanged": {
    text: "{them}との新しい対局で、再戦ではありません。前回と規則が違うので、色は入れ替わりません。",
    back: "A new game against {them}, not a rematch. The rules differ from your last game, so the colours are not swapped.",
    review: AGENT_READ,
  },
  "live.notRematch": {
    text: "新しい対局で、{them}との前回の対局の再戦ではありません。別の相手を選んだので、色は入れ替わりません。",
    back: "A new game, not a rematch of your last game against {them}. You chose a different opponent, so the colours are not swapped.",
    review: AGENT_READ,
  },
  "live.seatGone": {
    text: "先にほかの人がその席に座りました。もう一度「始める」を押すと、自分の対局が始まります。",
    back: "Somebody else took that seat first. Press Start again to begin a game of your own.",
    review: AGENT_READ,
  },
  "live.goneTaken": {
    text: "先にほかの人がその席に座ったので、このままでは自分の新しい対局になります。",
    back: "Somebody else took that seat first, so this would become a new game of your own.",
    review: AGENT_READ,
  },
  "live.goneFinished": {
    text: "その対局はすでに終わっているので、座れる席はありません。",
    back: "That game has finished, so there is no seat to take.",
    review: AGENT_READ,
  },
  "live.goneMissing": {
    text: "その席は掲示板になくなったので、このままでは自分の新しい対局になります。",
    back: "That seat is no longer on the noticeboard, so this would become a new game of your own.",
    review: AGENT_READ,
  },
  "live.goneOtherGame": {
    text: "その席は別のゲームのものなので、このページの席ではありません。",
    back: "That seat is for a different game, so it is not the seat this page is about.",
    review: AGENT_READ,
  },
  "live.goneOtherRules": {
    text: "その席の対局は、ここで選んだものと設定が違うので、このままでは自分の新しい対局になります。",
    back: "That seat's game is set up differently from the one chosen here, so this would become a new game of your own.",
    review: AGENT_READ,
  },
  // A match of several games, and an offer
  "live.matchTitle": {
    text: "番勝負",
    back: "Match",
    review: AGENT_READ,
  },
  "live.matchLead": {
    text: "同じ2人による{size}局のうちの1局です。色は交互に入れ替わります。",
    back: "One of {size} games between the same two players, with the colours alternating.",
    review: AGENT_READ,
  },
  "live.matchGame": {
    text: "第{index}局",
    back: "Game {index}",
    review: AGENT_READ,
  },
  "live.matchYou": {
    text: "自分は{colour}",
    back: "I am {colour}",
    review: AGENT_READ,
  },
  "live.matchHere": {
    text: "この対局",
    back: "this game",
    review: AGENT_READ,
  },
  "live.matchOffered": {
    text: "返事待ち",
    back: "waiting for an answer",
    review: AGENT_READ,
  },
  "live.matchPlaying": {
    text: "対局中",
    back: "in progress",
    review: AGENT_READ,
  },
  "live.matchBlack": {
    text: "黒の勝ち",
    back: "Black won",
    review: AGENT_READ,
  },
  "live.matchWhite": {
    text: "白の勝ち",
    back: "White won",
    review: AGENT_READ,
  },
  "live.matchDrawn": {
    text: "引き分け",
    back: "drawn",
    review: AGENT_READ,
  },
  "live.matchDeclined": {
    text: "断られた",
    back: "turned down",
    review: AGENT_READ,
  },
  "live.matchWithdrawn": {
    text: "取り下げ",
    back: "withdrawn",
    review: AGENT_READ,
  },
  "live.offerToMeTitle": {
    text: "この対局は申し込みです",
    back: "This game is an offer",
    review: AGENT_READ,
  },
  "live.offerToMeLead": {
    text: "{who}からこの対局の申し込みがありました。下の盤と規則が、これから打つ内容です。承諾するまで、どちらも手を打てません。断ると、結果もレーティングもどちらの戦績にも残さずに終わり、{who}はいつでもまた申し込めます。",
    back: "{who} has offered you this game. The board and rules below are what you would play. Neither of you can make a move until you accept. If you decline, it ends with no result, no rating and nothing on either record, and {who} can always offer again.",
    review: AGENT_READ,
  },
  "live.offerFromMeTitle": {
    text: "自分の申し込み",
    back: "My offer",
    review: AGENT_READ,
  },
  "live.offerFromMeLead": {
    text: "{who}の返事を待っています。時計は動いておらず、相手が承諾するまで、どちらも手を打てません。取り下げても誰にも不利益はなく、また申し込めます。",
    back: "Waiting for {who}. No clock is running, and neither of you can move until they accept. Withdrawing costs nobody anything, and you can offer again.",
    review: AGENT_READ,
  },
  "live.thinking": {
    text: "考え中…",
    back: "Thinking…",
    review: AGENT_READ,
  },
  // Placing a move that is confirmed before it is sent
  "live.submit": {
    text: "この手を確定",
    back: "Confirm this move",
    review: AGENT_READ,
  },
  "live.submitToNext": {
    text: "確定して次の対局へ",
    back: "Confirm, then go to the next game",
    review: AGENT_READ,
  },
  "live.submitToSame": {
    text: "確定して次の{game}へ",
    back: "Confirm, then go to the next {game}",
    review: AGENT_READ,
  },
  "live.submitToMyGames": {
    text: "確定して対局中の一覧へ",
    back: "Confirm, then go to my games",
    review: AGENT_READ,
  },
  "live.startMoveOver": {
    text: "この手をやり直す",
    back: "Redo this move",
    review: AGENT_READ,
  },
  "live.placedAt": {
    text: "{point}に置きました",
    back: "Placed at {point}",
    review: AGENT_READ,
  },
  "live.nudge": {
    text: "1点動かす",
    back: "Move it one point",
    review: AGENT_READ,
  },
  "live.nudgeUp": {
    text: "1点上へ",
    back: "Up one point",
    review: AGENT_READ,
  },
  "live.nudgeDown": {
    text: "1点下へ",
    back: "Down one point",
    review: AGENT_READ,
  },
  "live.nudgeLeft": {
    text: "1点左へ",
    back: "Left one point",
    review: AGENT_READ,
  },
  "live.nudgeRight": {
    text: "1点右へ",
    back: "Right one point",
    review: AGENT_READ,
  },
  // Go help, beside a Go board
  "live.goHelpTitle": {
    text: "囲碁の手引き",
    back: "Guide to Go",
    review: AGENT_READ,
  },
  "live.stones.one": {
    text: "{count}子",
    back: "{count} stone",
    review: AGENT_READ,
  },
  "live.stones.other": {
    text: "{count}子",
    back: "{count} stones",
    review: AGENT_READ,
  },
  "live.goPassed": {
    text: "{them}がパスしました。こちらもパスすると、対局が終わって数えられます。打つ価値のある場所がなくなったら、そうしてください。自分の地の中に打っても得はありません。",
    back: "{them} passed. If you pass too, the game ends and is counted. Do that when there is nothing left worth playing. A stone inside your own territory gains nothing.",
    review: AGENT_READ,
  },
  "live.goAtariMine": {
    text: "{at}の自分のかたまり（{stones}）は、呼吸点があと1つ（{liberty}）です。広げないと取られます。",
    back: "Your group at {at} ({stones}) has one liberty left, at {liberty}. Give it room or it will be captured.",
    review: AGENT_READ,
  },
  "live.goAtariTheirs": {
    text: "{them}の{at}のかたまり（{stones}）は、呼吸点があと1つです。{liberty}に打つと取れます。",
    back: "{them}'s group at {at} ({stones}) has one liberty left. Play {liberty} to capture it.",
    review: AGENT_READ,
  },
  "live.goFillsOwnEye": {
    text: "{placed}は、自分の眼の1つを埋めます。眼は、石のかたまりが生きるための空点です。眼が2つあるかたまりは決して取られませんが、1つだと取られます。意図したのでなければ、やり直してください。",
    back: "{placed} fills one of your own eyes, the empty points a group lives by. A group with two eyes can never be captured, but with one it can. Redo it unless you meant it.",
    review: AGENT_READ,
  },
  "live.goSelfAtari": {
    text: "{placed}のあと、自分のかたまりは呼吸点があと1つになり、相手が次の1手で取ります。意図したのでなければ、やり直してください。",
    back: "After {placed}, your group has one liberty left, and the other side captures it with the next stone. Redo it unless you meant it.",
    review: AGENT_READ,
  },
  "live.goHowToWin": {
    text: "囲碁の勝ち方：石を置いて、相手より広く盤を囲います。隣に空点のないかたまりは、盤から取り除かれます。別々の眼が2つあるかたまりは、決して取られません。どちらにも有効な手がなくなったら、双方がパスし、それぞれ自分の石と囲んだ地を数えます。白は後手なので、6.5目のコミがつきます。",
    back: "How Go is won: place stones to surround more of the board than your opponent. A group with no empty point next to it is removed from the board. A group with two separate eyes can never be captured. When neither side has anything useful left, both pass, and each counts their stones plus the territory they surrounded. White moves second, so it receives 6.5 points of komi.",
    review: AGENT_READ,
  },
  // A note sent with a move
  "live.noteOpen": {
    text: "メモを添える ✎",
    back: "Add a note ✎",
    review: AGENT_READ,
  },
  "live.noteLabel": {
    text: "この手のメモ",
    back: "A note with this move",
    review: AGENT_READ,
  },
  "live.notePlaceholder": {
    text: "この手にひとこと添える（任意）",
    back: "Add a few words to this move (optional)",
    review: AGENT_READ,
  },
  "live.noteClose": {
    text: "メモなし",
    back: "No note",
    review: AGENT_READ,
  },
  // The press that begins a game
  "live.start": {
    text: "始める",
    back: "Start",
    review: AGENT_READ,
  },
  "live.startAlone": {
    text: "ひとりで始める",
    back: "Start alone",
    review: AGENT_READ,
  },
  "live.startFriend": {
    text: "友だちと始める",
    back: "Start with a friend",
    review: AGENT_READ,
  },
  "live.startResume": {
    text: "続ける",
    back: "Continue",
    review: AGENT_READ,
  },
  "live.kept.one": {
    text: "途中のものが1つあります",
    back: "You have one in progress",
    review: AGENT_READ,
  },
  "live.kept.other": {
    text: "途中のものが{count}つあります",
    back: "You have {count} in progress",
    review: AGENT_READ,
  },
  "live.keptContinue": {
    text: "{run}を続ける",
    back: "Continue your {run}",
    review: AGENT_READ,
  },
  "live.keptNote": {
    text: "下の「始める」は、この画面で選んだものを始めます。途中のものはそのまま残ります。",
    back: "The Start below begins what is chosen on this screen. The one in progress stays as it is.",
    review: AGENT_READ,
  },
  "live.keptMyGames": {
    text: "途中のものはすべて「自分の対局」にあります",
    back: "All of the ones in progress are in My games",
    review: AGENT_READ,
  },
  "live.starting": {
    text: "開始しています…",
    back: "Starting…",
    review: AGENT_READ,
  },
  // Your pieces' colour, at set-up and beside a board
  "live.yourPieces": {
    text: "自分の駒",
    back: "My pieces",
    review: AGENT_READ,
  },
  "live.ownStones": {
    text: "このゲームの標準の石",
    back: "The game's standard stones",
    review: AGENT_READ,
  },
  "live.pieceColourLabel": {
    text: "自分の駒の色",
    back: "The colour of my pieces",
    review: AGENT_READ,
  },
  "live.seatColourFirst": {
    text: "最初の手の前に、{colour}の石の色を選べます。そのままにもできます。",
    back: "before your first move you can choose a colour for the {colour} stones. You can also leave them as they are.",
    review: AGENT_READ,
  },
  "live.seatColourChosen": {
    text: "{colour}は{name}です。いまでも、いつでも変えられます。",
    back: "{colour} is {name}. You can change it now or at any time.",
    review: AGENT_READ,
  },
  "live.seatColourLine": {
    text: "自分の駒・{colour}",
    back: "My pieces, {colour}",
    review: AGENT_READ,
  },
  "live.seatColourLineNamed": {
    text: "自分の駒・{colour}、{name}",
    back: "My pieces, {colour}, {name}",
    review: AGENT_READ,
  },
  "live.seatColourUsual": {
    text: "{colour}の石（通常）",
    back: "{colour} stones (usual)",
    review: AGENT_READ,
  },
  "live.seatColourPlaying": {
    text: "{colour}番としての自分の色",
    back: "My colour, as {colour}",
    review: AGENT_READ,
  },
  "live.seatColourFailed": {
    text: "その色を保存できませんでした。もう一度試してください。",
    back: "That colour could not be saved. Please try again.",
    review: AGENT_READ,
  },
  // Inviting somebody to a seat
  "live.inviteTitle": {
    text: "招待リンク",
    back: "Invitation links",
    review: AGENT_READ,
  },
  "live.inviteBody": {
    text: "対局者に、それぞれ専用のリンクを送ります。リンクを開いた人がその色を持つので、席がまだ誰かを待っている間だけ表示されます。着席したあとは、招待ではなく、その人の認証情報になります。",
    back: "Send each player their own link. Whoever opens it takes that colour, so it is shown only while the seat is still waiting for somebody. After they sit down, it is their credential rather than an invitation.",
    review: AGENT_READ,
  },
  "live.inviteMessage": {
    text: "五目並べの自分の席（{colour}）：{url}",
    back: "Your seat in our gomoku game ({colour}): {url}",
    review: AGENT_READ,
  },
  "live.youMark": {
    text: "自分",
    back: "Me",
    review: AGENT_READ,
  },
  "live.qrAlt": {
    text: "{name}の席のQRコード",
    back: "QR code for the {name} seat",
    review: AGENT_READ,
  },
  "live.seatLink": {
    text: "{name}の席のリンク",
    back: "Link to the {name} seat",
    review: AGENT_READ,
  },
  "live.copied": {
    text: "コピーしました",
    back: "Copied",
    review: AGENT_READ,
  },
  "live.copyLink": {
    text: "リンクをコピー",
    back: "Copy the link",
    review: AGENT_READ,
  },
  "live.textIt": {
    text: "SMSで送る",
    back: "Send by text message",
    review: AGENT_READ,
  },
  // Starting a game to share between two devices
  "live.sharedTitle": {
    text: "2台の端末で対局",
    back: "Play on two devices",
    review: AGENT_READ,
  },
  "live.postSeatNote": {
    text: "席を掲示します。対局を始めると、もう一方の席が、最初に応じた人のためにゲームのページに載ります。先にゲームや盤を変えるには、盤の下の「設定」を使ってください。",
    back: "Putting up a seat. When you start the game, the other seat goes on the games page for whoever answers first. To change the game or the board first, use Settings under the board.",
    review: AGENT_READ,
  },
  "live.sharedHere": {
    text: "ここの盤はこのブラウザだけの対局で、このブラウザの中にとどまります。共有する対局には専用のアドレスと、各対局者用のQRコードがつくので、2台の端末から交代で打てます。",
    back: "The board here is a game on this browser only, and it stays in this browser. A shared game gets its own address and a QR code for each player, so you can take turns from two devices.",
    review: AGENT_READ,
  },
  "live.startShared": {
    text: "共有する対局を始める",
    back: "Start a shared game",
    review: AGENT_READ,
  },
  "live.startSharedFailed": {
    text: "共有する対局を始められませんでした。もう一度試してください。",
    back: "A shared game could not be started. Please try again.",
    review: AGENT_READ,
  },
  // A clock beside a live board
  "live.giveTimeHint": {
    text: "この手について、相手の時計に時間を足します。時計で勝つ必要は誰にもありません。",
    back: "Adds time to the other side's clock for this move. Nobody has to win on the clock.",
    review: AGENT_READ,
  },
  "live.giveTime": {
    text: "時間を足す",
    back: "Give more time",
    review: AGENT_READ,
  },
  "live.timeBudgets": {
    text: "対局全体の残り時間：{black} {blackTime}・{white} {whiteTime}",
    back: "Time left for the whole game: {black} {blackTime}, {white} {whiteTime}",
    review: AGENT_READ,
  },
  "live.forfeitLine": {
    text: "{colour}は、{note}",
    back: "{colour}: {note}",
    review: AGENT_READ,
  },
  "live.timeCouldNotBeGiven": {
    text: "時間を足せませんでした。",
    back: "The time could not be added.",
    review: AGENT_READ,
  },
  "live.couldNotClaim": {
    text: "請求できませんでした。",
    back: "That could not be claimed.",
    review: AGENT_READ,
  },
  // The line over a live board
  "live.winsResign": {
    text: "{colour}の勝ちです（相手が投了）。",
    back: "{colour} wins (the other side resigned).",
    review: AGENT_READ,
  },
  "live.winsOver": {
    text: "{colour}の勝ちです。対局は終わりました。",
    back: "{colour} wins. The game is over.",
    review: AGENT_READ,
  },
  "live.winsDiscs": {
    text: "{colour}が石の数で勝ちました（{black}対{white}）。",
    back: "{colour} wins on discs ({black} to {white}).",
    review: AGENT_READ,
  },
  "live.winsCamp": {
    text: "{colour}の勝ちです。向こう側の陣地が埋まりました。",
    back: "{colour} wins. The far camp is full.",
    review: AGENT_READ,
  },
  "live.winsConnection": {
    text: "{colour}の勝ちです。盤の両側がつながりました。",
    back: "{colour} wins. Their two sides are joined.",
    review: AGENT_READ,
  },
  "live.winsBlocked": {
    text: "{colour}の勝ちです。相手に打てる手がなくなりました。",
    back: "{colour} wins. The other side has no move left.",
    review: AGENT_READ,
  },
  "live.winsIn": {
    text: "{colour}の勝ちです（{moves}）。",
    back: "{colour} wins ({moves}).",
    review: AGENT_READ,
  },
  "live.finished": {
    text: "{when}に終了",
    back: "Finished at {when}",
    review: AGENT_READ,
  },
  "live.offerToMeBold": {
    text: "{who}からこの対局の申し込みです",
    back: "{who} has offered you this game",
    review: AGENT_READ,
  },
  "live.offerToMeRest": {
    text: "盤を見てから、承諾するか断ってください。断っても何も失わず、結果もレーティングも戦績にも残りません。",
    back: "Look at the board, and then accept or decline. Declining costs you nothing: no result, no rating, and nothing on your record.",
    review: AGENT_READ,
  },
  "live.offerFromMeBold": {
    text: "{who}に申し込み中",
    back: "Offered to {who}",
    review: AGENT_READ,
  },
  "live.offerFromMeRest": {
    text: "相手が承諾するまで何も始まらず、時計も動きません。いつでも取り下げられます。",
    back: "Nothing starts until they accept, and no clock is running. You can withdraw it at any time.",
    review: AGENT_READ,
  },
  "live.awaitingBold": {
    text: "相手を待っています",
    back: "Waiting for an opponent",
    review: AGENT_READ,
  },
  "live.awaitingRest": {
    text: "席のリンクは下にあります。誰かに送るか、そのままにしておくと、誰かが座ったときにお知らせします。先に最初の手を打っても構いません。",
    back: "Your seat link is below. Send it to somebody, or leave it as it is and you will be told when it is taken. You may play your first move now if you prefer.",
    review: AGENT_READ,
  },
  "live.watching": {
    text: "観戦中です。{colour}の手番です。",
    back: "You are watching. It is {colour}'s turn.",
    review: AGENT_READ,
  },
  "live.yourMove": {
    text: "自分の手番です。自分は{colour}です。",
    back: "It is your move. You are {colour}.",
    review: AGENT_READ,
  },
  "live.waitingFor": {
    text: "{colour}の手番を待っています…",
    back: "Waiting for {colour}'s move…",
    review: AGENT_READ,
  },
  "live.mayNotPlay": {
    text: "{colour}は、✕の印の点には打てません。",
    back: "{colour} may not play the points marked ✕.",
    review: AGENT_READ,
  },
  "live.ownView": {
    text: "この盤の自分用の向きです。相手の盤は動きません。",
    back: "Your own view of this board. The other player's board does not move.",
    review: AGENT_READ,
  },
  "live.mute": {
    text: "この対局では、この相手のメッセージを非表示にする",
    back: "Hide this opponent's messages in this game",
    review: AGENT_READ,
  },
  "live.playingAgainst": {
    text: "自分は{colour}で、{name}と対局しています。",
    back: "You are playing {colour} against {name}.",
    review: AGENT_READ,
  },
  "live.playingAgainstFrom": {
    text: "自分は{colour}で、{country}の{name}と対局しています。",
    back: "You are playing {colour} against {name} from {country}.",
    review: AGENT_READ,
  },
  "live.awayUntil": {
    text: "{when}まで不在です。期限は止まっています。",
    back: "Away until {when}. Their deadline is waiting.",
    review: AGENT_READ,
  },
  "live.moveCouldNotBePlayed": {
    text: "その手は打てませんでした。",
    back: "That move could not be played.",
    review: AGENT_READ,
  },
  // Messages and reactions
  "live.reactSend": {
    text: "{label}を送る",
    back: "Send {label}",
    review: AGENT_READ,
  },
  "live.reactPlaceholder": {
    text: "ひとこと添える…",
    back: "Add a few words…",
    review: AGENT_READ,
  },
  "live.reactMessage": {
    text: "絵文字といっしょに送るメッセージ",
    back: "A message to send with an emoji",
    review: AGENT_READ,
  },
  "live.reactYou": {
    text: "自分",
    back: "Me",
    review: AGENT_READ,
  },
  "live.reactMove": {
    text: "{move}手目",
    back: "move {move}",
    review: AGENT_READ,
  },
  "live.reactLog": {
    text: "{colour}、{move}手目",
    back: "{colour}, move {move}",
    review: AGENT_READ,
  },
  "live.nothingPlayed": {
    text: "まだ何も打たれていません。",
    back: "Nothing has been played yet.",
    review: AGENT_READ,
  },
  "live.moves": {
    text: "棋譜",
    back: "Record of moves",
    review: AGENT_READ,
  },
  "live.puzzleForOne": {
    text: "ひとり用のパズル",
    back: "a puzzle for one person",
    review: AGENT_READ,
  },
  "live.confirmMoves": {
    text: "手を送る前に、毎回確認する",
    back: "Confirm each move before it is sent",
    review: AGENT_READ,
  },
  "live.moreRules": {
    text: "そのほかの規則",
    back: "More rules",
    review: AGENT_READ,
  },
  // Choosing the game, the board and the rules
  "live.gameLabel": {
    text: "ゲーム",
    back: "Game",
    review: AGENT_READ,
  },
  "live.boardLabel": {
    text: "盤",
    back: "Board",
    review: AGENT_READ,
  },
  "live.familiesLabel": {
    text: "ゲームの系統",
    back: "Families of games",
    review: AGENT_READ,
  },
  "live.openingLabel": {
    text: "開局ルール",
    back: "Opening rule",
    review: AGENT_READ,
  },
  "live.ratingsLabel": {
    text: "レーティング",
    back: "Ratings",
    review: AGENT_READ,
  },
  "live.clockPerMove": {
    text: "持ち時間は1手ごと",
    back: "The time limit is per move",
    review: AGENT_READ,
  },
  "live.clockWholeGame": {
    text: "持ち時間は対局全体",
    back: "The time limit is for the whole game",
    review: AGENT_READ,
  },
  "live.ratedAffects": {
    text: "この対局はレーティングに反映されます",
    back: "This game will affect ratings",
    review: AGENT_READ,
  },
  "live.ratedNot": {
    text: "この対局はレーティングに反映されません",
    back: "This game will NOT affect ratings",
    review: AGENT_READ,
  },
  "live.statementNote": {
    text: "最初の石が置かれたので、これがこの対局の規則です。",
    back: "The first stone has been placed, so these are the rules the game is played under.",
    review: AGENT_READ,
  },
  "live.allowed": {
    text: "許可",
    back: "Allowed",
    review: AGENT_READ,
  },
  "live.notAllowed": {
    text: "不可",
    back: "Not allowed",
    review: AGENT_READ,
  },
  "live.countsTowards": {
    text: "レーティングに反映される",
    back: "Counts towards ratings",
    review: AGENT_READ,
  },
  "live.friendlyUnaffected": {
    text: "親善対局（レーティングに影響なし）",
    back: "Friendly game (ratings are not affected)",
    review: AGENT_READ,
  },
  "live.sourceLine": {
    text: "{description}由来：{from}。",
    back: "{description} It comes from {from}.",
    review: AGENT_READ,
  },
  // Setting up: the heading, and sitting in as yourself
  "live.newGame": {
    text: "新規対局",
    back: "New game",
    review: AGENT_READ,
  },
  "live.setUpLead": {
    text: "対局の条件をすべて、対局が作られる前にここで決めます。「始める」を押すまで、何も始まりません。",
    back: "Everything the game will be played under is decided here, before the game is made. Nothing starts until you press \"Start\".",
    review: AGENT_READ,
  },
  "live.setUp": {
    text: "設定",
    back: "Settings",
    review: AGENT_READ,
  },
  "live.howToPlay": {
    text: "遊び方",
    back: "How to play",
    review: AGENT_READ,
  },
  "live.allGames": {
    text: "すべてのゲーム",
    back: "All games",
    review: AGENT_READ,
  },
  "live.sameOpponent": {
    text: "同じ相手",
    back: "the same opponent",
    review: AGENT_READ,
  },
  "live.sitAsBound": {
    text: "この4つの合言葉は、これで自分のものです。どの端末でも自分として対局でき、誰もサインアウトする必要はありません。",
    back: "These four words are now yours. They let you play as yourself on any device, and nobody has to sign out.",
    review: AGENT_READ,
  },
  "live.sitAsIntro": {
    text: "サインインしているのが自分ではありませんか？4つの合言葉で、自分としてここに着席できます。まだ合言葉がない場合は、選んだ4つが自分のものになります。",
    back: "Is the person signed in not you? You can sit in here as yourself with four words, and if you have none yet, the four you choose become yours.",
    review: AGENT_READ,
  },
  "live.sitAsOpen": {
    text: "4つの合言葉で着席する",
    back: "Sit in with my four words",
    review: AGENT_READ,
    ask: "The \"four words\" a member chooses to sit in as themselves are 合言葉 here. The account pages that set them must use the same word; John to confirm 合言葉 is the one he wants.",
  },
  "live.sitAsHelp": {
    text: "自分の名前を探し、4つの合言葉をタップしてください。入力は不要です。席はこの端末で自分のものになり、アカウントに合言葉がまだない場合は、これが合言葉になります。",
    back: "Find your name and then tap your four words. There is nothing to type. The seat becomes yours on this device, and if your account has no words yet, these become its words.",
    review: AGENT_READ,
  },
  "live.sitAsNobody": {
    text: "この方法で席に着けるアカウントを持つ人は、まだここにいません。",
    back: "Nobody here has an account that can take a seat this way yet.",
    review: AGENT_READ,
  },
  "live.sitAsPickOther": {
    text: "{who}（タップして別の人を選ぶ）",
    back: "{who} (tap to choose somebody else)",
    review: AGENT_READ,
  },
  "live.sitAsEmpty": {
    text: "空き",
    back: "Empty",
    review: AGENT_READ,
  },
  "live.sitAsTakeBack": {
    text: "タップすると、この言葉を取り消せます",
    back: "Tap to remove this word",
    review: AGENT_READ,
  },
  "live.sitAsPrefix": {
    text: "{ordinal}の言葉の最初の文字をタップしてください。",
    back: "Tap a letter to start {ordinal} word.",
    review: AGENT_READ,
  },
  "live.sitAsStarting": {
    text: "「{prefix}」で始まる言葉",
    back: "Words starting with \"{prefix}\"",
    review: AGENT_READ,
  },
  "live.sitAsNothing": {
    text: "その文字で始まる言葉はありません。最初からやり直してください。",
    back: "No word starts that way. Start the word over.",
    review: AGENT_READ,
  },
  "live.sitAsBack": {
    text: "1文字戻す",
    back: "Back one letter",
    review: AGENT_READ,
  },
  "live.sitAsSubmit": {
    text: "着席する",
    back: "Sit down",
    review: AGENT_READ,
  },
  "live.sitAsCancel": {
    text: "取り消す",
    back: "Cancel",
    review: AGENT_READ,
  },
  "live.sitAsFailed": {
    text: "その席に着けませんでした。",
    back: "That seat could not be taken.",
    review: AGENT_READ,
  },
  "live.wordFirst": {
    text: "1つ目",
    back: "the first",
    review: AGENT_READ,
  },
  "live.wordSecond": {
    text: "2つ目",
    back: "the second",
    review: AGENT_READ,
  },
  "live.wordThird": {
    text: "3つ目",
    back: "the third",
    review: AGENT_READ,
  },
  "live.wordFourth": {
    text: "4つ目",
    back: "the fourth",
    review: AGENT_READ,
  },
  "live.wordNext": {
    text: "次",
    back: "the next",
    review: AGENT_READ,
  },
  // The reasons a set-up address could not be used
  "live.problemUnreachable": {
    text: "リンクで指定された人とは対局できません。下から別の人を選んでください。",
    back: "The person named by that link cannot be played against. Choose somebody below.",
    review: AGENT_READ,
  },
  "live.problemNoGame": {
    text: "もう一度対局できるそのような対局はありません。",
    back: "There is no such game to play again.",
    review: AGENT_READ,
  },
  "live.problemStillPlaying": {
    text: "その対局はまだ続いているので、もう一度対局するものはありません。",
    back: "That game is still being played, so there is nothing to play again yet.",
    review: AGENT_READ,
  },
  "live.problemNotYours": {
    text: "その対局は自分が打ったものではないので、再戦を申し込めません。",
    back: "You did not play that game, so there is no rematch to offer.",
    review: AGENT_READ,
  },
  "live.problemOpponentGone": {
    text: "その対局の相手とは、もう対局できません。",
    back: "The person you played that game against cannot be played against again.",
    review: AGENT_READ,
  },
  "live.problemStillAgainst": {
    text: "リンクで指定された人とは対局できないので、{name}との対局のままです。",
    back: "The person named by that link cannot be played against, so this is still against {name}.",
    review: AGENT_READ,
  },
  "live.problemNoPosition": {
    text: "続きを打てるそのような対局はありません。",
    back: "There is no such game to continue from.",
    review: AGENT_READ,
  },
  "live.problemFewMoves": {
    text: "その対局は、指定された局面より手数が少ないです。",
    back: "That game has fewer moves than the position asked for.",
    review: AGENT_READ,
  },
  "live.measured": {
    text: "このゲームでの計測：{them}と互角です。",
    back: "Measured on this game: level with {them}.",
    review: AGENT_READ,
  },
  "live.measuredBeats": {
    text: "このゲームでの計測：{winner}は{loser}に勝ち越しています。",
    back: "Measured on this game: {winner} beats {loser}.",
    review: AGENT_READ,
  },
  "live.openSeatLine": {
    text: "{colour}の席は、ゲームのページに掲示されていて、誰でも座れます。",
    back: "The {colour} seat is put up on the games page, and anyone can take it.",
    review: AGENT_READ,
  },
  "live.startedAt": {
    text: "{when}に開始",
    back: "Started at {when}",
    review: AGENT_READ,
  },
  "live.finishedAt": {
    text: "{when}に終了",
    back: "finished at {when}",
    review: AGENT_READ,
  },
  "live.them": {
    text: "相手",
    back: "the other player",
    review: AGENT_READ,
  },
  "live.swapNote": {
    text: "今回は自分が{colour}",
    back: "this time you take {colour}",
    review: AGENT_READ,
  },
  "live.randomName": {
    text: "ランダムなコンピュータ",
    back: "A random computer",
    review: AGENT_READ,
  },
  "live.randomAgainst": {
    text: "ランダムなコンピュータと対局",
    back: "Playing a random computer",
    review: AGENT_READ,
  },
  "live.randomMeans": {
    text: "上のコンピュータのうち1つが、「始める」を押したときに選ばれます。",
    back: "One of the computers above is chosen when you press Start.",
    review: AGENT_READ,
  },
};
