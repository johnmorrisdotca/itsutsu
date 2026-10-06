import { Fragment } from "react";

import type { Speaker } from "@/lib/i18n/i18n";
import { familyBlurb } from "@/lib/gomoku/familyCopy";
import { FamilyMark } from "@/components/games/FamilyMark";
import { FigureTable as Table } from "@/components/about/FigureTable";
import { GAME_FAMILIES, familyPagePath } from "@/lib/gomoku/families";
import { familyCountWords } from "@/lib/gomoku/familyWords";
import { RULE_VARIANT_LIST, VARIANT_SPECS, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { isSettingKind } from "@/lib/catalogue/gameSettings";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import { puzzleCopy, puzzleName } from "@/lib/puzzles/puzzleCopy";

/** The puzzles as the catalogue lists them: a Gomoji's languages and word lists are settings of the one Gomoji, not puzzles of their own. */
const LISTED_PUZZLES = PUZZLE_KIND_LIST.filter((kind) => !isSettingKind(kind));
import { isPuzzleKind } from "@/lib/catalogue/gameKeys";
import Link from "@/components/ui/Link";

import { Game, rich, richCount } from "./about.links";
import type { AboutSection } from "./about.constants";
import { ABOUT_CHAPTERS } from "./about.chapters";

/**
 * WHAT IS ACTUALLY HERE, COUNTED RATHER THAN CLAIMED.
 *
 * Every figure on this page comes out of the same constants the catalogue is
 * drawn from, and not one of them is typed into the prose. The reason is the
 * sentence that stood in the sites table until today, which put the size of
 * this site at about thirty-five. It was right when it was written and it had
 * been ten short for months. A count in prose is a fact with no way of
 * noticing that it has stopped being one, and this is the page somebody reads
 * to decide whether the site is worth an account.
 *
 * `about.coverage.test.ts` holds the rule for the whole page.
 */

/** Games whose rules came from a game published elsewhere; the rest are this site's own. */
const OURS = RULE_VARIANT_LIST.filter((variant) => RULE_VARIANT_DISPLAY[variant].inspiredBy === undefined);

/** Every board every game is offered on, added up: the number of different games you can actually set up. */
const SET_UPS = RULE_VARIANT_LIST.reduce((total, variant) => total + boardSizesFor(variant).length, 0);

/** Games with a board of their own to choose from, rather than one fixed board. */
const CHOICE_OF_BOARD = RULE_VARIANT_LIST.filter((variant) => boardSizesFor(variant).length > 1).length;

/** The families of puzzles for one: Numbers, Logic puzzles and Other, read from the catalogue. */
const PUZZLE_FAMILIES = GAME_FAMILIES.filter((family) => family.games.length > 0 && family.games.every(isPuzzleKind));

/** How many of the games are decided by something other than a line of stones. */
const NOT_A_LINE = RULE_VARIANT_LIST.filter((variant) => {
  const spec = VARIANT_SPECS[variant];
  return spec.flips || spec.camps || spec.connects || spec.checkers || spec.go || spec.chineseCheckers;
}).length;

const families = (say: Speaker) => (
  <Table
    head={[say.say("about.catalogue.headFamily"), say.say("about.catalogue.headGames"), say.say("about.catalogue.headDecides")]}
    rows={GAME_FAMILIES.map((family) => [
      <span key={family.key} className="flex items-center gap-2">
        <FamilyMark family={family.title} size="small" />
        <Link href={familyPagePath(family)} className="underline decoration-rule underline-offset-2">
          {say.pairName(family.title, family.kanji).text}
        </Link>
        {say.pairsWithKanji ? <span className="font-mincho text-xs opacity-70">{family.kanji}</span> : null}
      </span>,
      familyCountWords(family, say),
      <span key={`${family.key}-blurb`} className="text-muted">
        {familyBlurb(family, say.locale)}
      </span>,
    ])}
    caption={say.say("about.catalogue.families", { families: String(GAME_FAMILIES.length) })}
  />
);

/** The sizes a puzzle is offered at: "5×5 up to 9×9", or "4×4, 6×6, 8×8". */
function puzzleSizes(say: Speaker, sizes: readonly number[]): string {
  return sizes.length > 3
    ? say.say("about.catalogue.sizesRange", { from: String(sizes[0]!), to: String(sizes.at(-1)!) })
    : say.list(sizes.map((side) => `${side}×${side}`));
}

export const catalogueSection = (say: Speaker): AboutSection => ({
  id: "catalogue",
  title: say.say("about.catalogue.title"),
  chapter: ABOUT_CHAPTERS.games,
  kanji: "目録",
  paragraphs: [
    rich(say, "about.catalogue.a", { games: RULE_VARIANT_LIST.length, families: GAME_FAMILIES.length, setups: SET_UPS, choice: CHOICE_OF_BOARD }),
    rich(say, "about.catalogue.b", { notLine: NOT_A_LINE }),
    rich(say, "about.catalogue.c", { games: RULE_VARIANT_LIST.length, ours: OURS.length, others: RULE_VARIANT_LIST.length - OURS.length }),
    richCount(
      say,
      "about.catalogue.d",
      LISTED_PUZZLES.length,
      { groups: PUZZLE_FAMILIES.length, families: say.list(PUZZLE_FAMILIES.map((family) => say.pairName(family.title, family.kanji).text)) },
      {
        puzzles: say.listPieces(
          LISTED_PUZZLES.map((kind) => (
            <span key={kind}>
              {rich(say, "about.catalogue.puzzle", { inspired: puzzleCopy(kind, say.locale).inspiredBy ?? "", sizes: puzzleSizes(say, PUZZLE_SPECS[kind].sizes) }, {
                game: <Game variant={kind}>{puzzleName(kind, say.locale)}</Game>,
              })}
            </span>
          )),
        ).map((piece, at) => <Fragment key={at}>{piece}</Fragment>),
      },
    ),
    rich(say, "about.catalogue.e"),
  ],
  figures: { 0: families(say) },
});
