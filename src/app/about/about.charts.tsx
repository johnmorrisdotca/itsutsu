import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { BarChart } from "@/components/about/BarChart";
import type { BarRow, FigureTone } from "@/components/about/about.types";
import { RULE_VARIANT_LIST, VARIANT_SPECS, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { COUNTRY_NAMES, flagFor, originFor, type CountryCode } from "@/lib/learn/origins";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { rich } from "./about.links";

/**
 * THE CATALOGUE IN CHARTS, every bar counted from the catalogue as the page is
 * drawn — the same rule `about.games.tsx` keeps for its prose, and for the same
 * reason: a chart of last month's catalogue is a wrong chart that looks right.
 *
 * The charts name no game. A bar of games is a count, and the games behind it
 * are one click away on /games; naming them here would be a second catalogue
 * to keep in step with the first.
 */

/** How a game is decided, in the words a player would use. The order is the order the bars are drawn in. */
const DECIDERS = [
  { key: "line", label: "about.charts.deciderLine", tone: "ink", note: "about.charts.deciderLineNote" },
  { key: "capture", label: "about.charts.deciderCapture", tone: "shu", note: "about.charts.deciderCaptureNote" },
  { key: "avoid", label: "about.charts.deciderAvoid", tone: "ochre", note: "about.charts.deciderAvoidNote" },
  { key: "flip", label: "about.charts.deciderFlip", tone: "moss", note: "about.charts.deciderFlipNote" },
  { key: "jump", label: "about.charts.deciderJump", tone: "shu", note: "about.charts.deciderJumpNote" },
  { key: "race", label: "about.charts.deciderRace", tone: "ochre", note: "about.charts.deciderRaceNote" },
  { key: "connect", label: "about.charts.deciderConnect", tone: "moss", note: "about.charts.deciderConnectNote" },
  { key: "territory", label: "about.charts.deciderTerritory", tone: "ink", note: "about.charts.deciderTerritoryNote" },
] as const satisfies readonly { key: string; label: PhraseKey; tone: FigureTone; note: PhraseKey }[];

type Decider = (typeof DECIDERS)[number]["key"];

/** Which of the deciders above a game's spec says it is. Read from the spec's flags, never from its name. */
function deciderOf(variant: RuleVariant): Decider {
  const spec = VARIANT_SPECS[variant];
  if (spec.go) return "territory";
  if (spec.connects) return "connect";
  if (spec.camps || spec.chineseCheckers) return "race";
  if (spec.checkers) return "jump";
  if (spec.flips) return "flip";
  if (spec.misere || spec.loseLength !== null) return "avoid";
  if (spec.captures) return "capture";
  return "line";
}

const howWon = (say: Speaker): BarRow[] =>
  DECIDERS.map((decider) => ({
    label: say.say(decider.label),
    value: RULE_VARIANT_LIST.filter((variant) => deciderOf(variant) === decider.key).length,
    note: say.say(decider.note),
    tone: decider.tone,
  }));

/** "the United States" leads a sentence well and a row badly. */
const capital = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

const COUNTRIES = [...new Set(RULE_VARIANT_LIST.map((variant) => RULE_VARIANT_DISPLAY[variant].country))]
  .filter((code): code is CountryCode => code !== undefined)
  .map((code) => ({ code, value: RULE_VARIANT_LIST.filter((variant) => RULE_VARIANT_DISPLAY[variant].country === code).length }))
  .sort((a, b) => b.value - a.value || COUNTRY_NAMES[a.code].localeCompare(COUNTRY_NAMES[b.code]));

const NO_COUNTRY = RULE_VARIANT_LIST.filter((variant) => RULE_VARIANT_DISPLAY[variant].country === undefined).length;

const whereFrom = (say: Speaker): BarRow[] => [
  ...COUNTRIES.map(({ code, value }) => ({
    label: (
      <>
        <span aria-hidden>{flagFor(code)}</span> {capital(originFor(code, say.locale)?.country ?? code)}
      </>
    ),
    value,
    tone: code === "JP" ? ("shu" as const) : ("moss" as const),
  })),
  { label: say.say("about.charts.noCountry"), value: NO_COUNTRY, note: say.say("about.charts.noCountryNote"), tone: "ochre" },
];

/** Square boards only: a hexagon counts its cells and a star its points, and neither is an N×N. */
const SQUARE = RULE_VARIANT_LIST.filter((variant) => !VARIANT_SPECS[variant].hexagon && !VARIANT_SPECS[variant].chineseCheckers);

const BOARDS: BarRow[] = [...new Set(SQUARE.flatMap((variant) => boardSizesFor(variant)))]
  .sort((a, b) => a - b)
  .map((size) => ({
    label: `${size}×${size}`,
    value: SQUARE.filter((variant) => boardSizesFor(variant).includes(size)).length,
    tone: size === 15 || size === 19 ? ("ink" as const) : ("moss" as const),
  }));

export const chartsSection = (say: Speaker): AboutSection => ({
  id: "charts",
  title: say.say("about.charts.title"),
  chapter: ABOUT_CHAPTERS.games,
  kanji: "図表",
  paragraphs: [rich(say, "about.charts.a"), rich(say, "about.charts.b"), rich(say, "about.charts.c")],
  figures: {
    0: <BarChart rows={howWon(say)} label={say.say("about.charts.wonLabel")} caption={say.say("about.charts.wonCaption", { games: String(RULE_VARIANT_LIST.length) })} />,
    1: <BarChart rows={whereFrom(say)} label={say.say("about.charts.fromLabel")} caption={say.say("about.charts.fromCaption")} />,
    2: <BarChart rows={BOARDS} label={say.say("about.charts.boardsLabel")} caption={say.say("about.charts.boardsCaption")} />,
  },
});
