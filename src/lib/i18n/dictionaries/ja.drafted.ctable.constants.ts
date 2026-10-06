import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the ctable.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_CTABLE: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // Every card table
  "ctable.play": {
    text: "出す",
    back: "Play",
    review: AGENT_READ,
  },
  "ctable.pass": {
    text: "パス",
    back: "Pass",
    review: AGENT_READ,
  },
  "ctable.draw": {
    text: "引く",
    back: "Draw",
    review: AGENT_READ,
  },
  "ctable.playCount": {
    text: "{count}枚を出す",
    back: "Play {count} cards",
    review: AGENT_READ,
  },
  "ctable.chooseCards": {
    text: "出す札を選んでください。",
    back: "Choose the cards to play.",
    review: AGENT_READ,
  },
  "ctable.chooseCard": {
    text: "出す札を選んでください。",
    back: "Choose a card to play.",
    review: AGENT_READ,
  },
  "ctable.noBeat": {
    text: "その札では、場の札に勝てません。",
    back: "Those cards cannot beat the cards on the table.",
    review: AGENT_READ,
  },
  "ctable.followSuit": {
    text: "できるなら、最初に出されたスートに合わせます。",
    back: "If you can, match the suit that was led first.",
    review: AGENT_READ,
  },
  "ctable.tookTrick": {
    text: "{name}がトリックを取りました",
    back: "{name} took the trick",
    review: AGENT_READ,
  },
  "ctable.toLead": {
    text: "{name}が先に出します。",
    back: "{name} plays first.",
    review: AGENT_READ,
  },
  "ctable.toPlay": {
    text: "{name}の番です。",
    back: "{name}'s turn.",
    review: AGENT_READ,
  },
  "ctable.stock": {
    text: "山札{count}枚",
    back: "{count} cards in the stock",
    review: AGENT_READ,
  },
  "ctable.stockNone": {
    text: "山札なし",
    back: "No stock",
    review: AGENT_READ,
  },
  "ctable.dealerNote": {
    text: "ディーラー",
    back: "dealer",
    review: AGENT_READ,
  },
  "ctable.toBidNote": {
    text: "ビッド待ち",
    back: "waiting to bid",
    review: AGENT_READ,
  },
  "ctable.bidsLine": {
    text: "ビッド：{bids}",
    back: "Bids: {bids}",
    review: AGENT_READ,
  },
  "ctable.bidOf": {
    text: "{name} {bid}",
    back: "{name} {bid}",
    review: AGENT_READ,
  },
  "ctable.nil": {
    text: "ニル",
    back: "nil",
    review: AGENT_READ,
  },
  "ctable.nilButton": {
    text: "ニル",
    back: "Nil",
    review: AGENT_READ,
  },
  "ctable.bidTook": {
    text: "ビッド{bid}、{took}トリック取得",
    back: "bid {bid}, took {took}",
    review: AGENT_READ,
  },
  "ctable.pointsFirst": {
    text: "得点（合計に先に届いた人の勝ち）",
    back: "Points (the first to reach the total wins)",
    review: AGENT_READ,
  },
  "ctable.pointsMost": {
    text: "得点（多い人の勝ち）",
    back: "Points (the most wins)",
    review: AGENT_READ,
  },
  "ctable.faceDownCard": {
    text: "{total}枚中{n}枚目の札（伏せてあります）",
    back: "card {n} of {total}, face down",
    review: AGENT_READ,
  },
  "ctable.chosenSuffix": {
    text: "、選択中",
    back: ", chosen",
    review: AGENT_READ,
  },
  // Hearts
  "ctable.hearts.passNowhere": {
    text: "どこにも渡さず、この回は手元に残します",
    back: "nowhere: they are kept in hand this deal",
    review: AGENT_READ,
  },
  "ctable.hearts.passLeft": {
    text: "左隣に",
    back: "to the left",
    review: AGENT_READ,
  },
  "ctable.hearts.passRight": {
    text: "右隣に",
    back: "to the right",
    review: AGENT_READ,
  },
  "ctable.hearts.passAcross": {
    text: "向かいに",
    back: "across",
    review: AGENT_READ,
  },
  "ctable.hearts.passing": {
    text: "3枚を{where}渡します",
    back: "Passing three cards {where}",
    review: AGENT_READ,
  },
  "ctable.hearts.passButton": {
    text: "3枚を{where}渡す",
    back: "Pass three cards {where}",
    review: AGENT_READ,
  },
  "ctable.hearts.passWhy": {
    text: "渡す札を3枚選んでください（{count}枚選択中）。",
    back: "Choose three cards to pass ({count} chosen).",
    review: AGENT_READ,
  },
  "ctable.hearts.cannotPlay": {
    text: "その札は今は出せません。できるなら、最初に出されたスートに合わせます。",
    back: "That card cannot be played now. If you can, match the suit that was led.",
    review: AGENT_READ,
  },
  "ctable.hearts.passStatus": {
    text: "{name}：{where}渡す札を3枚選んでください。",
    back: "{name}: choose three cards to pass {where}.",
    review: AGENT_READ,
  },
  "ctable.hearts.toLeadBroken": {
    text: "{name}が先に出します。ハートから出せます。",
    back: "{name} plays first. Hearts may be led.",
    review: AGENT_READ,
  },
  "ctable.hearts.toPlayBroken": {
    text: "{name}の番です。ハートから出せます。",
    back: "{name}'s turn. Hearts may be led.",
    review: AGENT_READ,
  },
  "ctable.hearts.thisDeal": {
    text: "この回{points}点",
    back: "{points} points this deal",
    review: AGENT_READ,
  },
  "ctable.hearts.scoreWords": {
    text: "得点（少ない人の勝ち）",
    back: "Points (the fewest wins)",
    review: AGENT_READ,
  },
  // Spades
  "ctable.spades.bidTitle": {
    text: "ビッド：それぞれ、何トリック取りますか？",
    back: "Bidding: how many tricks will each of you take?",
    review: AGENT_READ,
  },
  "ctable.spades.cannotPlay": {
    text: "その札は今は出せません。できるなら、最初に出されたスートに合わせます。スペードは、一度出されたあとでないと先に出せません。",
    back: "That card cannot be played now. If you can, match the suit that was led. A spade can only be led after spades have been played.",
    review: AGENT_READ,
  },
  "ctable.spades.bidStatus": {
    text: "{name}のビッドです。向かいのパートナーは{partner}です。何トリック取るか、取らないならニルです。",
    back: "{name} to bid. The partner across the table is {partner}. Say how many tricks, or nil for none.",
    review: AGENT_READ,
  },
  "ctable.spades.toLeadBroken": {
    text: "{name}が先に出します。スペードから出せます。",
    back: "{name} plays first. Spades may be led.",
    review: AGENT_READ,
  },
  "ctable.spades.toPlayBroken": {
    text: "{name}の番です。スペードから出せます。",
    back: "{name}'s turn. Spades may be led.",
    review: AGENT_READ,
  },
  "ctable.spades.pair": {
    text: "；チームで{contract}のうち{together}",
    back: "; as a team, {together} of {contract}",
    review: AGENT_READ,
  },
  "ctable.spades.bags.one": {
    text: "バッグ{count}",
    back: "{count} bag",
    review: AGENT_READ,
  },
  "ctable.spades.bags.other": {
    text: "バッグ{count}",
    back: "{count} bags",
    review: AGENT_READ,
  },
  "ctable.spades.scoreWords": {
    text: "チームの得点（向かい合った2人が組）",
    back: "Team points (the two across the table are a team)",
    review: AGENT_READ,
  },
  // Euchre
  "ctable.euchre.orderUpQuestion": {
    text: "{name}がディーラーです。{card}を切り札にしますか、パスしますか？",
    back: "{name} is the dealer. Make the {card} trumps, or pass?",
    review: AGENT_READ,
  },
  "ctable.euchre.turnedDown": {
    text: "{card}は伏せられました。別のスートを指定するか、パスします。",
    back: "The {card} was turned down. Name another suit, or pass.",
    review: AGENT_READ,
  },
  "ctable.euchre.trumpsBy": {
    text: "{suit}、{name}が指定",
    back: "{suit}, named by {name}",
    review: AGENT_READ,
  },
  "ctable.euchre.pickUp": {
    text: "{card}を拾う",
    back: "Pick up the {card}",
    review: AGENT_READ,
  },
  "ctable.euchre.orderUp": {
    text: "{card}を切り札にする",
    back: "Make the {card} trumps",
    review: AGENT_READ,
  },
  "ctable.euchre.call": {
    text: "{sign} {suit}を切り札にする",
    back: "{sign} Make {suit} trumps",
    review: AGENT_READ,
  },
  "ctable.euchre.throw": {
    text: "捨てる",
    back: "Throw away",
    review: AGENT_READ,
  },
  "ctable.euchre.throwWhy": {
    text: "表の札を拾いました。捨てる札を1枚選んでください。",
    back: "You picked up the turned-up card. Choose one card to throw away.",
    review: AGENT_READ,
  },
  "ctable.euchre.cannotPlay": {
    text: "できるなら、最初に出されたスートに合わせます。レフトバウアーは切り札として数えます。",
    back: "If you can, match the suit that was led. The left bower counts as a trump.",
    review: AGENT_READ,
  },
  "ctable.euchre.who": {
    text: "{name}（パートナーは{partner}）",
    back: "{name} (partner: {partner})",
    review: AGENT_READ,
  },
  "ctable.euchre.orderStatus": {
    text: "{who}：{card}を切り札にしますか、パスしますか。",
    back: "{who}: make the {card} trumps, or pass.",
    review: AGENT_READ,
  },
  "ctable.euchre.mustName": {
    text: "{name}がディーラーで、切り札を指定しなければなりません。",
    back: "{name} is the dealer and must name trumps.",
    review: AGENT_READ,
  },
  "ctable.euchre.nameTrumps": {
    text: "{who}：切り札を指定するか、パスします。",
    back: "{who}: name trumps, or pass.",
    review: AGENT_READ,
  },
  "ctable.euchre.pickedUp": {
    text: "{name}が{card}を拾いました。1枚捨てます。",
    back: "{name} picked up the {card}. Throw one card away.",
    review: AGENT_READ,
  },
  "ctable.euchre.note": {
    text: "{took}トリック取得、チームで{together}",
    back: "took {took}; the team has {together}",
    review: AGENT_READ,
  },
  "ctable.euchre.noteMaking": {
    text: "{took}トリック取得、チームで{together}、切り札を決めた側",
    back: "took {took}; the team has {together}, and named the trumps",
    review: AGENT_READ,
  },
  "ctable.euchre.scoreWords": {
    text: "チームの得点（向かい合った2人が組）",
    back: "Team points (the two across the table are a team)",
    review: AGENT_READ,
  },
  // Gin Rummy
  "ctable.gin.drawn": {
    text: "前の回は引き分けです。山札がなくなり、誰も上がりませんでした",
    back: "The last hand was a draw. The stock ran out and nobody went out",
    review: AGENT_READ,
  },
  "ctable.gin.went": {
    text: "{name}がジンで{points}点",
    back: "{name} went gin for {points}",
    review: AGENT_READ,
  },
  "ctable.gin.undercut": {
    text: "{name}がノックしましたが、アンダーカットされ、{winner}が{points}点を取りました",
    back: "{name} knocked but was undercut, and {winner} took {points}",
    review: AGENT_READ,
  },
  "ctable.gin.knocked": {
    text: "{name}がノックして{points}点",
    back: "{name} knocked and took {points}",
    review: AGENT_READ,
  },
  "ctable.gin.drawStock": {
    text: "山札から引く",
    back: "Draw from the stock",
    review: AGENT_READ,
  },
  "ctable.gin.take": {
    text: "{card}を取る",
    back: "Take the {card}",
    review: AGENT_READ,
  },
  "ctable.gin.throw": {
    text: "捨てる",
    back: "Throw",
    review: AGENT_READ,
  },
  "ctable.gin.throwWhy": {
    text: "捨てる札を選んでください。",
    back: "Choose a card to throw.",
    review: AGENT_READ,
  },
  "ctable.gin.noBack": {
    text: "捨て札から取った札を、すぐに戻すことはできません。",
    back: "The card you just took from the pile cannot go straight back.",
    review: AGENT_READ,
  },
  "ctable.gin.ginButton": {
    text: "ジン！",
    back: "Gin!",
    review: AGENT_READ,
  },
  "ctable.gin.knock": {
    text: "ノック",
    back: "Knock",
    review: AGENT_READ,
  },
  "ctable.gin.drawStatus": {
    text: "{name}の番です：山札から引くか、捨て札を取ります。",
    back: "{name}'s turn: draw from the stock, or take the card on the pile.",
    review: AGENT_READ,
  },
  "ctable.gin.throwStatus": {
    text: "{name}は札を捨てます。デッドウッドが10以下ならノックできます。",
    back: "{name} throws a card, and may knock with deadwood of ten or less.",
    review: AGENT_READ,
  },
  "ctable.gin.deadwood": {
    text: "あなたのデッドウッド：{points}",
    back: "Your deadwood: {points}",
    review: AGENT_READ,
  },
  "ctable.gin.took": {
    text: "取った札：{cards}",
    back: "cards taken: {cards}",
    review: AGENT_READ,
  },
  // Go Fish
  "ctable.fish.drew": {
    text: "{name}が1枚引きました。",
    back: "{name} drew a card.",
    review: AGENT_READ,
  },
  "ctable.fish.book": {
    text: "{name}が{rank}のブックを出しました。",
    back: "{name} laid down a book of {rank}.",
    review: AGENT_READ,
  },
  "ctable.fish.gotOne": {
    text: "{name}が{other}に{rank}を聞いて、1枚もらいました。",
    back: "{name} asked {other} for {rank} and got one.",
    review: AGENT_READ,
  },
  "ctable.fish.gotMany": {
    text: "{name}が{other}に{rank}を聞いて、{count}枚もらいました。",
    back: "{name} asked {other} for {rank} and got {count}.",
    review: AGENT_READ,
  },
  "ctable.fish.caught": {
    text: "{name}が{other}に{rank}を聞きました：ゴーフィッシュ。山札から欲しい札を引きました。",
    back: "{name} asked {other} for {rank}: go fish. They drew the card they wanted from the stock.",
    review: AGENT_READ,
  },
  "ctable.fish.missed": {
    text: "{name}が{other}に{rank}を聞きました：ゴーフィッシュ。",
    back: "{name} asked {other} for {rank}: go fish.",
    review: AGENT_READ,
  },
  "ctable.fish.emptyPond": {
    text: "{name}が{other}に{rank}を聞きました：ゴーフィッシュですが、山札がありません。",
    back: "{name} asked {other} for {rank}: go fish, but there is no stock.",
    review: AGENT_READ,
  },
  "ctable.fish.pondEmpty": {
    text: "山札はありません",
    back: "There is no stock",
    review: AGENT_READ,
  },
  "ctable.fish.pond": {
    text: "山札{count}枚",
    back: "{count} cards in the stock",
    review: AGENT_READ,
  },
  "ctable.fish.ask": {
    text: "聞く",
    back: "Ask",
    review: AGENT_READ,
  },
  "ctable.fish.askFor": {
    text: "{name}に{rank}を聞く",
    back: "Ask {name} for {rank}",
    review: AGENT_READ,
  },
  "ctable.fish.askWhy": {
    text: "聞きたい数字の札を選んでから、聞く相手を選んでください。",
    back: "Choose a card for the number you want, then choose who to ask.",
    review: AGENT_READ,
  },
  "ctable.fish.askStatus": {
    text: "{name}が聞く番です：札を選んでから、相手を選んでください。",
    back: "{name} to ask: choose a card, then choose a person.",
    review: AGENT_READ,
  },
  "ctable.fish.scoreWords": {
    text: "ブック（多い人の勝ち）",
    back: "Books (the most wins)",
    review: AGENT_READ,
  },
  // Oh Hell
  "ctable.ohhell.trumps": {
    text: "{suit}が切り札です",
    back: "{suit} are trumps",
    review: AGENT_READ,
  },
  "ctable.ohhell.bidTitle.one": {
    text: "1人{count}枚。それぞれ、何トリック取りますか？",
    back: "{count} card each. How many tricks will each of you take?",
    review: AGENT_READ,
  },
  "ctable.ohhell.bidTitle.other": {
    text: "1人{count}枚。それぞれ、何トリック取りますか？",
    back: "{count} cards each. How many tricks will each of you take?",
    review: AGENT_READ,
  },
  "ctable.ohhell.bidsLine.one": {
    text: "1人{count}枚。ビッド：{bids}",
    back: "{count} card each. Bids: {bids}",
    review: AGENT_READ,
  },
  "ctable.ohhell.bidsLine.other": {
    text: "1人{count}枚。ビッド：{bids}",
    back: "{count} cards each. Bids: {bids}",
    review: AGENT_READ,
  },
  "ctable.ohhell.dealerBids": {
    text: "{name}がディーラーで、最後にビッドします。{barred}以外にしてください。",
    back: "{name} is the dealer and bids last. Anything but {barred}.",
    review: AGENT_READ,
  },
  "ctable.ohhell.toBid": {
    text: "{name}のビッドです：ちょうど何トリック取るか、0から{cards}までで選びます。",
    back: "{name} to bid: exactly how many tricks, from none to {cards}.",
    review: AGENT_READ,
  },
  "ctable.ohhell.cannotPlay": {
    text: "できるなら、最初に出されたスートに合わせます。",
    back: "If you can, match the suit that was led.",
    review: AGENT_READ,
  },
  // Cribbage
  "ctable.crib.show": {
    text: "得点計算：{pone} {a}、{dealer} {b}、クリブ{c}",
    back: "The count: {pone} {a}, {dealer} {b}, and the crib {c}",
    review: AGENT_READ,
  },
  "ctable.crib.handOf": {
    text: "{name}の手札",
    back: "{name}'s hand",
    review: AGENT_READ,
  },
  "ctable.crib.cribOf": {
    text: "{name}のクリブ",
    back: "{name}'s crib",
    review: AGENT_READ,
  },
  "ctable.crib.laying": {
    text: "{name}のクリブに、それぞれ2枚ずつ置きます",
    back: "Each puts two cards in {name}'s crib",
    review: AGENT_READ,
  },
  "ctable.crib.starter": {
    text: "スターター",
    back: "The starter",
    review: AGENT_READ,
  },
  "ctable.crib.count": {
    text: "カウント：{count}",
    back: "Count: {count}",
    review: AGENT_READ,
  },
  "ctable.crib.lay": {
    text: "クリブに置く",
    back: "Lay to the crib",
    review: AGENT_READ,
  },
  "ctable.crib.layWhy": {
    text: "{name}のクリブに置く札を2枚選んでください（{count}枚選択中）。",
    back: "Choose two cards for {name}'s crib ({count} chosen).",
    review: AGENT_READ,
  },
  "ctable.crib.pastThirtyOne": {
    text: "その札を出すと、カウントが31を超えます。",
    back: "That card would take the count over thirty-one.",
    review: AGENT_READ,
  },
  "ctable.crib.layStatus": {
    text: "{name}：{dealer}のクリブに2枚置きます。",
    back: "{name}: put two cards in {dealer}'s crib.",
    review: AGENT_READ,
  },
  "ctable.crib.playStatus": {
    text: "{name}の番です：カウントは{count}です。",
    back: "{name}'s turn: the count is {count}.",
    review: AGENT_READ,
  },
  "ctable.crib.peg": {
    text: "{name}：{why}で{points}点",
    back: "{name}: {why}, for {points}",
    review: AGENT_READ,
  },
  "ctable.crib.whyFifteen": {
    text: "15",
    back: "fifteen",
    review: AGENT_READ,
  },
  "ctable.crib.whyThirtyOne": {
    text: "31",
    back: "thirty-one",
    review: AGENT_READ,
  },
  "ctable.crib.whyPair": {
    text: "ペア",
    back: "a pair",
    review: AGENT_READ,
  },
  "ctable.crib.whyThree": {
    text: "スリーカード",
    back: "three of a kind",
    review: AGENT_READ,
  },
  "ctable.crib.whyFour": {
    text: "フォーカード",
    back: "four of a kind",
    review: AGENT_READ,
  },
  "ctable.crib.whyRun": {
    text: "{n}枚のラン",
    back: "a run of {n}",
    review: AGENT_READ,
  },
  "ctable.crib.whyHeels": {
    text: "ヒズ・ヒールズ",
    back: "his heels",
    review: AGENT_READ,
  },
  "ctable.crib.whyLast": {
    text: "ラストカード",
    back: "last card",
    review: AGENT_READ,
  },
  "ctable.crib.whyGo": {
    text: "ゴー",
    back: "go",
    review: AGENT_READ,
  },
  "ctable.crib.fifteens": {
    text: "15 {n}",
    back: "fifteens {n}",
    review: AGENT_READ,
  },
  "ctable.crib.pairs": {
    text: "ペア {n}",
    back: "pairs {n}",
    review: AGENT_READ,
  },
  "ctable.crib.runs": {
    text: "ラン {n}",
    back: "runs {n}",
    review: AGENT_READ,
  },
  "ctable.crib.flush": {
    text: "フラッシュ {n}",
    back: "flush {n}",
    review: AGENT_READ,
  },
  "ctable.crib.nobs": {
    text: "ノブス {n}",
    back: "nobs {n}",
    review: AGENT_READ,
  },
  "ctable.crib.nothing": {
    text: "なし",
    back: "nothing",
    review: AGENT_READ,
  },
  // Crazy Eights
  "ctable.crazy.called": {
    text: "{sign} {suit}が指定されています",
    back: "{sign} {suit} has been called",
    review: AGENT_READ,
  },
  "ctable.crazy.call": {
    text: "{sign} {suit}を指定する",
    back: "{sign} Call {suit}",
    review: AGENT_READ,
  },
  "ctable.crazy.chooseMatch": {
    text: "スートか数字が合う札を選んでください。",
    back: "Choose a card that matches the suit or the number.",
    review: AGENT_READ,
  },
  "ctable.crazy.noMatch": {
    text: "その札は、スートも数字も合っていません。",
    back: "That card matches neither the suit nor the number.",
    review: AGENT_READ,
  },
  "ctable.crazy.drewStatus": {
    text: "{name}が引きました：引いた札が合うなら出し、合わなければパスします。",
    back: "{name} drew. Play the drawn card if it matches, or pass.",
    review: AGENT_READ,
  },
  "ctable.crazy.playStatus": {
    text: "{name}の番です：{sign} {suit}、同じ数字の札、または8を出せます。",
    back: "{name}'s turn: {sign} {suit}, a card of the same number, or an eight.",
    review: AGENT_READ,
  },
  // Big Two and President
  "ctable.climb.leadAny": {
    text: "{name}が先に出します：どんな出し方でもかまいません",
    back: "{name} leads: any play will do",
    review: AGENT_READ,
  },
  "ctable.climb.laidBy": {
    text: "{name}が出しました",
    back: "Played by {name}",
    review: AGENT_READ,
  },
  "ctable.climb.passed": {
    text: "パス：{names}",
    back: "Passed: {names}",
    review: AGENT_READ,
  },
  "ctable.climb.openingCard": {
    text: "{name}が先に出します。{card}を含めて出してください。",
    back: "{name} leads, and the play must include the {card}.",
    review: AGENT_READ,
  },
  "ctable.climb.leadBigTwo": {
    text: "{name}が先に出します：1枚、ペア、スリーカード、または5枚の役のどれでもかまいません。",
    back: "{name} leads: any single card, pair, three of a kind, or five-card hand.",
    review: AGENT_READ,
  },
  "ctable.climb.leadPresident": {
    text: "{name}が先に出します：1枚、または同じ数字の2枚・3枚・4枚。",
    back: "{name} leads: one card, or two, three or four of one number.",
    review: AGENT_READ,
  },
  "ctable.climb.beat": {
    text: "{name}は、場の札に勝つか、パスします。",
    back: "{name} must beat it, or pass.",
    review: AGENT_READ,
  },
  "ctable.climb.deal": {
    text: "第{n}回（全{total}回）",
    back: "deal {n} of {total}",
    review: AGENT_READ,
  },
  "ctable.climb.bigTwoScoreWords": {
    text: "ペナルティ点（少ない人の勝ち）",
    back: "Penalty points (the fewest wins)",
    review: AGENT_READ,
  },
  "ctable.climb.give": {
    text: "{count}枚を渡す",
    back: "Give {count}",
    review: AGENT_READ,
  },
  "ctable.climb.giveWhy.one": {
    text: "渡す札を1枚選んでください。",
    back: "Choose one card to give back.",
    review: AGENT_READ,
  },
  "ctable.climb.giveWhy.other": {
    text: "渡す札を{count}枚選んでください。",
    back: "Choose {count} cards to give back.",
    review: AGENT_READ,
  },
  "ctable.climb.giveStatus.one": {
    text: "{name}：好きな札を1枚、{to}に渡します。",
    back: "{name}: give one card of your choice to {to}.",
    review: AGENT_READ,
  },
  "ctable.climb.giveStatus.other": {
    text: "{name}：好きな札を{count}枚、{to}に渡します。",
    back: "{name}: give {count} cards of your choice to {to}.",
    review: AGENT_READ,
  },
  "ctable.climb.titlePresident": {
    text: "大富豪",
    back: "Daifugo (the top rank)",
    review: AGENT_READ,
  },
  "ctable.climb.titleVice": {
    text: "富豪",
    back: "Fugo (the second rank)",
    review: AGENT_READ,
  },
  "ctable.climb.titleCitizen": {
    text: "平民",
    back: "Heimin (the middle rank)",
    review: AGENT_READ,
  },
  "ctable.climb.titleViceBeggar": {
    text: "貧民",
    back: "Hinmin (the second-lowest rank)",
    review: AGENT_READ,
  },
  "ctable.climb.titleBeggar": {
    text: "大貧民",
    back: "Daihinmin (the lowest rank)",
    review: AGENT_READ,
  },
  // War
  "ctable.war.begin": {
    text: "札をめくって始めましょう。",
    back: "Turn the cards over to begin.",
    review: AGENT_READ,
  },
  "ctable.war.turned": {
    text: "{a}は{ca}、{b}は{cb}をめくりました。",
    back: "{a} turned {ca} and {b} turned {cb}.",
    review: AGENT_READ,
  },
  "ctable.war.turnedTakes": {
    text: "{a}は{ca}、{b}は{cb}をめくりました。{winner}が2枚とも取りました。",
    back: "{a} turned {ca} and {b} turned {cb}. {winner} took both.",
    review: AGENT_READ,
  },
  "ctable.war.tied": {
    text: "どちらも{rank}をめくりました：戦争！",
    back: "Both turned {rank}: war!",
    review: AGENT_READ,
  },
  "ctable.war.takesAll": {
    text: "{a}は{ca}、{b}は{cb}をめくりました。{winner}が{count}枚すべてを取りました。",
    back: "{a} turned {ca} and {b} turned {cb}. {winner} took all {count} cards.",
    review: AGENT_READ,
  },
  "ctable.war.neither": {
    text: "どちらも戦争を続けられませんでした。",
    back: "Neither could carry on with the war.",
    review: AGENT_READ,
  },
  "ctable.war.holdsAll": {
    text: "{name}が全部の札を持っています。",
    back: "{name} holds every card.",
    review: AGENT_READ,
  },
  "ctable.war.short": {
    text: "{loser}が戦争を続けられなかったので、{winner}が全部の札を取ります。",
    back: "{loser} could not carry on with a war, so {winner} takes every card.",
    review: AGENT_READ,
  },
  "ctable.war.drawnWar": {
    text: "どちらも戦争を続けられず、札の枚数も同じなので、引き分けです。",
    back: "Neither could carry on with the war and both had the same number of cards, so it is a draw.",
    review: AGENT_READ,
  },
  "ctable.war.turnsDraw": {
    text: "ターン数が尽き、どちらも{count}枚で、引き分けです。",
    back: "The turns have run out and both have {count} cards, so it is a draw.",
    review: AGENT_READ,
  },
  "ctable.war.turnsMore": {
    text: "ターン数が尽き、{name}の札が多くなっています。",
    back: "The turns have run out, and {name} has more cards.",
    review: AGENT_READ,
  },
  "ctable.war.turnButton": {
    text: "札をめくる",
    back: "Turn the cards over",
    review: AGENT_READ,
  },
  "ctable.war.turnStatus": {
    text: "第{n}ターン（全{size}）。札をめくってください。",
    back: "Turn {n} of {size}. Turn the cards over.",
    review: AGENT_READ,
  },
  "ctable.war.cards.one": {
    text: "{count}枚",
    back: "{count} card",
    review: AGENT_READ,
  },
  "ctable.war.cards.other": {
    text: "{count}枚",
    back: "{count} cards",
    review: AGENT_READ,
  },
  "ctable.war.scoreWords": {
    text: "手持ちの枚数（多い人の勝ち）",
    back: "Cards in hand (the most wins)",
    review: AGENT_READ,
  },
  // The set-up's length tiles
  "ctable.length.to": {
    text: "{size}点まで",
    back: "To {size} points",
    review: AGENT_READ,
  },
  "ctable.length.deals.one": {
    text: "{count}回",
    back: "{count} deal",
    review: AGENT_READ,
  },
  "ctable.length.deals.other": {
    text: "{count}回",
    back: "{count} deals",
    review: AGENT_READ,
  },
  "ctable.length.rounds": {
    text: "{count}ラウンド",
    back: "{count} rounds",
    review: AGENT_READ,
  },
  "ctable.length.oneDeal": {
    text: "1回",
    back: "One deal",
    review: AGENT_READ,
  },
  "ctable.length.cribShort": {
    text: "61点まで（盤を1周）",
    back: "To 61 (once round the board)",
    review: AGENT_READ,
  },
  "ctable.length.cribLong": {
    text: "121点まで",
    back: "To 121",
    review: AGENT_READ,
  },
  "ctable.length.ohHellShort": {
    text: "7回、最大7枚まで",
    back: "7 deals, up to seven cards",
    review: AGENT_READ,
  },
  "ctable.length.ohHellLong": {
    text: "13回、枚数が増えてから減ります",
    back: "13 deals, the number of cards goes up and then back down",
    review: AGENT_READ,
  },
  "ctable.length.turns": {
    text: "{count}ターン",
    back: "{count} turns",
    review: AGENT_READ,
  },
  // The card back's picker
  "ctable.back.aria": {
    text: "カードの裏柄",
    back: "Card back",
    review: AGENT_READ,
  },
  "ctable.back.label": {
    text: "{name}の裏柄",
    back: "{name} back",
    review: AGENT_READ,
  },
  "ctable.back.itsutsu": {
    text: "Itsutsu",
    back: "Itsutsu",
    review: AGENT_READ,
  },
  "ctable.back.classicRed": {
    text: "クラシック（赤）",
    back: "Classic (red)",
    review: AGENT_READ,
  },
  "ctable.back.classicBlue": {
    text: "クラシック（青）",
    back: "Classic (blue)",
    review: AGENT_READ,
  },
  "ctable.back.inkDots": {
    text: "インクの水玉",
    back: "Ink dots",
    review: AGENT_READ,
  },
};
