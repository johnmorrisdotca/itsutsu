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
 * THE ONE TILE: a family, a game and a board size are all this box.
 *
 * John, 2026-09-24, with the set-up screen jumping as he clicked: "The Board
 * size boxes should all have same height and even same width. Game boxes should
 * also be consistent… redesigned to be as wide as the Family boxes… where we
 * have the icon and the Text below on one line." Three shapes had grown up
 * side by side — a family tile, a wide game card with its name beside the
 * picture, and a size block that stretched to fill whatever row it was in —
 * so the same screen drew three sizes of box, and the height of each row
 * depended on which game was open.
 *
 * So one box, fixed in both directions: the regular 70px picture, and under it
 * a name in a space two lines tall. A name that fits on one line leaves the
 * second empty rather than making its tile shorter, and one that needs two
 * ("International Draughts") takes them without making its tile taller. The
 * height is written once, here, and every grid that reserves a row of tiles
 * reads the same figure (`PICK_TILE_ROWS_*`), so a row and its tile cannot
 * disagree.
 *
 * `TILE_WIDTH` is 6.75rem: eight of them and their gaps are 906px, which is
 * what the panel holds for the games on a 1024px laptop, so a family of eight
 * games is one row from there up. The side padding is 2px because a board size
 * on a 390px phone is a quarter of the panel, 76px, and the picture is 70.
 */
export const PICK_TILE =
  "flex h-[7.25rem] min-w-0 flex-col items-center justify-start gap-1 px-0.5 py-1.5 text-center";

/** The name under a tile's picture: one language, up to two lines, in a space two lines tall whatever it holds. */
export const PICK_TILE_NAME = "line-clamp-2 h-[2lh] w-full text-center text-[0.7rem] leading-tight [overflow-wrap:anywhere]";

/**
 * One family in the row above the games.
 *
 * A button rather than a radio, because the family is NOT a value this form
 * holds — the game is. A control that showed itself checked while changing
 * nothing a game is played under would be claiming to be an answer to a
 * question nobody asked. The tile is `PICK_TILE`, the same box as a game and a
 * board; only the chosen look differs, ink rather than a check, for that reason.
 */
export const PICK_CHIP =
  `${PICK_TILE} rounded-xl border transition-colors` +
  " outline-none focus-visible:ring-2 focus-visible:ring-moss" +
  " disabled:cursor-not-allowed disabled:opacity-50";

export const PICK_CHIP_OPEN = "border-ink bg-ink text-paper";

/**
 * A choice with words and no picture — a puzzle's level, checks, hints — in
 * the families' ink when chosen. A third of the row on a phone, so three fit
 * on one line; 7rem from 640px. Not a tile: there is no picture to hold, and a 116px box round
 * "Easy" would be most of a screen of paper on a phone.
 */
export const PICK_WORD_CHIP =
  "flex min-h-11 w-full flex-col items-center justify-center rounded-xl border px-1 py-1.5 text-center text-xs leading-tight transition-colors sm:w-28" +
  " outline-none focus-visible:ring-2 focus-visible:ring-moss" +
  " disabled:cursor-not-allowed disabled:opacity-50";

/**
 * The first row of the set-up screen: the families, and — through the picker's
 * `underFamilies` — the board and its sizes. A column below a laptop's width,
 * where the families are a wrapping row of tiles over the board; one row from
 * `lg`, families on the left, board in the middle, sizes on the right. See
 * `GamePicker` for why the families are the part that can stand beside it.
 */
export const FAMILY_ROW = "flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-6";

/*
 * SYMMETRY. John, looking at the first version of that row: "Have better
 * symmetry. LHS center and RHS". The families sat against the left edge, the
 * board and its sizes were centred in whatever was left, and the right of the
 * panel was empty. Now the row is three columns, the two outer ones equal: the
 * board in the exact middle of the panel, the families against the left edge,
 * the sizes against the right, and the sizes as wide as the families so the two
 * sides weigh the same.
 */

/**
 * The family tiles: three across on a phone, four across from 640px (two rows
 * of the eight), and two columns against the left edge from `lg`. The same
 * columns the games under them are drawn in (`PICK_TILE_GRID`), so a family and
 * a game are the same box on every screen.
 */
export const FAMILY_TILES = "grid grid-cols-3 gap-1.5 sm:grid-cols-[repeat(4,6.75rem)] lg:grid-cols-[repeat(2,6.75rem)]";

/** The families' column from `lg`, with the heading that lines up with the board's. */
export const FAMILY_COLUMN = "flex min-w-0 flex-col lg:justify-self-start";

/** How wide two tiles and the gap between them are: the families' column, and the sizes' opposite it. */
const TWO_TILES_WIDTH = "md:w-[13.875rem]";

export const PICK_CHIP_SHUT =
  "border-rule bg-ivory/70 text-ink-soft hover:border-rule-strong hover:text-ink";

/**
 * The games of the open family, in the columns the families are in.
 *
 * THE ROWS ARE THE LARGEST FAMILY'S, ON EVERY FAMILY. John, 2026-09-24: "Note
 * how the games in the family shift up and down based on the content above
 * and the Boards… We cannot have the heights change in Mobile or Desktop."
 * This reverses the decision before it — rows sized to what was in them —
 * which was right about one thing and is kept: a band of empty rows between a
 * family's last game and the line saying what the chosen game is reads as a
 * page that failed to draw. So the rows are not declared on the grid. The
 * PANEL holding the grid, its two lines of words and the room left over is the
 * fixed height (`PICK_GAMES_PANEL`), and any spare room is under the words, at
 * the bottom of the panel, where it reads as the space before the next section.
 *
 * Three across on a phone (three rows of the eight), four across from 640px
 * (two rows), eight across from a laptop (one). `MOST_GAMES_ON_A_SHELF` is the
 * eight, and `picker.test.ts` fails when a family grows past it.
 */
export const PICK_TILE_GRID =
  "grid grid-cols-3 gap-1.5 sm:grid-cols-[repeat(4,6.75rem)] lg:grid-cols-[repeat(8,6.75rem)]";

/** The most games any one family shows; the rows above are counted for this many. */
export const MOST_GAMES_ON_A_SHELF = 8;

/**
 * The games' panel: the family's line, its games and the chosen game's line, at
 * one height whichever family is open. Measured with every family, game and
 * board clicked in turn at the narrowest width of each range (360, 640, 768 and
 * 1024px), and held there by `e2e/set-up-steady.spec.ts`.
 */
export const PICK_GAMES_PANEL = "min-h-[31rem] sm:min-h-[20rem] lg:min-h-[11.25rem]";

/**
 * The boards a game is played on, side by side rather than stacked.
 *
 * FOUR PLACES, WHATEVER THE GAME HAS. John, 2026-09-24: "We need to plan for 4
 * boards with predictable height." The columns are four whether a game has one
 * board or four, so a lone board is one tile in the first place rather than a
 * block stretched across the row, and a row of sizes is one row high.
 *
 * Four across a phone from 390px, where a quarter of the panel still holds the
 * 70px picture; three below that, where it does not, with two rows kept so the
 * fourth board wraps into room already there. Four tiles at the families' own
 * width from 640px.
 */
export const PICK_BLOCKS =
  "grid grid-cols-3 grid-rows-[repeat(2,7.25rem)] gap-1.5 min-[390px]:grid-cols-4 min-[390px]:grid-rows-[7.25rem] sm:grid-cols-[repeat(4,6.75rem)]";

/**
 * THE BOARD AND THE BOARDS IT COULD BE, SIDE BY SIDE FROM A TABLET UP.
 *
 * John, 2026-09-22, with Halma 16×16 open on a laptop: "rightnow we have extra
 * height since we have Board size row... that row could just be a side panel
 * next to the large Board… and it's also better since you can see the board
 * and sizes side by side, rather than like now, where the board sizes are
 * lower and almost off screen."
 *
 * Both halves of that matter and only one of them is about height. The sizes
 * were a full-width row a screen below the preview, so choosing a board meant
 * scrolling away from the picture of the board — the one thing the choice is
 * about. Beside it, pressing 8, 10 and 16 in turn redraws a board you are
 * looking at.
 *
 * CENTRED AS A PAIR, not spread across the panel. The preview is 22rem and the
 * column of sizes two tiles, 13.875rem, so together about 600px of a 670px panel.
 * Letting the preview take the slack would have left the board in the middle of
 * the page and the sizes against the right edge — further apart than the row
 * they replaced, which is the opposite of what was asked for.
 *
 * FROM 768px, WHICH IS AN IPAD IN PORTRAIT, not from a laptop. The pair needs
 * about 600px and that screen's panel gives 670, so the width where it fits is
 * the width where it is offered. This page is used on an iPad — two of the
 * measurements in this file were taken for one — and holding the change back
 * to 1024 would have left the screen John was describing out of it.
 *
 * One column below that width, in the same order: the games, then the board,
 * then its sizes.
 */
export const PICK_BOARD_ROW = "flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-center md:gap-6";

/**
 * The preview's place in that row. `w-full` under a laptop so `BoardPreview`'s
 * own caps decide — 15rem on a phone, 22rem from a tablet — and a fixed 22rem
 * at a desk so the sizes sit against the board rather than against the panel.
 */
export const PICK_BOARD_PREVIEW = "w-full min-w-0 md:w-[22rem] md:shrink-0";

/**
 * The column the sizes stand in: two tiles across, as wide as the families'
 * column opposite, so the two sides of the board weigh the same and four sizes
 * are two rows — never taller than the families beside them.
 */
export const PICK_BOARD_ASIDE = `w-full md:shrink-0 ${TWO_TILES_WIDTH} lg:justify-self-end`;

/**
 * The board and its sizes under the families (`GamePicker`'s `underFamilies`).
 * Below a laptop's width the pair is its own row; from `lg` the wrapper steps
 * aside (`contents`) so the board and the sizes become the middle and right
 * columns of the families' row.
 */
export const PICK_BOARD_ROW_UNDER_FAMILIES = "lg:contents";

/**
 * The blocks themselves in that column: the row everywhere else, two across
 * once there is a board beside them. Two rows at most, and the board beside them
 * is taller than two, so the row is the board's height for one size or four.
 */
export const PICK_BLOCKS_ASIDE = `${PICK_BLOCKS} md:grid-cols-[repeat(2,6.75rem)] md:grid-rows-none`;

/**
 * The line naming what is being set up, at the top of the set-up screen: two
 * lines kept on a phone, where "International Draughts 国際ドラフツ · 10×10
 * International" wraps and a shorter one does not, and one from 640px, so the
 * whole screen under it starts at the same place for every game.
 */
export const SET_UP_SUMMARY = "line-clamp-2 h-10 text-sm leading-5 font-semibold sm:line-clamp-1 sm:h-5";

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

/**
 * THE ANSWERED ROWS, SIDE BY SIDE FROM A TABLET UP.
 *
 * John, 2026-09-22, with the set-up screen open on a laptop: "seems like WHo
 * You Play 3 rows can just be 1 row with 3 columns. or at least condensed to
 * the 1 row and can open up when clicking things that have more room needed.
 * like a 2nd row for changing the Player (human) or Bot (bot). Same with Rules
 * and Handicap - can probably be 1 row with 2 columns."
 *
 * Every band here was already a one-line answer — a chosen tile, "6 to choose
 * from", "No clock · Rated" — drawn the width of the panel. At a desk that is a
 * line of text in a band of empty paper, three times over.
 *
 * EACH ANSWER KEEPS ITS COLUMN, OPEN OR SHUT. The first version made an open
 * fold span the row, and the answers beside it closed up — John opened the
 * handicap and watched it jump to a line of its own: "Should keep that
 * column!!! … I HATE the UI moving unnecessarily". Now every button stays where
 * it is and an open answer's choices appear on a line under the row. How is in
 * `answerRow.ts`; the classes here only turn the row into a grid and let each
 * answer be laid over it.
 *
 * Below 768px everything stacks exactly as it did, because a phone's column is
 * already the width of one answer.
 */
export const ANSWER_ROW = "flex flex-col gap-2 md:grid md:items-stretch md:gap-x-3 md:gap-y-0";

/** Who you play: the posted seat and each list of people or programs. */
export const ANSWER_ROW_OPPONENT = ANSWER_ROW;

/** The rules and the handicap. */
export const ANSWER_ROW_RULES = ANSWER_ROW;

/**
 * An answer laid over the whole row: a subgrid of it, so its button and its
 * choices can each be put on the row's own lines. Transparent to the pointer,
 * because it covers its neighbours' buttons; its own parts take the pointer
 * back (`ANSWER_PART`).
 */
export const ANSWER_SPREAD =
  "md:grid md:grid-cols-subgrid md:grid-rows-subgrid md:pointer-events-none md:gap-x-3 md:gap-y-0";

/** A button or a set of choices inside a spread answer: pressable again. */
export const ANSWER_PART = "md:pointer-events-auto";

/** The space above an open answer's choices, which in a row sit a line below the buttons. */
export const ANSWER_BODY_GAP = "md:pt-3";

/**
 * The posted seat's cell in that row. It holds one tile, so from a tablet up
 * the tile fills the cell; below that it is the two-across of `PICK_PEOPLE`
 * that it always was. A constant of its own rather than `PICK_PEOPLE` with a
 * column count laid over it: two `lg:grid-cols-*` on one element are decided
 * by whichever Tailwind happens to emit last, the same trap `PICK_BASE`'s
 * cursor fell into.
 */
export const ANSWER_ROW_SEAT = "grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1";


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
