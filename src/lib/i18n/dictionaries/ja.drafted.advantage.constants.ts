import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the advantage.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_ADVANTAGE: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // What a count means, and what it means where the smaller number wins
  "advantage.discsNote": {
    text: "予想ではなく、石の数です。挟んで返すゲームでは、リードが終盤に何度も入れ替わります。30手目で決まったように見える盤でも、そうでないことがほとんどです。",
    back: "It is a count of discs, not a forecast. In a game where discs are flipped, the lead changes hands many times near the end. Even a board that looks settled at move 30 almost never is.",
    review: AGENT_READ,
  },
  "advantage.discsFewerNote": {
    text: "予想ではなく、石の数です。ここでは少ないほうが有利で、相手より石を少なくして終えることが目的です。",
    back: "It is a count of discs, not a forecast. Here the smaller number is better, and the aim is to finish with fewer discs than your opponent.",
    review: AGENT_READ,
  },
  "advantage.homeNote": {
    text: "向こう側の陣地に着いた駒の数です。双方がどこまで進んだかを示すもので、どちらが先に着くかは示しません。後ろに残った駒のかたまりが、すでに散らばった駒より速く進むこともあります。",
    back: "It is the number of pieces that have reached the far camp. It shows how far each side has come, not who will arrive first. A group of pieces left behind can sometimes move faster than pieces that have already spread out.",
    review: AGENT_READ,
  },
  "advantage.homeFewerNote": {
    text: "向こう側の陣地に着いた駒の数です。",
    back: "It is the number of pieces that have reached the far camp.",
    review: AGENT_READ,
  },
  "advantage.scoreNote": {
    text: "いまの盤面を、石と、一方の色だけが囲む空点の合計で数えた点数です。白にはコミが入っています。どの石が死んでいるかは分からないので、取られる石も取られるまでは数えます。序盤は、盤のほとんどがまだ誰の地でもありません。",
    back: "It is the score counted on the board as it stands, as stones plus the empty points surrounded by only one colour. Komi is included for White. It cannot tell which stones are dead, so a stone that will be captured is counted until it is captured. Early on, most of the board is still nobody's territory.",
    review: AGENT_READ,
  },
  "advantage.scoreFewerNote": {
    text: "いまの盤面を数えた点数で、白にはコミが入っています。",
    back: "It is the score counted on the board as it stands, with komi included for White.",
    review: AGENT_READ,
  },
  "advantage.materialNote": {
    text: "盤上に残っている駒の単純な数で、キングも含みます。ここでは駒の数がほぼ勝負を左右しますが、これから取らされる駒も数に入ります。数字は、このあとの展開までは分かりません。",
    back: "It is a plain count of the pieces left on the board, kings included. Here the number of pieces mostly decides the game, but a piece that is about to be forced into a capture is still counted. The number does not know what happens next.",
    review: AGENT_READ,
  },
  "advantage.materialFewerNote": {
    text: "盤上に残っている駒の単純な数で、キングも含みます。",
    back: "It is a plain count of the pieces left on the board, kings included.",
    review: AGENT_READ,
  },
  // Why a game cannot be read
  "advantage.unreadable": {
    text: "このゲームは、この方法では優劣を判断できません",
    back: "This game's advantage cannot be judged by this method",
    review: AGENT_READ,
  },
  "advantage.unreadableTurning": {
    text: "石を置くたびに盤の4分の1が回ります。この局面について数えたことは次の手で崩れてしまうので、どんな読みも、示したときにはもう古くなっています。",
    back: "A quarter of the board turns after every stone. Whatever is counted about this position falls apart on the next move, so any reading is already out of date by the time it is shown.",
    review: AGENT_READ,
  },
  "advantage.unreadableQueued": {
    text: "ここでは1つの駒が複数の点をふさぎ、次に打てるのは、順番待ちの列から渡されたものです。線の読みは、1つずつ自由に置く石を前提にしていますが、ここではどちらも当てはまりません。",
    back: "Here one piece covers several points, and what you can play next is whatever the waiting line hands you. Reading lines assumes stones placed one at a time, freely, and neither is true here.",
    review: AGENT_READ,
  },
  "advantage.unreadableConnection": {
    text: "局面はすべて1つの問い、つまり、つながりが端から端まで届くかどうかで、石の数では答えられません。石1つで2つのかたまりがつながり、互角に見えた盤が決まることもあります。",
    back: "The whole position is one question, whether a chain reaches from one side to the other, and a count of stones cannot answer it. One stone can join two groups and decide a board that looked even.",
    review: AGENT_READ,
  },
  "advantage.unreadableSquare": {
    text: "勝ちは線ではなく正方形で、双方とも最初から最後まで同じ4つの駒を使います。数えても同じ数にしかならず、読める線もありません。",
    back: "A win is a square, not a line, and both sides use the same four pieces from start to finish. Counting only gives the same number, and there is no line to read.",
    review: AGENT_READ,
  },
  "advantage.unreadableAsymmetric": {
    text: "ここでは2人の目的が違い、片方は線を作ろうとし、もう片方はあらゆる線を防ごうとします。双方が優劣を比べられる共通の数字はありません。",
    back: "The two players have different aims here: one tries to make a line and the other tries to stop every line. There is no common number on which both sides can be compared.",
    review: AGENT_READ,
  },
  "advantage.unreadableShared": {
    text: "このゲームの石は色に属していないので、黒の形勢と白の形勢を比べることはできません。あるのは、2人がいっしょに作っていく形だけです。",
    back: "The stones in this game do not belong to a colour, so black's position and white's position cannot be compared. All there is is the shape the two players build together.",
    review: AGENT_READ,
  },
  // The threats reading, in words
  "advantage.threatsNote": {
    text: "盤上の狙いを、数字ではなく言葉で読んだものです。このサイトは局面を探索していないので、数字で出すと探索したかのように見えてしまいます。",
    back: "It is a reading of the threats on the board, given in words rather than a number. This site does not search the position, so giving a number would make it look as if it had.",
    review: AGENT_READ,
  },
};
