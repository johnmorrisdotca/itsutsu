import { AGENT_READ_2026_10_06, type JaLine } from "../copyJa.types";
import { JAPANESE_TILE_MIX, KUMIMOJI_HANDS, kumimojiTileCount } from "../../puzzles/kumimoji/tiles.constants";

import type { PuzzleCopyJa } from "./puzzles.ja.types";

/**
 * The word puzzles' words in Japanese: the five Gomoji, Tsunagi, Kumimoji and
 * Koushi. A word puzzle's word list is data and its language a setting of the
 * game, so what is here is only the words about the game.
 */
const AGENT_READ = AGENT_READ_2026_10_06;

/** A lettered Gomoji's Head start, in its rules (`headStart.ts`); the kana one says it in kana. */
const HEAD_START: JaLine = [
  "「先手」は、初級で選べます。最初の予想の前に、単語の文字数と同じ数のキーを灰色にします。灰色にするのは、単語に入っていない文字です。行を使わない無料の予想ですが、50点を払います。",
  "Head start, a choice at easy, greys as many keys as the word has letters before the first guess, none of them letters in the word. It is a free guess that takes no row, at a cost of 50 points.",
];

const FIVE_LETTERS: JaLine = [
  "単語が1つ隠れています。5文字の長さです。短い形では4文字、長い形では6文字です。その長さの単語を打ち、Enterを押して予想します。",
  "A word is hidden: five letters long, four in the short form, six in the long one. Type a word of that length and press Enter to guess it.",
];
const COLOURS: JaLine = [
  "予想の1文字ごとに色がつきます。その場所に正しく入っていれば緑、単語のほかの場所にあれば金色、単語に入っていなければ灰色です。",
  "Each letter of the guess gets a colour: green if it is in the word in that place, gold if it is in the word somewhere else, grey if it is not in the word at all.",
];
const STRICT: JaLine = [
  "「ストリクト」は、どのレベルでも選べます。見つかった文字は、次の予想でも必ず使い、緑の文字は同じ場所に置きます。",
  "Strict, a choice at any level, keeps you honest: every letter already found must be used again, and a green one goes in its place.",
];
const HARD_HONEST: JaLine = [
  "上級では、見つかった文字は次の予想でも必ず使い、緑の文字は同じ場所に置きます。",
  "Hard keeps you honest: every letter already found must be used again, and a green one goes in its place.",
];

export const PUZZLE_COPY_JA_WORDS = {
  gomoji: {
    tagline: [
      "隠れた単語を見つけます。予想するたびに、その文字が単語に入っているか、正しい場所にあるかが分かります。",
      "Find the hidden word. Each guess shows which of its letters are in the word and which are in the right place.",
    ],
    origin: [
      "予想の手がかりから単語を当てるのは、昔からある室内遊びです。1955年の「ジョット」は2つの単語に共通する文字を数え、1987年のテレビゲーム「リンゴ」は文字ごとに、場所が合っているかどうかで色をつけました。2021年にJosh Wardleの「ワードル」が、5文字の形を毎日の習慣にしました。",
      "Guessing a word from what each guess gives away is an old parlour game: Jotto (1955) counted the letters two words share, and the television game Lingo (1987) coloured each letter by whether it was in its place. Josh Wardle's Wordle (2021) made the five-letter form a daily habit.",
    ],
    rules: [
      FIVE_LETTERS,
      COLOURS,
      [
        "文字の色は、その文字が単語に入っている数だけつきます。単語にEが1つしかないのにEを2つ入れると、1つのEが光り、もう1つは灰色になります。",
        "A letter is coloured as many times as it is in the word: guess two E's against a word with one, and one E lights up while the other goes grey.",
      ],
      [
        "予想の回数は、初級が8回、中級が7回、上級が6回で、どの長さでも同じです。短い単語は、1回の予想で分かる文字が少なく、1文字違いの4文字の単語も多いので、見つけやすいわけではありません。予想は実在する単語でなければなりません。リストにない単語は受け付けられず、回数も減りません。",
        "You get eight guesses on easy, seven on medium and six on hard, at every length: a short word is no easier to find, since each guess gives away fewer letters and many four-letter words differ by one letter. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      ],
      STRICT,
      HEAD_START,
    ],
    board: [
      "4文字、5文字、6文字から選べます。盤はどの長さ、どのレベルでも8行です。横は、4文字と6文字が8マス、5文字が9マスで、単語が中央に来ます。単語はKevin Atkinsonの綴りリスト「SCOWL」から取っています。初級はごく身近な単語のどれか、中級と上級はもっと広いリストの単語のどれかが答えで、予想にはリストにあるどの単語も使えます。",
      "Four, five or six letters. The board is eight rows tall at every length and level, and eight squares across for four or six letters and nine for five, so the word sits in the middle. The words come from SCOWL, the spelling lists by Kevin Atkinson: easy hides one of the commonest words, medium and hard one from a wider list, and any word in the lists may be guessed.",
    ],
    review: AGENT_READ,
  },
  gomojiKana: {
    tagline: [
      "隠れた単語をかなで見つけます。予想するたびに、合っているかな、単語に入っているかな、正しいかなが入る列が分かります。",
      "Find the hidden word in kana. Each guess shows which kana are right, which are in the word, and which column the right one is in.",
    ],
    origin: [
      "日本語版の五文字です。隠れた単語をひらがなで探す遊びは同じですが、かなには文字では起こらない「惜しい」があります。大きさ、印、列の決まりはこのサイトのものです。",
      "Gomoji in Japanese: the same hunt for a hidden word, played in hiragana, where a kana can be nearly right in ways a letter cannot. The rules for size, marks and columns are our own.",
    ],
    rules: [
      [
        "単語が1つ隠れています。ひらがなで3文字、4文字、5文字のどれかです。予想の行数は、初級が8行、中級が7行、上級が6行で、どの長さでも同じです。初級と中級では最初の1行が無料の灰色の単語なので、予想できるのは初級が7回、中級が6回、上級は無料の単語なしで6回です。予想は実在する単語でなければなりません。",
        "A word is hidden, three, four or five kana long, in hiragana. The rows are eight on easy, seven on medium and six on hard, at every length: on easy and medium the first row is the free grey word, so you get seven guesses on easy and six on medium, and six with no free word on hard. Every guess must be a real word.",
      ],
      [
        "緑は、正しいかなが正しい場所にあることです。オレンジは、そのかなが単語のほかの場所にあることです。黄色は、この場所に入る単語のかなが、かな表で同じ列にあることです（か・き・く・け・こは同じ列です）。灰色は、そのどれでもありません。",
        "Green is the right kana in the right place. Orange is a kana that is in the word somewhere else. Yellow means the word's kana in this place is in the same column of the kana table (か き く け こ are one column). Grey is none of those.",
      ],
      [
        "矢印は、かなは合っているが、惜しいという意味です。下向きは大きさのちがい（「っ」のところに「つ」）、上向きは濁点や半濁点のちがい（「ば」や「ぱ」のところに「は」）です。すべての場所がふつうの緑になったときに、単語が見つかったことになります。",
        "An arrow means the right kana, but not quite: down for the wrong size (つ for っ), up for the wrong mark (は for ば or ぱ). The word is found only when every place is plain green.",
      ],
      [
        "初級と中級では、始まるときに、すでに予想された無料の単語があり、そのかなはすべて灰色です。始める前に、そのかなは候補から消えています。",
        "On easy and medium the puzzle opens with a free word already played, grey everywhere, so its kana are ruled out before you start.",
      ],
      [
        "かなのキーで打つか、パソコンのキーボードでローマ字（ka、kya、tsu。「っ」は子音を2回、「ん」はnn、「ー」は-）で打ちます。「ストリクト」は、どのレベルでも選べます。見つかったかなは次の予想でも必ず使い、緑のかなは同じ場所に置きます。",
        "Type with the kana keys, or in romaji on your own keyboard (ka, kya, tsu; a doubled consonant for っ, nn for ん, - for ー). Strict, a choice at any level, keeps you honest: every kana found must be used again, and a green one goes in its place.",
      ],
      [
        "「先手」は、初級で選べます。最初の予想の前に、単語の長さと同じ数のかなキーを灰色にします。灰色にするのは、単語にも無料の灰色の単語にも入っていないかなです。行を使わない無料の予想ですが、50点を払います。",
        "Head start, a choice at easy, greys as many kana keys as the word is long before the first guess, none of them in the word or in the free grey word. It is a free guess that takes no row, at a cost of 50 points.",
      ],
    ],
    board: [
      "3文字がいちばんやさしく、5文字がいちばん難しいです。単語は、電子辞書研究開発グループの日本語辞書「JMdict」から取っています。ライセンスに従って使い、毎月更新しています。答えになる単語は、決まった基準でよく使われるものです。まず教科書によく出る言葉、次に新聞で使われる回数の順です。初級は、その長さのいちばんよく使われる900語のうちの1語、中級と上級は2,000語のうちの1語が答えで、予想には辞書にあるどの単語も使えます。",
      "Three kana is the gentlest, five the hardest. The words come from JMdict, the Japanese dictionary of the Electronic Dictionary Research and Development Group, used under its licence and refreshed every month. The answers are the commonest words by a fixed rule: first the words common in textbooks, then by how often newspapers use them. Easy hides one of the 900 commonest at its length, medium and hard one of the 2,000 commonest, and any word in the dictionary may be guessed.",
    ],
    review: AGENT_READ,
  },
  gomojiMot: {
    tagline: [
      "隠れたフランス語の単語を見つけます。予想するたびに、その文字が単語に入っているか、正しい場所にあるかが分かります。",
      "Find the hidden French word. Each guess shows which of its letters are in the word and which are in the right place.",
    ],
    origin: [
      "フランス語版の五文字です。2021年にJosh Wardleの「ワードル」が毎日の習慣にした、隠れた単語を探す遊びを、AZERTYキーボードで遊びます。アクセント記号は、フランス語のワードル風のゲームと同じように、ふつうの文字として扱います。ÉはEと同じ予想になります。",
      "Gomoji in French: the same hunt for a hidden word that Josh Wardle's Wordle (2021) made a daily habit, played on the AZERTY keyboard. Accents fold to their plain letter, as French Wordle-style games play it: É guesses the same as E.",
    ],
    rules: [
      FIVE_LETTERS,
      COLOURS,
      [
        "文字の色は、その文字が単語に入っている数だけつきます。単語にEが1つしかないのにEを2つ入れると、1つのEが光り、もう1つは灰色になります。",
        "A letter is coloured as many times as it is in the word: guess two E's against a word with one, and one E lights up while the other goes grey.",
      ],
      [
        "予想の回数は、初級が8回、中級が7回、上級が6回で、どの長さでも同じです。予想は実在する単語でなければなりません。リストにない単語は受け付けられず、回数も減りません。",
        "You get eight guesses on easy, seven on medium and six on hard, at every length. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      ],
      HARD_HONEST,
      HEAD_START,
    ],
    board: [
      "4文字、5文字、6文字から選べて、予想の回数は初級が8回、中級が7回、上級が6回です。予想には、約14万語のフランス語辞書「Lexique」にあるどの単語も使えます。答えは、Wiktionaryにもある単語で、フランス語の本で読まれる、辞書の見出しの形です。人名、複数形、活用した動詞、英語からの借用語は入りません。初級はLexiqueの数え方でよく使われる単語、中級と上級はもっと広いリストから出ます。よく使われる単語は、フランス語の映画のせりふでの多さ（hermitdaveのFrequencyWords）を目安にしています。アクセント記号は取り除かれ、œやæを含む単語は除いています。",
      "Four, five or six letters, with eight guesses on easy, seven on medium and six on hard. Any word in Lexique, a French dictionary of about 140,000 words, may be guessed. The hidden word is one that Wiktionary has too, read in French books and in its dictionary form: never a name, a plural, a conjugated verb or a word borrowed from English. Easy hides one of the commoner words as Lexique counts them, by how often French film dialogue uses them (hermitdave's FrequencyWords), and medium and hard one from the wider list. Accents are folded away, and words spelled with œ or æ are left out.",
    ],
    review: AGENT_READ,
  },
  gomojiWort: {
    tagline: [
      "隠れたドイツ語の単語を見つけます。予想するたびに、その文字が単語に入っているか、正しい場所にあるかが分かります。",
      "Find the hidden German word. Each guess shows which of its letters are in the word and which are in the right place.",
    ],
    origin: [
      "ドイツ語版の五文字です。2021年にJosh Wardleの「ワードル」が毎日の習慣にした、隠れた単語を探す遊びを、QWERTZキーボードで遊びます。Ä、Ö、Üは、それぞれ独立した文字です。",
      "Gomoji in German: the same hunt for a hidden word that Josh Wardle's Wordle (2021) made a daily habit, played on the QWERTZ keyboard, with Ä, Ö and Ü as letters of their own.",
    ],
    rules: [
      FIVE_LETTERS,
      COLOURS,
      [
        "Ä、Ö、Üは、母音に点がついたものではなく、独立した文字です。äの予想は、äにだけ合います。",
        "Ä, Ö and Ü are letters of their own, not vowels with marks added: a guess of ä matches only ä.",
      ],
      [
        "予想の回数は、初級が8回、中級が7回、上級が6回で、どの長さでも同じです。予想は実在する単語でなければなりません。リストにない単語は受け付けられず、回数も減りません。",
        "You get eight guesses on easy, seven on medium and six on hard, at every length. Every guess must be a real word; a word the list does not know is refused and costs nothing.",
      ],
      HARD_HONEST,
      HEAD_START,
    ],
    board: [
      "4文字、5文字、6文字から選べて、予想の回数は初級が8回、中級が7回、上級が6回です。予想には、LanguageToolのドイツ語辞書にあるどの形も使えます。人名や略語は使えません。答えは、Wiktionaryにもある単語で、辞書の見出しの形です。複数形、語形変化した形、英語からの借用語は入りません。単語のよく使われる度合いは、ドイツ語の映画のせりふでの多さ（hermitdaveのFrequencyWords）で決めています。初級はよく使われる単語、中級と上級はもっと広いリストから出ます。ßを含む単語は、フランス語版がœやæを除くのと同じように除いています。",
      "Four, five or six letters, with eight guesses on easy, seven on medium and six on hard. Any form in LanguageTool's German dictionary may be guessed, never a name or an abbreviation. The hidden word is one that Wiktionary has too, in its dictionary form: never a plural, an inflected form or a word borrowed from English. How common a word is is decided by how often German film dialogue says it (hermitdave's FrequencyWords): easy hides one of the commoner words, medium and hard one from the wider list. Words spelled with ß are left out, the way the French version leaves out œ and æ.",
    ],
    review: AGENT_READ,
  },
  gomojiPop: {
    tagline: [
      "カテゴリを手がかりに、隠れたポップカルチャーの言葉を見つけます。予想するたびに、その文字が単語に入っているか、正しい場所にあるかが分かります。",
      "Find the hidden pop-culture word from its category. Each guess shows which of its letters are in the word and which are in the right place.",
    ],
    origin: [
      "クイズが入った五文字です。2021年にJosh Wardleの「ワードル」が毎日の習慣にした、隠れた単語を探す遊びに、ゲーム、映画、神話、音楽、スポーツ、日本の文化など、誰もが名前を知っているものの一覧を組み合わせました。答えにはそれぞれ、出どころのカテゴリが示されます。",
      "Gomoji with a quiz inside: the hunt for a hidden word that Josh Wardle's Wordle (2021) made a daily habit, over a list of the games, films, myths, music, sport and Japanese culture people know by name, each word shown with the category it comes from.",
    ],
    rules: [
      [
        "単語が1つ隠れています。3文字から7文字の長さで、盤の上にカテゴリが示されます。たとえばポケモン、ギリシャの神、楽器です。その長さの単語を打ち、Enterを押して予想します。",
        "A word is hidden, three to seven letters long, and its category is shown above the board: a Pokemon, a Greek deity, a musical instrument. Type a word of that length and press Enter to guess it.",
      ],
      COLOURS,
      [
        "予想には、その長さのどの英単語も使えます。ポップカルチャーのリストにある言葉なら、名前も使えます。MARIOもZELDAも、ここでは単語です。",
        "Any English word of that length may be guessed, and any word of the pop list, names included: MARIO and ZELDA are words here.",
      ],
      [
        "予想の回数は、初級が8回、中級が7回、上級が6回で、どの長さでも同じです。リストにない単語は受け付けられず、回数も減りません。",
        "You get eight guesses on easy, seven on medium and six on hard, at every length. A word the list does not know is refused and costs nothing.",
      ],
      STRICT,
      HEAD_START,
    ],
    board: [
      "設定画面の1段目は3文字から6文字、2段目は4文字から7文字です。答えは手で管理している1つのリストで、どの言葉もカテゴリに合っているか、サイトのどの会員にも向いているかを確かめています。名前は、記号やロゴなしの、ふつうの言葉として書いています。予想には、そのリストと、Kevin Atkinsonの綴りリスト「SCOWL」にある言葉が使えます。",
      "The set-up screen's first shelf has three to six letters, and its second four to seven. The answers are one list kept by hand, each word checked to belong to its category and to be fit for every member of the site; names are written as plain words, with no marks or logos. Guesses come from that list and from SCOWL, the spelling lists by Kevin Atkinson.",
    ],
    review: AGENT_READ,
  },
  tsunagi: {
    tagline: ["同じ色のビー玉の組を線でつなぎ、盤をすべて埋めます。", "Join each pair of marbles with a line, and fill the whole board."],
    origin: [
      "1980年代にニコリが日本で広めた、つなぐパズルの、このサイトの形です。繋ぎは、つなぐことを表す言葉で、結び合うものどうしのあいだの線のことです。レベル、ビー玉、名前はこのサイトのものです。",
      "Our version of the joining puzzle Nikoli made famous in Japan in the 1980s. 繋ぎ is Japanese for a joining: the line between two things that belong together. The levels, the marbles and the name are our own.",
    ],
    rules: [
      [
        "どのビー玉にも、同じ色と同じ数字の相手がいます。組になった2つを、1本の線でつなぎます。線はマスからマスへ、縦か横にだけ進み、斜めには進めません。",
        "Every marble has a partner of the same colour and number. Join each pair with one line, drawn from cell to cell, across and down only, never on a slant.",
      ],
      ["線は交わってはならず、2本の線が同じマスを通ってもいけません。", "Lines may not cross, and no two lines may pass through the same cell."],
      [
        "すべての組がつながり、盤のすべてのマスに線が通ると、そのレベルは解けたことになります。どのレベルにも、その方法はちょうど1つだけです。",
        "The level is solved when every pair is joined and every cell of the board has a line through it. Every level has exactly one way to do that.",
      ],
      [
        "ビー玉か線の端を押して、ドラッグします。自分の線の上を戻ると短くなります。ほかの線の中へドラッグすると、その線が切り戻されます。ビー玉をタップすると、その線が消えます。",
        "Press a marble or the end of a line and drag. Drag back over your own line to shorten it; drag into another line to cut it back. Tap a marble to clear its line.",
      ],
      [
        "サイズごとに、全員が同じ、やさしい順のレベルがあります。5×5から9×9は各256問、4×4は192問、10×10と12×12から15×15は各128問、11×11、20×20、25×25、30×30は各64問です。16問ずつのブロックになっていて、ブロックを全部解くと次のブロックが開きます。",
        "Every size has its own levels, the same for everybody, easiest first: 256 at each of 5×5 to 9×9, 192 at 4×4, 128 at 10×10 and at each of 12×12 to 15×15, and 64 at 11×11, 20×20, 25×25 and 30×30. They come in blocks of 16: solve a whole block and the next one opens.",
      ],
      [
        "ブロックの最後の2問には、ひねりが入ります。15問めがやさしい紹介、16問めがそのブロックの試験です。最初は「橋」です。橋では、2本の線が交わります。1本は横に、もう1本は縦に通り、どちらも曲がれません。次は「壁」で、線は壁を越えられず、ふさがれたマスにも入れません。次は「経由」で、マスに輪があれば、その色の線は必ずそこを通り、ほかの線は通れません。次は「巡」で、盤の端がつながり、片側から出た線は反対側から戻ってきます。次は「爆」で、数回線を引くごとに、引いた線が壊れます。半分まで切り戻されるか、いちばん難しい盤ではとなりの線も切られます。盤の下の数字が1手前に知らせてくれます。レベルを解く最後の1本では、爆発は起こりません。奇数のサイズでは「六角」で、どのマスにも隣が6つある蜂の巣の形になり、線は両方の斜めにも進めます。いちばん大きな3つの盤には、壁、巡、ポータル、爆の4ブロックの短い梯子があります。新しい決まりがなくても難しくなるものが2つあります。「筆」は、指を離して盤を変えるたびに1本使い、元に戻しても返してくれません。「疎」は、組の少ない長い線の盤です。14×14と15×15の「巡」のブロックは、ふつうのブロックで、最後のブロックも同じです。",
        "The last two levels of a block bring a twist: the 15th shows it gently, the 16th is the block's test. First BRIDGES: a bridge is crossed by two lines, one straight across and a different one straight down, and neither may turn on it. Then WALLS: no line may cross a wall or go into a blocked cell. Then WAYPOINTS: where a cell has a ring, the line of its colour must pass through it and no other may. Then WRAP: the edges join, so a line leaving one side comes back in on the other. Then EXPLOSIONS: every few strokes a drawn line is broken, cut back to half or, on the hardest boards, wiped with the line beside it cut too; the count under the board warns you one stroke before, and the stroke that solves the level sets nothing off. And at the odd sizes, HEXAGONS: a honeycomb where every cell has six neighbours, so a line may also run along both slants. The three biggest boards have their own short ladder of four blocks: walls, wrap, portals and explosions. Two are harder with no new rule at all: a STROKE LIMIT, where every lift of your finger that changed the board spends a stroke and Undo gives none back, and SPARSE boards of a few long lines. At 14×14 and 15×15 the wrap block is an ordinary one, and so is the last.",
      ],
      [
        "「ポータル」は、設定画面で「ポータル」を選ぶと遊べる別のレベル群です。5×5から10×10、12×12、15×15で、各32問あります。同じ輪が2つあれば、それがポータルです。一方に入った線は、もう一方から同じ向きで出てきて、どちらの輪も線が埋めるマスです。どのポータルも、ちょうど1本の線が、1回だけ通ります。輪を指すかタップすると、相手の輪が分かります。線がポータルを通ったあとは、指が線の端の上にあるので、盤の外へ出てしまうときは、指を離して、線の端をもう一度押します。",
        "PORTALS are a second set of levels, chosen with Portals at the set-up, at 5×5 to 10×10, 12×12 and 15×15, thirty-two each. Two rings alike are a portal: a line that goes into one comes out of the other, going the same way, and both rings are cells it fills. Each portal is gone through by exactly one line, once. Point at a ring, or tap it, to see its partner. Once a line has gone through a portal the finger is over the end of the line, and where that would take it off the board, lift it and press the line's end again.",
      ],
    ],
    board: [
      "4×4から始めるのがおすすめで、7×7が普段の大きさです。12×12から15×15は、最大16組の長い夜向きで、20×20から30×30は、さらに数十組があって長くなります。スマートフォンでは、10×10以上の盤は拡大され、盤の下の「全体」と矢印で動かし、2本の指のつまみでも動かせます。色でも数字でも、読みやすいほうで遊べます。ビー玉もレベルも同じです。",
      "4×4 is where to start, and 7×7 is the everyday size. 12×12 to 15×15 are long evenings, with up to sixteen pairs, and 20×20 to 30×30 are longer, with dozens; on a phone a board of 10×10 or more zooms, with Fit and the arrows under the board, and two fingers pinch it and move it. Play by colours or by numbers, whichever you read faster: the marbles and the level are the same either way.",
    ],
    review: AGENT_READ,
  },
  kumimoji: {
    tagline: [
      "文字タイルの手札から、自分だけのクロスワードを1つ組み立てます。タイルを引いて増やし、袋のタイルを全部、時間内に使い切ります。",
      "Build one crossword of your own from a hand of letter tiles, draw more as you go, and use the whole bag against the clock.",
    ],
    origin: [
      "全員が引いたタイルで、それぞれ自分のクロスワードを同時に組み立てる、文字並べの競争ゲームを、1人用にしたものです。組文字は、1人で、時計と競います。袋は、144文字の定番の配分から引きます。名前の組文字は「組み立てた文字」という意味で、五文字の兄弟分です。",
      "Our own solo take on the anagram-grid race games, where every player builds a crossword of their own from drawn tiles at the same time. Kumimoji plays it alone, against the clock, from a bag drawn from the classic mix of 144 letters. Its name, 組文字, means “assembled letters”, a sibling of 五文字.",
    ],
    rules: [
      [
        `最初の手札は、「クラシック」では${KUMIMOJI_HANDS.classic}枚、「クイック」では${KUMIMOJI_HANDS.quick}枚です。並べて、1つのクロスワードを組み立てます。どのタイルも、ほかのタイルとつながり、2文字以上の縦横のすべての並びが、単語になっていなければなりません。`,
        `You start with a hand of tiles, ${KUMIMOJI_HANDS.classic} in a Classic game or ${KUMIMOJI_HANDS.quick} in a Quick one. Lay them out to build one crossword: every tile joined to the rest, and every line of two or more letters, across or down, a word.`,
      ],
      [
        `ゲームの長さは「ショート」「ミディアム」「フル」から選びます。「クラシック」の手札では${kumimojiTileCount(KUMIMOJI_HANDS.classic, "short")}枚（「クイック」では${kumimojiTileCount(KUMIMOJI_HANDS.quick, "short")}枚）、セットの半分の${kumimojiTileCount(KUMIMOJI_HANDS.classic, "medium")}枚、全部の${kumimojiTileCount(KUMIMOJI_HANDS.classic, "full")}枚です。英語では「ダブルセット」で2セットを1つとして遊べ、「フル」では${kumimojiTileCount(KUMIMOJI_HANDS.classic, "full", undefined, true)}枚になります。`,
        `A game is Short, Medium or Full: ${kumimojiTileCount(KUMIMOJI_HANDS.classic, "short")} tiles from a Classic hand (${kumimojiTileCount(KUMIMOJI_HANDS.quick, "short")} from a Quick one), half the set (${kumimojiTileCount(KUMIMOJI_HANDS.classic, "medium")}), or all ${kumimojiTileCount(KUMIMOJI_HANDS.classic, "full")}. In English the Double set plays two sets as one, ${kumimojiTileCount(KUMIMOJI_HANDS.classic, "full", undefined, true)} tiles at Full.`,
      ],
      [
        "タイルをタップしてからマスをタップすると置けます。ドラッグでも置けます。キーボードでは、マスを選んで文字を打ちます。タイルはいつでも動かしたり、入れ替えたり、手札に戻したりできます。盤上のタイルを2回タップすると、すぐ手札に戻ります。「並べ替え」か「/」キーで、手札が順番に並びます。単語になっていない並びは、そうなるまで赤く表示されます。",
        "Tap a tile and then a square to put it there, or drag it; on a keyboard, choose a square and type. Tiles can be moved, swapped or sent back to your hand at any time: tap a tile on the table twice and it goes straight back. Sort, or the / key, puts your hand in order. A line that is not a word is marked in red until it is.",
      ],
      [
        "設定画面で「ヘルプ」を選ぶと、ヘルプを押すたびに、手札が毎回ちがう単語の並びになります。置き場所は自分で見つけます。押すたびにヒント1回分の点がかかり、競争では使えません。",
        "Choose Help on the set-up screen and each Help press arranges your hand to spell a word, a different one each time; you still have to find it a place. Each press costs a hint's worth of points, and Help is never offered in a race.",
      ],
      [
        "設定画面で「斜め」を選ぶと、クロスワードは角から角にも読まれます。斜めに3枚以上並んだタイルは、上から下へ読んだ単語になっていなければなりません。斜めの単語も、横の単語と同じようにタイルをクロスワードにつなぎます。角だけで触れ合う2枚のタイルは、つながっているとは数えません。競争、途中で保存したゲーム、1台で交代して遊ぶゲームは、それぞれ設定したときの決まりで遊びます。",
        "Choose Diagonals on the set-up screen and the crossword is read corner to corner as well: every line of three or more tiles running diagonally, read from the top down, must be a word too, and a diagonal word joins its tiles to the crossword as a word across does. Two tiles touching at a corner are still free. A race, a kept game and a pass-and-play game are each played by the rule they were set up with.",
      ],
      [
        "「五」と書かれた炭色のタイルはワイルドです。タップして、どの文字にするかを選び、あとで好きなときに変えられます。初級がいちばん多く、中級はその半分、上級は1枚もありません。",
        "The charcoal tiles marked 五 are wild: tap one and choose the letter it stands for, and change it whenever you like. Easy games have the most of them, medium half as many, and hard none.",
      ],
      [
        "日本語では、タイルはどれもひらがなで、そのかなのすべての形として使えます。形は隅に小さく表示されます。「は」は「ば」「ぱ」にもなり、「つ」は「っ」「づ」にも、「や」は「ゃ」にも、「お」は「を」にもなります。並びは、そのように読んで単語になっていればよく、日本語のクロスワードと同じです。「学校」（がっこう）は、「か」「つ」「こ」「う」と並べて作ります。",
        "In Japanese every tile is a hiragana and plays as all of its forms, shown small in its corner: は is also ば and ぱ, つ is also っ and づ, や is also ゃ, and お is also を. A line is a word when it spells one read that way, as in a Japanese crossword: 学校, がっこう, is laid か つ こ う.",
      ],
      [
        "テーブルは、組み立てるにつれて広がり、クロスワードに合わせて自動で収まります。つまむか、ホイールで拡大縮小し、テーブルをドラッグして動かします。「矢印」を押すと、どちらもできるボタンが出ます。「回転」は、テーブルを4分の1ずつ回して、盤を別の側から見ます。タイルはどれも立ったままです。",
        "The table grows as you build and fits itself to the crossword. Pinch or use the wheel to zoom, drag the table to move it, or press Arrows for buttons that do both. Turn turns the table a quarter at a time, to see the grid from another side, and every tile stays upright.",
      ],
      [
        "手札がなくなり、盤の単語がすべて正しくなったら、「引く」を押して、袋から次のタイルを引き、組み込みます。何度組み直してもかまいません。全体が正しくなっていればよいのです。",
        "When your hand is empty and the grid is sound, press Draw for the next tile from the bag, and fit it in. Rebuild as much as you like: only the whole has to be right.",
      ],
      [
        "QやXが余ったとき、また手札で単語が作れないときは、タイルを1枚交換します。そのタイルは袋の底に入り、次の3枚を引きます。交換したタイルも含め、すべてのタイルを使わなければなりません。",
        "Stuck with a Q or an X, or a hand that spells no word? Trade a tile: it goes to the bottom of the bag and you take the next three. Every tile still has to be used, the traded one included.",
      ],
      [
        "袋が空になり、すべてのタイルが正しい盤に置かれたら、ゲームは終わりです。かかった時間が、記録になります。どの袋も、見る前に1度クロスワードとして並べられているので、必ず終わらせられます。",
        "The game ends when the bag is empty and every tile is on a sound grid. Your time is your score. Every bag has been laid out once before you see it, so it can always be finished.",
      ],
      [
        "1台で交代して遊ぶ場合は、設定画面で2人から8人を選び、1台をまわします。全員のクロスワードと手札は、テーブルを囲むのと同じように見えています。「終わり」を押して次の人へ渡し、「全員のテーブル」で、全員のクロスワードを一度に見られます。手札を使い切り、盤が正しくなったら、「引く」で全員にタイルが1枚ずつ配られます。交換は1ターンに1回までです。そのあと置けるものを置くか、「終わり」を押します。次の交換は次のターンまで待つので、袋が交換で使われてしまうことはありません。誰かが上がると、ほかの全員に最後の1ターンがあり、そこで上がった人は勝ちを分け合います。袋から交換するタイルがなくなったあと、行き詰まった人は降りられます。最後に残った人が、タイルを1枚置けば勝ちです。",
        "Pass and play: choose two to eight players on the set-up screen and hand one device round. Everyone's crossword and hand are face up, as they would be on a table; press Done to pass, and All tables shows every crossword at once. When your hand is used and your grid is sound, Draw gives every player a tile. A player may trade once a turn, then lay what they can or press Done; the next trade waits for their next turn, so nobody can trade the bag away from everybody else. When somebody goes out, everybody else has one last turn, and anyone who goes out on it shares the win. Once the bag cannot give a trade, a player who is stuck may resign; the last one standing wins by laying a tile.",
      ],
      [
        "会員が完成させたクロスワードは、すべて記録に残ります。「壁紙」ボタンで、全部を1枚の絵にして、パソコンやスマートフォンの背景にできます。",
        "Every crossword a member finishes is kept on their record, and its Wallpaper button draws them all as one picture, for a desk or a phone.",
      ],
      [
        "ターンの合間、交代の画面で、プレイヤーは抜けられます。手札と盤の上のタイルは全部袋に戻り、ゲームはその人なしで続きます。最後の1周が始まるまでは、新しい人が8人まで加われ、手札は袋から配られます。どの席もコンピュータにでき、「BOT」と表示されます。コンピュータは、みんなに見える形で自分のターンを遊び、単語を1つずつ組み立て、引き、交換し、同じ決まりで上がります。残った人が1人になったら、その人が最後に残った人です。",
        "Between turns, from the pass screen, a player may leave: every tile in their hand and on their table goes back into the bag, and play goes on without them. Somebody new may join, up to eight, with a hand dealt from the bag, until the last round begins. Any seat can be a computer, marked BOT, which plays its own turn where everybody can watch: it builds its crossword a word at a time, draws, trades and goes out by the same rules. With one player left, they are the last one standing.",
      ],
    ],
    board: [
      `盤はありません。タイルはテーブルの上に置かれ、クロスワードが広がるにつれてテーブルも広がり、全体が収まるように拡大縮小します。選んだ長さとセットで、使うタイルの数が決まります。タイルは144文字の配分から引きます。Aが13枚、Eが18枚、J、K、Q、X、Zは各2枚です。2文字から15文字までの、Kevin Atkinsonの英語・米語の綴りリスト「SCOWL」にある単語が使えます。日本語のセットは、45種類144枚のひらがなで、よく使われる度合いで配分しています。「う」が${JAPANESE_TILE_MIX["う"]}枚、「ん」が${JAPANESE_TILE_MIX["ん"]}枚、「ぬ」「へ」「ね」「ろ」「れ」のような難しいものは各1枚です。単語は、電子辞書研究開発グループの辞書「JMdict」にあるすべてのひらがなの読みで、ライセンスに従って使っています。`,
      `There is no board: the tiles lie on a table that grows as the crossword does, and zooms to fit it. The chosen length and set determine how many tiles must be played, drawn from the 144-letter mix: thirteen A's, eighteen E's, and two each of J, K, Q, X and Z. Any word from two letters to fifteen in SCOWL, Kevin Atkinson's English and American spelling lists, counts. The Japanese set is 144 hiragana in 45 kinds, shared by how often each is used: ${JAPANESE_TILE_MIX["う"]} う, ${JAPANESE_TILE_MIX["ん"]} ん, and one each of the hard ones, ぬ, へ, ね, ろ and れ. Its words are every hiragana reading in JMdict, the Electronic Dictionary Research and Development Group's dictionary, used under its licence.`,
    ],
    review: AGENT_READ,
  },
  koushi: {
    tagline: [
      "6つの単語が格子に編み込まれ、文字がばらばらになっています。2文字ずつ入れ替えて、すべての単語を正しくします。",
      "Six words woven into a lattice, their letters scrambled. Swap two letters at a time until every word is right.",
    ],
    origin: [
      "文字を入れ替えて単語を直す、格子の単語パズルを、このサイトの形にしたものです。6つの単語が格子で交わり、文字を当てるのではなく動かして見つけます。格子は障子の桟のことで、紙の窓が木の格子に収まっているように、ここの単語も格子に収まっています。",
      "Our own take on the swap-the-letters word grid: six words crossing in a lattice, found by moving letters rather than guessing them. 格子 is the lattice of a shoji screen, paper panes held in a grid of wood, and the words here are held the same way.",
    ],
    rules: [
      [
        "格子には、5文字の単語が6つ隠れています。横が3つ（1行め、3行め、5行め）、縦が3つ（1列め、3列め、5列め）です。2つの単語が交わるところの文字は共有なので、21文字で6つの単語になります。",
        "Six five-letter words are hidden in the lattice: three across, on the first, third and fifth rows, and three down, on the first, third and fifth columns. Where two words cross they share a letter, so 21 letters make all six.",
      ],
      [
        "文字は、はじめはばらばらです。文字をタップして、もう1つの文字をタップするか、文字をもう1つの上へドラッグすると、入れ替わります。緑の文字は正しい文字で、動かしません。",
        "The letters start scrambled. Tap a letter and then another, or drag one onto the other, and they change places. A green letter is right and stays where it is.",
      ],
      [
        "緑は、正しい文字が正しい場所にあることです。金色は、その文字が属する単語のどちらかが、ほかの場所にそれを必要としていることです。色なしは、どちらの単語も、緑になっていない場所では必要としていないことです。",
        "Green is the right letter in the right place. Gold means one of the letter's words needs it somewhere else. Plain means neither of its words needs it anywhere that is not already green.",
      ],
      [
        "2つの単語が交わるところの文字は、どちらかの単語が必要としていれば金色になり、どちらの単語かは色では分かりません。単語が文字を光らせるのは、まだ必要としている数だけです。Eを1つ必要とする単語は、左から右、上から下の順で最初に出会ったEだけを金色にし、2つめのEは光らせません。",
        "A letter where two words cross turns gold if either word needs it, and the colour does not say which. A word lights a letter only as often as it still needs it: a word wanting one E turns the first E it comes to gold, reading left to right or top to bottom, and not the second.",
      ],
      [
        "どのパズルも、そのレベルの回数、つまり初級は8回、中級は10回、上級は12回の入れ替えで解けます。使えるのは、それより5回多い回数です。使い切ると、パズルは解けないまま終わり、単語が表示されます。",
        "Every puzzle can be solved in exactly its level's number of swaps, 8 on easy, 10 on medium and 12 on hard, and you have five more than that. Run out, and the puzzle ends unsolved and shows its words.",
      ],
      [
        "最後に残った入れ替えは、1回ごとに1つのしるしになり、いちばん良くて5つです。順位表は、まず入れ替えの回数が少ない順、次に時間で数えます。",
        "Every swap left at the end is a mark, five at best. The leaderboard counts the fewest swaps first, then the time.",
      ],
    ],
    board: [
      "格子は1つで、縦横5文字ずつです。4つの穴からは、下の盤が見えます。単語は、五文字と同じく、Kevin Atkinsonの綴りリスト「SCOWL」から取っています。初級と中級はごく身近な単語、上級はもっと広いリストの単語です。",
      "One lattice, five letters each way, its four holes showing the board beneath. The words come from SCOWL, the spelling lists by Kevin Atkinson, as Gomoji's do: easy and medium use the commonest words, hard a wider list.",
    ],
    review: AGENT_READ,
  },
} as const satisfies Partial<Record<string, PuzzleCopyJa>>;
