import { Diagram } from "@/components/about/Diagram";
import { FigureTable } from "@/components/about/FigureTable";
import { Game, Inside, Out } from "./about.links";
import type { AboutSection } from "./about.constants";

/**
 * Go, which is not played here.
 *
 * The board is a go board, the stones are go stones, the display face is the
 * one a go book sets its diagrams in, and the page had never once said what
 * go is. This section says it. It is history and furniture — whether go
 * becomes a game you can play here is a much larger question and a ticket of
 * its own, and the last paragraph says so rather than letting a reader think
 * a link is missing.
 */

/** A white stone with its last liberty filled: four black stones around it, and it comes off. */
const CAPTURE = (
  <Diagram
    rows={7}
    cols={7}
    grid="lines"
    label="A white stone on the centre of a small go board with black stones on all four neighbouring points; the white stone is shown fading, about to be lifted."
    stones={[
      { row: 3, col: 3, colour: "white", taken: true },
      { row: 2, col: 3, colour: "black" },
      { row: 4, col: 3, colour: "black" },
      { row: 3, col: 2, colour: "black" },
      { row: 3, col: 4, colour: "black", ring: true },
    ]}
    caption={
      <>
        Liberties are the empty points a stone touches along the lines. The white stone began with four; the
        ringed black stone takes the last of them, and white comes off the board. Everything the capture games
        here do — <Game variant="ninuki">bracketing a pair</Game> — is a simplification of this one idea.
      </>
    }
  />
);

/** A black group with two separate eyes: white can never fill both, so it cannot be taken. */
const TWO_EYES = (
  <Diagram
    rows={7}
    cols={7}
    grid="lines"
    label="A ring of black stones enclosing two separate single empty points, the shape that cannot be captured."
    stones={[
      { row: 2, col: 1, colour: "black" },
      { row: 2, col: 2, colour: "black" },
      { row: 2, col: 3, colour: "black" },
      { row: 2, col: 4, colour: "black" },
      { row: 2, col: 5, colour: "black" },
      { row: 3, col: 1, colour: "black" },
      { row: 3, col: 3, colour: "black" },
      { row: 3, col: 5, colour: "black" },
      { row: 4, col: 1, colour: "black" },
      { row: 4, col: 2, colour: "black" },
      { row: 4, col: 3, colour: "black" },
      { row: 4, col: 4, colour: "black" },
      { row: 4, col: 5, colour: "black" },
    ]}
    caption={
      <>
        Two eyes, and the group is alive for ever. Filling either empty point would leave white’s own stone
        without a liberty, which is not allowed, and white cannot fill both at once. This is the whole of life
        and death in one picture, and it is why go is a harder game than it looks.
      </>
    }
  />
);

/** How big the game is, next to the games this site does play. */
const SIZES = (
  <FigureTable
    head={["Game", "Board", "Legal positions"]}
    rows={[
      [<Game key="t" variant="tictactoe">Tic-tac-toe</Game>, "3×3", "5,478"],
      [<Game key="c" variant="dropFour">Connect Four</Game>, "7×6", "4,531,985,219,092"],
      ["Chess", "8×8", "about 4.8 × 10⁴⁴"],
      [<Game key="f" variant="freestyle">Gomoku</Game>, "15×15", "under 3²²⁵ ≈ 10¹⁰⁷"],
      ["Go", "19×19", "2.08 × 10¹⁷⁰"],
    ]}
    caption={
      <>
        Positions that can legally stand on the board, not games that can be played — the game counts are larger
        again. Tic-tac-toe and Connect Four are exact and settled. The go figure is exact too: John Tromp counted
        it in 2016, all 171 digits. The chess number is Tromp’s estimate, and the gomoku one is only the ceiling
        the board’s 225 points allow — three states each — because nobody has counted the legal ones.
      </>
    }
  />
);

export const GO_SECTION: AboutSection = {
  title: "Go, the board underneath",
  kanji: "囲碁",
  paragraphs: [
    <>
      Everything here is drawn on a go board. The grid, the star points, the clamshell-and-slate colours, the
      mincho face the Japanese names are set in — all of it is borrowed from a game this site does not yet let you
      play, and it is worth saying what that game is. Go was invented in China more than two and a half thousand
      years ago and is the oldest board game still played with its rules essentially intact: a Chinese player of
      the fourth century BC and one of today would need a few minutes to agree the scoring and could then simply
      play. It is <span className="font-mincho">围棋</span> <em>weiqi</em> in China, <span className="font-mincho">바둑</span>{" "}
      <em>baduk</em> in Korea, and <span className="font-mincho">囲碁</span> <em>igo</em> in Japan, which is the
      name that reached English.
    </>,
    <>
      The rules are shorter than the rules of five in a row. Players place a stone on any empty intersection,
      black first. A stone or a solid group of stones is captured when the last empty point touching it is filled.
      You may not play a move that leaves your own stones with no liberties, and you may not repeat the whole
      board position — the <em>ko</em> rule, which stops two players taking the same stone back and forth for
      ever. The game ends when both players pass, and whoever has surrounded more of the board wins. That is all
      of it, and it is enough for two thousand years of argument.
    </>,
    <>
      Its size is the famous part. A 19×19 board has 361 points, and the number of positions that can legally
      stand on it was settled exactly by John Tromp in 2016 after years of computation: 2.08 × 10¹⁷⁰, a number
      171 digits long. There are something like 10⁸⁰ atoms in the observable universe, so the board has about
      ninety orders of magnitude more positions than the universe has atoms — the comparison is not a flourish,
      it is the reason brute force never worked here when it had already finished{" "}
      <Game variant="dropFour">Connect Four</Game> and was beating world champions at chess.
    </>,
    <>
      Two of go’s inventions are the direct ancestors of things on this site. <em>Komi</em> is compensation: black
      moves first, so white is given points at the end — six and a half, or seven and a half under Chinese rules —
      and the half point exists for no reason other than to make a draw impossible. And the handicap lets black
      begin with up to nine stones already placed, which means two players nine grades apart can sit down to a
      real game rather than a formality. Every rating and tier on the{" "}
      <Inside href="/players">players page</Inside> is chasing what the handicap system did first: a way of making
      an uneven game worth both players’ evening.
    </>,
    <>
      Go is also where computers were held off longest. Chess fell in 1997; go was expected to hold out for
      another decade or more when, in Seoul in March 2016, DeepMind’s AlphaGo beat Lee Sedol — one of the
      strongest players of his generation — four games to one. The moment people remember is move 37 of the second
      game, a shoulder hit on the fifth line that no professional would have played and that commentators first
      called a mistake; it won the game, and the word they reached for afterwards was <em>beautiful</em>. Lee took
      the fourth game with move 78 of his own, a wedge so far outside the machine’s expectations that it never
      recovered — the last game a human has won against a top program in an even match. He retired in 2019,
      saying there was now an entity that could not be defeated. In 2023 a researcher did beat one again, but
      only by playing a weakness another program had been set to go looking for, which is a different kind of
      win and arguably proves his point rather than answering it.
    </>,
    <>
      You cannot play go here yet. Territory, capture, ko and passing are a family of their own and a long piece
      of work rather than a row in a table, and the honest thing is to say so rather than leave you hunting for a
      link. What the site has taken from it is the furniture, the vocabulary and the manners: stones on lines,
      names in two languages, a record that is kept, and a{" "}
      <Out href="https://www.littlegolem.net/">place to play slowly</Out> against somebody you like.
    </>,
  ],
  figures: { 1: CAPTURE, 2: SIZES, 3: TWO_EYES },
};
