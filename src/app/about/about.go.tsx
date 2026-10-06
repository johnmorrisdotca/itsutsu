import { Diagram } from "@/components/about/Diagram";
import { FigureTable } from "@/components/about/FigureTable";
import type { Speaker } from "@/lib/i18n/i18n";
import { KOMI } from "@/lib/gomoku/rules/go";
import { Game, rich } from "./about.links";
import type { AboutSection } from "./about.constants";
import { ABOUT_CHAPTERS } from "./about.chapters";

/**
 * Go, the board underneath everything here — and, since it was added to the
 * catalogue, one of the games on it.
 *
 * The board is a go board, the stones are go stones, the display face is the
 * one a go book sets its diagrams in, and for a long time the page never said
 * what go is. This section says it. It was written while go could not be
 * played here and said so; it now says where to play it instead, because a
 * page that tells a reader a game is missing when it is one click away is the
 * dead end this site's rules exist to prevent.
 */

/** A white stone with its last liberty filled: four black stones around it, and it comes off. */
const capture = (say: Speaker) => (
  <Diagram
    rows={7}
    cols={7}
    grid="lines"
    label={say.say("about.go.captureLabel")}
    stones={[
      { row: 3, col: 3, colour: "white", taken: true },
      { row: 2, col: 3, colour: "black" },
      { row: 4, col: 3, colour: "black" },
      { row: 3, col: 2, colour: "black" },
      { row: 3, col: 4, colour: "black", ring: true },
    ]}
    caption={rich(say, "about.go.capture")}
  />
);

/** A black group with two separate eyes: white can never fill both, so it cannot be taken. */
const twoEyes = (say: Speaker) => (
  <Diagram
    rows={7}
    cols={7}
    grid="lines"
    label={say.say("about.go.eyesLabel")}
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
    caption={say.say("about.go.eyes")}
  />
);

/** How big the game is, next to the games this site does play. */
const sizes = (say: Speaker) => (
  <FigureTable
    head={[say.say("about.go.sizeGame"), say.say("about.go.sizeBoard"), say.say("about.go.sizePositions")]}
    rows={[
      [<Game key="t" variant="tictactoe">{say.say("about.go.sizeTicTacToe")}</Game>, "3×3", "5,478"],
      [<Game key="c" variant="dropFour">{say.say("about.go.sizeConnectFour")}</Game>, "7×6", "4,531,985,219,092"],
      [say.say("about.go.sizeChess"), "8×8", say.say("about.go.sizeChessCount")],
      [<Game key="f" variant="freestyle">{say.say("about.go.sizeGomoku")}</Game>, "15×15", say.say("about.go.sizeGomokuCount")],
      [<Game key="g" variant="go">{say.say("about.go.sizeGo")}</Game>, "19×19", "2.08 × 10¹⁷⁰"],
    ]}
    caption={say.say("about.go.sizes")}
  />
);

export const goSection = (say: Speaker): AboutSection => ({
  id: "go",
  title: say.say("about.go.title"),
  chapter: ABOUT_CHAPTERS.japan,
  kanji: "囲碁",
  paragraphs: [rich(say, "about.go.a"), rich(say, "about.go.b", { komi: KOMI })],
  // Two paragraphs, so only two slots: the diagrams share the first, the numbers sit under the second.
  figures: {
    0: (
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-4">
        {capture(say)}
        {twoEyes(say)}
      </div>
    ),
    1: sizes(say),
  },
});
