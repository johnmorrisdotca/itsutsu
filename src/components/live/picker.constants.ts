import { OPENING_RULES, STONES } from "@/lib/gomoku/gomoku.constants";
import type { OpeningRule, Stone } from "@/lib/gomoku/gomoku.types";
import { LONG_PRO_EXCLUSION, PRO_EXCLUSION } from "@/lib/gomoku/rules/opening";

import type { GroupWords, OpponentGroupKind, RatedTile, SeatMarkKind } from "./picker.types";

/**
 * The look of the pickers on the set-up screen.
 *
 * John, looking at /games/new: "however UGLY dropdown… we should show all the
 * families of board images with text… for the board sizes, make it more
 * visual! Big blocks lined up with the numbers."
 *
 * Both pickers are the same mechanism — a hidden radio inside a label that is
 * itself the target — so the classes that say "this is a thing you pick" and
 * "this is the one picked" live here once rather than twice. Two vocabularies
 * for one idea would be worse than either alone.
 *
 * THE RADIO IS REAL AND IS INSIDE THE LABEL. `sr-only` rather than
 * `display: none`, so it is still focusable, still announced, still arrow-key
 * navigable within its group, and still a value the form holds. Everything
 * below is `has-[…]` on the label, which reads the input's own state rather
 * than a copy of it kept in JavaScript — the checked look cannot come apart
 * from what is checked.
 *
 * CHOSEN IS NEVER COLOUR ALONE. A chosen card takes the ink border, an inset
 * second stroke and a filled check mark (PickMark). Any one of those alone
 * would fail somebody; the ring on focus is a fourth thing again, so "where I
 * am" and "what I picked" never have to be told apart by hue.
 *
 * Nothing here says anything about reduced motion: globals.css already zeroes
 * every transition on the site under `prefers-reduced-motion: reduce`, which
 * is the same reason CardArrow does not mention it either.
 */

/** Shared by every card and block: the frame, the pointer, the focus ring. */
const PICK_BASE =
  /*
   * THE CURSOR IS NOT HERE, and that is the same lesson PickMark's size
   * carries. `cursor-pointer` lived in this string, and a board block with
   * one option tried to override it with `cursor-default` — two cursor
   * utilities of equal weight on one element, decided by whichever Tailwind
   * happened to emit last. It emitted pointer, so a board nobody can change
   * went on inviting the press. Every caller says its own cursor.
   */
  "relative flex items-center rounded-xl border bg-ivory/70 text-left transition-colors" +
  " has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-moss" +
  " has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50";

/** Untouched, and firming up under a pointer the way a card on /games does. */
const PICK_RESTING = "border-rule hover:border-rule-strong";

/** The one that is picked: ink border, a second stroke inside it, a tinted ground. */
const PICK_CHOSEN =
  "has-[:checked]:border-ink has-[:checked]:bg-moss-soft" +
  " has-[:checked]:shadow-[inset_0_0_0_1px_var(--ink)]";

/** A game in the open family, or a board a game is played on. */
export const PICK_CARD = `${PICK_BASE} ${PICK_RESTING} ${PICK_CHOSEN}`;

/**
 * One family in the row above the games.
 *
 * A button rather than a radio, because the family is NOT a value this form
 * holds — the game is. A control that showed itself checked while changing
 * nothing a game is played under would be claiming to be an answer to a
 * question nobody asked.
 *
 * `min-h-12` is 48px, comfortably past the 44px minimum rather than at it:
 * this screen is used on an iPad, and "the buttons are too small" is a
 * complaint John has made about two other screens.
 *
 * A TILE, THE MARK ABOVE THE NAME. It was a chip — a 20px mark beside the
 * name — and then a `w-24` tile holding the 56px family icon over a name that
 * could take two lines. John, 2026-09-15, pointed at "Pieces and twists"
 * wrapping under its mark and asked for one regular picture size on this page,
 * the board tile's, and a label under an icon that is one language on one line.
 * So the mark is the regular size and the tile is `w-28`: wide enough for the
 * longest family name on one line at this text size. Every tile is still the
 * same width, so the row stays the same number of tiles whatever the names
 * say, and a finger's target grows rather than shrinks.
 */
export const PICK_CHIP =
  "flex w-28 min-h-12 flex-col items-center justify-start gap-1 rounded-lg border px-1 py-1.5 text-center text-xs leading-tight transition-colors" +
  " outline-none focus-visible:ring-2 focus-visible:ring-moss" +
  " disabled:cursor-not-allowed disabled:opacity-50";

export const PICK_CHIP_OPEN = "border-ink bg-ink text-paper";

export const PICK_CHIP_SHUT =
  "border-rule bg-ivory/70 text-ink-soft hover:border-rule-strong hover:text-ink";

/**
 * The games of the open family, as tall as the family.
 *
 * ROWS SIZED TO WHAT IS IN THEM, and this reverses a decision on purpose. The
 * template used to declare the rows of the largest family — eight games, so 1×8
 * on a phone, 2×4, 3×3, 4×2 on a desk — so the Start button would not walk up
 * and down under the reader's hand as families were browsed. Rows declared in a
 * template are drawn whether or not anything sits in them, and that is exactly
 * what John's screenshot of Checkers showed: one game card, then a band of empty
 * rows before the line saying what the game is — seven empty rows on a phone,
 * which reads as a page that failed to draw rather than as room kept.
 *
 * A family click already redraws everything under it (the boards, the openings,
 * the programs offered), so the rows below were never still; and a band of
 * nothing is a worse thing to be shown than a page that grows to fit its
 * answer. Each row is still exactly one card tall.
 *
 * ONE COLUMN ON A PHONE, which is what /games already does with its game
 * cards — two columns here was the odd one out. Measured: at 390px, two
 * columns leave 70px beside the board for the name, which cut seven of the
 * thirty-nine to about nine characters — "Tournament Gomo…", "Chinese
 * Checker…". A phone is the screen where reading is hardest and it is the
 * one place a clipped name is least affordable.
 *
 * TWO COLUMNS UNTIL A LAPTOP, THREE FROM THERE, AND NEVER FOUR — measured with
 * the regular 70px board beside each name. Three columns on an iPad in
 * portrait left 102px for a name and cut seven of them; four at a desk left 127
 * and cut "International Draughts". A clipped name is what this control was
 * rebuilt to stop, so the columns give way before a name does.
 *
 * THE ROW HEIGHT IS THE PICTURE'S. 5rem is the regular 70px board plus the
 * card's own padding and border and nothing else, so every pixel of this
 * control's height is a picture of a board. It was 3rem around a 40px board
 * until John asked for one picture size on this page. The first draft carried a
 * line of what-it-is under each name and was half again as tall; what that
 * bought was a tagline nobody was reading for a game they had not chosen, and
 * what it cost was the Start button, which went off the bottom of an iPad.
 *
 * THE NAME IS ONE LANGUAGE ON ONE LINE. The kanji used to follow the name and
 * take the squeeze — "Tournament Gomoku 競技…" — and a label beside a picture is
 * now the reader's own half of the pair (`OneName`), as it is under one. Where a
 * column is still too narrow for a name, it truncates from the end and its
 * title carries it whole. A picture with an unreadable name beside it is not
 * "board images with text", which was the complaint being answered here.
 */
export const PICK_GRID = "grid grid-cols-1 auto-rows-[5rem] gap-2 sm:grid-cols-2 lg:grid-cols-3";

/**
 * The boards a game is played on, side by side rather than stacked.
 *
 * A GRID OF EQUAL COLUMNS, not a wrapping flex row. With every block the big
 * number, four blocks do not fit across a 400px phone. A flex row wrapped them
 * three and one, and `flex-1` stretched the one left over across the whole
 * panel — the banner a lone board is kept from becoming. `auto-fit` over a
 * 6rem minimum shares a wide row evenly, as `flex-1` did, and on a narrow one
 * puts the fourth block in a column exactly as wide as the three above it.
 */
export const PICK_BLOCKS = "grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2";

/**
 * A setting stated rather than offered — the one opening a game has, or a
 * rating the game could never move. The card's frame without anything that
 * says "press me": no pointer, no hover, no check, no ring.
 */
export const PICK_FACT = "relative flex items-center rounded-xl border border-rule bg-ivory/70 text-left";

/**
 * The openings a game offers — two or three — in a row from a tablet up, and
 * stacked on a phone, where a picture, a name and a line of what it means
 * would otherwise be squeezed into a third of 390 pixels.
 */
export const PICK_TILES = "grid grid-cols-1 gap-2 md:grid-cols-3";

/** Rated and Friendly: two answers, side by side once there is room for both lines. */
export const PICK_PAIR = "grid grid-cols-1 gap-2 sm:grid-cols-2";

/** People and programs: there can be more of them, so the columns are narrower. */
export const PICK_PEOPLE = "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3";

/**
 * The square that holds a tile's picture, when the picture is a glyph. Its side
 * is a picture size, given by the caller through `pictureBox` — never a size
 * class here, or it would be a picture size of its own again.
 */
export const PICK_ICON =
  "inline-flex shrink-0 items-center justify-center rounded-md border border-rule-strong bg-ivory text-ink";

/**
 * How far from tengen each opening's square reaches, in cells — the ENGINE'S
 * numbers, imported rather than written down again, so the picture of Pro
 * cannot draw a different square from the one Pro enforces. An opening with no
 * square has no entry; "no square" is an absence, not a zero, since a reach of
 * zero would be a real square of one point.
 */
export const OPENING_ZONE_REACH: Partial<Record<OpeningRule, number>> = {
  [OPENING_RULES.pro]: PRO_EXCLUSION,
  [OPENING_RULES.longPro]: LONG_PRO_EXCLUSION,
};

/** The square an opening sends black's second stone out of. Dashed, and never colour alone. */
export const OPENING_ZONE_CLASS = "absolute border border-dashed border-shu bg-shu-soft/60";

export const MARK_STONE = "absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full";

export const MARK_STONE_COLOUR: Record<Stone, string> = {
  [STONES.black]: "bg-ink",
  [STONES.white]: "bg-paper ring-1 ring-ink",
};

/**
 * The picture on an opponent's tile, which is a stone: white with an initial
 * for a person, black with its own script for a program, and an empty dashed
 * ring for the seat nobody has taken yet. The side is `SeatMark`'s, one of the
 * picture sizes; the initial is set large enough to read on a regular stone.
 */
const SEAT_MARK =
  "inline-flex shrink-0 items-center justify-center rounded-full text-2xl font-semibold leading-none";

export const SEAT_MARK_LOOK: Record<SeatMarkKind, string> = {
  person: `${SEAT_MARK} border border-ink bg-paper text-ink`,
  computer: `${SEAT_MARK} font-mincho bg-ink text-paper`,
  anyone: `${SEAT_MARK} border-2 border-dashed border-rule-strong`,
};

/**
 * THE MOST TILES ONE RUN OF OPPONENTS SHOWS BEFORE IT FOLDS.
 *
 * A select hid a long list behind one line; tiles do not. On the development
 * database "Here now" was fifty-seven tiles, a wall between the rules and the
 * Start button. Nine is three rows of three on a desk, and the rest are one
 * press away — "Show all N" — rather than gone. The chosen person is never
 * behind that press: see `capTiles`.
 */
export const PEOPLE_CAP = 9;

/** The press that shows the rest of a run, and the one that folds it back. */
export const PICK_MORE =
  "inline-flex min-h-11 items-center self-start rounded-lg px-2 text-xs font-semibold text-moss" +
  " underline-offset-2 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-moss";

export const OPPONENT_GROUPS = {
  asked: "asked",
  here: "here",
  known: "known",
  computer: "computer",
} as const satisfies Record<OpponentGroupKind, OpponentGroupKind>;

/**
 * The headings over each run of opponents. The kanji are the ones the select's
 * optgroups carried, kept beside the English the way every heading here is.
 */
export const OPPONENT_GROUP_WORDS: Record<OpponentGroupKind, GroupWords> = {
  [OPPONENT_GROUPS.asked]: { phrase: "setup.askedFor", kanji: "指名" },
  [OPPONENT_GROUPS.here]: { phrase: "setup.hereNow", kanji: "在室" },
  [OPPONENT_GROUPS.known]: { phrase: "setup.playersYouKnow", kanji: "知人" },
  [OPPONENT_GROUPS.computer]: { phrase: "setup.theComputer", kanji: "対コンピュータ" },
};

/** Rated first, as the select had it, because a game counts unless somebody says otherwise. */
export const RATED_TILES: readonly RatedTile[] = [
  { rated: true, word: "rated", phrase: "setup.rated", means: "setup.ratedMeans" },
  { rated: false, word: "friendly", phrase: "setup.friendly", means: "setup.friendlyMeans" },
];

/*
 * THE BOARD'S PICTURE in every board block is the big numbered mark at the
 * regular size, and on the doorstep — the last page before a game — the same
 * mark at the large size, twice it. Both numbers used to live here, 70 and 112,
 * and the 70 is the one John picked for every picture on the site: see
 * `PICTURE_PX` in the games constants, where large is written as twice regular.
 *
 * John, with the Checkers doorstep in front of him: "Checkers page, and all
 * pages like it, should use the Board Icon... since this is the last page
 * before the game... perhaps we use new larger icons?" NO SECOND SET OF ICONS,
 * because there is no set: `BoardSizeMark` draws the lattice from the number
 * and scales the numeral from the picture's side, so larger is one word.
 */

/**
 * The doorstep's pictures in a row, wrapping only if a phone must. Two large
 * pictures and the gap between them are 296px, inside a 400px phone's panel.
 */
export const DOORSTEP_PICTURES = "flex flex-wrap items-start gap-4";

/**
 * One picture and its name, as wide as the wider of the two. The name is one
 * line (`OneName`) and never wraps under the picture; every name the doorstep
 * prints is narrower than a large picture.
 */
export const DOORSTEP_FIGURE = "m-0 flex min-w-0 flex-col items-center gap-1.5";

export const DOORSTEP_FIGURE_NAME = "text-center text-xs leading-snug text-ink-soft";

/** The tile for a computer player drawn at random, under the programs it is drawn from. */
export const RANDOM_COMPUTER_WORDS = {
  name: "A random computer player",
  /** How the line over Continue names it. */
  against: "Against a random computer player",
  /** The mark on its black stone, where a program carries its own script. */
  mark: "?",
  means: "One of the programs above, drawn once, when you press Begin on the next page.",
} as const;
