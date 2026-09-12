/**
 * The look of the two pickers on the set-up screen.
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
  "relative flex cursor-pointer items-center rounded-xl border bg-ivory/70 text-left transition-colors" +
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
 * NARROW, NOT SHORT. Everything tight here is horizontal — `px-1.5`, `gap-1`,
 * a 20px mark — and the 48px height is untouched, so what shrinks is never
 * the thing a finger has to hit. It is measured rather than tasteful: eleven
 * chips at their roomier size wrapped to THREE lines on an iPad, and the
 * third line was 54 of the 33 pixels between the Start button and the bottom
 * of an iPad in Safari. Two lines clears it. Anything that makes a chip wider
 * — a longer family name, a bigger mark — needs that measurement taken again.
 */
export const PICK_CHIP =
  "flex min-h-12 items-center gap-1 rounded-lg border px-1.5 py-1 text-xs transition-colors" +
  " outline-none focus-visible:ring-2 focus-visible:ring-moss";

export const PICK_CHIP_OPEN = "border-ink bg-ink text-paper";

export const PICK_CHIP_SHUT =
  "border-rule bg-ivory/70 text-ink-soft hover:border-rule-strong hover:text-ink";

/**
 * The games of the open family, at a height that does not move.
 *
 * EXPLICIT ROWS, not `auto-rows`. The families hold between one and eight
 * games, so a grid that sizes itself to its contents would change height
 * every time somebody looked at a different family — and the Start button
 * below it would walk up and down the screen under the reader's hand. Rows
 * declared in the template are drawn whether or not anything sits in them,
 * so the row is as tall for Checkers (one game) as for Drops (eight).
 *
 * Eight is the largest family, and each shape holds exactly that: 1×8 on a
 * phone, 2×4 from a large phone, 3×3 on a tablet, 4×2 on a desk.
 *
 * ONE COLUMN ON A PHONE, which is what /games already does with its game
 * cards — two columns here was the odd one out. Measured: at 390px, two
 * columns leave 70px beside the board for the name, which cut seven of the
 * thirty-nine to about nine characters — "Tournament Gomo…", "Chinese
 * Checker…". A phone is the screen where reading is hardest and it is the
 * one place a clipped name is least affordable. It costs 208px of height,
 * all of it on the phone, where nothing has a fold to clear: the Start
 * button's margin was measured on an iPad, which gets three columns.
 *
 * THE ROW HEIGHT IS THE THUMBNAIL'S. 3rem is the 40px board plus the card's
 * own padding and nothing else, so every pixel of this control's height is a
 * picture of a board. The first draft carried a line of what-it-is under each
 * name and was half again as tall; what that bought was a tagline nobody was
 * reading for a game they had not chosen, and what it cost was the Start
 * button, which went off the bottom of an iPad.
 *
 * THE NAME IS NEVER THE THING THAT GETS CUT. Three columns on a tablet left
 * 131px for "Tournament Gomoku 競技五目" — enough for the name and not for
 * the kanji. Because `Paired` puts the kanji last and the label truncates
 * from the end, the squeeze falls on the kanji and the name always survives:
 * "Tournament Gomoku 競技…". That is the right way round. A picture with an
 * unreadable name beside it is not "board images with text" — and the
 * complaint being answered here was a control you had to read carefully to
 * tell one game from another.
 */
export const PICK_GRID =
  "grid grid-cols-1 grid-rows-[repeat(8,3rem)] gap-2" +
  " sm:grid-cols-2 sm:grid-rows-[repeat(4,3rem)]" +
  " md:grid-cols-3 md:grid-rows-[repeat(3,3rem)]" +
  " xl:grid-cols-4 xl:grid-rows-[repeat(2,3rem)]";

/** The boards a game is played on, side by side rather than stacked. */
export const PICK_BLOCKS = "flex flex-wrap gap-2";
