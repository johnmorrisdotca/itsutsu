import type { SugorokuKind } from "../../party/sugoroku/sugoroku.constants";
import { AGENT_READ_2026_10_06 } from "../copyJa.types";

import type { PartyCopyJa } from "./party.ja.types";

/**
 * The seven backgammon games' words in Japanese (`SUGOROKU_DISPLAY`, in
 * `src/lib/party/sugoroku/sugoroku.copy.ts`), in the words the package itself
 * uses for them in Japanese (`@johnmorrisdotca/sugoroku`: ポイント, ダブル,
 * テイク, ドロップ, キューブ, ギャモン, クロフォードゲーム), so the rules page and
 * the table that follows it say the same thing.
 */
const AGENT_READ = AGENT_READ_2026_10_06;

const ROLL = [
  "サイコロを2個振り、それぞれの目の数だけ別のチェッカーを動かすか、1個のチェッカーを両方の目の分だけ動かします。ゾロ目は4回分動かせます。1個だけのチェッカーをヒットすると、それはバーに行き、ほかのチェッカーを動かす前に、入れなければなりません。2個以上のあるポイントは、ブロックされています。",
  "Roll two dice and move a checker by each die separately, or one checker by both. A double plays four times. Hit a lone checker and it goes to the bar and must be entered before anything else moves. A point with two or more checkers is blocked.",
] as const;

const WON = (count: string, matches: string, backMatches: string) =>
  [
    `${count}を最初にベアオフした側の勝ちですが、ベアオフできるのは、すべてのチェッカーがホームボードに入ってからです。シングルゲームは1ポイントです。${matches}では、ギャモンが2ポイント、バックギャモンが3ポイントで、ダブリングキューブの値を掛け、クロフォードルールも適用されます。`,
    `The first side to bear off ${count === "15個すべて" ? "all fifteen checkers" : "all three checkers"} wins, but only once every checker is in the home board. A single game is one point. In ${backMatches} a gammon is two points and a backgammon three, multiplied by the doubling cube, with the Crawford rule as well.`,
  ] as const;

export const PARTY_COPY_JA_SUGOROKU = {
  backgammon: {
    tagline: [
      "15個のチェッカーを盤に沿って走らせ、先にすべてベアオフします。途中で、相手の1個だけのチェッカーをヒットしましょう。",
      "Race fifteen checkers round the board and bear them all off first, hitting the other side's lone checkers on the way.",
    ],
    origin: [
      "テーブルズ系のゲームでいちばん広く遊ばれているゲームで、その祖先は少なくとも1600年前にさかのぼります。ローマ人は「タブラ」を遊び、テーブルズ系の「盤双六」は7世紀までに日本に伝わって、689年には賭博のため禁止されました。いまの名前でのこのゲームの記録は、17世紀のイギリスが最初で、ダブリングキューブは、1920年代にニューヨークの遊技クラブが加えたものです。誰のものでもありません。",
      "The most widespread of the tables games, a family whose ancestors go back at least 1,600 years. The Romans played one, tabula, and a tables game, ban-sugoroku, reached Japan by the seventh century and was banned for gambling in 689. The game under its present name is first recorded in seventeenth-century England, and the doubling cube was added by gaming clubs in New York in the 1920s. It belongs to nobody.",
    ],
    rules: [
      [
        "白と黒の2人が、24のポイントがある盤に、それぞれ15個のチェッカーを置いて遊びます。互いに反対向きに盤を一周させ、15個すべてがホームボードに入ったら、ベアオフします。15個すべてを最初にベアオフした側の勝ちです。",
        "Two players, white and black, each with fifteen checkers on a board of twenty-four points. Each takes its checkers round the board in the opposite direction to the other and, once all fifteen are in its home board, bears them off. The first side to bear off all fifteen wins.",
      ],
      [
        "最初に、それぞれが1個ずつサイコロを振り、大きい目を出した側が、その2つの目を最初の手として使います。その後は、自分の番にサイコロを2個振り、それぞれの目の数だけ別のチェッカーを動かすか、1個のチェッカーを両方の目の分だけ動かします。ゾロ目は4回分動かせます。",
        "To start, each side rolls one die, and the side with the higher throw plays both dice as its first move. After that, on your turn roll two dice and move a checker by each die separately, or one checker by both. A double plays four times.",
      ],
      [
        "チェッカーは、空いているポイント、自分のチェッカーがあるポイント、または相手のチェッカーが1個だけあるポイントに止まれます。最後の場合は、その相手のチェッカーをヒットし、バーに送ります。相手のチェッカーが2個以上あるポイントは、ブロックされていて止まれません。",
        "A checker may land on an empty point, on a point holding your own checkers, or on a point holding just one checker of the other side, in which case that checker is hit and sent to the bar. A point with two or more of the other side's checkers is blocked and cannot be landed on.",
      ],
      [
        "バーにチェッカーがある側は、ほかのどのチェッカーを動かすよりも先に、サイコロの目の1つを使って、それを相手のホームボードに入れなければなりません。入れられなければ、その番は動けません。",
        "A side with a checker on the bar must, before moving anything else, use one of its dice to enter it into the other side's home board. If it cannot, it cannot move that turn.",
      ],
      [
        "できるなら、両方の目を使わなければなりません。片方しか使えないときは、どちらでも使えるなら、大きい目を使います。ベアオフできるのは、自分のチェッカーがすべてホームボードに入ってからで、サイコロのちょうどの目で行います。それより高いポイントにチェッカーがないときは、大きい目でもできます。",
        "You must play both dice if you can, and if only one can be played, the larger one if either can. You may bear off only once all your checkers are in the home board, by the exact number on a die, or by a larger one when there is no checker on a higher point.",
      ],
      [
        "キューブは、1を示して、中央に置いて始まります。自分の番に、サイコロを振る前に、ダブルを申し出られます。相手がテイクすると、キューブは倍の値になって相手のものになり、あとでリダブルできます。ドロップすると、ダブル前の値で、そのゲームに負けます。どちらかが初めて、マッチの勝利まであと1ポイントに迫ったときの、次のゲームは、キューブなしで行います（クロフォードルール）。",
        "The cube starts in the middle, showing 1. On your turn, before you roll, you may double. If the other side takes it, the cube turns to twice the value and becomes theirs, to redouble later. If they drop it, they lose the game at the value before the double. The game after a side first comes within one point of winning the match is played without the cube (the Crawford rule).",
      ],
      [
        "15個すべてを最初にベアオフした側の勝ちです。シングルゲームは1ポイントです。3、5、7、9ポイントのマッチでは、ギャモン（負けた側が1個もベアオフしていない）は2ポイント、バックギャモン（さらに、負けた側のチェッカーがバーか、勝った側のホームボードに残っている）は3ポイントで、いずれもキューブの値を掛けます。",
        "The first side to bear off all fifteen checkers wins. A single game is worth one point. In a match to 3, 5, 7 or 9 points, a gammon (the loser has borne off nothing) is worth two, and a backgammon (and the loser still has a checker on the bar or in the winner's home board) three, each multiplied by the cube.",
      ],
    ],
    board: [
      "シングルゲームは、いちばん素直で、短いゲームです。3、5、7、9ポイントのマッチを選ぶと、ダブリングキューブ、ギャモン、クロフォードルールが入ります。1台を囲んでも、4段階の強さのコンピュータ相手でも、2台の端末でも遊べます。",
      "A single game is the plain game and the quickest. Choose a match to 3, 5, 7 or 9 points to play with the doubling cube, gammons and the Crawford rule. Play round one device, against the computer at four strengths, or on two devices.",
    ],
    review: AGENT_READ,
  },
  nackgammon: {
    tagline: [
      "後ろに置くチェッカーが2個でなく4個のバックギャモンです。ゲームは長くなり、ヒットできるものも、恐れるものも増えます。",
      "Backgammon with four checkers at the back instead of two. The game is longer, with more to hit and more to fear.",
    ],
    origin: [
      "バックギャモンの名手ナック・バラードが考案し、自分の名前を付けたゲームです。それぞれの6ポイントとミッドポイントから1個ずつを、相手側の2ポイントに移すので、後ろのチェッカーが2個でなく4個から始まります。ダブリングキューブを使って遊びます。",
      "Invented by the backgammon master Nack Ballard, who gave the game his name. One checker from each side's six point and midpoint is moved to the other side's two point, so each side starts with four checkers at the back instead of two. It is played with the doubling cube.",
    ],
    rules: [
      [
        "ルールはバックギャモンと同じで、始まりの配置だけが違います。各自、24ポイント（相手の1ポイント）に2個、23ポイントに2個、ミッドポイントに4個、8ポイントに3個、6ポイントに4個を置きます。",
        "The rules are those of backgammon, with a different start: each side has two checkers on its 24 point (the other side's one point), two on its 23 point, four on its midpoint, three on its 8 point and four on its 6 point.",
      ],
      ROLL,
      WON("15個すべて", "マッチ", "a match"),
    ],
    board: [
      "後ろに4個ずつあるので、序盤はヒットの応酬になり、ギャモンもよく出ます。覚えるにはシングルゲーム、キューブを使うなら3、5、7、9ポイントのマッチで遊びましょう。",
      "With four checkers at the back each, the early game is full of hits, and gammons are common. To learn it play a single game, and to play with the cube play a match to 3, 5, 7 or 9 points.",
    ],
    review: AGENT_READ,
  },
  longGammon: {
    tagline: [
      "15個すべてのチェッカーが、相手がベアオフする側の、1つのポイントから出発し、盤を端から端まで回ってこなければなりません。",
      "All fifteen checkers start on the one point on the side the other side bears off from, and must come all the way round the board from one end to the other.",
    ],
    origin: [
      "バックギャモンの変形で、各自の15個のチェッカーが、すべて相手の1ポイント（24ポイント）から始まるので、どのチェッカーも盤全体を進まなければなりません。ダブリングキューブを使い、ギャモンとバックギャモンは、ふつうどおり2倍、3倍に数えます。",
      "A backgammon variant in which each side's fifteen checkers all begin on the other side's one point (the 24 point), so every one has the whole board to travel. It is played with the doubling cube, and a gammon and a backgammon count double and triple as usual.",
    ],
    rules: [
      [
        "ルールはバックギャモンと同じで、始まりの配置だけが違います。各自の15個のチェッカーは、すべて24ポイント、つまり相手がベアオフする側のポイントから始まります。",
        "The rules are those of backgammon, with a different start: all fifteen of each side's checkers begin on its 24 point, the point the other side bears off from.",
      ],
      ROLL,
      WON("15個すべて", "マッチ", "a match"),
    ],
    board: [
      "1つのポイントに15個を置くと、相手のスタート地点をすっかりふさぐので、最初の数手が大切です。この系統でいちばん長いゲームです。シングルゲームか、3、5、7、9ポイントのマッチで遊びます。",
      "Fifteen checkers on one point block the whole of the other side's start, so the first moves matter. It is the longest game of the family. Play a single game, or a match to 3, 5, 7 or 9 points.",
    ],
    review: AGENT_READ,
  },
  hypergammon: {
    tagline: [
      "チェッカーは各自3個だけで、いちばん遠い3つのポイントから始まるバックギャモン。短く鋭く、数分で終わります。",
      "Backgammon with only three checkers each, starting on the farthest three points: short, sharp, and over in minutes.",
    ],
    origin: [
      "各自3個のチェッカーを、相手の1、2、3ポイント（24、23、22ポイント）に置いて始める、短いバックギャモンの変形です。ダブリングキューブを使って遊びます。計算機科学者のヒュー・スコニヤーズが1990年代の初めにこれを解き、すべての局面に、最善手がわかっています。",
      "A short backgammon variant with three checkers each, started on the other side's one, two and three points (the 24, 23 and 22 points). It is played with the doubling cube. The computer scientist Hugh Sconyers solved it in the early 1990s, so every position has a known best move.",
    ],
    rules: [
      [
        "ルールはバックギャモンと同じですが、チェッカーは15個でなく3個ずつで、24、23、22ポイントに1個ずつ置いて始めます。",
        "The rules are those of backgammon, with three checkers each instead of fifteen, one on each of its 24, 23 and 22 points.",
      ],
      ROLL,
      [
        "3個すべてを最初にベアオフした側の勝ちですが、ベアオフできるのは、3個ともホームボードに入ってからです。シングルゲームは1ポイントです。3か5ポイントのマッチでは、ギャモンが2ポイント、バックギャモンが3ポイントで、ダブリングキューブの値を掛け、クロフォードルールも適用されます。",
        "The first side to bear off all three checkers wins, but only once all three are in the home board. A single game is one point. In a match to 3 or 5 points a gammon is two points and a backgammon three, multiplied by the doubling cube, with the Crawford rule as well.",
      ],
    ],
    board: [
      "各自3個なので、ほとんどの局面でヒットが起こり、ゲームは数分で終わります。シングルゲームか、キューブ付きの3か5ポイントのマッチで遊びます。",
      "With three checkers each, almost every position has a hit in it, and a game is over in a few minutes. Play a single game, or a match to 3 or 5 points with the cube.",
    ],
    review: AGENT_READ,
  },
  backgammonRace: {
    tagline: [
      "どのチェッカーも、盤の外のバーから始まり、ゲームが進むにつれて、サイコロで盤に入れていきます。それでもヒットは起こります。",
      "Every checker starts off the board on the bar, and is entered with the dice as the game goes. Hits still happen.",
    ],
    origin: [
      "すべてのチェッカーが盤の外から始まる、バックギャモンの変形です。各自の15個はバーから始まり、ゲームが進むにつれて、サイコロで相手のホームボードに入れていきます。何もないところからのレースに見えますが、お互いは出会い、ヒットも起こります。アメリカのゲーム「エースデュース」の親戚ですが、ここではゾロ目はバックギャモンと同じ扱いです。",
      "A backgammon variant that begins with every checker off the board. Each side's fifteen start on the bar and are entered into the other side's home board with the dice as the game goes. It looks like a race from nothing, but the sides still meet and hit. It is related to the American game of acey-deucey, though a double is treated here as in backgammon.",
    ],
    rules: [
      [
        "ルールはバックギャモンと同じですが、始まりの配置が違います。各自の15個のチェッカーは、すべて盤の外にあり、ゲームが進むにつれて、サイコロの目1つずつで、相手のホームボードに入ります。",
        "The rules are those of backgammon, with a different start: all fifteen of each side's checkers are off the board, and enter the other side's home board, one die at a time, as the game goes.",
      ],
      [
        "サイコロを2個振り、それぞれの目の数だけ別のチェッカーを動かすか、1個のチェッカーを両方の目の分だけ動かします。ゾロ目は4回分動かせます。チェッカーは、好きなときに入れられます。ヒットされたチェッカーはバーに行き、ほかのチェッカーを動かす前に、入れなければなりません。",
        "Roll two dice and move a checker by each die separately, or one checker by both. A double plays four times. A checker may be entered whenever you like. A checker that is hit goes to the bar and must be entered before anything else is moved.",
      ],
      [
        "相手のチェッカーが2個以上あるポイントは、ブロックされています。",
        "A point with two or more of the other side's checkers is blocked.",
      ],
      [
        "15個すべてを最初にベアオフした側の勝ちですが、ベアオフできるのは、すべてのチェッカーがホームボードに入ってからです。シングルゲームは1ポイントです。5ポイントのマッチでは、ギャモンが2ポイント、バックギャモンが3ポイントで、ダブリングキューブの値を掛け、クロフォードルールも適用されます。",
        "The first side to bear off all fifteen checkers wins, but only once every checker is in the home board. A single game is one point. In a match to 5 points a gammon is two points and a backgammon three, multiplied by the doubling cube, with the Crawford rule as well.",
      ],
    ],
    board: [
      "最初は盤に何もないので、覚えるべき定跡はなく、最初の数回の目が、そのまま序盤になります。シングルゲームか、キューブ付きの5ポイントのマッチで遊びます。",
      "Nothing is on the board to begin with, so there is no opening to learn, and the first few rolls make the opening. Play a single game, or a match to 5 points with the cube.",
    ],
    review: AGENT_READ,
  },
  antiBackgammon: {
    tagline: [
      "負けを目指すバックギャモン。15個すべてを最初にベアオフした側が負けです。",
      "Backgammon played to lose. Whoever bears off all fifteen checkers first loses.",
    ],
    origin: [
      "バックギャモンを逆にしたゲームです。盤も動かし方もふつうどおりですが、すべてのチェッカーを最初にベアオフした側が負けなので、レースでの先行は重荷になり、ヒットは贈り物になります。ダブリングキューブもギャモンもありません。それぞれ500手番に達したら、引き分けです。",
      "Backgammon played in reverse. The board and the moves are the usual ones, but the side that bears off every checker first loses, so a lead in the race is a burden and a hit is a gift. There is no doubling cube and no gammon. A game that reaches 500 turns each is a draw.",
    ],
    rules: [
      [
        "ルールはバックギャモンと同じですが、目的は最後になることです。15個すべてを最初にベアオフした側が負けます。",
        "The rules are those of backgammon, but the aim is to come last: whoever bears off all fifteen checkers first loses the game.",
      ],
      [
        "サイコロを2個振り、それぞれの目の数だけ別のチェッカーを動かすか、1個のチェッカーを両方の目の分だけ動かします。ゾロ目は4回分動かせます。1個だけのチェッカーをヒットすると、それはバーに行き、ほかのチェッカーを動かす前に、入れなければなりません。2個以上のあるポイントは、ブロックされています。できるなら、両方の目を使わなければなりません。",
        "Roll two dice and move a checker by each die separately, or one checker by both. A double plays four times. Hit a lone checker and it goes to the bar and must be entered before anything else moves. A point with two or more checkers is blocked. You must play both dice if you can.",
      ],
      [
        "ベアオフできるのは、すべてのチェッカーがホームボードに入ってからです。ダブリングキューブはなく、ギャモンもバックギャモンもありません。1ゲームは1ポイントです。",
        "A side bears off only once every checker is in the home board. There is no doubling cube, and no gammon or backgammon: a game is worth one point.",
      ],
      [
        "15個すべてを最初にベアオフした側が負けで、相手の勝ちです。それぞれ500手番に達したゲームは、引き分けです。",
        "The first side to bear off all fifteen checkers loses, and the other side wins. A game that reaches 500 turns each is a draw.",
      ],
    ],
    board: [
      "どのゲームも1ポイントです。遅れたい側は、断れないベアオフに気をつけなければなりません。動かせるものは、必ず動かさなければならないからです。",
      "Every game is one point. The side that wants to hold back has to watch out for a bear-off it cannot refuse, because you must play whatever you can.",
    ],
    review: AGENT_READ,
  },
  tabula: {
    tagline: [
      "バックギャモンのもとになった、ローマのゲームです。サイコロは3個で、両者が同じコースを同じ向きに進みます。",
      "The Roman game that backgammon came from. It uses three dice, and both sides go the same way round the same course.",
    ],
    origin: [
      "タブラ（盤）は、ギリシャとローマで遊ばれた、サイコロ3個の2人用ゲームで、バックギャモンが属するテーブルズ系ゲーム全体の名前のもとになりました。完全なルールは伝わっていないので、ここでのルールは、bkgm.comにある復元を、2026年10月1日に読んで採ったものです。",
      "Tabula (\"board\") was a Greek and Roman game for two with three dice, and gave its name to the whole tables family that backgammon belongs to. No complete rules survive, so the rules here are the reconstruction on bkgm.com, read on 1 October 2026.",
    ],
    rules: [
      [
        "2人で、それぞれ15個のチェッカーを持ち、最初はすべて盤の外にあります。両者は盤の同じ端から入り、同じ向きに回ってゴールへ向かうので、後ろにいる側は、前にいる側の1個だけのチェッカーをヒットできますが、前にいる側はヒットし返せません。",
        "Two players, fifteen checkers each, all off the board to begin. Both enter at the same end of the board and go the same way round to the finish, so the side behind can hit a lone checker of the side in front, and the side in front cannot hit back.",
      ],
      [
        "最初に、それぞれが1個ずつサイコロを振り、大きい目の側が先に、自分の3個のサイコロを振ります。1回に3個のサイコロを振り、それぞれ別のチェッカーに使っても、1個のチェッカーにどの目でも使ってもかまいません。特別なゾロ目はなく、ゾロ目も、ほかの目と同じ3手です。",
        "To start, each side rolls one die, and the higher goes first and then rolls its own three dice. A roll is three dice, used on a checker each, or on one checker in any way. There is no special double, and a double is three moves like any other roll.",
      ],
      [
        "1個だけのチェッカーはヒットされることがあり、盤の外に戻され、ほかのチェッカーを動かす前に、入れなければなりません。2個以上のあるポイントは、ブロックされています。",
        "A lone checker may be hit, and goes back off the board and must be entered before anything else moves. A point with two or more checkers is blocked.",
      ],
      [
        "自分の15個がすべて入るまでは、チェッカーを盤の後半に進められません。できるなら、3つの数をすべて使わなければなりません。",
        "You may not move a checker into the second half of the board until all fifteen of yours have entered. You must play all three numbers if you can.",
      ],
      [
        "15個すべてを最初にベアオフした側の勝ちですが、ベアオフできるのは、すべてのチェッカーがコースの最後の4分の1に入ってからです。ダブリングキューブはなく、1ゲームは1ポイントです。",
        "The first side to bear off all fifteen checkers wins, but only once every checker is in the last quarter of the course. There is no doubling cube, and a game is worth one point.",
      ],
    ],
    board: [
      "どのゲームも1ポイントで、ダブリングキューブはありません。コースは両者とも同じ向きなので、いくつかの危険のあるレースになります。ここでは、盤はバックギャモンの盤として描かれます。",
      "Every game is one point, and there is no doubling cube. The course goes the same way for both sides, so it reads as a race with a few dangers. Here the board is drawn as a backgammon board.",
    ],
    review: AGENT_READ,
  },
} as const satisfies Record<SugorokuKind, PartyCopyJa>;
