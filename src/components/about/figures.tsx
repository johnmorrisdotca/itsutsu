import { Diagram } from "./Diagram";
import { Timeline } from "./Timeline";

/*
 * The pictures in the story. Positions are given as stones on a small window
 * of the board — the centre nine lines of a renju board, the whole of an
 * Othello board — because the point of each is one shape, not the game.
 */

/** 浦月, the diagonal opening: the strongest start for black, and the reason renju polices the first three moves. */
export const HOGETSU = (
  <Diagram
    rows={9}
    cols={9}
    grid="lines"
    label="Three stones on a diagonal in the centre of a renju board: black, white, black."
    stones={[
      { row: 4, col: 4, colour: "black", label: "1" },
      { row: 3, col: 5, colour: "white", label: "2" },
      { row: 2, col: 6, colour: "black", label: "3" },
    ]}
    caption={
      <>
        <span className="font-mincho">浦月</span> <em>Hogetsu</em>, the diagonal opening. Renju names all twenty-six
        openings after moons and flowers; this one is so strong for black that tournament rules let white swap seats
        after it.
      </>
    }
  />
);

/** A Pente capture: the pair between two black stones comes off. */
export const PENTE_CAPTURE = (
  <Diagram
    rows={7}
    cols={9}
    grid="lines"
    label="A black stone at each end of a pair of white stones; the pair is faded, about to be taken."
    stones={[
      { row: 3, col: 2, colour: "black" },
      { row: 3, col: 3, colour: "white", taken: true },
      { row: 3, col: 4, colour: "white", taken: true },
      { row: 3, col: 5, colour: "black", ring: true },
      { row: 2, col: 4, colour: "black" },
      { row: 4, col: 3, colour: "white" },
      { row: 1, col: 5, colour: "white" },
    ]}
    caption={
      <>
        A capture in Pente. Black’s ringed stone brackets the pair and both white stones leave the board. Five in a
        row still wins — and so does taking five pairs.
      </>
    }
  />
);

/** Othello's fixed start and black's classic first move. */
export const OTHELLO_START = (
  <Diagram
    rows={8}
    cols={8}
    grid="cells"
    label="An Othello board with the four starting discs and black's first disc at f5, turning e5."
    stones={[
      { row: 3, col: 3, colour: "white" },
      { row: 3, col: 4, colour: "black" },
      { row: 4, col: 3, colour: "black" },
      { row: 4, col: 4, colour: "black", label: "↻" },
      { row: 4, col: 5, colour: "black", ring: true, label: "1" },
    ]}
    caption={
      <>
        Othello’s fixed start and black’s first disc, at f5, which turns the white disc beside it. Every move must
        turn at least one disc, and there are only four first moves — all the same by symmetry.
      </>
    }
  />
);

/** When each game in the family was born. */
export const ORIGINS = (
  <Timeline
    from={1875}
    to={2025}
    step={25}
    label="A timeline from 1875 to 2025 marking when reversi, renju, Othello, Connect Four, Pente and Connect6 appeared."
    events={[
      { year: 1883, name: "Reversi", note: "London", lane: 1 },
      { year: 1899, name: "Renju named", note: "Tokyo", lane: -1 },
      { year: 1973, name: "Othello", note: "Japan", lane: 2 },
      { year: 1974, name: "Connect Four", note: "USA", lane: -1 },
      { year: 1977, name: "Pente", note: "Oklahoma", lane: 1 },
      { year: 2003, name: "Connect6", note: "Taiwan", lane: -1 },
    ]}
    caption={
      <>
        When the newer games in the family were born. Gomoku itself is off the left edge by nine centuries, and
        tic-tac-toe by twenty.
      </>
    }
  />
);

/** The solved games, and who wins them. */
export const SOLVED = (
  <Timeline
    from={1985}
    to={2025}
    step={10}
    verdicts
    label="A timeline from 1985 to 2025 marking when Connect Four, gomoku, 6×6 Othello, renju and 8×8 Othello were solved, and who wins each with perfect play."
    events={[
      { year: 1988, name: "Connect Four", note: "Allis; Allen", lane: 1, verdict: "first" },
      { year: 1993, name: "Gomoku 15×15", note: "Allis", lane: 2, verdict: "first" },
      { year: 1993, name: "Othello 6×6", note: "Feinstein", lane: -1, verdict: "second" },
      { year: 2001, name: "Renju", note: "Wágner & Virág", lane: 1, verdict: "first" },
      { year: 2023, name: "Othello 8×8", note: "Takizawa", lane: 1, verdict: "draw" },
    ]}
    caption={
      <>
        The games in the family that computers have solved, and who wins with perfect play. Free gomoku and even
        renju are wins for black; the smaller Othello board is a win for the second player, and the real one is a
        draw. Pente and Connect6 are still open.
      </>
    }
  />
);
