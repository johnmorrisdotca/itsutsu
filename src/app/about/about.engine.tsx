import { FigureTable } from "@/components/about/FigureTable";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Inside, Out } from "./about.links";

/**
 * FOR THE READERS WHO WANT TO KNOW HOW IT IS BUILT.
 *
 * One picture of the shape — a row per game, one engine, four places that ask
 * it — and one table of what it stands on. It is the view from outside, for a
 * curious player; the working detail for somebody changing the code is in the
 * repository's own README and AGENTS.md, and this does not try to be a second
 * copy of either.
 */

const BOX = "flex flex-col gap-1 rounded-lg border border-rule bg-ivory p-3 text-xs leading-relaxed text-ink-soft";
const HEAD = "text-sm font-semibold text-ink";

/** Who asks the engine, and what for. */
const ASKERS = [
  { title: "The board", kanji: "盤", body: "Which points are legal, what is threatened, and a hint when you ask for one." },
  { title: "The server", kanji: "記録係", body: "Plays each move again before keeping it, so a game cannot be won by a move the rules refuse." },
  { title: "The bots", kanji: "棋士", body: "Search the moves the rules allow, in a worker thread in your own browser." },
  { title: "The record", kanji: "棋譜", body: "Replays a game from its first move to draw any position, and writes SGF where a game has a number in it." },
];

const ONE_ENGINE = (
  <figure className="flex flex-col gap-2" data-testid="about-engine">
    <div
      className="flex flex-col items-stretch gap-2"
      role="img"
      aria-label={`${RULE_VARIANT_LIST.length} rows of rules feed one engine, which the board, the server, the bots and the record all ask.`}
    >
      <div className={`${BOX} bg-moss-soft`}>
        <span className={HEAD}>
          {RULE_VARIANT_LIST.length} rows of rules <span className="font-mincho text-xs font-normal opacity-70">規則</span>
        </span>
        One row per game: the boards it is played on, what wins and what loses, whether stones are captured,
        turned, jumped or never move.
      </div>
      <span className="text-center text-muted" aria-hidden>
        ↓
      </span>
      <div className={`${BOX} border-ink`}>
        <span className={HEAD}>
          One engine <span className="font-mincho text-xs font-normal opacity-70">盤面</span>
        </span>
        Pure functions: a position and a move go in, a new position comes out, and nothing else is touched. It never
        asks which game it is playing; it asks the row.
      </div>
      <span className="text-center text-muted" aria-hidden>
        ↓
      </span>
      <div className="grid gap-2 sm:grid-cols-2">
        {ASKERS.map((asker) => (
          <div key={asker.title} className={BOX}>
            <span className={HEAD}>
              {asker.title} <span className="font-mincho text-xs font-normal opacity-70">{asker.kanji}</span>
            </span>
            {asker.body}
          </div>
        ))}
      </div>
    </div>
    <figcaption className="text-xs leading-relaxed text-muted">
      How the site is put together. Adding a game is adding a row; everything below it already knows what to do.
    </figcaption>
  </figure>
);

const STACK = (
  <FigureTable
    head={["Part", "What it runs on"]}
    rows={[
      ["Pages", "Next.js 16 and React 19, written in TypeScript, drawn on the server where they can be"],
      ["Rules", "one pure engine with a module per rule, each tested beside its source"],
      ["Games and players", "Postgres, through Prisma"],
      ["Bots", "a Web Worker in the reader’s browser, never the server"],
      ["Game files", <Out key="sgf" href="https://www.red-bean.com/sgf/">SGF</Out>],
      ["Tests", "Vitest for the rules and pages, Playwright for a browser playing every game"],
    ]}
    caption={
      <>
        What the site stands on. Every game is also played automatically, start to finish, by a simulator that
        checks the rules against a second copy written out by hand.
      </>
    }
  />
);

export const ENGINE_SECTION: AboutSection = {
  title: "One engine, every game",
  chapter: ABOUT_CHAPTERS.programs,
  kanji: "仕組み",
  paragraphs: [
    <>
      For the readers who want to know how it is built: every game here is a row in one table, and one engine plays
      all of them. The engine does not know the names of games. It knows what a row says — how big the board is,
      how many in a line wins, whether a bracketed run turns over or comes off — and it answers the same few
      questions for every game: may this move be played, and what does the board look like after it.
    </>,
    <>
      Four parts of the site ask it those questions, and none of them has rules of its own. That is why a new game
      arrives with its board, its computer opponents, its record and its replay on the day its row does, and why a
      rule fixed once is fixed everywhere. The <Inside href="/releases">release notes</Inside> list every change, in
      the order they shipped.
    </>,
  ],
  figures: { 0: ONE_ENGINE, 1: STACK },
};
