import { BarChart } from "@/components/about/BarChart";
import type { BarRow, FigureTone } from "@/components/about/about.types";
import { RULE_VARIANT_LIST, VARIANT_SPECS, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { COUNTRY_NAMES, flagFor, type CountryCode } from "@/lib/learn/origins";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Inside } from "./about.links";

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
  { key: "line", label: "Make a line", tone: "ink", note: "five, four or three in a row, including the drops and the twists" },
  { key: "capture", label: "A line, or captures", tone: "shu", note: "bracket a pair and lift it; enough pairs also win" },
  { key: "avoid", label: "Avoid a line", tone: "ochre", note: "the misère games, where the line you make is the one that loses" },
  { key: "flip", label: "Most discs", tone: "moss", note: "bracketed runs turn over; count at the end" },
  { key: "jump", label: "Take every piece", tone: "shu", note: "jump and crown until the other side cannot move" },
  { key: "race", label: "Race home", tone: "ochre", note: "the first to fill the far camp" },
  { key: "connect", label: "Join two sides", tone: "moss", note: "a chain from edge to edge" },
  { key: "territory", label: "Surround ground", tone: "ink", note: "stones plus empty points walled in, with komi for white" },
] as const satisfies readonly { key: string; label: string; tone: FigureTone; note: string }[];

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

const HOW_WON: BarRow[] = DECIDERS.map((decider) => ({
  label: decider.label,
  value: RULE_VARIANT_LIST.filter((variant) => deciderOf(variant) === decider.key).length,
  note: decider.note,
  tone: decider.tone,
}));

/** "the United States" leads a sentence well and a row badly. */
const capital = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

const COUNTRIES = [...new Set(RULE_VARIANT_LIST.map((variant) => RULE_VARIANT_DISPLAY[variant].country))]
  .filter((code): code is CountryCode => code !== undefined)
  .map((code) => ({ code, value: RULE_VARIANT_LIST.filter((variant) => RULE_VARIANT_DISPLAY[variant].country === code).length }))
  .sort((a, b) => b.value - a.value || COUNTRY_NAMES[a.code].localeCompare(COUNTRY_NAMES[b.code]));

const NO_COUNTRY = RULE_VARIANT_LIST.filter((variant) => RULE_VARIANT_DISPLAY[variant].country === undefined).length;

const WHERE_FROM: BarRow[] = [
  ...COUNTRIES.map(({ code, value }) => ({
    label: (
      <>
        <span aria-hidden>{flagFor(code)}</span> {capital(COUNTRY_NAMES[code])}
      </>
    ),
    value,
    tone: code === "JP" ? ("shu" as const) : ("moss" as const),
  })),
  { label: "No one country", value: NO_COUNTRY, note: "our own games, and our variations on other people’s", tone: "ochre" },
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

export const CHARTS_SECTION: AboutSection = {
  title: "The catalogue in charts",
  chapter: ABOUT_CHAPTERS.games,
  kanji: "図表",
  paragraphs: [
    <>
      The games here look alike on a thumbnail — a grid and two colours of stone — and play nothing alike. The
      quickest way to see the difference is by how a game is won. More are decided by a line than by anything
      else, which is where the site started; the rest are decided by counting, jumping, racing, joining or surrounding.
    </>,
    <>
      They come from all over. Five in a row and its tournament forms were settled in Japan, which is why the
      site’s name is Japanese; the draughts family is a map of its own, one national rule set after another; and
      a good share of the rest belongs to no country at all, because it was made here.
    </>,
    <>
      And they are played on many boards. The 15×15 board is the one five in a row is played on in competition
      and the 19×19 is the full go board; the five-in-a-row games offer
      both, and smaller ones for a quicker game.
      Every board a game offers is on its set-up page, and the whole list is on <Inside href="/games">/games</Inside>.
    </>,
  ],
  figures: {
    0: (
      <BarChart
        rows={HOW_WON}
        label="How the games here are won, by the number of games decided each way."
        caption={<>How the {RULE_VARIANT_LIST.length} games are won, read from each game’s own rules as this page is drawn.</>}
      />
    ),
    1: (
      <BarChart
        rows={WHERE_FROM}
        label="Where the games here come from, by the number of games from each country."
        caption={
          <>
            Where the games come from: the country each game’s rules page names, with Japan marked. A game with no
            country is one of ours, or our variation on somebody else’s.
          </>
        }
      />
    ),
    2: (
      <BarChart
        rows={BOARDS}
        label="How many games offer each square board size."
        caption={
          <>
            How many games can be played on each square board. Hexagonal and star-shaped boards are left out, because
            their sizes count cells and points rather than a side.
          </>
        }
      />
    ),
  },
};
