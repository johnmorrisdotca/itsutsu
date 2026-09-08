import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * Strategy, written to be learned from. Each guide is a few sections of
 * plain paragraphs and bullet lists, keyed by the variants it applies to, so
 * one guide can serve a whole family and a rules page can link the guide
 * that fits. Terms are given with their Japanese names where the game has
 * them, because that is how the literature names them.
 */
export type GuideSection = {
  heading: string;
  paragraphs?: readonly string[];
  points?: readonly string[];
};

export type Guide = {
  slug: string;
  title: string;
  kanji: string;
  summary: string;
  variants: readonly RuleVariant[];
  sections: readonly GuideSection[];
};

export const GUIDES: readonly Guide[] = [
  {
    slug: "five-in-a-row",
    title: "Five in a row, from the first stone",
    kanji: "五目の基本",
    summary: "Threats, shapes and tempo: the ideas every gomoku family game is built on.",
    variants: ["freestyle", "standard", "renju", "omok", "caro", "ninuki", "dominoFive", "blockFive", "misereFive", "toroidalFive", "obstacleFive"],
    sections: [
      {
        heading: "The game is about threats, not lines",
        paragraphs: [
          "Nobody wins by quietly building a five. A five is the end of a sequence of threats the opponent had to answer, each one leaving them a little less choice. Think in threats and the board starts to read itself.",
          "A four (四) is four in a row with at least one open end: it must be blocked at once or it is five. An open three (活三, live three) is three in a row with both ends open and room beyond: it must be answered now, because next move it becomes an open four (活四), which has two ends to block and only one stone to block with. That is the whole ladder: three forces, four forces harder, open four wins.",
        ],
      },
      {
        heading: "The shapes that win",
        points: [
          "Four-three (四三): one stone makes a four and an open three at once. The four must be blocked; the three becomes an open four. This is the standard winning shape, and in Renju it is the only double black is allowed.",
          "Three-three (三三): one stone makes two open threes. Whichever is blocked, the other becomes an open four. Forbidden to black in Renju and to both in Omok, which tells you how strong it is.",
          "Four-four (四四): two fours at once. Unblockable. Forbidden to black in Renju.",
          "A VCF, victory by continuous fours (四追い), is a sequence where every move is a four and the last is a four-three or a double. Because every move forces, the opponent never gets a free stone. Look for it whenever you have two or three stones near each other and the opponent has none.",
        ],
      },
      {
        heading: "Tempo and the free stone",
        paragraphs: [
          "The player who makes a threat chooses where the reply goes. The player who answers gets nothing for it. So the question after every move is: does this stone force a reply, and if not, what does the opponent get to do with their free stone?",
          "Defend with a stone that also threatens. A block that makes your own three is worth two moves. A block that makes nothing hands the initiative straight back.",
        ],
      },
      {
        heading: "The opening",
        points: [
          "Black's first stone belongs in the centre; every line through tengen (天元) has the most room.",
          "White's first stone goes adjacent or diagonal to it. Too far away and black builds unopposed; too close and white gets tangled.",
          "Freestyle is a known black win with perfect play, which is why the serious rule sets restrict black (Renju), swap colours (Swap2) or push black's second stone away (Pro). If you play freestyle for a game that matters, give white the first move now and then, or use an opening.",
        ],
      },
      {
        heading: "Reading",
        points: [
          "Before you play, count the opponent's threats on the board. If there is a four, block it. If there is an open three, block it unless you have a four of your own to play first.",
          "When blocking an open three, block the end that leaves your stone useful, usually the end nearer your own stones.",
          "A line with an enemy stone at one end is a dead three: it can become a four but never an open four. Do not spend moves answering it until it is a four.",
        ],
      },
      {
        heading: "Misère Five: losing on purpose",
        points: [
          "Making five loses, so a four is a threat against its own maker: the opponent's task is to leave you nothing but the fifth point. Keep your lines short and broken, and force your opponent's to grow.",
          "Parity decides the end. The board fills, and whoever is forced to complete a five loses; a full board with no five goes to the opener. Count the safe points late in the game as you would in Notakto.",
        ],
      },
    ],
  },
  {
    slug: "renju",
    title: "Renju: playing black with your hands tied",
    kanji: "連珠の考え方",
    summary: "What the forbidden shapes take from black, what white does with them, and the openings.",
    variants: ["renju"],
    sections: [
      {
        heading: "Black's restrictions are white's weapon",
        paragraphs: [
          "Black may not make a double three, a double four or an overline. White may do all three, and white's overline wins. The point of the rules is that black's first-move advantage is worth about that much, so the two sides end up even.",
          "For white this means one thing above all: force black towards forbidden points. A point black is not allowed to play is a point white does not have to defend. Build your shape so that black's natural winning stone would be a three-three, and black has no winning stone.",
        ],
      },
      {
        heading: "What a three is, precisely",
        points: [
          "A three counts only if it can become a straight four with one more stone, and that stone must itself be a legal move for black. A three whose only completion is forbidden is not a three, and does not count towards a double.",
          "A four is any line one stone short of exactly five. A straight four with two open ends is one four, not two.",
          "A five wins at once even if the same stone would also have made a forbidden shape.",
          "The board marks black's forbidden points with a cross. Learn to see them before the marks appear; that is the skill the game is testing.",
        ],
      },
      {
        heading: "The openings",
        points: [
          "The RIF opening confines the first three stones: tengen, then inside the 3×3, then inside the 5×5, after which white may swap colours. The twenty-six openings that result are named, and each has a known evaluation. Direct openings (直接, white's stone on a line with tengen) and indirect openings (間接, diagonal) play very differently.",
          "The fourth move is white's free choice and decides the character of the game. In tournament play black then offers two fifth moves and white removes one; here that step is not enforced, so black simply plays the fifth.",
          "A good habit for white in a swap: take black in the balanced openings and white in the sharp ones, since black's forbidden points bite hardest when the position is sharp.",
        ],
      },
      {
        heading: "The opening protocols, and which are here",
        paragraphs: [
          "Renju has spent a century balancing its opening, and the protocols are its history. Three are playable here. RIF (連珠国際連盟ルール) confines the first three stones and lets white swap. Sakata (坂田ルール) is RIF with a single fifth move that must stay inside the central 7×7, which takes away black's sharpest fifth stones. Tarannikov nests the first five stones in the 1×1, 3×3, 5×5, 7×7 and 9×9 and offers a swap after every one of them, so any stone that tips the balance is simply handed to the other player.",
          "Three more are not built yet, because they all rest on one mechanism this board does not have: black putting down several candidate fifth moves and white removing all but one. Yamaguchi has black declare, before the swap, how many fifth moves it will offer. Soosyrv-8 declares the number after white's fourth stone, up to eight, and then offers the swap. Taraguchi-10 is Tarannikov's nested squares with a swap after each of the first four stones, after which white may instead demand ten fifth-move candidates. When the candidate mechanism arrives, all three come with it, along with the fifth-move pair in full RIF.",
        ],
      },
    ],
  },
  {
    slug: "captures",
    title: "Ninuki-renju: two ways to win",
    kanji: "二抜きの考え方",
    summary: "Captures change the value of every shape. Threats can be taken apart, and pairs are points.",
    variants: ["ninuki", "sannuki"],
    sections: [
      {
        heading: "Never leave a pair with an open end",
        paragraphs: [
          "Two of your stones side by side with an empty point at one end and an enemy stone at the other are a capture waiting to happen. Every pair you make, ask where the flank is. Three in a row cannot be captured, which makes a three far safer than a pair.",
          "Moving into a flanked position is safe: only the stone that closes the trap captures. So a pair between two enemy stones is not in danger; it is the empty end you watch.",
        ],
      },
      {
        heading: "Capture as defence",
        points: [
          "A four can be broken by capturing one of its stones. Before you block a four, look for the capture: it takes the stone away and gives you a pair towards the win.",
          "An open three built from a pair plus one can often be captured out of existence rather than blocked.",
          "Five pairs win outright. At three or four captures, every capture threat is as forcing as a four.",
        ],
      },
      {
        heading: "The Pro opening",
        paragraphs: [
          "Black's second stone must leave the central 5×5. It is the tournament rule for a reason: the first player's advantage is larger in the capture game than in plain gomoku, and the exclusion takes some of it back.",
        ],
      },
      {
        heading: "Sannuki-renju: triples fall too",
        points: [
          "Three in a row is no longer safe. A three with an empty point at one end and an enemy stone at the other is exactly as exposed as a pair. Only a four cannot be taken.",
          "The count is in stones, fifteen to win. A triple is worth half again a pair, so an opponent who has left a three flanked is the first thing to look at.",
          "Because threes are capturable, an open three is a weaker threat than in the pair game: your opponent may answer it by taking it, and gain three stones. Build fours from pairs plus one rather than from threes plus one where you can.",
        ],
      },
    ],
  },
  {
    slug: "connect-six",
    title: "Connect6: two stones a turn",
    kanji: "六子棋の考え方",
    summary: "Threats arrive in pairs, and a line of four with open ends is already decisive.",
    variants: ["connect6"],
    sections: [
      {
        heading: "Count threats in twos",
        points: [
          "You place two stones, so you can block two things or make two things. An opponent's shape that needs three blocks is unblockable.",
          "Four in a row with both ends open needs two stones to block: the opponent has exactly two. Four with both ends open plus any other threat wins.",
          "Five in a row with one open end is a single threat. Do not panic at it; one stone blocks it and the other is free.",
        ],
      },
      {
        heading: "Shape",
        paragraphs: [
          "Because you place pairs, connected shapes matter more than in gomoku. Two stones with a gap between them are a potential four in two moves; keep your stones near each other and force the opponent to spend both stones on defence each turn.",
        ],
      },
    ],
  },
  {
    slug: "drops",
    title: "The drop family: gravity is the board",
    kanji: "落としの考え方",
    summary: "Columns, parity and the threats you set up for later.",
    variants: ["dropFour", "ringDrop", "holeDrop", "hotDrop", "clearDrop", "giveawayDrop", "edgeDrop", "wormDrop"],
    sections: [
      {
        heading: "Threats are stored, not played",
        paragraphs: [
          "A threat in a drop game is an empty point that would complete your four, sitting above stones that have not been played yet. It cannot be taken until the column fills to just beneath it. So the game is about which threats are stacked where, and who is forced to fill the column below.",
          "Two of your threats in the same column, one directly above the other, is decisive: whoever fills to the lower one loses it, and the other side then has the upper. Two threats in adjacent columns on the same row are nearly as good.",
        ],
      },
      {
        heading: "Parity",
        points: [
          "On a board with an odd number of columns and an even number of rows, the player who moved first will fill the last point of an even row and the second player the last point of an odd row, if both play out. So threats on odd rows favour one side and even rows the other. Count the rows from the bottom and remember which are yours.",
          "The middle column is worth the most: every horizontal and both diagonals pass through it.",
        ],
      },
      {
        heading: "The variants",
        points: [
          "Ring Drop: the edges join. A three at the right edge threatens the left; do not think of the sides as safe.",
          "Hole Drop and Hot Drop: the random squares change parity for their column. Work out which rows they push your threats onto before you commit to a plan on that side.",
          "Clear Drop: a full bottom row vanishes and everything drops. A stored threat one row up becomes playable at once, and one on the bottom row disappears. Time the clearing.",
          "Giveaway Drop: play away from lines. The rule against playing on top of the opponent's last stone means you cannot be forced into a four by a single column; count the safe moves left, as in a game of nim.",
          "Edge Drop: the board fills from the outside in. Lines along the edges come early; lines through the centre come last, and the centre is where the game is decided.",
          "Worm Drop: the two wormhole mouths join the board to itself. A line that reaches one mouth carries on from the other in the same direction, so a column or diagonal far from your stones may be next to them. Read every line through the mouths before you call a position safe.",
        ],
      },
    ],
  },
  {
    slug: "twist",
    title: "Twist Five and Twist Four: the board moves",
    kanji: "回しの考え方",
    summary: "Think in quadrants, and never rely on a line that a single turn undoes.",
    variants: ["twistFive", "twistFour"],
    sections: [
      {
        heading: "A line across a quadrant edge is not a line",
        paragraphs: [
          "Every turn ends with a quadrant rotating. A line that crosses from one quadrant into another can be broken by turning either. A line that lives inside one quadrant survives every turn of the other three, and turning its own quadrant only moves it.",
          "So the strong shapes are the ones inside a quadrant, especially the centre cell of a 3×3 quadrant, which does not move at all when the quadrant turns. On the 6×6 board those four centre points are the anchors of every plan.",
        ],
      },
      {
        heading: "Use the turn on your own move",
        points: [
          "You place, then turn. Placing a stone that will line up after the turn is the basic tactic: the stone goes down where the line will be, not where it is.",
          "Turning to break the opponent's line is defence; turning to complete your own is attack. The best turns do both.",
          "Five for both at once is a draw. When you are losing, look for a turn that makes their five and yours together.",
        ],
      },
    ],
  },
  {
    slug: "small-games",
    title: "Trap Three, Square Four, tic-tac-toe and the trick games",
    kanji: "小さな盤の考え方",
    summary: "Games short enough to read to the end, and what reading to the end feels like.",
    variants: ["trapThree", "squareFour", "tictactoe", "wildTicTacToe", "notakto", "makerBreaker"],
    sections: [
      {
        heading: "Trap Three",
        points: [
          "Every stone you place narrows what you can play next: a stone that would make three of your own is illegal for you in practice, because it loses. Count your safe moves, and count your opponent's.",
          "The winning idea is to leave your opponent with no safe move. On a 5×5 board that comes quickly. Play towards a position where every empty point makes a three for them and a four for you.",
          "Four is safe to make and wins. A line of two with both ends open is a threat to make four in two moves; but it is also a trap for you if the only continuation makes three. Check both.",
        ],
      },
      {
        heading: "Square Four",
        points: [
          "The 2×2 square is the quiet win. Three pieces in an L shape threaten a square in one move; the opponent must sit on the fourth point or move a piece into it.",
          "In the placing phase, spread out enough to threaten both a line and a square. In the sliding phase, every move both leaves a point and takes one: look at what the piece you move stops guarding.",
          "The game is a draw with perfect play. Wins come from the opponent guarding the line and forgetting the square, or the other way round.",
        ],
      },
      {
        heading: "Tic-tac-toe",
        points: [
          "The centre is the strongest first move, and a corner is the strongest reply. An edge as the first move loses to correct play.",
          "The only winning idea is the fork: a move that makes two lines of two at once. Every drawing strategy is a list of forks to prevent.",
          "It is always a draw between players who know that. That is the lesson, and the reason the bigger boards exist.",
        ],
      },
      {
        heading: "Wild tic-tac-toe",
        points: [
          "You may place either colour, and a line of either wins for whoever completes it. So a line of two of any colour with an open end is a threat to you and a threat to your opponent equally: whoever moves next takes it.",
          "Never leave a two with an open end on your opponent's turn unless you are forced to. The first player wins with the centre, followed by correct play; the second player's task is to keep every line at one stone or full.",
        ],
      },
      {
        heading: "Notakto",
        points: [
          "Every stone is black, and three in a row loses. Think of the board as a set of lines that are alive (two empty points or more, no three possible yet) and dead.",
          "On one 3×3 board the first player loses with correct play: the centre is the only safe start and it still loses. Count the safe moves left after each of your candidates; the player who runs out first loses, so leave an even number.",
        ],
      },
      {
        heading: "Maker and Breaker",
        points: [
          "The Maker wants any five of one colour, whoever placed it; the Breaker wants a full board without one. The Breaker's job is easier to describe than to do: every open four of either colour must be answered with the other colour at once.",
          "As Maker, build two-colour threats: a black four and a white four that share no point cannot both be blocked in one move. As Breaker, place stones where they cut two lines of different colours at once, and keep every line mixed.",
          "On the 6×6 board the Maker is generally thought to have the edge, which is why the site lets the players change seats between games.",
        ],
      },
    ],
  },
  {
    slug: "pieces",
    title: "Domino Five and Block Five: playing the queue",
    kanji: "駒の考え方",
    summary: "You both see the same pieces coming. The game is in what you do with a piece you would rather not have.",
    variants: ["dominoFive", "blockFive"],
    sections: [
      {
        heading: "Read the queue before the board",
        paragraphs: [
          "Both players get the same run of pieces, and the next three are shown. So you know what your opponent will have to lay, and they know yours. A white-white domino in black's hand is not a disaster if black lays it where white's stones cannot use it: on the far side of the board, or into a line black has already blocked.",
          "Plan two pieces ahead. If the piece after next is good for you, place the current one to make room for it where it will count.",
        ],
      },
      {
        heading: "Every piece cuts both ways",
        points: [
          "A piece carrying the opponent's colour can complete the opponent's five, and then the opponent wins whoever laid it. Before you lay, check every cell of the piece against the opponent's lines, not only your own.",
          "A piece carrying both colours can be laid so that your stone extends your line while the opponent's stone lands on a dead point: next to the edge, or on a line already blocked.",
          "In Block Five, singles are the scarce resource. A single fills the one gap a four needs, or blocks the one gap the opponent's four needs. Spend them on decisions, never on tempo.",
        ],
      },
      {
        heading: "When nothing fits",
        paragraphs: [
          "Late in the game the board runs out of room for the larger shapes and the turn passes. Two passes in a row end it as a draw. If you are ahead on the board, keep it tidy so your pieces still fit; if you are behind, a crowded board and a draw may be the best result available.",
        ],
      },
    ],
  },
];

/** The guides that apply to a variant, most specific first. */
export function guidesFor(variant: RuleVariant): Guide[] {
  return GUIDES.filter((guide) => guide.variants.includes(variant)).sort(
    (a, b) => a.variants.length - b.variants.length,
  );
}

export function guideBySlug(slug: string): Guide | null {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}
