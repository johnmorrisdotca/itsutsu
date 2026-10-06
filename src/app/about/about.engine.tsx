import { Paired } from "@/components/i18n/Paired";
import { FigureTable } from "@/components/about/FigureTable";
import type { Speaker } from "@/lib/i18n/i18n";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Out, rich } from "./about.links";

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
const KANJI = "text-xs font-normal opacity-70";

/** Who asks the engine, and what for. */
const askers = (say: Speaker) => [
  { title: say.say("about.engine.askBoard"), kanji: "盤", body: say.say("about.engine.askBoardBody") },
  { title: say.say("about.engine.askServer"), kanji: "記録係", body: say.say("about.engine.askServerBody") },
  { title: say.say("about.engine.askBots"), kanji: "コンピュータ", body: say.say("about.engine.askBotsBody") },
  { title: say.say("about.engine.askRecord"), kanji: "棋譜", body: say.say("about.engine.askRecordBody") },
];

const oneEngine = (say: Speaker) => (
  <figure className="flex flex-col gap-2" data-testid="about-engine">
    <div
      className="flex flex-col items-stretch gap-2"
      role="img"
      aria-label={say.say("about.engine.label", { count: String(RULE_VARIANT_LIST.length) })}
    >
      <div className={`${BOX} bg-moss-soft`}>
        <span className={HEAD}>
          <Paired en={say.say("about.engine.rowsTitle", { count: String(RULE_VARIANT_LIST.length) })} kanji="規則" kanjiClassName={KANJI} />
        </span>
        {say.say("about.engine.rows")}
      </div>
      <span className="text-center text-muted" aria-hidden>
        ↓
      </span>
      <div className={`${BOX} border-ink`}>
        <span className={HEAD}>
          <Paired en={say.say("about.engine.engineTitle")} kanji="盤面" kanjiClassName={KANJI} />
        </span>
        {say.say("about.engine.engine")}
      </div>
      <span className="text-center text-muted" aria-hidden>
        ↓
      </span>
      <div className="grid gap-2 sm:grid-cols-2">
        {askers(say).map((asker) => (
          <div key={asker.kanji} className={BOX}>
            <span className={HEAD}>
              <Paired en={asker.title} kanji={asker.kanji} kanjiClassName={KANJI} />
            </span>
            {asker.body}
          </div>
        ))}
      </div>
    </div>
    <figcaption className="text-xs leading-relaxed text-muted">{say.say("about.engine.caption")}</figcaption>
  </figure>
);

const stack = (say: Speaker) => (
  <FigureTable
    head={[say.say("about.engine.stackPart"), say.say("about.engine.stackRuns")]}
    rows={[
      [say.say("about.engine.stackPages"), say.say("about.engine.stackPagesBody")],
      [say.say("about.engine.stackRules"), say.say("about.engine.stackRulesBody")],
      [say.say("about.engine.stackGames"), say.say("about.engine.stackGamesBody")],
      [say.say("about.engine.stackBots"), say.say("about.engine.stackBotsBody")],
      [say.say("about.engine.stackFiles"), <Out key="sgf" href="https://www.red-bean.com/sgf/">SGF</Out>],
      [say.say("about.engine.stackTests"), say.say("about.engine.stackTestsBody")],
    ]}
    caption={say.say("about.engine.stackCaption")}
  />
);

export const engineSection = (say: Speaker): AboutSection => ({
  id: "engine",
  title: say.say("about.engine.title"),
  chapter: ABOUT_CHAPTERS.programs,
  kanji: "仕組み",
  paragraphs: [rich(say, "about.engine.a"), rich(say, "about.engine.b")],
  figures: { 0: oneEngine(say), 1: stack(say) },
});
