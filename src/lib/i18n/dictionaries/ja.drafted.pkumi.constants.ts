import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the pkumi.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PKUMI: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "pkumi.length.short": {
    text: "短め",
    back: "Short",
    review: AGENT_READ,
  },
  "pkumi.length.medium": {
    text: "ふつう",
    back: "Medium",
    review: AGENT_READ,
  },
  "pkumi.length.full": {
    text: "フル",
    back: "Full",
    review: AGENT_READ,
  },
  "pkumi.count.player.one": {
    text: "{count}人",
    back: "{count} player",
    review: AGENT_READ,
  },
  "pkumi.count.player.other": {
    text: "{count}人",
    back: "{count} players",
    review: AGENT_READ,
  },
  "pkumi.opts.playersAria": {
    text: "人数",
    back: "Players",
    review: AGENT_READ,
  },
  "pkumi.opts.solo": {
    text: "1人：時計と順位表のある、ひとり用のゲームです。人数を増やすと、この端末を順番に回して遊びます。",
    back: "One player: the solo game, with its clock and its leaderboard. Choose more to pass this device round.",
    review: AGENT_READ,
  },
  "pkumi.opts.party": {
    text: "{count}人でこの端末を順番に回して遊びます。袋は1つで、このブラウザーにだけ保存されます。",
    back: "{count} players pass this device round, one bag, kept in this browser only.",
    review: AGENT_READ,
  },
  "pkumi.opts.recommendDouble": {
    text: "{from}人以上のときは、ダブル（288枚）をおすすめします。",
    back: "Double, 288 tiles, is recommended for {from} or more.",
    review: AGENT_READ,
  },
  "pkumi.opts.recommendFull": {
    text: "{from}人以上のときは、フル（全144枚）をおすすめします。",
    back: "Full, all 144 tiles, is recommended for {from} or more.",
    review: AGENT_READ,
  },
  "pkumi.opts.tooSmall.one": {
    text: "{players}人には、{what}では足りません。",
    back: "{what} is too small for {players}.",
    review: AGENT_READ,
  },
  "pkumi.opts.tooSmall.other": {
    text: "{players}人には、{what}では足りません。",
    back: "{what} are too small for {players}.",
    review: AGENT_READ,
  },
  "pkumi.opts.tooFew": {
    text: "{tiles}枚では、{size}枚の手札を{players}人に配り、さらに1巡ぶん引くことはできません（{needed}枚が必要です）",
    back: "{tiles} tiles cannot deal {players} hands of {size} and a round of draws ({needed})",
    review: AGENT_READ,
  },
  "pkumi.opts.languageAria": {
    text: "言語",
    back: "Language",
    review: AGENT_READ,
  },
  "pkumi.opts.english": {
    text: "英語",
    back: "English",
    review: AGENT_READ,
  },
  "pkumi.opts.japanese": {
    text: "日本語・ひらがな",
    back: "Japanese · ひらがな",
    review: AGENT_READ,
  },
  "pkumi.opts.lengthAria": {
    text: "ゲームの長さ",
    back: "Game length",
    review: AGENT_READ,
  },
  "pkumi.opts.setAria": {
    text: "タイルのセット",
    back: "Tile set",
    review: AGENT_READ,
  },
  "pkumi.opts.double": {
    text: "ダブル",
    back: "Double",
    review: AGENT_READ,
  },
  "pkumi.opts.oneSet": {
    text: "1セット",
    back: "One set",
    review: AGENT_READ,
  },
  "pkumi.opts.recommendedMark": {
    text: "、おすすめ",
    back: ", recommended",
    review: AGENT_READ,
  },
  "pkumi.opts.diagonalsAria": {
    text: "斜め",
    back: "Diagonals",
    review: AGENT_READ,
  },
  "pkumi.opts.diagOn": {
    text: "斜めあり",
    back: "Diagonals",
    review: AGENT_READ,
  },
  "pkumi.opts.diagOff": {
    text: "斜めなし",
    back: "No diagonals",
    review: AGENT_READ,
  },
  "pkumi.opts.diagOnSays": {
    text: "角どうしでつながる3枚以上のタイルの並びも、下へ向かって読んで、単語になる必要があります。",
    back: "Three or more tiles in a line corner to corner must spell a word too, read downward.",
    review: AGENT_READ,
  },
  "pkumi.opts.diagOffSays": {
    text: "単語は、横と縦だけです。タイルが角で触れていてもかまいません。",
    back: "Words across and down only; tiles may touch at a corner.",
    review: AGENT_READ,
  },
  "pkumi.opts.helpAria": {
    text: "ヘルプ",
    back: "Help",
    review: AGENT_READ,
  },
  "pkumi.opts.helpOn": {
    text: "ヘルプあり",
    back: "Help",
    review: AGENT_READ,
  },
  "pkumi.opts.helpOff": {
    text: "ヘルプなし",
    back: "No help",
    review: AGENT_READ,
  },
  "pkumi.tiles.heading": {
    text: "タイル",
    back: "The tiles",
    review: AGENT_READ,
  },
  "pkumi.tiles.which": {
    text: "タイルのセット",
    back: "Which set of tiles",
    review: AGENT_READ,
  },
  "pkumi.tiles.setEnglish": {
    text: "英語のセット",
    back: "The English set",
    review: AGENT_READ,
  },
  "pkumi.tiles.setJapanese": {
    text: "日本語のセット",
    back: "The Japanese set",
    review: AGENT_READ,
  },
  "pkumi.tiles.summary.one": {
    text: "{kinds}、全部で{total}枚です。いちばん多いのは{commonest}で{most}枚、難しいのは{rarest}で、どれも1枚だけです。",
    back: "{total} tiles in {kinds}. The most is {commonest}, {most} of them; the hard ones are {rarest}, only one of each.",
    review: AGENT_READ,
  },
  "pkumi.tiles.summary.other": {
    text: "{kinds}、全部で{total}枚です。いちばん多いのは{commonest}で{most}枚、難しいのは{rarest}で、どれも{count}枚だけです。",
    back: "{total} tiles in {kinds}. The most is {commonest}, {most} of them; the hard ones are {rarest}, only {count} of each.",
    review: AGENT_READ,
  },
  "pkumi.tiles.formAria": {
    text: "{glyph}、セットに{count}枚。この牌が表せるすべての形を見る。",
    back: "{glyph}, {count} in the set. Show every form it plays as.",
    review: AGENT_READ,
  },
  "pkumi.tiles.wildLetter": {
    text: "ワイルドタイルは、ゲームのタイルの一部の代わりになります。やさしいレベルでいちばん多く、難しいレベルではありません。好きな文字を選べて、あとで選び直せます。",
    back: "The wild tile stands in for some of a game's tiles, most at easy and none at hard: it is any letter you choose, and you can change your mind.",
    review: AGENT_READ,
  },
  "pkumi.tiles.wildKana": {
    text: "ワイルドタイルは、ゲームのタイルの一部の代わりになります。やさしいレベルでいちばん多く、難しいレベルではありません。好きなかなを選べて、あとで選び直せます。",
    back: "The wild tile stands in for some of a game's tiles, most at easy and none at hard: it is any kana you choose, and you can change your mind.",
    review: AGENT_READ,
  },
  "pkumi.tiles.howMany": {
    text: "ゲームに使うタイルの枚数",
    back: "How many tiles a game takes",
    review: AGENT_READ,
  },
  "pkumi.tiles.colLength": {
    text: "長さ",
    back: "Length",
    review: AGENT_READ,
  },
  "pkumi.tiles.colTiles": {
    text: "枚数",
    back: "Tiles",
    review: AGENT_READ,
  },
  "pkumi.tiles.colDouble": {
    text: "ダブルセット",
    back: "Double set",
    review: AGENT_READ,
  },
  "pkumi.tiles.colWild": {
    text: "ワイルド（やさしい・ふつう・難しい）",
    back: "Wild at easy · medium · hard",
    review: AGENT_READ,
  },
  "pkumi.tiles.foot": {
    text: "手札が{classic}枚の場合です。手札が{quick}枚のとき、「短め」のゲームは{quickShort}枚です。ダブルセットは英語のセットを2つ合わせたもので、日本語は1セットで遊びます。",
    back: "With the {classic}-tile hand. A Short game from the {quick}-tile hand is {quickShort} tiles. The Double set is two English sets together; Japanese plays one.",
    review: AGENT_READ,
  },
  "pkumi.tiles.toFront": {
    text: "遊んでいる様子の写真と、試せる手札が、ゲームのページにあります →",
    back: "Pictures of it being played, and a hand to try, on the game's page →",
    review: AGENT_READ,
  },
  "pkumi.tiles.formsOne": {
    text: "{kana}は、そのままの形だけで使われます。",
    back: "{kana} plays as itself alone.",
    review: AGENT_READ,
  },
  "pkumi.tiles.formsMany": {
    text: "{kana}は、{count}つのかなとして使われ、選ぶ必要はありません。これらのどの読み方で読んでも単語になるなら、その並びは単語です。",
    back: "{kana} plays as {count} kana, with nothing to choose: a line is a word if it spells one read any of these ways.",
    review: AGENT_READ,
  },
  "pkumi.tiles.formsAria": {
    text: "{kana}が表すもの",
    back: "What {kana} plays as",
    review: AGENT_READ,
  },
  "pkumi.tile.wild": {
    text: "ワイルド、{glyph}",
    back: "Wild, {glyph}",
    review: AGENT_READ,
  },
  "pkumi.tile.wildBlank": {
    text: "ワイルド、未設定",
    back: "Wild, unassigned",
    review: AGENT_READ,
  },
  "pkumi.tray.hand": {
    text: "手札",
    back: "Your hand",
    review: AGENT_READ,
  },
  "pkumi.tray.sort": {
    text: "並べ替え",
    back: "Sort",
    review: AGENT_READ,
  },
  "pkumi.tray.help": {
    text: "ヘルプ",
    back: "Help",
    review: AGENT_READ,
  },
  "pkumi.tray.helpOffered": {
    text: "手札を並べて、単語にします",
    back: "Arrange your hand into a word",
    review: AGENT_READ,
  },
  "pkumi.tray.helpNot": {
    text: "ヘルプは、ゲームを始める前に、設定の画面で選びます",
    back: "Help is chosen on the set-up screen, before the game starts",
    review: AGENT_READ,
  },
  "pkumi.tray.inBag": {
    text: "袋に{count}枚",
    back: "{count} in the bag",
    review: AGENT_READ,
  },
  "pkumi.tray.handUsed": {
    text: "手札を使いきりました。",
    back: "Hand used.",
    review: AGENT_READ,
  },
  "pkumi.tray.bagOut": {
    text: "袋のタイルは、すべて出ました。",
    back: "Every tile is out of the bag.",
    review: AGENT_READ,
  },
  "pkumi.tray.inHand": {
    text: "手札の{tile}",
    back: "{tile} in your hand",
    review: AGENT_READ,
  },
  "pkumi.tray.draw": {
    text: "引く",
    back: "Draw",
    review: AGENT_READ,
  },
  "pkumi.tray.trade": {
    text: "交換",
    back: "Trade",
    review: AGENT_READ,
  },
  "pkumi.tray.tradeSays": {
    text: "選んだタイルを返して、{take}枚取ります",
    back: "Give the chosen tile back and take {take}",
    review: AGENT_READ,
  },
  "pkumi.tray.toHand": {
    text: "手札へ",
    back: "To hand",
    review: AGENT_READ,
  },
  "pkumi.tray.allBack": {
    text: "すべて手札へ",
    back: "All back",
    review: AGENT_READ,
  },
  "pkumi.tray.startAgain": {
    text: "もう一度はじめる",
    back: "Start again",
    review: AGENT_READ,
  },
  "pkumi.wild.letter": {
    text: "このワイルドタイルは、次の文字です",
    back: "This wild tile is the letter",
    review: AGENT_READ,
  },
  "pkumi.wild.kana": {
    text: "このワイルドタイルは、次のかなです",
    back: "This wild tile is the kana",
    review: AGENT_READ,
  },
  "pkumi.wild.chooseReading": {
    text: "読みを選ぶ",
    back: "Choose reading",
    review: AGENT_READ,
  },
  "pkumi.wild.choose": {
    text: "選ぶ",
    back: "Choose",
    review: AGENT_READ,
  },
  "pkumi.say.tapDrag": {
    text: "タイルをタップして、マスをタップします。タイルをテーブルへドラッグしてもかまいません。キーボードでは、マスを選んで文字を打ちます。",
    back: "Tap a tile, then a square, or drag it onto the table. On a keyboard, choose a square and type.",
    review: AGENT_READ,
  },
  "pkumi.say.notWords.one": {
    text: "単語ではありません：{words}。",
    back: "Not a word: {words}.",
    review: AGENT_READ,
  },
  "pkumi.say.notWords.other": {
    text: "単語ではありません：{words}。",
    back: "Not words: {words}.",
    review: AGENT_READ,
  },
  "pkumi.say.join": {
    text: "すべてのタイルを、ひとつのクロスワードにつなげてください。",
    back: "Join every tile into one crossword.",
    review: AGENT_READ,
  },
  "pkumi.say.twoLetters": {
    text: "単語は、2文字以上です。",
    back: "A word takes two letters or more.",
    review: AGENT_READ,
  },
  "pkumi.say.toLay.one": {
    text: "置くタイルは、あと{count}枚です。",
    back: "{count} tile to lay.",
    review: AGENT_READ,
  },
  "pkumi.say.toLay.other": {
    text: "置くタイルは、あと{count}枚です。",
    back: "{count} tiles to lay.",
    review: AGENT_READ,
  },
  "pkumi.say.drawNext": {
    text: "正しく並んでいます。次のタイルを引いてください。",
    back: "Sound. Draw the next tile.",
    review: AGENT_READ,
  },
  "pkumi.say.drawLast": {
    text: "正しく並んでいます。最後のタイルを引いてください。これはワイルドで、文字を選べます。",
    back: "Sound. Draw the last tile: it is wild, and you choose its letter.",
    review: AGENT_READ,
  },
  "pkumi.say.drawEveryone": {
    text: "正しく並んでいます。引くと、全員がタイルを1枚ずつ取ります。",
    back: "Sound. Draw, and everybody takes a tile.",
    review: AGENT_READ,
  },
  "pkumi.say.allDown": {
    text: "すべてのタイルを置きました。",
    back: "Every tile is down.",
    review: AGENT_READ,
  },
  "pkumi.say.helpNone": {
    text: "この手札には単語がありません。タイル1枚を、3枚と交換してください。",
    back: "No word in this hand: trade a tile for three.",
    review: AGENT_READ,
  },
  "pkumi.say.helpFront": {
    text: "{word}が手札の先頭にあります。別の単語を見るには、もう一度「ヘルプ」を押してください。",
    back: "{word} is at the front of your hand. Press Help again for another word.",
    review: AGENT_READ,
  },
  "pkumi.try.heading": {
    text: "手札を試す",
    back: "Try a hand",
    review: AGENT_READ,
  },
  "pkumi.try.lead": {
    text: "タイルは10枚です。手札が7枚で、あと3枚を引きます。すべてをひとつのクロスワードに置き、2文字以上の並びは、すべて単語にします。",
    back: "Ten tiles: a hand of seven, and three more to draw. Lay them into one crossword, every line of two or more letters a word.",
    review: AGENT_READ,
  },
  "pkumi.try.wordsAria": {
    text: "テーブルの上の単語",
    back: "Words on the table",
    review: AGENT_READ,
  },
  "pkumi.try.real": {
    text: "本物のゲームは、40枚以上のタイルを、時計と競って遊びます →",
    back: "A real game is 40 tiles or more, against the clock →",
    review: AGENT_READ,
  },
  "pkumi.try.idle": {
    text: "タイルをタップして、マスをタップします。最初のタップで、このゲームの英語の単語リスト（約{kb} KB）を1回だけ取り込みます。どこにも送信されません。",
    back: "Tap a tile, then a square. Your first tap fetches the game's English word list, about {kb} KB, once; nothing is sent anywhere.",
    review: AGENT_READ,
  },
  "pkumi.try.loading": {
    text: "単語リストを取り込んでいます…",
    back: "Fetching the word list…",
    review: AGENT_READ,
  },
  "pkumi.try.failed": {
    text: "単語リストを今は取り込めませんでした。ページを読み込み直して、もう一度試してください。",
    back: "The word list could not be fetched just now. Reload the page to try again.",
    review: AGENT_READ,
  },
  "pkumi.try.finished": {
    text: "すべてのタイルが、ひとつのクロスワードに置かれました。これで、{count}枚の組文字が1回分、完成です。",
    back: "Every tile is down in one crossword. That is a whole Kumimoji, {count} tiles long.",
    review: AGENT_READ,
  },
  "pkumi.try.empty": {
    text: "タイルをタップして、マスをタップします。テーブルの上のタイルを2回タップすると、手札に戻ります。",
    back: "Tap a tile, then a square. Tap a tile on the table twice to send it back.",
    review: AGENT_READ,
  },
  "pkumi.solve.score": {
    text: "{tiles}枚すべてを、ひとつのクロスワードにしました。{points}点：1枚10点で、残りは速さの点です。",
    back: "All {tiles} tiles in one crossword. {points} points: ten a tile, and the rest for speed.",
    review: AGENT_READ,
  },
  "pkumi.solve.scoreLess.one": {
    text: "{tiles}枚すべてを、ひとつのクロスワードにしました。{points}点：1枚10点で、残りは速さの点です。ヘルプ{count}回につき{per}点ずつ引かれています。",
    back: "All {tiles} tiles in one crossword. {points} points: ten a tile, and the rest for speed, less {per} for each of {count} Help.",
    review: AGENT_READ,
  },
  "pkumi.solve.scoreLess.other": {
    text: "{tiles}枚すべてを、ひとつのクロスワードにしました。{points}点：1枚10点で、残りは速さの点です。ヘルプ{count}回につき{per}点ずつ引かれています。",
    back: "All {tiles} tiles in one crossword. {points} points: ten a tile, and the rest for speed, less {per} for each of {count} Helps.",
    review: AGENT_READ,
  },
  "pkumi.shots.heading": {
    text: "遊んでいる様子",
    back: "See it played",
    review: AGENT_READ,
  },
  "pkumi.shots.open": {
    text: "{caption}写真が原寸で開きます。",
    back: "{caption} Opens the picture full size.",
    review: AGENT_READ,
  },
  "pkumi.party.who": {
    text: "遊ぶのは誰ですか？",
    back: "Who is playing?",
    review: AGENT_READ,
  },
  "pkumi.party.lead": {
    text: "{count}人でこの端末を順番に回して遊びます。それぞれが自分の手札とテーブルを持ちます。名前はこのブラウザーにだけ残り、空のままなら番号で呼ばれます。コンピュータは、みんなが見ている前で、自分の手番を打ちます。",
    back: "{count} players pass this device round, each with a hand and a table of their own. Names stay in this browser; leave one empty for its number. A computer plays its own turns, where everybody can watch.",
    review: AGENT_READ,
  },
  "pkumi.party.playerLabel": {
    text: "プレイヤー{n}",
    back: "Player {n}",
    review: AGENT_READ,
  },
  "pkumi.party.computerName": {
    text: "コンピュータ{n}",
    back: "Computer {n}",
    review: AGENT_READ,
  },
  "pkumi.party.computerAria": {
    text: "プレイヤー{n}はコンピュータです",
    back: "Player {n} is a computer",
    review: AGENT_READ,
  },
  "pkumi.party.replacing": {
    text: "はじめると、このブラウザーに残っている回し遊びのゲームは、忘れられます。",
    back: "Beginning forgets the pass-and-play game this browser is keeping.",
    review: AGENT_READ,
  },
  "pkumi.party.continueThat": {
    text: "そちらを続ける",
    back: "Continue that one instead",
    review: AGENT_READ,
  },
  "pkumi.party.nobody": {
    text: "少なくとも1つの席は人にしてください。見ている人が必要です。",
    back: "At least one seat is a person's: somebody has to watch.",
    review: AGENT_READ,
  },
  "pkumi.party.begin": {
    text: "はじめる",
    back: "Begin",
    review: AGENT_READ,
  },
  "pkumi.party.orderAria": {
    text: "遊ぶ順番",
    back: "The order of play",
    review: AGENT_READ,
  },
  "pkumi.party.bot": {
    text: "コンピュータ",
    back: "bot",
    review: AGENT_READ,
  },
  "pkumi.party.resigned": {
    text: "投了",
    back: "resigned",
    review: AGENT_READ,
  },
  "pkumi.party.out": {
    text: "あがり",
    back: "out",
    review: AGENT_READ,
  },
  "pkumi.party.endAsk": {
    text: "全員のために、このゲームを終えますか？ゲームは保存されません。",
    back: "End this game for everybody? It is not kept.",
    review: AGENT_READ,
  },
  "pkumi.party.endYes": {
    text: "はい、終える",
    back: "Yes, end it",
    review: AGENT_READ,
  },
  "pkumi.party.keepPlaying": {
    text: "続ける",
    back: "Keep playing",
    review: AGENT_READ,
  },
  "pkumi.party.endGame": {
    text: "このゲームを終える",
    back: "End this game",
    review: AGENT_READ,
  },
  "pkumi.party.tied": {
    text: "引き分け：{names}",
    back: "Tied: {names}",
    review: AGENT_READ,
  },
  "pkumi.party.standing": {
    text: "{name}の勝ちです。最後まで残りました",
    back: "{name} wins, the last one standing",
    review: AGENT_READ,
  },
  "pkumi.party.wins": {
    text: "{name}の勝ちです",
    back: "{name} wins",
    review: AGENT_READ,
  },
  "pkumi.party.share": {
    text: "{names}が勝ちを分け合いました",
    back: "{names} share the win",
    review: AGENT_READ,
  },
  "pkumi.party.continueGame": {
    text: "回し遊びのゲームを続ける",
    back: "Continue the pass-and-play game",
    review: AGENT_READ,
  },
  "pkumi.seats.full": {
    text: "{count}人が遊んでいます。これ以上は加われません。",
    back: "{count} are playing: nobody else can join.",
    review: AGENT_READ,
  },
  "pkumi.seats.lastRound": {
    text: "最後の1巡が始まりました。今は誰も加われません。",
    back: "The last round has begun: nobody can join now.",
    review: AGENT_READ,
  },
  "pkumi.seats.bag.one": {
    text: "袋のタイルは{count}枚で、{size}枚の手札に足りません。今は誰も加われません。",
    back: "The bag holds {count} tile, fewer than a hand of {size}: nobody can join now.",
    review: AGENT_READ,
  },
  "pkumi.seats.bag.other": {
    text: "袋のタイルは{count}枚で、{size}枚の手札に足りません。今は誰も加われません。",
    back: "The bag holds {count} tiles, fewer than a hand of {size}: nobody can join now.",
    review: AGENT_READ,
  },
  "pkumi.seats.over": {
    text: "ゲームは終わりました。",
    back: "The game is over.",
    review: AGENT_READ,
  },
  "pkumi.seats.leaveOut": {
    text: "あがったので、最後まで残ります",
    back: "went out: stays to the end",
    review: AGENT_READ,
  },
  "pkumi.seats.leaveLast": {
    text: "最後の1人なので、代わりにゲームを終えてください",
    back: "the last person: end the game instead",
    review: AGENT_READ,
  },
  "pkumi.seats.open": {
    text: "席に加わる・席を外れる",
    back: "Join or leave",
    review: AGENT_READ,
  },
  "pkumi.seats.close": {
    text: "閉じる",
    back: "Close",
    review: AGENT_READ,
  },
  "pkumi.seats.leaveAsk.one": {
    text: "席を外れて、{count}枚のタイルを袋に戻しますか？",
    back: "Leave, and put {count} tile back in the bag?",
    review: AGENT_READ,
  },
  "pkumi.seats.leaveAsk.other": {
    text: "席を外れて、{count}枚のタイルを袋に戻しますか？",
    back: "Leave, and put {count} tiles back in the bag?",
    review: AGENT_READ,
  },
  "pkumi.seats.leaveYes": {
    text: "はい、外れる",
    back: "Yes, leave",
    review: AGENT_READ,
  },
  "pkumi.seats.stay": {
    text: "残る",
    back: "Stay",
    review: AGENT_READ,
  },
  "pkumi.seats.leave": {
    text: "席を外れる",
    back: "Leave",
    review: AGENT_READ,
  },
  "pkumi.seats.nameAria": {
    text: "新しいプレイヤーの名前",
    back: "The new player's name",
    review: AGENT_READ,
  },
  "pkumi.seats.join": {
    text: "加わる",
    back: "Join",
    review: AGENT_READ,
  },
  "pkumi.seats.addComputer": {
    text: "コンピュータを加える",
    back: "Add a computer",
    review: AGENT_READ,
  },
  "pkumi.seats.note": {
    text: "新しいプレイヤーは、{name}の次の席に着き、袋から{size}枚の手札を受け取ります。席を外れると、そのプレイヤーの手札とテーブルのタイルは、袋に戻ります。",
    back: "A new player sits down after {name} with a hand of {size} from the bag. Leaving puts a player's hand and table back in the bag.",
    review: AGENT_READ,
  },
  "pkumi.turn.whose": {
    text: "{name}の番です",
    back: "{name}'s turn",
    review: AGENT_READ,
  },
  "pkumi.turn.whoseLast": {
    text: "{name}の番です（最後の番）",
    back: "{name}'s turn, the last",
    review: AGENT_READ,
  },
  "pkumi.turn.whoseStanding": {
    text: "{name}の番です（最後まで残っています）",
    back: "{name}'s turn, the last one standing",
    review: AGENT_READ,
  },
  "pkumi.turn.allTables": {
    text: "すべてのテーブル",
    back: "All tables",
    review: AGENT_READ,
  },
  "pkumi.turn.passBack": {
    text: "渡し直す",
    back: "Pass back",
    review: AGENT_READ,
  },
  "pkumi.turn.done": {
    text: "終わり",
    back: "Done",
    review: AGENT_READ,
  },
  "pkumi.turn.doneOut": {
    text: "終わりにして、あがる",
    back: "Done, and go out",
    review: AGENT_READ,
  },
  "pkumi.turn.outSaid": {
    text: "手札を使いきり、クロスワードも正しく並んでいます。「終わり」を押して、あがりましょう。",
    back: "Your hand is used and your crossword is sound: press Done to go out.",
    review: AGENT_READ,
  },
  "pkumi.turn.tradeFirst": {
    text: "手札に単語がありません。先にタイルを1枚選んで、3枚と交換してください。",
    back: "No word in your hand: choose a tile and trade it for three first.",
    review: AGENT_READ,
  },
  "pkumi.turn.standing": {
    text: "ほかの全員が投了しました。正しいクロスワードにタイルを1枚置いて「終わり」を押せば勝ちです。投了することもできます。",
    back: "Everybody else has resigned. Lay a tile on a sound crossword and press Done to win, or resign.",
    review: AGENT_READ,
  },
  "pkumi.turn.traded": {
    text: "交換しました。置けるものを置くか、「終わり」を押してください。次の交換は、次の番にできます。",
    back: "Traded: lay what you can or press Done. Your next trade is on your next turn.",
    review: AGENT_READ,
  },
  "pkumi.turn.resignAsk": {
    text: "投了して、このゲームの残りの番を打たないことにしますか？",
    back: "Resign, and play no more turns this game?",
    review: AGENT_READ,
  },
  "pkumi.board.won": {
    text: "勝ち",
    back: "won",
    review: AGENT_READ,
  },
  "pkumi.board.laid": {
    text: "置いた{laid}枚・手札{hand}枚",
    back: "{laid} laid · {hand} in hand",
    review: AGENT_READ,
  },
  "pkumi.board.resigned": {
    text: "投了",
    back: "resigned",
    review: AGENT_READ,
  },
  "pkumi.board.wentOut": {
    text: "あがり",
    back: "went out",
    review: AGENT_READ,
  },
  "pkumi.board.toPlay": {
    text: "手番",
    back: "to play",
    review: AGENT_READ,
  },
  "pkumi.board.handAria": {
    text: "{name}の手札",
    back: "{name}'s hand",
    review: AGENT_READ,
  },
  "pkumi.board.noTiles": {
    text: "手札にタイルはありません",
    back: "No tiles in hand",
    review: AGENT_READ,
  },
  "pkumi.board.allTablesBack": {
    text: "← すべてのテーブル",
    back: "← All tables",
    review: AGENT_READ,
  },
  "pkumi.board.back": {
    text: "← 戻る",
    back: "← Back",
    review: AGENT_READ,
  },
  "pkumi.board.backToMine": {
    text: "← 自分のテーブルへ戻る",
    back: "← Back to my table",
    review: AGENT_READ,
  },
  "pkumi.board.backToMineAria": {
    text: "自分のテーブルへ戻る",
    back: "Back to my table",
    review: AGENT_READ,
  },
  "pkumi.board.lookAt": {
    text: "{name}のテーブルを見る",
    back: "Look at {name}'s table",
    review: AGENT_READ,
  },
  "pkumi.board.before": {
    text: "前のテーブル",
    back: "The table before",
    review: AGENT_READ,
  },
  "pkumi.board.next": {
    text: "次のテーブル",
    back: "The next table",
    review: AGENT_READ,
  },
  "pkumi.board.viewing": {
    text: "{name}のテーブル・{count}人中{at}人め",
    back: "{name}'s table · {at} of {count}",
    review: AGENT_READ,
  },
  "pkumi.board.wentOutLast": {
    text: "{names}があがりました。{name}が最後の番です",
    back: "{names} went out — last turn for {name}",
    review: AGENT_READ,
  },
  "pkumi.board.passTo": {
    text: "{name}に渡してください",
    back: "Pass to {name}",
    review: AGENT_READ,
  },
  "pkumi.board.imName": {
    text: "{name}です",
    back: "I'm {name}",
    review: AGENT_READ,
  },
  "pkumi.board.allTablesOpen": {
    text: "すべてのテーブル",
    back: "All tables",
    review: AGENT_READ,
  },
  "pkumi.computer.looking": {
    text: "タイルを見ています…",
    back: "Looking at its tiles…",
    review: AGENT_READ,
  },
  "pkumi.computer.rebuilt": {
    text: "タイルを手札に戻して、組み直します",
    back: "Took its tiles up to build again",
    review: AGENT_READ,
  },
  "pkumi.computer.laid": {
    text: "{word}を置きました",
    back: "Laid {word}",
    review: AGENT_READ,
  },
  "pkumi.computer.drew": {
    text: "引く：全員がタイルを1枚ずつ取ります",
    back: "Draw: a tile for everybody",
    review: AGENT_READ,
  },
  "pkumi.computer.traded": {
    text: "{tile}を、3枚のタイルと交換しました",
    back: "Traded {tile} for three tiles",
    review: AGENT_READ,
  },
  "pkumi.computer.done": {
    text: "終わりました",
    back: "Done",
    review: AGENT_READ,
  },
  "pkumi.computer.doneOut": {
    text: "終わって、あがりました",
    back: "Done, and out",
    review: AGENT_READ,
  },
  "pkumi.computer.resigned": {
    text: "投了しました。もう打てる手がありません",
    back: "Resigned: it can do nothing more",
    review: AGENT_READ,
  },
  "pkumi.computer.playing": {
    text: "{name}が打っています",
    back: "{name} is playing",
    review: AGENT_READ,
  },
  "pkumi.computer.stuck": {
    text: "このコンピュータは打てません。下でゲームを終えてください。",
    back: "This computer cannot move: end the game below.",
    review: AGENT_READ,
  },
  "pkumi.computer.seatTitle": {
    text: "この席は、コンピュータが打ちます",
    back: "A computer plays this seat",
    review: AGENT_READ,
  },
  "pkumi.computer.mark": {
    text: "コンピュータ",
    back: "Bot",
    review: AGENT_READ,
  },
  "pkumi.tiles.japanese": {
    text: "日本語",
    back: "Japanese",
    review: AGENT_READ,
  },
  "pkumi.table.emptySquare": {
    text: "空のマス",
    back: "empty square",
    review: AGENT_READ,
  },
  "pkumi.table.typingAcross": {
    text: "横に入力中、画面では{way}向き",
    back: "typing across, which is the {way} direction on the screen",
    review: AGENT_READ,
  },
  "pkumi.table.typingDown": {
    text: "縦に入力中、画面では{way}向き",
    back: "typing down, which is the {way} direction on the screen",
    review: AGENT_READ,
  },
  "pkumi.table.way.right": {
    text: "右",
    back: "right",
    review: AGENT_READ,
  },
  "pkumi.table.way.down": {
    text: "下",
    back: "down",
    review: AGENT_READ,
  },
  "pkumi.table.way.left": {
    text: "左",
    back: "left",
    review: AGENT_READ,
  },
  "pkumi.table.way.up": {
    text: "上",
    back: "up",
    review: AGENT_READ,
  },
  "pkumi.table.misspelt": {
    text: "言葉にならない並びの中",
    back: "in a run that is not a word",
    review: AGENT_READ,
  },
  "pkumi.table.apart": {
    text: "ほかとつながっていない",
    back: "not joined to the rest",
    review: AGENT_READ,
  },
};
