import { FigureTable } from "@/components/about/FigureTable";
import { RatingTiers } from "@/components/about/RatingTiers";
import { LAST_TEN_SHARE, XpCurve } from "@/components/about/XpCurve";
import { Paired } from "@/components/i18n/Paired";
import type { Speaker } from "@/lib/i18n/i18n";
import { thousands } from "@/lib/ui/thousands";
import { XP_EVENT_SPECS } from "@/lib/xp/xp.constants";
import { xpEventCopy } from "@/lib/xp/xpAwardCopy";
import type { XpEventType } from "@/lib/xp/xp.types";
import { XP_LEVELS, xpForLevel } from "@/lib/xp/xpCurve";
import { xpLevelName } from "@/lib/xp/levelNames";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { rich } from "./about.links";

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

const prices = (say: Speaker) => (
  <FigureTable
    head={[say.say("about.xp.headAward"), say.say("about.xp.headPoints"), say.say("about.xp.headCap"), say.say("about.xp.headFor")]}
    rows={SAMPLES.map((type) => {
      const spec = XP_EVENT_SPECS[type];
      const copy = xpEventCopy(type, say.locale);
      return [
        <span key={type} className="whitespace-nowrap">
          <Paired en={copy.label} kanji={spec.kanji} kanjiClassName="text-xs opacity-70" />
        </span>,
        spec.points,
        spec.cap ?? "–",
        <span key={`${type}-blurb`} className="text-muted">
          {copy.blurb}
        </span>,
      ];
    })}
    caption={say.say("about.xp.prices")}
  />
);

export const xpSection = (say: Speaker): AboutSection => ({
  id: "xp",
  title: say.say("about.xp.title"),
  chapter: ABOUT_CHAPTERS.numbers,
  kanji: "経験値",
  paragraphs: [
    rich(say, "about.xp.a"),
    rich(say, "about.xp.b", {
      levels: XP_LEVELS,
      first: xpLevelName(1, say.locale),
      tenth: xpLevelName(10, say.locale),
      last: xpLevelName(XP_LEVELS, say.locale),
      top: thousands(xpForLevel(XP_LEVELS)),
      share: Math.round(LAST_TEN_SHARE * 100),
    }),
    rich(say, "about.xp.c"),
  ],
  figures: { 0: <RatingTiers say={say} />, 1: <XpCurve say={say} />, 2: prices(say) },
});
