import { Diagram } from "@/components/about/Diagram";
import { FigureTable } from "@/components/about/FigureTable";
import { Inside, Out } from "./about.links";
import type { AboutSection } from "./about.constants";

/**
 * How a move is written down here, and the standard it belongs to.
 *
 * The site has printed moves as H8 since the beginning and never said what
 * that means — which end the numbers start from, or why there is no column I.
 * Both are go conventions, and go's records have a file format of their own,
 * so the section names it. It is careful not to claim compatibility we do not
 * have: SGF's own coordinates are a different scheme, and the table says so
 * in the only way that settles it, by showing three points in both.
 */

/** The centre of a small board, named. */
const CENTRE = (
  <Diagram
    rows={9}
    cols={9}
    grid="lines"
    label="A nine by nine board with a single black stone on the centre point, labelled E5."
    stones={[{ row: 4, col: 4, colour: "black", label: "E5", ring: true }]}
    caption={
      <>
        The centre of a 9×9 board. E is the fifth column counting from the left, 5 the fifth row counting up from
        the bottom edge. The same point written for a file is <span className="font-mono">ee</span>.
      </>
    }
  />
);

/** The two schemes side by side, on a full-size board. */
const COORDINATES = (
  <FigureTable
    head={["On the board", "In SGF", "Where that is"]}
    rows={[
      [<span key="a" className="font-mono">H8</span>, <span key="b" className="font-mono">hh</span>, "the centre of a 15×15 board"],
      [<span key="c" className="font-mono">A1</span>, <span key="d" className="font-mono">ao</span>, "the bottom-left corner"],
      [<span key="e" className="font-mono">P15</span>, <span key="f" className="font-mono">oa</span>, "the top-right corner"],
    ]}
    caption={
      <>
        The same three points in both schemes, on the 15×15 board. They disagree about almost everything — where
        the origin is, which way the rows count, and whether the letter I exists — which is why the top-right
        column is P on the board and only the fifteenth letter, <span className="font-mono">o</span>, in the file.
      </>
    }
  />
);

export const NOTATION_SECTION: AboutSection = {
  title: "How a move is written down",
  kanji: "棋譜",
  paragraphs: [
    <>
      A move here is a letter and a number — <span className="font-mono">H8</span>, the centre of a full board.
      The letter is the column, counting from the left; the number is the row, counting up from the bottom edge,
      so row 1 is the bottom of the board rather than the top. You will see it on every move in the{" "}
      <Inside href="/history">record</Inside>, beside the hint when you ask for one, and in the list of moves
      down the side of a game.
    </>,
    <>
      There is no column I. Go boards have left the letter out for as long as they have had letters on them,
      because I, l and 1 are the same shape at a glance and a misread coordinate is a misread game; the columns
      run A to H, then J. On a 19×19 board that takes the letters to T rather than S. Renju’s published records
      use the same convention, which is why a championship game from Kyoto can be replayed here move for move
      without translating anything.
    </>,
    <>
      The standard this belongs to is <Out href="https://www.red-bean.com/sgf/">SGF</Out>, the Smart Game Format,
      written by Anders Kierulf in 1987 for his program Smart Go and revised into its current fourth form in the
      1990s. It is the format go records are kept in, and not only go: SGF gives each game it supports a number,
      and <span className="font-mono">GM[1]</span> is Go, <span className="font-mono">GM[2]</span> Othello,{" "}
      <span className="font-mono">GM[4]</span> Gomoku and Renju, <span className="font-mono">GM[11]</span> Hex.
      Most of the families on this site had a number in a standard written before the web did. It is worth naming
      because the obvious alternative is not one: PGN is chess and only chess, and a gomoku record has no business
      pretending to be a chess game.
    </>,
    <>
      SGF does not write a point the way the board does, and it is better to be plain about that than to imply a
      compatibility that does not exist. An SGF point is two lowercase letters, column then row, counted from the
      top-left corner, with no letter skipped — so our <span className="font-mono">H8</span> is{" "}
      <span className="font-mono">hh</span>, and our <span className="font-mono">A1</span>, at the bottom-left, is{" "}
      <span className="font-mono">ao</span>. One scheme is for reading and the other for storing, and the table
      below is the whole of the difference between them.
    </>,
    <>
      What the site keeps today is the record itself rather than a file: every finished game is filed, a single
      game can be copied out of its replay as text, and the whole record can be taken away as a plain listing.
      There is no <span className="font-mono">.sgf</span> export yet. It would be a small piece of work and it
      would let a game played here be opened in any go program in the world, which is a good enough reason to do
      it — but it is a separate question from explaining the notation, and this section is the explanation.
    </>,
  ],
  figures: { 0: CENTRE, 3: COORDINATES },
};
