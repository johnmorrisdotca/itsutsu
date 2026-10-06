import { Diagram } from "@/components/about/Diagram";
import { FigureTable } from "@/components/about/FigureTable";
import type { Speaker } from "@/lib/i18n/i18n";
import { rich } from "./about.links";
import { SGF_POINTS } from "./about.names.constants";
import type { AboutSection } from "./about.constants";
import { ABOUT_CHAPTERS } from "./about.chapters";

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
const centre = (say: Speaker) => (
  <Diagram
    rows={9}
    cols={9}
    grid="lines"
    label={say.say("about.notation.centreLabel")}
    stones={[{ row: 4, col: 4, colour: "black", label: "E5", ring: true }]}
    caption={rich(say, "about.notation.centre")}
  />
);

/** What each of the three points is, in the order of `SGF_POINTS`. */
const WHERE = ["about.notation.centreOf", "about.notation.bottomLeft", "about.notation.topRight"] as const;

/** The two schemes side by side, on a full-size board. */
const coordinates = (say: Speaker) => (
  <FigureTable
    head={[say.say("about.notation.headBoard"), say.say("about.notation.headSgf"), say.say("about.notation.headWhere")]}
    rows={[
      ...SGF_POINTS.map(([board, sgf], at) => [
        <span key="board" className="font-mono">{board}</span>,
        <span key="sgf" className="font-mono">{sgf}</span>,
        say.say(WHERE[at]!),
      ]),
    ]}
    caption={rich(say, "about.notation.table")}
  />
);

export const notationSection = (say: Speaker): AboutSection => ({
  id: "notation",
  title: say.say("about.notation.title"),
  chapter: ABOUT_CHAPTERS.numbers,
  kanji: "棋譜",
  paragraphs: [
    rich(say, "about.notation.a"),
    rich(say, "about.notation.b"),
    rich(say, "about.notation.c"),
    rich(say, "about.notation.d"),
    rich(say, "about.notation.e"),
  ],
  figures: { 0: centre(say), 3: coordinates(say) },
});
