import { AGENT_READ_2026_10_06 } from "../copyJa.types";
import type { RuleVariant } from "../../gomoku/gomoku.types";
import type { VariantCopyJa } from "./variants.ja.types";

/**
 * Japanese copy for the Checkers family (`variants.constants.ts` holds the
 * English). 駒 for a piece, キング for a king and ふつうの駒 for a man; 濃い色の
 * マス for the dark squares the game is played on. Bodies' and rulebooks' names
 * (FMJD, CBJD, ФШР) and the authors cited stay as their sources spell them.
 */

const MEN_CAPTURE_ALL_WAYS: VariantCopyJa["rules"][number] = [
  "ふつうの駒は、斜め前へ1歩進み、隣り合う相手の駒を飛び越えて、その先の空いているマスに着地して取ります。前にも後ろにも取れます。",
  "An ordinary piece steps one square diagonally forward, and captures by jumping an adjacent enemy piece and landing on the empty square beyond it. It can capture forward or backward.",
];

const CAPTURE_MOST: VariantCopyJa["rules"][number] = [
  "取りは義務で、しかも最も多く取る手を選ばなければなりません。キングもふつうの駒と同じく1個として数えます。取りは、取れる駒がある限り続き、取った駒はその手が終わってから取り除かれ、同じ駒を2度飛び越えることはできません。",
  "Capturing is compulsory, and you must also take the most you can. A king counts as one piece, the same as an ordinary piece. A capture continues as long as there is a piece to take, the captured pieces are removed only when the move is over, and no piece can be jumped twice.",
];

const CROWN_AT_END_AND_FLY: VariantCopyJa["rules"][number] = [
  "ふつうの駒がキングになるのは、その手が奥の段で終わったときだけです。キングは飛びます。空いている斜めの線に沿って好きなだけ進め、どれだけ離れた駒でも取って、その先の空いているマスのどこにでも着地できます。",
  "An ordinary piece is crowned a king only when its move ends on the far row. A king flies: along an open diagonal it can move any distance, capture a piece at any distance, and land on any empty square beyond it.",
];

export const VARIANT_COPY_JA_CHECKERS = {
  checkers: {
    tagline: [
      "相手の駒を飛び越えて盤から取り除く。取りは義務で、キングは前後どちらにも動ける。",
      "Jump over the other side's pieces and remove them from the board. Capturing is compulsory, and a king can move both forward and backward.",
    ],
    origin: [
      "何世紀も地中海や中東で遊ばれてきた、飛び越えて取るゲーム「アルケルク」の子孫です。1100年ごろ、フランスのある人が、これをチェス盤の上に移して取りの義務を加えたといわれています。このサイトで遊べるイギリス式は18世紀に書き留められ、ほとんど形を変えずに大西洋を渡って、アメリカのチェッカーになりました。",
      "A descendant of alquerque, a game of jumping to capture that was played around the Mediterranean and the Middle East for centuries. It is said that around 1100 someone in France moved it onto a chessboard and added the compulsory capture. The English form that can be played on this site was written down in the 18th century and crossed the Atlantic almost unchanged to become American checkers.",
    ],
    rules: [
      [
        "各自、自陣の3段の濃い色のマスを埋める12個のふつうの駒を持ちます。黒が先に動かします。",
        "Each side has twelve ordinary pieces filling the dark squares of its own three rows. Black moves first.",
      ],
      [
        "ふつうの駒は、斜め前の空いているマスへ1歩進みます。",
        "An ordinary piece steps one square diagonally forward onto an empty square.",
      ],
      [
        "取りは、隣り合う相手の駒を飛び越えて、その先の空いているマスに着地することで、これは義務です。自分の駒のどれかが取れるなら、1歩進むのではなく、必ずその取りのどれかを打ちます。",
        "A capture is jumping over an adjacent enemy piece and landing on the empty square beyond it, and it is compulsory. If any of your pieces can capture, you must play one of those captures rather than a step.",
      ],
      [
        "取った駒が、着地した場所からさらに取れるなら、同じ手の中で跳び続けます。途中でキングになったふつうの駒は、必ずそこで止まります。取りを続けられるのはキングだけで、それも次の手からです。",
        "A piece that captures and can capture again from where it lands keeps jumping in the same move. An ordinary piece that is crowned partway through always stops there. Only a king can carry a chain on, and only on a later move.",
      ],
      [
        "奥の段に着いたふつうの駒はキングになり、以後は前だけでなく後ろにも動き、取ることができます。",
        "An ordinary piece that reaches the far row is crowned a king, and from then on can move and capture backward as well as forward.",
      ],
      [
        "相手に動かせる駒をなくさせれば勝ちです。駒が1つも残っていないか、すべての駒が動けなくなった場合です。",
        "You win by leaving the other side with no piece that can move. That is when no pieces are left, or when every one is shut in.",
      ],
    ],
    board: [
      "8×8で、濃い色のマスだけを使います。64マスのうち32マスです。各自12個の駒が、最初の3段を埋めます。",
      "8×8, played on the dark squares only: 32 of the 64 squares. Each side's 12 pieces fill the first three rows.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  internationalDraughts: {
    tagline: [
      "10×10の盤のドラフツ。ふつうの駒も後ろに取れ、キングは飛び、取れるだけ多く取らなければならない。",
      "Draughts on a 10×10 board. Ordinary pieces can capture backward, kings fly, and you must capture as many as you can.",
    ],
    origin: [
      "歴史家のArie van der Stoepによれば、1550年ごろにはオランダで10×10の盤で遊ばれ、17世紀の終わりからは各自20個の駒で遊ばれました。古い呼び名の「ポーランド式ドラフツ」は、オランダ人が目新しい考えを何でもポーランド風と呼んだ習慣に由来するといわれます。1947年にフランス、オランダ、ベルギー、スイスの連盟が設立したFMJDが世界の競技を統括していて、ここでの規則はFMJDの公式規則（2018年の付属書1と、2024年の付属書）です。",
      "According to the historian Arie van der Stoep, it was played in the Netherlands on a 10×10 board by about 1550, and from the late 17th century with 20 pieces each. Its old name, Polish draughts, is said to come from a Dutch habit of calling any novel idea Polish. The FMJD, founded in 1947 by the French, Dutch, Belgian and Swiss federations, governs the game worldwide, and the rules here are the FMJD's official rules (Annex 1 of 2018 and the Annexes of 2024).",
    ],
    rules: [
      [
        "各自、自陣の4段の濃い色のマスに20個のふつうの駒を持ちます。白が先に動かします。",
        "Each side has twenty ordinary pieces on the dark squares of its own four rows. White moves first.",
      ],
      [
        "ふつうの駒は、斜め前へ1歩進みます。取るときは、隣り合う相手の駒を飛び越えて、その先の空いているマスに着地し、前にも後ろにも取れます。",
        "An ordinary piece steps one square diagonally forward. To capture, it jumps over an adjacent enemy piece and lands on the empty square beyond it, forward or backward.",
      ],
      [
        "取りは義務で、しかも最も多く取る手を選ばなければなりません。取る駒の数が最大の取りだけを打て、キングもふつうの駒と同じく1個として数えます。",
        "Capturing is compulsory, and you must also take the most you can. Only a capture that takes the greatest number of pieces can be played, and a king counts as one piece, the same as an ordinary piece.",
      ],
      [
        "取りは、取れる駒がある限り、向きを変えながら続きます。取った駒は、その手がすべて終わってから盤から取り除かれ、同じ駒を2度飛び越えることはできません。",
        "A capture continues, changing direction, as long as there is something to take. The captured pieces are removed from the board only when the move is completely over, and no piece can be jumped twice.",
      ],
      [
        "ふつうの駒がキングになるのは、その手が奥の段で終わったときだけです。取りの途中でその段を通過しても、キングにはなりません。キングは飛びます。空いている斜めの線に沿って好きなだけ進め、どれだけ離れた駒でも取って、その先の空いているマスのどこにでも着地できます。",
        "An ordinary piece is crowned a king only when its move ends on the far row. Crossing that row partway through a capture does not crown it. A king flies: along an open diagonal it can move any distance, capture a piece at any distance, and land on any empty square beyond it.",
      ],
      [
        "動かせる駒がなくなった側の負けです。同じ手番で同じ局面が3回目に現れたとき、キングだけが動き何も取られないまま各自25手が過ぎたとき、駒3個対キング1個の終盤が各自16手のうちに決着しないとき、または駒2個対1個の終盤が各自5手のうちに決着しないときは、引き分けです。",
        "A side with no piece that can move has lost. It is a draw when the same position appears for the third time with the same side to move, when 25 moves each have passed with only kings moving and nothing captured, when an ending of three pieces against a lone king is not decided within 16 moves each, or when an ending of two pieces against one is not decided within 5 moves each.",
      ],
    ],
    board: [
      "10×10で、濃い色のマスだけを使います。100マスのうち50マスです。各自20個のふつうの駒が最初の4段を埋め、中央の2段は空いて始まります。各自の手前の左隅は濃い色のマスです。",
      "10×10, played on the dark squares only: 50 of the 100 squares. Each side's 20 ordinary pieces fill the first four rows, and the two middle rows start empty. The near left-hand corner of each player is a dark square.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  brazilianDraughts: {
    tagline: [
      "8×8の盤で遊ぶ国際ルール。ふつうの駒も後ろに取れ、キングは飛び、いちばん長く取る手が義務。",
      "The international rules on an 8×8 board. Ordinary pieces can capture backward, kings fly, and the longest capture is compulsory.",
    ],
    origin: [
      "国際ドラフツを小さい盤で、アメリカのチェッカーと同じ12個の駒で遊ぶ形で、ブラジルで遊ばれており、1985年からは8×8のドラフツの世界選手権でも遊ばれています。ここでの規則はブラジルのドラフツ連盟（CBJD、Regras Oficiais）のもので、引き分けの規則はFMJDの8×8の盤の規則と異なります。両者が食い違うところは、ブラジルの規則に従います。",
      "International draughts on the smaller board with the same 12 pieces as American checkers, as played in Brazil and, since 1985, at the world championships of 8×8 draughts. The rules here are those of Brazil's draughts confederation (CBJD, Regras Oficiais), whose draw rules differ from the FMJD's rules for the 8×8 board. Where the two disagree, Brazil's rules are followed.",
    ],
    rules: [
      [
        "各自、自陣の3段の濃い色のマスに12個のふつうの駒を持ちます。白が先に動かします。",
        "Each side has twelve ordinary pieces on the dark squares of its own three rows. White moves first.",
      ],
      MEN_CAPTURE_ALL_WAYS,
      CAPTURE_MOST,
      CROWN_AT_END_AND_FLY,
      [
        "動かせる駒がなくなった側の負けです。同じ手番で同じ局面が3回目に現れたとき、キングだけが動き何も取られないまま各自20手が過ぎたとき、またはキング2個対キング2個、キング2個対キング1個、キング2個対キング1個とふつうの駒1個、キング1個対キング1個、キング1個対キング1個とふつうの駒1個のいずれかの終盤が各自5手のうちに決着しないときは、引き分けです。",
        "A side with no piece that can move has lost. It is a draw when the same position appears for the third time with the same side to move, when 20 moves each have passed with only kings moving and nothing captured, or when an ending of two kings against two kings, two kings against one king, two kings against a king and an ordinary piece, a king against a king, or a king against a king and an ordinary piece is not decided within 5 moves each.",
      ],
    ],
    board: [
      "8×8で、濃い色のマスだけを使います。64マスのうち32マスです。各自12個のふつうの駒が最初の3段を埋めます。長い対角線は、各自から見て左から始まります。",
      "8×8, played on the dark squares only: 32 of the 64 squares. Each side's 12 ordinary pieces fill the first three rows. The long diagonal runs from each player's left.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  canadianCheckers: {
    tagline: [
      "12×12の盤で遊ぶ国際ルール。各自30個の駒を持つ。",
      "The international rules on a 12×12 board, with 30 pieces each.",
    ],
    origin: [
      "フランス語圏のケベックの「グラン・ジュ・ド・ダム（grand jeu de dames）」で、144マスの盤で遊ぶ国際ルールのゲームです。この大きさの盤は1805年までにロンドンで売られており、カナダ選手権は1880年に「ハフ」、つまり取り損ねた駒を取り上げられる昔の罰則をなくしました（H. J. R. Murray、1978年）。いまはほとんど遊ばれておらず、どの連盟の引き分け規則も見つからなかったので、ここでの引き分けは国際ドラフツのFMJDの規則を借りています。",
      "The grand jeu de dames of French-speaking Quebec: the international game on a board of 144 squares. Boards of this size were on sale in London by 1805, and the Canadian championship abolished the huff, the old penalty of having a piece that failed to capture taken away, in 1880 (H. J. R. Murray, 1978). Little is played now, and no federation's draw rules could be found, so the draws here borrow the FMJD's rules for international draughts.",
    ],
    rules: [
      [
        "各自、自陣の5段の濃い色のマスに30個のふつうの駒を持ちます。白が先に動かします。",
        "Each side has thirty ordinary pieces on the dark squares of its own five rows. White moves first.",
      ],
      MEN_CAPTURE_ALL_WAYS,
      CAPTURE_MOST,
      CROWN_AT_END_AND_FLY,
      [
        "動かせる駒がなくなった側の負けです。引き分けは国際ドラフツと同じで、同じ局面の3回目の繰り返し、キングだけが動き何も取られないまま各自25手、そして、駒3個または2個対キング1個の終盤についての16手と5手の数え方です。",
        "A side with no piece that can move has lost. The draws are the same as in international draughts: a third repetition of a position, 25 moves each with only kings moving and nothing captured, and the counts of 16 and 5 moves for endings of three or two pieces against a lone king.",
      ],
    ],
    board: [
      "12×12で、濃い色のマスだけを使います。144マスのうち72マスです。各自30個のふつうの駒が最初の5段を埋め、中央の2段は空いて始まります。",
      "12×12, played on the dark squares only: 72 of the 144 squares. Each side's 30 ordinary pieces fill the first five rows, and the two middle rows start empty.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  russianDraughts: {
    tagline: [
      "8×8でキングが飛ぶドラフツ。ふつうの駒も後ろに取れ、どの取りを選んでもよく、取りの途中でキングになった駒はキングとして取り続ける。",
      "Draughts on 8×8 with flying kings. Ordinary pieces can capture backward, any capture may be chosen, and a piece crowned partway through a capture carries on capturing as a king.",
    ],
    origin: [
      "公式の規則は1884年にロシアで初めて印刷され、最初のロシア選手権は1894年に開かれました。1924年からはソ連選手権が続き、1993年からは、FMJDの8×8部門のもとで世界選手権が開かれています。ここでの規則はロシアドラフツ連盟（ФШР）のもので、引き分けも含みますが、数えられない2つ、つまりキング1個が大きな対角線（メインロード）を押さえている場合と、審判が明らかな引き分けと判断した局面は除きます。",
      "Official rules were first printed in Russia in 1884, and the first Russian championship was held in 1894. Soviet championships followed from 1924, and world championships have been held since 1993 under the FMJD's section for the 8×8 game. The rules here are those of the Russian Draughts Federation (ФШР), draws included, except for the two that cannot be counted: a lone king holding the main road (the long diagonal), and a position that an arbiter calls clearly drawn.",
    ],
    rules: [
      [
        "各自、自陣の3段の濃い色のマスに12個のふつうの駒を持ちます。白が先に動かします。",
        "Each side has twelve ordinary pieces on the dark squares of its own three rows. White moves first.",
      ],
      MEN_CAPTURE_ALL_WAYS,
      [
        "取りは義務ですが、どの取りを選ぶかは自由で、長くても短くてもかまいません。取りを始めたら、取れる駒がある限り続け、取った駒はその手が終わってから取り除かれ、同じ駒を2度飛び越えることはできません。",
        "Capturing is compulsory, but which capture you choose is up to you, the longer or the shorter. Once a capture is begun it continues as long as there is a piece to take, the captured pieces are removed only when the move is over, and no piece can be jumped twice.",
      ],
      [
        "奥の段に着いたふつうの駒は、取りの途中でも、その場でキングになり、キングとして取り続けます。キングは飛びます。空いている斜めの線に沿って好きなだけ進め、どれだけ離れた駒でも取って、その先の空いているマスのどこにでも着地できます。ただし、さらに取れる着地先があるなら、そこを選びます。",
        "An ordinary piece that reaches the far row is crowned a king at once, even partway through a capture, and carries on capturing as a king. A king flies: along an open diagonal it can move any distance, capture a piece at any distance, and land on any empty square beyond it. But if there is a landing square from which it can capture again, it chooses that one.",
      ],
      [
        "動かせる駒がなくなった側の負けです。次のときは引き分けです。同じ手番で同じ局面が3回目に現れたとき。キングだけが動き何も取られないまま各自15手が過ぎたとき。キング3個以上がキング1個を15手のうちに取れなかったとき。両者にキングがいる終盤で、何も取られず何もキングにならない状態が、盤上の駒が2個か3個なら各自5手、4個か5個なら30手、6個か7個なら60手続いたとき。",
        "A side with no piece that can move has lost. It is a draw in these cases: when the same position appears for the third time with the same side to move; when 15 moves each have passed with only kings moving and nothing captured; when three or more kings have not captured a lone king within 15 moves; and when, in an ending with a king on each side, nothing is captured and nothing is crowned for 5 moves each with two or three pieces on the board, 30 with four or five, or 60 with six or seven.",
      ],
    ],
    board: [
      "8×8で、濃い色のマスだけを使います。64マスのうち32マスです。各自12個のふつうの駒が最初の3段を埋め、長い対角線、つまりメインロードは、各自から見て左から始まります。",
      "8×8, played on the dark squares only: 32 of the 64 squares. Each side's 12 ordinary pieces fill the first three rows, and the long diagonal, the main road, runs from each player's left.",
    ],
    review: AGENT_READ_2026_10_06,
  },
  poolCheckers: {
    tagline: [
      "アメリカのプール。ふつうの駒も後ろに取れ、キングは飛び、どの取りを選んでもよい。",
      "American pool. Ordinary pieces can capture backward, kings fly, and you may choose any capture.",
    ],
    origin: [
      "アメリカ南部のチェッカーで、昔からアフリカ系アメリカ人の対局者に遊ばれ、プエルトリコやジャマイカでも遊ばれています。起源は記録されておらず、Vladimir Kaplanはスペインのチェッカーにさかのぼると考えました。American Pool Checker Associationが1960年代から規則を守っており、ここでの規則は同協会の大会規則（Tournament Rules of Play、2016年）です。協会の30手規則は対局者が宣言して数えますが、ここでは誰も宣言しないので、進展のない対局は、このサイト独自の40手の数え方で終わります。",
      "The checkers of the American South, traditionally played by African American players and also played in Puerto Rico and Jamaica. Its origin is not documented, and Vladimir Kaplan traced it back to Spanish checkers. The American Pool Checker Association has kept its rules since the 1960s, and the rules here are the association's Tournament Rules of Play (2016). The association's 30-move rule is announced and counted by a player, but nobody announces anything here, so a game that is going nowhere ends by this site's own 40-move count.",
    ],
    rules: [
      [
        "各自、自陣の3段の濃い色のマスに12個のふつうの駒を持ちます。黒が先に動かします。",
        "Each side has twelve ordinary pieces on the dark squares of its own three rows. Black moves first.",
      ],
      [
        "ふつうの駒は、斜め前へ1歩進み、隣り合う相手の駒を飛び越えて取ります。前にも後ろにも取れます。",
        "An ordinary piece steps one square diagonally forward and captures by jumping over an adjacent enemy piece. It can capture forward or backward.",
      ],
      [
        "取りは義務ですが、最も多く取る必要はなく、どの取りを選んでもかまいません。取りは、始めたら最後まで続け、取った駒はその手が終わってから取り除かれ、同じ駒を2度飛び越えることはできません。",
        "Capturing is compulsory, but you do not have to take the most, and you may choose any capture. Once begun, a capture is carried to the end, the captured pieces are removed only when the move is over, and no piece can be jumped twice.",
      ],
      [
        "ふつうの駒がキングになるのは、その手が奥の段で終わったときだけです。そこからさらに跳ばなければならない駒は、ふつうの駒のままです。キングは飛び、どれだけ離れた駒でも取って、その先の空いているマスのどこにでも着地できます。",
        "An ordinary piece is crowned a king only if its move ends on the far row. A piece that must jump on from there stays an ordinary piece. A king flies, captures a piece at any distance, and can land on any empty square beyond it.",
      ],
      [
        "動かせる駒がなくなった、または駒が1つも残っていない側の負けです。キング3個は、キング1個が13手を指す前に取らなければならず、そうでなければ引き分けです。また、ここのチェッカーと同じく、キングだけが動き何も取られないまま各自40手が過ぎれば引き分けです。これはこのサイトの規則で、協会の規則ではありません。",
        "A side with no piece that can move, or with no pieces left, has lost. Three kings must capture a lone king before it has made 13 moves, or the game is a draw. Also, as in the checkers here, 40 moves each with only kings moving and nothing captured is a draw. This is this site's rule, not the association's.",
      ],
    ],
    board: [
      "8×8で、濃い色のマスだけを使います。64マスのうち32マスで、各自の手前の左隅は濃い色のマスです。各自12個のふつうの駒が最初の3段を埋めます。",
      "8×8, played on the dark squares only: 32 of the 64 squares, with a dark square in each player's near left-hand corner. Each side's 12 ordinary pieces fill the first three rows.",
    ],
    review: AGENT_READ_2026_10_06,
  },
} satisfies Partial<Record<RuleVariant, VariantCopyJa>>;
