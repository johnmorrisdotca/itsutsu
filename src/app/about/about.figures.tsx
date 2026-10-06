import { Diagram } from "@/components/about/Diagram";
import { Timeline } from "@/components/about/Timeline";
import type { Speaker } from "@/lib/i18n/i18n";

import { rich } from "./about.links";

/*
 * The pictures in the story. Positions are given as stones on a small window
 * of the board — the centre nine lines of a renju board, the whole of an
 * Othello board — because the point of each is one shape, not the game.
 *
 * Their words are phrases (`about.stones.*`, `about.othello.*`), so each picture is built for the reader's language.
 */
export function storyFigures(say: Speaker) {
  return {
    /** 浦月, the diagonal opening: the strongest start for black, and the reason renju polices the first three moves. */
    hogetsu: (
      <Diagram
        rows={9}
        cols={9}
        grid="lines"
        label={say.say("about.stones.hogetsuLabel")}
        stones={[
          { row: 4, col: 4, colour: "black", label: "1" },
          { row: 3, col: 5, colour: "white", label: "2" },
          { row: 2, col: 6, colour: "black", label: "3" },
        ]}
        caption={rich(say, "about.stones.hogetsu")}
      />
    ),

    /** A Pente capture: the pair between two black stones comes off. */
    penteCapture: (
      <Diagram
        rows={7}
        cols={9}
        grid="lines"
        label={say.say("about.stones.captureLabel")}
        stones={[
          { row: 3, col: 2, colour: "black" },
          { row: 3, col: 3, colour: "white", taken: true },
          { row: 3, col: 4, colour: "white", taken: true },
          { row: 3, col: 5, colour: "black", ring: true },
          { row: 2, col: 4, colour: "black" },
          { row: 4, col: 3, colour: "white" },
          { row: 1, col: 5, colour: "white" },
        ]}
        caption={say.say("about.stones.capture")}
      />
    ),

    /** Othello's fixed start and black's classic first move. */
    otheloStart: (
      <Diagram
        rows={8}
        cols={8}
        grid="cells"
        label={say.say("about.othello.startLabel")}
        stones={[
          { row: 3, col: 3, colour: "white" },
          { row: 3, col: 4, colour: "black" },
          { row: 4, col: 3, colour: "black" },
          { row: 4, col: 4, colour: "black", label: "↻" },
          { row: 4, col: 5, colour: "black", ring: true, label: "1" },
        ]}
        caption={say.say("about.othello.startCaption")}
      />
    ),

    /** When each game in the family was born. */
    origins: (
      <Timeline
        say={say}
        from={1875}
        to={2025}
        step={25}
        label={say.say("about.stones.originsLabel")}
        events={[
          { year: 1883, name: say.say("about.stones.evReversi"), note: say.say("about.stones.evReversiNote"), lane: 1 },
          { year: 1899, name: say.say("about.stones.evRenju"), note: say.say("about.stones.evRenjuNote"), lane: -1 },
          { year: 1973, name: say.say("about.stones.evOthello"), note: say.say("about.stones.evOthelloNote"), lane: 2 },
          { year: 1974, name: say.say("about.stones.evConnectFour"), note: say.say("about.stones.evConnectFourNote"), lane: -1 },
          { year: 1977, name: say.say("about.stones.evPente"), note: say.say("about.stones.evPenteNote"), lane: 1 },
          { year: 2003, name: say.say("about.stones.evConnectSix"), note: say.say("about.stones.evConnectSixNote"), lane: -1 },
        ]}
        caption={say.say("about.stones.originsCaption")}
      />
    ),

    /** The solved games, and who wins them. */
    solved: (
      <Timeline
        say={say}
        from={1985}
        to={2025}
        step={10}
        verdicts
        label={say.say("about.othello.solvedLabel")}
        events={[
          { year: 1988, name: say.say("about.stones.evConnectFour"), note: say.say("about.othello.evConnectFourNote"), lane: 1, verdict: "first" },
          { year: 1993, name: say.say("about.othello.evGomoku"), note: say.say("about.othello.evGomokuNote"), lane: 2, verdict: "first" },
          { year: 1993, name: say.say("about.othello.evOthelloSix"), note: say.say("about.othello.evOthelloSixNote"), lane: -1, verdict: "second" },
          { year: 2001, name: say.say("about.othello.evRenju"), note: say.say("about.othello.evRenjuNote"), lane: 1, verdict: "first" },
          { year: 2023, name: say.say("about.othello.evOthelloEight"), note: say.say("about.othello.evOthelloEightNote"), lane: 1, verdict: "draw" },
        ]}
        caption={say.say("about.othello.solvedCaption")}
      />
    ),
  };
}
