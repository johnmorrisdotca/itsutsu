import { FigureTable } from "@/components/about/FigureTable";
import { RatingTiers } from "@/components/about/RatingTiers";
import { LAST_TEN_SHARE, XpCurve, thousands } from "@/components/about/XpCurve";
import { XP_EVENT_SPECS } from "@/lib/xp/xp.constants";
import type { XpEventType } from "@/lib/xp/xp.types";
import { XP_LEVELS, xpForLevel } from "@/lib/xp/xpCurve";
import { xpLevelName } from "@/lib/xp/levelNames";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Inside } from "./about.links";

/**
 * THE SECOND LADDER: experience, and how it differs from a rating.
 *
 * Every figure is read from the files that pay it — the prices from
 * `XP_EVENT_SPECS`, the curve from `xpForLevel`, the names from the level
 * list — so a retune of the economy retunes this page with it.
 */

/**
 * A handful of awards a new member meets first, then some that take months.
 *
 * Chosen from those whose blurbs count nothing: several blurbs in the XP table
 * type the number of games or families into their sentence, and this page
 * reads its counts from the catalogue — printing one of those would put a
 * typed count on the one page that refuses them.
 */
const SAMPLES: readonly XpEventType[] = [
  "gameFinished",
  "gameWon",
  "wonVsPerson",
  "longGame",
  "comeback",
  "revengeWin",
  "upsetWin",
  "dayStreak7",
  "dayStreak100",
  "yearHere",
];

const PRICES = (
  <FigureTable
    head={["Award", "XP", "A day at most", "For"]}
    rows={SAMPLES.map((type) => {
      const spec = XP_EVENT_SPECS[type];
      return [
        <span key={type} className="whitespace-nowrap">
          {spec.label} <span className="font-mincho text-xs opacity-70">{spec.kanji}</span>
        </span>,
        spec.points,
        spec.cap ?? "–",
        <span key={`${type}-blurb`} className="text-muted">
          {spec.blurb}
        </span>,
      ];
    })}
    caption={
      <>
        A few of the awards and what they pay, read from the table that pays them. A dash means no daily limit,
        which is right for anything that can only happen once.
      </>
    }
  />
);

export const XP_SECTION: AboutSection = {
  title: "Experience and levels",
  chapter: ABOUT_CHAPTERS.numbers,
  kanji: "経験値",
  paragraphs: [
    <>
      There are two ladders here, and they measure different things. A <em>rating</em> says how well you play: it
      moves only with rated games, one number per game and one across all of them, and it goes down as readily as
      up. <em>Experience</em> says you turned up and tried things: every finished game pays some, a loss included,
      and it never goes down. Neither can be bought with the other.
    </>,
    <>
      Experience is spent on levels, {XP_LEVELS} of them, and every one has a name taken from the history of games:
      level 1 is {xpLevelName(1)}, level 10 is {xpLevelName(10)}, and the top is {xpLevelName(XP_LEVELS)}, at{" "}
      {thousands(xpForLevel(XP_LEVELS))} XP. The first ten come quickly, so a new member has something to
      hold on to; the climb hardens after ten and again after twenty, and the last ten levels alone cost{" "}
      {Math.round(LAST_TEN_SHARE * 100)}% of the whole ladder. It is meant to be a lifetime’s standing. The
      computer players climb it on the same terms as people, from the games they finish, and are held back only
      from the awards a program cannot earn, like making a buddy or setting a profile.
    </>,
    <>
      The awards are small for turning up and larger for doing something new: a game you have never played, a
      family you have never met, a win over somebody rated well above you. Most have a daily limit, so a hundred
      quick games against the easiest program are worth no more than a handful. Every rung has its own page under{" "}
      <Inside href="/xp">XP</Inside>, with who is standing on it.
    </>,
  ],
  figures: { 0: <RatingTiers />, 1: <XpCurve />, 2: PRICES },
};
