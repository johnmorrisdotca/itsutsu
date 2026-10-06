import { gameArtPath } from "@/lib/gomoku/artwork";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import type { RulesPage } from "@/lib/learn/rulesPage";

import { HOUSEKI_SPECS, campaignsOf, levelsOf } from "./houseki.constants";
import { housekiCopy } from "./housekiCopy";
import { CAMPAIGN_KEYS } from "./housekiKeys";
import type { HousekiKind } from "./houseki.types";

/** The campaigns a game has, said in a line: "Classic, Shizen and Arashi", or "Classic" alone. */
function campaignWords(kind: HousekiKind, say: Speaker): string {
  return say.list(campaignsOf(kind).map((campaign) => say.say(CAMPAIGN_KEYS[campaign])));
}

/**
 * A Houseki game's rules page, in the game template: Objective, Board, How to
 * play, House rules. The same `RulesPage` shape every game builds, so the one
 * rules page draws it. The facts come from the game's copy and spec, never from a
 * second description that could drift: the levels are counted from the spec, and
 * a test holds the spec to the package.
 */
export function housekiRulesPage(kind: HousekiKind, say: Speaker = speaker(DEFAULT_LOCALE)): RulesPage {
  const copy = housekiCopy(kind, say.locale);
  const spec = HOUSEKI_SPECS[kind];
  return {
    variant: kind,
    title: copy.label,
    kanji: copy.kanji,
    tagline: copy.tagline,
    origin: copy.origin,
    alsoKnownAs: [],
    from: null,
    wikipedia: null,
    object: [copy.tagline, copy.rules[0]!],
    board: [copy.board, say.say("houseki.rules.levels", { levels: say.number(levelsOf(kind)), campaigns: campaignWords(kind, say), lessons: say.number(spec.lessons) })],
    play: copy.rules.slice(1),
    house: [
      say.say("houseki.house.alone"),
      say.say("houseki.house.sameForAll"),
      say.say(spec.daily ? "houseki.house.daily" : "houseki.house.noDaily"),
      say.say(spec.motion === "falling" ? "houseki.house.modes" : "houseki.house.turns"),
      say.say("houseki.house.points"),
      say.say("houseki.house.kept"),
    ],
    image: gameArtPath(kind),
  };
}

