import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the pword.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PWORD: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "pword.headStart.off": {
    text: "先手なし",
    back: "No head start",
    review: AGENT_READ,
  },
  "pword.headStart.dodge": {
    text: "逃げる単語は、まだ何も隠していないので、最初の予想の前に灰色にするものはありません。",
    back: "A word that dodges hides nothing yet, so there is nothing to grey before the first guess.",
    review: AGENT_READ,
  },
  "pword.headStart.backwards": {
    text: "逆さに遊ぶときは、先手は文字を減らすだけなので、ありません。",
    back: "Played backwards, a head start would only take letters away, so there is none.",
    review: AGENT_READ,
  },
  "pword.headStart.notEasy": {
    text: "先手は初級のためのものです。使うには、初級を選んでください。",
    back: "A head start is for easy: choose Easy to have one.",
    review: AGENT_READ,
  },
  "pword.headStart.chosen": {
    text: "{which}入っていない{unit}が{count}個、最初から灰色になります。行を使わない無料の予想ですが、{points}点かかります。",
    back: "{count} {unit} not in {which} start grey: a free guess that uses no row. It costs {points} points.",
    review: AGENT_READ,
  },
  "pword.headStart.letters": {
    text: "文字",
    back: "letters",
    review: AGENT_READ,
  },
  "pword.headStart.kana": {
    text: "かな",
    back: "kana",
    review: AGENT_READ,
  },
  "pword.headStart.whichFour": {
    text: "4つの単語のどれにも",
    back: "any of the four words",
    review: AGENT_READ,
  },
  "pword.headStart.whichTwo": {
    text: "どちらの単語にも",
    back: "either word",
    review: AGENT_READ,
  },
  "pword.headStart.whichOne": {
    text: "単語に",
    back: "the word",
    review: AGENT_READ,
  },
  "pword.headStart.nothing": {
    text: "盤が決めるまで、キーボードでは何も消えません。",
    back: "Nothing is ruled out on the keyboard until the board rules it out.",
    review: AGENT_READ,
  },
  "pword.futago.howMany": {
    text: "単語の数",
    back: "How many words",
    review: AGENT_READ,
  },
  "pword.futago.oneWord": {
    text: "一語",
    back: "One word",
    review: AGENT_READ,
  },
  "pword.futago.four": {
    text: "4つの単語が隠れていて、予想は{guesses}回です。予想は4つすべてに送られ、キーは4つの色をすべて表します。",
    back: "Four hidden words, {guesses} guesses: each goes to all four, and each key shows all four colours.",
    review: AGENT_READ,
  },
  "pword.futago.two": {
    text: "2つの単語が隠れていて、予想は{guesses}回です。予想は両方に送られ、キーは両方の色を表します。",
    back: "Two hidden words, {guesses} guesses: each goes to both words, and each key shows both colours.",
    review: AGENT_READ,
  },
  "pword.futago.one": {
    text: "隠れた単語は1つ、盤も1つです。",
    back: "One hidden word, one board.",
    review: AGENT_READ,
  },
  "pword.way.howPlayed": {
    text: "単語の遊び方",
    back: "How the word is played",
    review: AGENT_READ,
  },
  "pword.way.find": {
    text: "探す",
    back: "Find it",
    review: AGENT_READ,
  },
  "pword.way.popOnly": {
    text: "ポップカルチャーの言葉は、カテゴリから見つけるので、見つける遊び方しかありません。",
    back: "Pop culture words are found from their category, so they are only ever found.",
    review: AGENT_READ,
  },
  "pword.way.findBlurb": {
    text: "最初の予想の前は隠れていて、行が尽きる前に見つかります。",
    back: "Hidden before the first guess, and found before the rows run out.",
    review: AGENT_READ,
  },
  "pword.solve.guessLetters": {
    text: "予想は{size}文字です。",
    back: "A guess is {size} letters.",
    review: AGENT_READ,
  },
  "pword.solve.guessKana": {
    text: "予想は{size}文字です。",
    back: "A guess is {size} kana.",
    review: AGENT_READ,
  },
  "pword.solve.notInList": {
    text: "{word}は、単語リストにありません。",
    back: "{word} is not in the word list.",
    review: AGENT_READ,
  },
  "pword.solve.hideAmong.one": {
    text: "、隠れられる単語は{count}個",
    back: ", and {count} word for it to hide among",
    review: AGENT_READ,
  },
  "pword.solve.hideAmong.other": {
    text: "、隠れられる単語は{count}個",
    back: ", and {count} words for it to hide among",
    review: AGENT_READ,
  },
  "pword.solve.typeBackwards.one": {
    text: "隠れた単語以外の{size}文字の単語を打ち、見つかった文字をすべて使い続けます。通り抜ける行は、あと{count}行です。",
    back: "Type any {size}-letter word but the hidden one, keeping every letter uncovered. {count} row to get through.",
    review: AGENT_READ,
  },
  "pword.solve.typeBackwards.other": {
    text: "隠れた単語以外の{size}文字の単語を打ち、見つかった文字をすべて使い続けます。通り抜ける行は、あと{count}行です。",
    back: "Type any {size}-letter word but the hidden one, keeping every letter uncovered. {count} rows to get through.",
    review: AGENT_READ,
  },
  "pword.solve.typeBackwardsKana.one": {
    text: "隠れた単語以外の単語を打ち、見つかったかなをすべて使い続けます。通り抜ける行は、あと{count}行です。",
    back: "Type any word but the hidden one, keeping every kana uncovered. {count} row to get through.",
    review: AGENT_READ,
  },
  "pword.solve.typeBackwardsKana.other": {
    text: "隠れた単語以外の単語を打ち、見つかったかなをすべて使い続けます。通り抜ける行は、あと{count}行です。",
    back: "Type any word but the hidden one, keeping every kana uncovered. {count} rows to get through.",
    review: AGENT_READ,
  },
  "pword.solve.typeA.one": {
    text: "{size}文字の単語を打って、Enterを押します{goes}。予想は残り{count}回{dodge}。",
    back: "Type a {size}-letter word and press Enter{goes}. {count} guess left{dodge}.",
    review: AGENT_READ,
  },
  "pword.solve.typeA.other": {
    text: "{size}文字の単語を打って、Enterを押します{goes}。予想は残り{count}回{dodge}。",
    back: "Type a {size}-letter word and press Enter{goes}. {count} guesses left{dodge}.",
    review: AGENT_READ,
  },
  "pword.solve.goesFour": {
    text: "（4つすべての単語に送られます）",
    back: ": it goes to all four words",
    review: AGENT_READ,
  },
  "pword.solve.goesTwo": {
    text: "（両方の単語に送られます）",
    back: ": it goes to both words",
    review: AGENT_READ,
  },
  "pword.solve.freeFirst": {
    text: "最初の単語は無料で、すべて灰色です。",
    back: "The first word is free, grey everywhere.  ",
    review: AGENT_READ,
  },
  "pword.solve.freeFirstTwo": {
    text: "最初の単語は無料で、両方の単語に対してすべて灰色です。",
    back: "The first word is free, grey everywhere for both words.  ",
    review: AGENT_READ,
  },
  "pword.solve.freeFirstFour": {
    text: "最初の単語は無料で、4つの区画のすべてに対してすべて灰色です。",
    back: "The first word is free, grey everywhere in all four quarters.  ",
    review: AGENT_READ,
  },
  "pword.solve.allFour": {
    text: "予想は、4つすべての単語に送られます。",
    back: "Every guess goes to all four words.  ",
    review: AGENT_READ,
  },
  "pword.solve.allTwo": {
    text: "予想は、両方の単語に送られます。",
    back: "Every guess goes to both words.  ",
    review: AGENT_READ,
  },
  "pword.solve.guessesLeft.one": {
    text: "予想は残り{count}回{dodge}。",
    back: "{count} guess left{dodge}.",
    review: AGENT_READ,
  },
  "pword.solve.guessesLeft.other": {
    text: "予想は残り{count}回{dodge}。",
    back: "{count} guesses left{dodge}.",
    review: AGENT_READ,
  },
  "pword.out.guesses": {
    text: "予想{rows}回を使い切りました",
    back: "Out of {rows} guesses",
    review: AGENT_READ,
  },
  "pword.out.theWords": {
    text: "単語は",
    back: "The words were",
    review: AGENT_READ,
  },
  "pword.out.theWord": {
    text: "単語は",
    back: "The word was",
    review: AGENT_READ,
  },
  "pword.out.stillHiding": {
    text: "まだ{count}個の単語のどれかに隠れていました。その1つは",
    back: "It was still hiding among {count} words, one of them",
    review: AGENT_READ,
  },
  "pword.out.tail": {
    text: "でした。",
    back: ".",
    review: AGENT_READ,
  },
  "pword.out.caughtHead": {
    text: "{rows}行中{n}行めで引っかかりました：",
    back: "Caught on row {n} of {rows}: ",
    review: AGENT_READ,
  },
  "pword.out.caughtTail": {
    text: "が、その単語でした。",
    back: " was the word.",
    review: AGENT_READ,
  },
  "pword.out.caughtShort": {
    text: "{n}行めで引っかかった",
    back: "Caught on row {n}",
    review: AGENT_READ,
  },
  "pword.out.playedOutPaid": {
    text: "最後まで遊んで+{points}経験値。",
    back: "+{points} XP for playing it out. ",
    review: AGENT_READ,
  },
  "pword.out.keptBefore": {
    text: "予想といっしょに",
    back: "Kept in",
    review: AGENT_READ,
  },
  "pword.out.keptAfter": {
    text: "に保存されています。",
    back: "with your guesses.",
    review: AGENT_READ,
  },
  "pword.out.anotherFour": {
    text: "さらに4つの単語 →",
    back: "Four more words →",
    review: AGENT_READ,
  },
  "pword.out.anotherTwo": {
    text: "さらに2つの単語 →",
    back: "Two more words →",
    review: AGENT_READ,
  },
  "pword.out.anotherOne": {
    text: "別の単語 →",
    back: "Another word →",
    review: AGENT_READ,
  },
  "pword.credit.languageTool": {
    text: "LanguageToolのドイツ語辞書",
    back: "LanguageTool's German dictionary",
    review: AGENT_READ,
  },
  "pword.credit.licence": {
    text: "ライセンス",
    back: "licence",
    review: AGENT_READ,
  },
  "pword.credit.words": {
    text: "単語は、{source}と{wiktionary}から取り、{frequency}（Hermit Daveによる、OpenSubtitles 2018の集計）で順位づけしています。すべて{licence}のもとで使っています。",
    back: "Words from {source} and {wiktionary}, ranked by {frequency} by Hermit Dave, a count of OpenSubtitles 2018; all used under {licence}.",
    review: AGENT_READ,
  },
  "pword.credit.kana": {
    text: "単語は、電子辞書研究開発グループの{jmdict}から取っています。{licence}（CC BY-SA 4.0）のもとで使っており、リリースは{release}です。",
    back: "Words from {jmdict} by the Electronic Dictionary Research and Development Group, used under its {licence} (CC BY-SA 4.0), release {release}.",
    review: AGENT_READ,
  },
  "pword.koushi.left.one": {
    text: "入れ替えは残り{count}回",
    back: "{count} swap left",
    review: AGENT_READ,
  },
  "pword.koushi.left.other": {
    text: "入れ替えは残り{count}回",
    back: "{count} swaps left",
    review: AGENT_READ,
  },
  "pword.koushi.how": {
    text: "· 文字をタップして、もう1つの文字をタップすると入れ替わります。文字を別の文字の上にドラッグしてもかまいません。",
    back: "· Tap a letter, then another, to swap them, or drag one onto the other.",
    review: AGENT_READ,
  },
  "pword.koushi.another": {
    text: "別の格子 →",
    back: "Another lattice →",
    review: AGENT_READ,
  },
  "pword.koushi.sparesAria": {
    text: "余った入れ替えは{total}回中{kept}回",
    back: "{kept} of {total} swaps to spare",
    review: AGENT_READ,
  },
  "pword.koushi.summary.one": {
    text: "入れ替え{count}回、余り{kept}回{note}。",
    back: "{count} swap, {kept} to spare{note}.",
    review: AGENT_READ,
  },
  "pword.koushi.summary.other": {
    text: "入れ替え{count}回、余り{kept}回{note}。",
    back: "{count} swaps, {kept} to spare{note}.",
    review: AGENT_READ,
  },
  "pword.koushi.asFew": {
    text: "（これ以上少なくできません）",
    back: ": as few as it can be done in",
    review: AGENT_READ,
  },
  "pword.board.foundIn": {
    text: "✓ {count}回で発見",
    back: "✓ Found in {count}",
    review: AGENT_READ,
  },
  "pword.hist.newest": {
    text: "{total}件のうち、新しい{count}件です。",
    back: "Your newest {count} of {total}.",
    review: AGENT_READ,
  },
  "pword.hist.foundIn": {
    text: "{count}で発見",
    back: "Found in {count}",
    review: AGENT_READ,
  },
  "pword.hist.notFound": {
    text: "見つからなかった",
    back: "Not found",
    review: AGENT_READ,
  },
  "pword.hist.noGuesses": {
    text: "予想は保存されていません。保存される前に遊んだものです。",
    back: "Its guesses were not kept: it was played before they were.",
    review: AGENT_READ,
  },
  "pword.hist.guessesAria": {
    text: "予想：{list}",
    back: "Guesses: {list}",
    review: AGENT_READ,
  },
  "pword.hist.points": {
    text: "点",
    back: "points",
    review: AGENT_READ,
  },
  "pword.key.enter": {
    text: "決定",
    back: "Enter",
    review: AGENT_READ,
  },
  "pword.key.deleteLetter": {
    text: "文字を消す",
    back: "delete a letter",
    review: AGENT_READ,
  },
  "pword.key.deleteKana": {
    text: "かなを消す",
    back: "delete a kana",
    review: AGENT_READ,
  },
  "pword.key.makes": {
    text: "{kana}にする",
    back: "make {kana}",
    review: AGENT_READ,
  },
  "pword.key.nothingToChange": {
    text: "{kind}：変えられるものはありません",
    back: "{kind}: nothing to change",
    review: AGENT_READ,
  },
  "pword.key.changeKana": {
    text: "かなを変える：{what}",
    back: "change the kana: {what}",
    review: AGENT_READ,
  },
  "pword.key.small": {
    text: "大きさ",
    back: "small or large",
    review: AGENT_READ,
  },
  "pword.key.mark": {
    text: "濁点・半濁点",
    back: "its mark",
    review: AGENT_READ,
  },
  "pword.key.inPlace": {
    text: "正しい場所",
    back: "in its place",
    review: AGENT_READ,
  },
  "pword.key.elsewhere": {
    text: "単語のほかの場所",
    back: "in the word elsewhere",
    review: AGENT_READ,
  },
  "pword.key.notIn": {
    text: "単語にない",
    back: "not in it",
    review: AGENT_READ,
  },
  "pword.key.column": {
    text: "この列にある",
    back: "its column is here",
    review: AGENT_READ,
  },
  "pword.key.notTried": {
    text: "まだ試していない",
    back: "not tried",
    review: AGENT_READ,
  },
  "pword.key.word": {
    text: "単語{count}",
    back: "word {count}",
    review: AGENT_READ,
  },
  "pword.key.firstWord": {
    text: "1つめの単語",
    back: "first word",
    review: AGENT_READ,
  },
  "pword.key.secondWord": {
    text: "2つめの単語",
    back: "second word",
    review: AGENT_READ,
  },
  "pword.key.thirdWord": {
    text: "3つめの単語",
    back: "third word",
    review: AGENT_READ,
  },
  "pword.key.fourthWord": {
    text: "4つめの単語",
    back: "fourth word",
    review: AGENT_READ,
  },
  "pword.keys.show": {
    text: "キーを出す",
    back: "Show keys",
    review: AGENT_READ,
  },
  "pword.keys.hide": {
    text: "キーを隠す",
    back: "Hide keys",
    review: AGENT_READ,
  },
  "pword.score.inPlace": {
    text: "正しい場所",
    back: "In place",
    review: AGENT_READ,
  },
  "pword.score.elsewhere": {
    text: "ほかの場所で発見",
    back: "Found elsewhere",
    review: AGENT_READ,
  },
  "pword.score.columns": {
    text: "列",
    back: "Columns",
    review: AGENT_READ,
  },
  "pword.score.theWord": {
    text: "単語",
    back: "The word",
    review: AGENT_READ,
  },
  "pword.score.speed": {
    text: "速さ",
    back: "Speed",
    review: AGENT_READ,
  },
  "pword.score.nothingFound": {
    text: "— 単語の文字は、ひとつも見つかりませんでした。",
    back: "— nothing of the word was found.",
    review: AGENT_READ,
  },
  "pword.score.headStart": {
    text: "先手",
    back: "Head start",
    review: AGENT_READ,
  },
  "pword.score.caught": {
    text: "— 最初の行で引っかかりました。",
    back: "— caught on the first row.",
    review: AGENT_READ,
  },
  "pword.score.rows": {
    text: "通り抜けた行",
    back: "Rows got through",
    review: AGENT_READ,
  },
  "pword.score.everyRow": {
    text: "すべての行",
    back: "Every row",
    review: AGENT_READ,
  },
  "pword.pop.categories": {
    text: "カテゴリ",
    back: "Categories",
    review: AGENT_READ,
  },
  "pword.pop.category": {
    text: "カテゴリ",
    back: "Category",
    review: AGENT_READ,
  },
  "pword.setting.language": {
    text: "言語",
    back: "Language",
    review: AGENT_READ,
  },
  "pword.setting.wordList": {
    text: "単語リスト",
    back: "Word list",
    review: AGENT_READ,
  },
  "pword.setting.popOnly": {
    text: "ポップカルチャーは、英語だけです。",
    back: "Pop culture is in English only.",
    review: AGENT_READ,
  },
  "pword.setting.english": {
    text: "英語の単語は、Kevin Atkinsonの綴りリスト「SCOWL」からです。初級は、ごく身近な単語のどれかが答えです。",
    back: "English words from SCOWL, Kevin Atkinson's spelling lists: easy hides one of the commonest.",
    review: AGENT_READ,
  },
  "pword.setting.french": {
    text: "フランス語の単語は「Lexique」からで、答えはどれもWiktionaryにもあります。アクセント記号は、ふつうの文字として扱います。",
    back: "French words from Lexique, every hidden one in Wiktionary too; accents fold to their letter.",
    review: AGENT_READ,
  },
  "pword.setting.german": {
    text: "ドイツ語の単語は、LanguageToolの辞書からです。Ä、Ö、Üは、それぞれ独立した文字です。",
    back: "German words from LanguageTool's dictionary, with Ä, Ö and Ü as letters of their own.",
    review: AGENT_READ,
  },
  "pword.setting.japanese": {
    text: "かなの単語は、JMdictからで、ひらがなです。かなのキーか、ローマ字で打ちます。",
    back: "Kana words from JMdict, in hiragana, typed on the kana keys or in romaji.",
    review: AGENT_READ,
  },
  "pword.setting.pop": {
    text: "ポップカルチャーの言葉は、手で管理していて、それぞれカテゴリが示されます。たとえば、ポケモンやギリシャの神です。",
    back: "Pop culture words kept by hand, each shown with its category: a Pokemon, a Greek deity.",
    review: AGENT_READ,
  },
  "pword.daily.today": {
    text: "今日の{size}",
    back: "Today's {size}",
    review: AGENT_READ,
  },
  "pword.daily.fastest": {
    text: "今日の最速",
    back: "Today's fastest",
    review: AGENT_READ,
  },
  "pword.daily.past": {
    text: "過去の単語",
    back: "Past words",
    review: AGENT_READ,
  },
  "pword.daily.heading": {
    text: "今日の言葉",
    back: "Today's words",
    review: AGENT_READ,
  },
  "pword.daily.lead": {
    text: "今日の単語は、どの長さも全員が同じです。{futago}では同じ2つ、{yotsugo}では同じ4つ、{nige}では同じ逃げる単語、{sakasa}では同じ避ける単語で、UTCの午前0時に新しくなります。",
    back: "The same word for everybody today at each length, the same two for a {futago} and four for a {yotsugo}, the same word that dodges for a {nige} and a word to avoid for a {sakasa}, new at midnight UTC.",
    review: AGENT_READ,
  },
  "pword.daily.caught": {
    text: "引っかかった",
    back: "caught",
    review: AGENT_READ,
  },
  "pword.daily.notFound": {
    text: "見つからなかった",
    back: "not found",
    review: AGENT_READ,
  },
  "pword.daily.halfDone": {
    text: "途中まで",
    back: "Half done",
    review: AGENT_READ,
  },
  "pword.daily.notYet": {
    text: "まだ",
    back: "Not yet",
    review: AGENT_READ,
  },
  "pword.daily.archive.title": {
    text: "{name}の日替わり単語",
    back: "{name} daily words",
    review: AGENT_READ,
  },
  "pword.daily.archive.crumb": {
    text: "日替わり単語",
    back: "Daily words",
    review: AGENT_READ,
  },
  "pword.daily.archive.lead": {
    text: "毎日、どの長さにも1つずつ単語があり、全員が同じで、UTCの午前0時に新しくなります。ここには過ぎた日が並び、単語はそのパズルへ、日付はその最速の記録へつながっています。今日の単語は、明日まで、ゲームのページで待っています。",
    back: "Every day has one word at each length, the same for everybody, new at midnight UTC. Here are the days gone by, a word leading to its puzzle and a day to its fastest finds; today's words wait on the game's page until tomorrow.",
    review: AGENT_READ,
  },
  "pword.daily.archive.playToday": {
    text: "今日の単語を遊ぶ",
    back: "Play today's words",
    review: AGENT_READ,
  },
  "pword.daily.archive.everyMonth": {
    text: "すべての月",
    back: "Every month",
    review: AGENT_READ,
  },
  "pword.daily.archive.show": {
    text: "表示",
    back: "Show",
    review: AGENT_READ,
  },
  "pword.daily.archive.search": {
    text: "この日々を検索",
    back: "Search these days",
    review: AGENT_READ,
  },
  "pword.daily.archive.placeholder": {
    text: "単語か日付",
    back: "A word or a date",
    review: AGENT_READ,
  },
  "pword.daily.archive.noDay": {
    text: "まだ過ぎた日はありません。最初の日の単語は、その翌日に、ここに並びます。",
    back: "No day has passed yet. The first day's words are listed here the day after it.",
    review: AGENT_READ,
  },
  "pword.daily.archive.noMatch": {
    text: "「{search}」を含む日は、ここにありません。ほかの月か、すべての月を試してください。",
    back: "No day listed here has \"{search}\". Try another month, or every month.",
    review: AGENT_READ,
  },
  "pword.daily.archive.weekOf": {
    text: "{date}の週",
    back: "Week of {date}",
    review: AGENT_READ,
  },
  "pword.daily.archive.day": {
    text: "日",
    back: "Day",
    review: AGENT_READ,
  },
  "pword.daily.archive.fastestFinds": {
    text: "{day}：最速の記録",
    back: "{day}: the fastest finds",
    review: AGENT_READ,
  },
  "pword.daily.day.today": {
    text: "今日、{day}",
    back: "Today, {day}",
    review: AGENT_READ,
  },
  "pword.daily.day.lead": {
    text: "この日の単語と、それぞれをいちばん速く見つけた記録です。その日に見つけたものも、その後のものも含みます。",
    back: "The words of this day, and the fastest to find each — on the day or since.",
    review: AGENT_READ,
  },
  "pword.daily.day.leadToday": {
    text: "今日の単語は、明日まで隠れています。タイムは、すでに競い合っています。",
    back: "Today's words stay hidden until tomorrow. The times are already racing.",
    review: AGENT_READ,
  },
  "pword.daily.day.before": {
    text: "← 前の日",
    back: "← The day before",
    review: AGENT_READ,
  },
  "pword.daily.day.after": {
    text: "次の日 →",
    back: "The day after →",
    review: AGENT_READ,
  },
  "pword.daily.day.every": {
    text: "過ぎた日のすべて",
    back: "Every past day",
    review: AGENT_READ,
  },
  "pword.daily.day.nobody": {
    text: "まだ誰も見つけていません。",
    back: "Nobody has found this one yet.",
    review: AGENT_READ,
  },
  "pword.daily.day.playYourself": {
    text: "自分で遊ぶ →",
    back: "Play it yourself →",
    review: AGENT_READ,
  },
  "pword.daily.day.level": {
    text: "レベル",
    back: "Level",
    review: AGENT_READ,
  },
  "pword.daily.archive.month": {
    text: "月",
    back: "Month",
    review: AGENT_READ,
  },
  "pword.koushi.keptBefore": {
    text: "そのままの状態で",
    back: "Kept in",
    review: AGENT_READ,
  },
  "pword.koushi.keptAfter": {
    text: "に保存されています。",
    back: "as you left it.",
    review: AGENT_READ,
  },
  "pword.solve.refused": {
    text: "{mode}の決まり：{reason}。",
    back: "{mode} rule: {reason}.",
    review: AGENT_READ,
  },
  "pword.hold.played": {
    text: "{unit}は、もう打ちました",
    back: "{unit} has been played already",
    review: AGENT_READ,
  },
  "pword.hold.stay": {
    text: "{ordinal}は、{unit}のままにします",
    back: "the {ordinal} must stay {unit}",
    review: AGENT_READ,
  },
  "pword.hold.use": {
    text: "予想には、{unit}を使う必要があります",
    back: "the guess must use {unit}",
    review: AGENT_READ,
  },
  "pword.hold.grey": {
    text: "{unit}は灰色だったので、もう使えません",
    back: "{unit} was grey, and may not be used again",
    review: AGENT_READ,
  },
  "pword.hold.letterMust": {
    text: "{ordinal}の文字は、{unit}のままにします",
    back: "the {ordinal} letter must be {unit}",
    review: AGENT_READ,
  },
  "pword.hold.kanaStay": {
    text: "{kana}は、{place}番目のままにします",
    back: "{kana} must stay in place {place}",
    review: AGENT_READ,
  },
  "pword.hold.kanaUse": {
    text: "{kana}を使う必要があります",
    back: "{kana} must be used",
    review: AGENT_READ,
  },
  "pword.ord.first": {
    text: "1つ目",
    back: "first",
    review: AGENT_READ,
  },
  "pword.ord.second": {
    text: "2つ目",
    back: "second",
    review: AGENT_READ,
  },
  "pword.ord.third": {
    text: "3つ目",
    back: "third",
    review: AGENT_READ,
  },
  "pword.ord.fourth": {
    text: "4つ目",
    back: "fourth",
    review: AGENT_READ,
  },
  "pword.ord.fifth": {
    text: "5つ目",
    back: "fifth",
    review: AGENT_READ,
  },
  "pword.ord.sixth": {
    text: "6つ目",
    back: "sixth",
    review: AGENT_READ,
  },
  "pword.ord.seventh": {
    text: "7つ目",
    back: "seventh",
    review: AGENT_READ,
  },
  "pword.ord.other": {
    text: "{n}つ目",
    back: "{n}th",
    review: AGENT_READ,
  },
  "pword.mode.twoWords": {
    text: "2つの単語",
    back: "Two words",
    review: AGENT_READ,
  },
  "pword.mode.fourWords": {
    text: "4つの単語",
    back: "Four words",
    review: AGENT_READ,
  },
  "pword.cell.hit": {
    text: "合っている場所",
    back: "in the right place",
    review: AGENT_READ,
  },
  "pword.cell.near": {
    text: "単語の別の場所にある",
    back: "in the word elsewhere",
    review: AGENT_READ,
  },
  "pword.cell.kin": {
    text: "同じ列の別のかなが単語にある",
    back: "the word has another kana from the same column",
    review: AGENT_READ,
  },
  "pword.cell.miss": {
    text: "単語にない",
    back: "not in the word",
    review: AGENT_READ,
  },
  "pword.cell.wrongSize": {
    text: "大きさがちがう",
    back: "the size is wrong",
    review: AGENT_READ,
  },
  "pword.cell.wrongMark": {
    text: "濁点・半濁点がちがう",
    back: "the dakuten or handakuten is wrong",
    review: AGENT_READ,
  },
  "pword.cell.wrongBoth": {
    text: "大きさと濁点・半濁点がちがう",
    back: "the size and the dakuten or handakuten are wrong",
    review: AGENT_READ,
  },
  "pword.cell.letter": {
    text: "{n}文字目",
    back: "letter {n}",
    review: AGENT_READ,
  },
  "pword.cell.chosen": {
    text: "選択中",
    back: "chosen",
    review: AGENT_READ,
  },
  "pword.cell.givenFree": {
    text: "無料で入っている",
    back: "in for free",
    review: AGENT_READ,
  },
  "pword.koushi.near": {
    text: "どちらかの単語の別の場所に必要",
    back: "needed elsewhere in one of the words",
    review: AGENT_READ,
  },
  "pword.koushi.miss": {
    text: "どちらの単語にも不要",
    back: "not needed by either word",
    review: AGENT_READ,
  },
};
