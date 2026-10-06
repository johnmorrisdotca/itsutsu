import { GradeLadderGraph } from "@/components/about/GradeLadderGraph";
import { MeasuredGrades } from "@/components/about/MeasuredGrades";
import { FigureTable as Table } from "@/components/about/FigureTable";
import type { Speaker } from "@/lib/i18n/i18n";
import { botProfile } from "@/lib/gomoku/botCopy";
import { BOT_PROFILES, BOT_TIER_LIST, SEARCH } from "@/lib/gomoku/opponent.constants";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";

import { rich } from "./about.links";
import type { AboutSection } from "./about.constants";
import { ABOUT_CHAPTERS } from "./about.chapters";

/**
 * HOW THE COMPUTER PLAYERS ACTUALLY WORK, told the way the rest of this page
 * tells things: what it does, what it cost, and what turned out not to be true.
 *
 * The finding in the last paragraph is the reason the section is worth having.
 * A site with five graded opponents is claiming five different strengths, and
 * two of ours measured as one player. Saying so is a better advertisement for
 * the measuring than any of the numbers above it, and a reader who has beaten
 * 名人 and is wondering whether 国手 is worth the trouble deserves the real
 * answer rather than the one the ladder implies.
 */

const grades = (say: Speaker) => (
  <Table
    /*
     * Read out of the same rows the opponent chooser draws from, so a grade
     * reworded there is reworded here. A second description of a player is a
     * second thing to keep true.
     */
    head={[say.say("about.bots.headGrade"), say.say("about.bots.headStrength"), say.say("about.bots.headDoes")]}
    rows={BOT_TIER_LIST.map((tier) => {
      const profile = botProfile(tier, say.locale);
      return [
        <span key={tier} className="whitespace-nowrap">
          {BOT_PROFILES[tier].name} <span className="font-mincho text-xs opacity-70">{profile.native}</span>
        </span>,
        profile.strength,
        <span key={`${tier}-note`} className="text-muted">
          {profile.blurb}
        </span>,
      ];
    })}
    caption={say.say("about.bots.grades")}
  />
);

export const botsSection = (say: Speaker): AboutSection => ({
  id: "bots",
  title: say.say("about.bots.title"),
  chapter: ABOUT_CHAPTERS.programs,
  kanji: "棋力",
  paragraphs: [
    rich(say, "about.bots.a", { games: RULE_VARIANT_LIST.length }),
    rich(say, "about.bots.b", { millis: SEARCH.millis }),
    rich(say, "about.bots.c", { millis: SEARCH.millis, reading: SEARCH.rootReading }),
    rich(say, "about.bots.d"),
    rich(say, "about.bots.e"),
    rich(say, "about.bots.f"),
  ],
  /*
    The table says how each grade did against the whole field; the graph asks
    the narrower question the section is really about — whether the ORDER is
    real — one bar per step of the ladder, with half drawn as the line it is.
  */
  figures: { 0: grades(say), 4: <MeasuredGrades say={say} />, 5: <GradeLadderGraph say={say} /> },
});
