/**
 * The shared look of every control. Kept in one place so the board panel, the
 * settings and the history page cannot drift apart.
 *
 * Colours are the Itsutsu tokens from globals.css — ivory, ink, rule, moss —
 * and each token already carries its dark value, so nothing here needs a
 * `dark:` twin. A control that does is using the wrong colour.
 */

export const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-35";

/*
 * A CONTROL A CHILD TAPS ON AN IPAD, which the ordinary button is not.
 *
 * `BUTTON_BASE` is a mouse-sized control: 1.5 units of vertical padding on
 * 14px text comes out around thirty pixels tall. John has said twice that the
 * buttons on the four-words screens are too small, and that screen is the one
 * his twelve-year-old uses — dozens of taps to find four words and her own
 * name, on glass, with a fingertip. Forty-eight pixels is the size a fingertip
 * actually hits.
 *
 * A SIBLING OF `BUTTON_BASE` AND NOT A MODIFIER ON IT. Both set padding and
 * text size, and Tailwind decides between conflicting utilities by their order
 * in the stylesheet rather than in the attribute — so `${BUTTON_BASE}
 * ${something-bigger}` would be a coin toss. This is the whole class; pair it
 * with `BUTTON_QUIET` or `BUTTON_STRONG`, which only set colours.
 */
export const BUTTON_TAP =
  "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-base font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-35";

export const BUTTON_QUIET =
  "border-rule-strong/80 bg-ivory/80 text-ink hover:bg-rule/60";

export const BUTTON_STRONG =
  "border-transparent bg-ink text-paper hover:bg-ink-soft";

/*
 * `min-w-0` and `max-w-full` because a select is as wide as its longest
 * option and will otherwise push out of whatever it is sitting in. Naming an
 * option well is the real fix — see GAME_COPY's short penalty labels — but a
 * control should not be able to break a panel however badly it is named.
 */
export const SELECT_CLASS =
  "min-w-0 max-w-full truncate rounded-lg border border-rule-strong/80 bg-ivory/80 px-2 py-1 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-55";

export const INPUT_CLASS =
  "w-full rounded-lg border border-rule-strong/80 bg-ivory/80 px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-muted/80 focus-visible:ring-2 focus-visible:ring-moss";

export const PANEL_CLASS =
  "rounded-2xl border border-rule bg-ivory/60 p-4 backdrop-blur-sm";

/** A panel that is a link: the border firms up under the pointer. */
export const PANEL_LINK_CLASS = `${PANEL_CLASS} transition-colors hover:border-rule-strong`;

/*
 * A CARD IS A TARGET, NOT A LABEL WITH A TARGET IN IT.
 *
 * John, on the family cards: "Mousing over a game should show us a button to
 * click… right now we're forced to click the name." A bordered box with a
 * name, a kanji and a tagline reads as one object, and an object that only
 * answers on a few words of text is a card that looks like a target and is
 * not one.
 *
 * Three classes make one mechanism, and they are kept together because each
 * is useless without the others:
 *
 *  STRETCHED_LINK  goes on the card's own link — usually the game's name,
 *                  which is already the way to the game — and spreads it over
 *                  the whole card with a pseudo-element. The name stays the ONE
 *                  link to that destination: one tab stop, one thing a screen
 *                  reader announces, and no second <a> to the same place. The
 *                  link also carries `data-card-link`, which is what the card
 *                  and the arrow answer to.
 *  RAISED_LINK     goes on every link inside the card that leads somewhere
 *                  ELSE — a count, a last game, a player — or the stretched
 *                  face swallows the click. GameName and GameCount take it as
 *                  `raised`. This is the cost of a card being a link at all,
 *                  and the record list has paid it since it was written.
 *  STRETCHED_HOST  goes on the card, or on the whole-card <Link> where the
 *                  card IS the link. Positioned so the face can spread, and
 *                  ringed on focus by `card-focus` (globals.css), which looks
 *                  for that one marked link and no other. `group/card` is
 *                  NAMED because the families accordion already has a bare
 *                  `group` on its <details>, and an unnamed group inside it
 *                  would light every card whenever any was. STRETCHED_CARD
 *                  and STRETCHED_ROW are the host with its hover look: a
 *                  bordered card firms its border, a row in a list shades.
 *
 * `outline-none` on both: the ring is drawn on the card, because the card is
 * what the reader is choosing, and a second ring around the name's text would
 * be two indicators for one focus.
 *
 * NEVER a link inside a link. An <a> inside an <a> is invalid HTML and a
 * browser splits it wherever it likes, which is why this is a pseudo-element
 * and a stacking order rather than nesting.
 */
export const STRETCHED_LINK = "outline-none after:absolute after:inset-0";

export const RAISED_LINK = "relative z-10";

export const STRETCHED_HOST =
  "group/card relative outline-none transition-colors card-focus:ring-2 card-focus:ring-moss";

/** A bordered card: the border firms under the pointer, the way PANEL_LINK_CLASS does. */
export const STRETCHED_CARD = `${STRETCHED_HOST} card-hover:border-rule-strong card-focus:border-rule-strong`;

/**
 * A row in a list, with no border of its own worth firming: it shades under
 * the pointer instead, the way the record's rows always have. A row whose
 * border or fill already says something — a green "your move" row — takes
 * STRETCHED_HOST alone, so hovering never paints over what it is saying.
 */
export const STRETCHED_ROW = `${STRETCHED_HOST} card-hover:bg-shade`;

/*
 * The round chevron on a card that opens — see CardArrow.tsx for what it is
 * for and why it is drawn at rest. Named-group variants, so it answers to the
 * card it sits in and to nothing around it.
 */
export const CARD_ARROW_CLASS =
  "pointer-events-none inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-rule-strong text-ink-soft opacity-50 transition group-card-hover/card:border-ink group-card-hover/card:bg-ink group-card-hover/card:text-paper group-card-hover/card:opacity-100 group-card-focus/card:border-ink group-card-focus/card:bg-ink group-card-focus/card:text-paper group-card-focus/card:opacity-100";

export const SECTION_TITLE =
  "text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted";

/** Focus ring for things that are not buttons — intersections, swatches. */
export const FOCUS_RING = "outline-none focus-visible:ring-2 focus-visible:ring-moss";

/** Tone colours for the awareness banner, matching `AdviceTone`. */
export const TONE_CLASS = {
  calm: "border-rule bg-ivory/70 text-ink-soft",
  good: "border-moss/40 bg-moss-soft text-ink",
  great: "border-moss bg-moss-soft text-ink",
  warn: "border-ochre/50 bg-ochre-soft text-ink",
  alarm: "border-shu/60 bg-shu-soft text-ink",
} as const;
