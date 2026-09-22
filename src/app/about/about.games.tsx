import { FamilyMark } from "@/components/games/FamilyMark";
import { FigureTable as Table } from "@/components/about/FigureTable";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST, VARIANT_SPECS, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { familyPath } from "@/lib/gomoku/slugs";
import Link from "next/link";

import { Game, Inside } from "./about.links";
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

/** How many of the games are decided by something other than a line of stones. */
const NOT_A_LINE = RULE_VARIANT_LIST.filter((variant) => {
  const spec = VARIANT_SPECS[variant];
  return spec.flips || spec.camps || spec.connects || spec.checkers || spec.go || spec.chineseCheckers;
}).length;

const FAMILIES = (
  <Table
    head={["Family", "Games", "What decides it"]}
    rows={GAME_FAMILIES.map((family) => [
      <span key={family.key} className="flex items-center gap-2">
        <FamilyMark family={family.title} size="small" />
        <Link href={familyPath(family.games[0])} className="underline decoration-rule underline-offset-2">
          {family.title}
        </Link>
        <span className="font-mincho text-xs opacity-70">{family.kanji}</span>
      </span>,
      family.games.length,
      <span key={`${family.key}-blurb`} className="text-muted">
        {family.blurb}
      </span>,
    ])}
    caption={
      <>
        The {GAME_FAMILIES.length} families, with the number of games each holds, read from the catalogue itself.
        A family is a way of finding a game rather than a filing cabinet: a game lives in one of them and may be
        shown on another’s shelf where somebody looking there would want to find it.
      </>
    }
  />
);

export const CATALOGUE_SECTION: AboutSection = {
  title: "What is on the board here",
  chapter: ABOUT_CHAPTERS.games,
  kanji: "目録",
  paragraphs: [
    <>
      There are {RULE_VARIANT_LIST.length} games here, in {GAME_FAMILIES.length} families, and those numbers are
      counted from the catalogue every time this page is drawn rather than written down in this sentence — a page
      that tells you how big a site is should not be able to be wrong about it. A game means a rule set with a page
      of its own: its rules, its record, its standings and a board. Counting the boards each is played on, there
      are {SET_UPS} different games you can sit down to, and {CHOICE_OF_BOARD} of them let you choose how big the
      board is before you start.
    </>,
    <>
      Most of them descend from <Game variant="freestyle">five in a row</Game>, which is what the site is named
      for, and {NOT_A_LINE} of them are decided by something else entirely: discs that turn over, pieces that are
      jumped off the board, a race from one corner to the other, a chain joining two sides, territory surrounded
      and counted. That was not the plan at the start. It happened because the two households this site is a
      tribute to did not play one game either — the evening moved from Othello to Pente to something nobody could
      remember the name of, and a site that only did lines would have been a smaller room than the one it is
      remembering.
    </>,
    <>
      {OURS.length} of the {RULE_VARIANT_LIST.length} are ours: rule sets that exist here and, as far as we know,
      nowhere else — the drop game played on a board whose edges join, the one where a full bottom row disappears,
      the five-in-a-row played with dominoes out of a shared queue, the board that turns a quarter of itself after
      every stone. The other {RULE_VARIANT_LIST.length - OURS.length} are our version of a game somebody else
      published, and each of those says so on its own rules page, with the name it is properly called and who
      made it. Borrowing a game and not saying whose it is would be the one thing a site built out of other
      people’s evenings has no excuse for.
    </>,
    <>
      The whole catalogue is <Inside href="/games">here</Inside>, and it is open to read without an account —
      the rules of every one of them, whether or not you ever play a move.
    </>,
  ],
  figures: { 0: FAMILIES },
};
